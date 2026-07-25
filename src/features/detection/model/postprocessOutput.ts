import {
  MODEL_LABELS,
  MODEL_OUTPUT,
} from '@/features/detection/constants/modelContract';
import { InferenceError } from '@/features/detection/model/inferenceErrors';
import { softmax } from '@/features/detection/model/softmax';
import type { ClassScore, DetectionResult } from '@/features/detection/types';

const FLOAT32_BYTES = Float32Array.BYTES_PER_ELEMENT;
const PROBABILITY_SUM_TOLERANCE = 0.001;

export type PostprocessedOutput = Pick<
  DetectionResult,
  'predictedLabel' | 'confidence' | 'scores'
>;

function normalizeScores(
  values: readonly number[],
  interpretation: 'probabilities' | 'logits',
): number[] {
  if (values.some((value) => !Number.isFinite(value))) {
    throw new InferenceError(
      'OUTPUT_VALUE_INVALID',
      'The output tensor contains a non-finite value.',
    );
  }

  if (interpretation === 'logits') {
    return softmax(values);
  }

  const probabilitySum = values.reduce((sum, value) => sum + value, 0);
  const containsOutOfRangeValue = values.some((value) => value < 0 || value > 1);

  if (
    containsOutOfRangeValue ||
    Math.abs(probabilitySum - 1) > PROBABILITY_SUM_TOLERANCE
  ) {
    throw new InferenceError(
      'OUTPUT_VALUE_INVALID',
      `Expected probabilities in [0, 1] summing to 1; received sum ${probabilitySum}.`,
    );
  }

  return [...values];
}

export function postprocessOutput(outputBuffer: ArrayBuffer): PostprocessedOutput {
  if (MODEL_OUTPUT.dataType !== 'float32') {
    throw new InferenceError(
      'OUTPUT_VALUE_INVALID',
      `Unsupported Model v0 output type: ${MODEL_OUTPUT.dataType}.`,
    );
  }

  const expectedByteLength = MODEL_LABELS.length * FLOAT32_BYTES;

  if (outputBuffer.byteLength !== expectedByteLength) {
    throw new InferenceError(
      'OUTPUT_SIZE_MISMATCH',
      `Expected ${expectedByteLength} output bytes, received ${outputBuffer.byteLength}.`,
    );
  }

  const rawValues = Array.from(new Float32Array(outputBuffer));
  const probabilities = normalizeScores(
    rawValues,
    MODEL_OUTPUT.interpretation,
  );
  const scores = probabilities.map<ClassScore>((score, index) => {
    const label = MODEL_LABELS[index];

    if (!label) {
      throw new InferenceError(
        'LABEL_MAPPING_FAILED',
        `No Model v0 label exists for output index ${index}.`,
      );
    }

    return { label, score };
  });

  scores.sort((left, right) => right.score - left.score);

  const topScore = scores[0];

  if (!topScore) {
    throw new InferenceError(
      'LABEL_MAPPING_FAILED',
      'The output tensor did not map to any Model v0 label.',
    );
  }

  return {
    predictedLabel: topScore.label,
    confidence: topScore.score,
    scores,
  };
}
