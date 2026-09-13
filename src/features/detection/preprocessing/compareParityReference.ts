import qaExpectedOutputs from '../../../../qa/expected-v1-outputs.json';

import {
  MODEL_INPUT,
  MODEL_LABELS,
  MODEL_SHA256,
} from '@/features/detection/constants/modelContract';
import {
  compareV1QaOutput,
  getV1QaExpectedOutput,
  type V1QaFixtureId,
} from '@/features/detection/model/v1Qa';
import type { PreprocessingResult } from '@/features/detection/preprocessing/preprocessImage';

export interface PreprocessingParityComparison {
  modelShaMatches: boolean;
  shapeMatches: boolean;
  dataTypeMatches: boolean;
  elementCountMatches: boolean;
  byteLengthMatches: boolean;
  classOrderMatches: boolean;
  resizePolicyMatches: boolean;
  interpolationMatches: boolean;
  letterboxValueMatches: boolean;
  mobileNormalizationMatches: boolean;
  letterbox: PreprocessingResult['letterbox'];
}

export interface ModelOutputParityComparison {
  fixtureId: V1QaFixtureId;
  modelShaMatches: boolean;
  classOrderMatches: boolean;
  outputLengthMatches: boolean;
  values: {
    actual: number;
    expected: number;
    absoluteDelta: number;
  }[];
  maxAbsoluteDelta: number;
  topIndexMatches: boolean;
  topLabelMatches: boolean;
}

export function comparePreprocessingToParity(
  result: PreprocessingResult,
): PreprocessingParityComparison {
  const expected = qaExpectedOutputs.preprocessing_contract;
  const expectedElementCount = MODEL_INPUT.shape.reduce<number>(
    (product, dimension) => product * dimension,
    1,
  );

  return {
    modelShaMatches: qaExpectedOutputs.model_sha256 === MODEL_SHA256,
    shapeMatches:
      MODEL_INPUT.shape[0] === 1 &&
      MODEL_INPUT.shape[1] === result.height &&
      MODEL_INPUT.shape[2] === result.width &&
      MODEL_INPUT.shape[3] === result.channels,
    dataTypeMatches: expected.dtype === result.dataType,
    elementCountMatches:
      expectedElementCount === result.width * result.height * result.channels,
    byteLengthMatches:
      expectedElementCount * Float32Array.BYTES_PER_ELEMENT ===
      result.inputBuffer.byteLength,
    classOrderMatches:
      qaExpectedOutputs.class_order.length === MODEL_LABELS.length &&
      qaExpectedOutputs.class_order.every(
        (label, index) => label === MODEL_LABELS[index],
      ),
    resizePolicyMatches:
      expected.resize === 'aspect-ratio-preserving letterbox' &&
      MODEL_INPUT.resizePolicy === 'letterbox',
    interpolationMatches: expected.resize_interpolation === MODEL_INPUT.interpolation,
    letterboxValueMatches: expected.letterbox_value === MODEL_INPUT.letterboxValue,
    mobileNormalizationMatches:
      expected.normalization.startsWith('NONE in Android') &&
      MODEL_INPUT.mobileNormalization === 'none',
    letterbox: result.letterbox,
  };
}

export function compareModelOutputToParity(
  modelOutput: readonly number[],
  fixtureId: V1QaFixtureId = 'healthy',
): ModelOutputParityComparison {
  const comparison = compareV1QaOutput(fixtureId, modelOutput);
  const expected = getV1QaExpectedOutput(fixtureId);
  const values = comparison.scoreDeltas.map(({ actual, expected: expectedScore, absoluteDelta }) => ({
    actual,
    expected: expectedScore,
    absoluteDelta,
  }));
  const topIndex = modelOutput.length
    ? modelOutput.reduce(
        (bestIndex, value, index, valuesToCompare) =>
          value > valuesToCompare[bestIndex] ? index : bestIndex,
        0,
      )
    : -1;

  return {
    fixtureId,
    modelShaMatches: qaExpectedOutputs.model_sha256 === MODEL_SHA256,
    classOrderMatches:
      qaExpectedOutputs.class_order.length === MODEL_LABELS.length &&
      qaExpectedOutputs.class_order.every(
        (label, index) => label === MODEL_LABELS[index],
      ),
    outputLengthMatches: modelOutput.length === MODEL_LABELS.length,
    values,
    maxAbsoluteDelta: values.every(({ absoluteDelta }) => Number.isFinite(absoluteDelta))
      ? Math.max(...values.map(({ absoluteDelta }) => absoluteDelta))
      : Number.POSITIVE_INFINITY,
    topIndexMatches:
      topIndex >= 0 && MODEL_LABELS[topIndex] === expected.expectedTop1Class,
    topLabelMatches: comparison.top1Matches,
  };
}
