import v1ThresholdArtifact from '../../../../threshold/v1-confidence-caution-threshold.json';
import v2ThresholdArtifact from '../../../../threshold/v2-confidence-caution-threshold.json';

import {
  MODEL_LABELS,
  MODEL_SHA256,
  MODEL_V2_LABELS,
  MODEL_V2_SHA256,
  MODEL_V2_VERSION,
  MODEL_VERSION,
} from '@/features/detection/constants/modelContract';

const v1ArtifactClassOrder = v1ThresholdArtifact.class_order;
const v2ArtifactClassOrder = v2ThresholdArtifact.class_order;

if (
  v1ThresholdArtifact.model_sha256 !== MODEL_SHA256 ||
  v1ArtifactClassOrder.length !== MODEL_LABELS.length ||
  v1ArtifactClassOrder.some((label, index) => label !== MODEL_LABELS[index]) ||
  !Number.isFinite(v1ThresholdArtifact.threshold) ||
  v1ThresholdArtifact.threshold < 0 ||
  v1ThresholdArtifact.threshold > 1
) {
  throw new Error('The V1 confidence caution artifact does not match the bundled model contract.');
}

if (
  v2ThresholdArtifact.model_sha256 !== MODEL_V2_SHA256 ||
  v2ArtifactClassOrder.length !== MODEL_V2_LABELS.length ||
  v2ArtifactClassOrder.some((label, index) => label !== MODEL_V2_LABELS[index]) ||
  !Number.isFinite(v2ThresholdArtifact.threshold) ||
  v2ThresholdArtifact.threshold < 0 ||
  v2ThresholdArtifact.threshold > 1
) {
  throw new Error('The V2 confidence caution artifact does not match the bundled model contract.');
}

/** Frozen UI caution cutoff from the Model V1 OOF-derived artifact. */
export const V1_CONFIDENCE_CAUTION_THRESHOLD = v1ThresholdArtifact.threshold;

/** Provisional UI caution cutoff from selected-checkpoint Model V2 validation data. */
export const V2_CONFIDENCE_CAUTION_THRESHOLD = v2ThresholdArtifact.threshold;

/**
 * Returns the cutoff for the model that produced a saved or live result. Older
 * and unknown versions fall back to V1 so saved records do not silently change.
 */
export function confidenceCautionThresholdForModelVersion(modelVersion: string): number {
  return modelVersion === MODEL_V2_VERSION
    ? V2_CONFIDENCE_CAUTION_THRESHOLD
    : V1_CONFIDENCE_CAUTION_THRESHOLD;
}

/**
 * A caution is presentation-only. It never changes the predicted label and
 * never blocks saving or creating a local Field Report.
 */
export function isBelowConfidenceCautionThreshold(
  score: number,
  modelVersion: string,
): boolean {
  return (
    Number.isFinite(score) &&
    score < confidenceCautionThresholdForModelVersion(modelVersion)
  );
}

/** Kept for V1-specific callers and compatibility with the frozen V1 artifact. */
export function isBelowV1ConfidenceCautionThreshold(score: number): boolean {
  return isBelowConfidenceCautionThreshold(score, MODEL_VERSION);
}
