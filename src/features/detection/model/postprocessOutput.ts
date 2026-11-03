import {
  ACTIVE_MODEL,
  type ModelContract,
  type ModelOutputLabel,
} from '@/features/detection/constants/modelContract';
import { InferenceError } from '@/features/detection/model/inferenceErrors';
import { softmax } from '@/features/detection/model/softmax';

const FLOAT32_BYTES = Float32Array.BYTES_PER_ELEMENT;
const PROBABILITY_SUM_TOLERANCE = 0.001;

export type ModelOutputScore = { label: ModelOutputLabel; score: number };

/** Model-layer result: every output the artifact declares, best first. */
export type PostprocessedOutput = {
  predictedLabel: ModelOutputLabel;
  confidence: number;
  scores: ModelOutputScore[];
};

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

/**
 * Maps a float32 output buffer to labelled scores. Outputs are probabilities
 * (both artifacts embed softmax), so no further softmax is applied.
 */
export function postprocessOutput(
  outputBuffer: ArrayBuffer,
  contract: ModelContract = ACTIVE_MODEL,
): PostprocessedOutput {
  const modelName = contract.id.toUpperCase();

  if (contract.output.dataType !== 'float32') {
    throw new InferenceError(
      'OUTPUT_VALUE_INVALID',
      `Unsupported Model ${modelName} output type: ${contract.output.dataType}.`,
    );
  }

  const expectedByteLength = contract.labels.length * FLOAT32_BYTES;

  if (outputBuffer.byteLength !== expectedByteLength) {
    throw new InferenceError(
      'OUTPUT_SIZE_MISMATCH',
      `Expected ${expectedByteLength} output bytes, received ${outputBuffer.byteLength}.`,
    );
  }

  const rawValues = Array.from(new Float32Array(outputBuffer));
  const probabilities = normalizeScores(rawValues, contract.output.interpretation);
  const scores = probabilities.map<ModelOutputScore>((score, index) => {
    const label = contract.labels[index];

    if (!label) {
      throw new InferenceError(
        'LABEL_MAPPING_FAILED',
        `No Model ${modelName} label exists for output index ${index}.`,
      );
    }

    return { label, score };
  });

  scores.sort((left, right) => right.score - left.score);

  const topScore = scores[0];

  if (!topScore) {
    throw new InferenceError(
      'LABEL_MAPPING_FAILED',
      `The output tensor did not map to any Model ${modelName} label.`,
    );
  }

  return {
    predictedLabel: topScore.label,
    confidence: topScore.score,
    scores,
  };
}
