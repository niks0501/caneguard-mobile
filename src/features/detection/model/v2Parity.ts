import {
  MODEL_V2_LABELS,
  MODEL_V2_SHA256,
} from '@/features/detection/constants/modelContract';

/** Parity requirement from the V2 hand-off: same top class, max |diff| <= 0.01. */
export const V2_PARITY_MAX_ABSOLUTE_DIFFERENCE = 0.01;

export type V2ParityManifestExample = {
  image_id: string;
  class_name: string;
  predicted_class: string;
  kind: string;
  tflite_probabilities: number[];
};

export type V2ParityManifest = {
  tflite_sha256: string;
  examples: V2ParityManifestExample[];
};

export type V2ParityResult = {
  imageId: string;
  expertLabel: string;
  recordedPrediction: string;
  actualTop: string | null;
  recordedTop: string | null;
  topMatches: boolean;
  maxAbsoluteDifference: number;
  pass: boolean;
};

function topIndex(values: readonly number[]): number {
  return values.reduce(
    (best, value, index) => (value > values[best] ? index : best),
    0,
  );
}

export function manifestMatchesModel(manifest: V2ParityManifest): boolean {
  return manifest.tflite_sha256 === MODEL_V2_SHA256;
}

/** Compares all five outputs with the manifest's recorded TFLite probabilities. */
export function compareV2Parity(
  example: V2ParityManifestExample,
  actual: readonly number[],
): V2ParityResult {
  const expected = example.tflite_probabilities;
  const lengthOk =
    actual.length === MODEL_V2_LABELS.length &&
    expected.length === MODEL_V2_LABELS.length;
  const maxAbsoluteDifference =
    lengthOk && actual.every(Number.isFinite)
      ? Math.max(...actual.map((value, i) => Math.abs(value - expected[i])))
      : Number.POSITIVE_INFINITY;
  const actualTop = lengthOk ? MODEL_V2_LABELS[topIndex(actual)] : null;
  const recordedTop = lengthOk ? MODEL_V2_LABELS[topIndex(expected)] : null;
  const topMatches = actualTop !== null && actualTop === recordedTop;

  return {
    imageId: example.image_id,
    expertLabel: example.class_name,
    recordedPrediction: example.predicted_class,
    actualTop,
    recordedTop,
    topMatches,
    maxAbsoluteDifference,
    pass:
      topMatches && maxAbsoluteDifference <= V2_PARITY_MAX_ABSOLUTE_DIFFERENCE,
  };
}
