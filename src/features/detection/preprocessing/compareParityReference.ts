import parityReference from '../../../../docs/model-v0/parity-reference.json';

import {
  MODEL_LABELS,
  MODEL_SHA256,
} from '@/features/detection/constants/modelContract';
import type { PreprocessingResult } from '@/features/detection/preprocessing/preprocessImage';

interface NumericComparison {
  actual: number;
  expected: number;
  absoluteDelta: number;
}

export interface PreprocessingParityComparison {
  modelShaMatches: boolean;
  shapeMatches: boolean;
  dataTypeMatches: boolean;
  elementCountMatches: boolean;
  byteLengthMatches: boolean;
  classOrderMatches: boolean;
  statistics: {
    min: NumericComparison;
    max: NumericComparison;
    mean: NumericComparison;
  };
  first20Actual: number[];
  first20Expected: number[];
  first20AbsoluteDeltas: number[];
  first20MaxAbsoluteDelta: number;
}

export interface ModelOutputParityComparison {
  modelShaMatches: boolean;
  classOrderMatches: boolean;
  outputLengthMatches: boolean;
  values: NumericComparison[];
  maxAbsoluteDelta: number;
  topIndexMatches: boolean;
  topLabelMatches: boolean;
}

function compareNumber(actual: number, expected: number): NumericComparison {
  return {
    actual,
    expected,
    absoluteDelta: Math.abs(actual - expected),
  };
}

export function comparePreprocessingToParity(
  result: PreprocessingResult,
): PreprocessingParityComparison {
  const expectedShape = parityReference.input.shape;
  const first20Actual = Array.from(new Float32Array(result.inputBuffer, 0, 20));
  const first20Expected = parityReference.input.first_20_values;
  const first20AbsoluteDeltas = first20Actual.map((value, index) =>
    Math.abs(value - first20Expected[index]),
  );

  return {
    modelShaMatches: parityReference.model.sha256 === MODEL_SHA256,
    shapeMatches:
      expectedShape[0] === 1 &&
      expectedShape[1] === result.height &&
      expectedShape[2] === result.width &&
      expectedShape[3] === result.channels,
    dataTypeMatches: parityReference.input.dtype === result.dataType,
    elementCountMatches:
      parityReference.input.element_count ===
      result.width * result.height * result.channels,
    byteLengthMatches: parityReference.input.byte_length === result.inputBuffer.byteLength,
    classOrderMatches:
      parityReference.output.label_order.length === MODEL_LABELS.length &&
      parityReference.output.label_order.every((label, index) => label === MODEL_LABELS[index]),
    statistics: {
      min: compareNumber(result.minValue, parityReference.input.min),
      max: compareNumber(result.maxValue, parityReference.input.max),
      mean: compareNumber(result.meanValue, parityReference.input.mean),
    },
    first20Actual,
    first20Expected,
    first20AbsoluteDeltas,
    first20MaxAbsoluteDelta: Math.max(...first20AbsoluteDeltas),
  };
}

export function compareModelOutputToParity(
  modelOutput: readonly number[],
): ModelOutputParityComparison {
  const expectedOutput = parityReference.output.raw_probabilities;
  const values = expectedOutput.map((expectedValue, index) =>
    compareNumber(modelOutput[index] ?? Number.NaN, expectedValue),
  );
  const topIndex = modelOutput.length
    ? modelOutput.reduce(
        (bestIndex, value, index, valuesToCompare) =>
          value > valuesToCompare[bestIndex] ? index : bestIndex,
        0,
      )
    : -1;
  const absoluteDeltas = values.map((comparison) => comparison.absoluteDelta);

  return {
    modelShaMatches: parityReference.model.sha256 === MODEL_SHA256,
    classOrderMatches:
      parityReference.output.label_order.length === MODEL_LABELS.length &&
      parityReference.output.label_order.every((label, index) => label === MODEL_LABELS[index]),
    outputLengthMatches: modelOutput.length === expectedOutput.length,
    values,
    maxAbsoluteDelta: absoluteDeltas.every(Number.isFinite)
      ? Math.max(...absoluteDeltas)
      : Number.POSITIVE_INFINITY,
    topIndexMatches: topIndex === parityReference.output.top_index,
    topLabelMatches: MODEL_LABELS[topIndex] === parityReference.output.top_label,
  };
}
