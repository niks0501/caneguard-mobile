import thresholdArtifact from '../../../../threshold/v1-confidence-caution-threshold.json';

import {
  MODEL_LABELS,
  MODEL_SHA256,
} from '@/features/detection/constants/modelContract';

const artifactClassOrder = thresholdArtifact.class_order;

if (
  thresholdArtifact.model_sha256 !== MODEL_SHA256 ||
  artifactClassOrder.length !== MODEL_LABELS.length ||
  artifactClassOrder.some((label, index) => label !== MODEL_LABELS[index]) ||
  !Number.isFinite(thresholdArtifact.threshold) ||
  thresholdArtifact.threshold < 0 ||
  thresholdArtifact.threshold > 1
) {
  throw new Error('The V1 confidence caution artifact does not match the bundled model contract.');
}

/** Frozen UI caution cutoff from the Model V1 OOF-derived artifact. */
export const V1_CONFIDENCE_CAUTION_THRESHOLD = thresholdArtifact.threshold;

/**
 * A caution is presentation-only. It never changes the predicted label and
 * never blocks saving or creating a local Field Report.
 */
export function isBelowV1ConfidenceCautionThreshold(score: number): boolean {
  return Number.isFinite(score) && score < V1_CONFIDENCE_CAUTION_THRESHOLD;
}
