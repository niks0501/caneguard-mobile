import {
  isBelowConfidenceCautionThreshold,
  isBelowV1ConfidenceCautionThreshold,
  V1_CONFIDENCE_CAUTION_THRESHOLD,
  V2_CONFIDENCE_CAUTION_THRESHOLD,
} from '@/features/detection/constants/confidenceCaution';
import {
  MODEL_LABELS,
  MODEL_SHA256,
  MODEL_V2_LABELS,
  MODEL_V2_SHA256,
  MODEL_V2_VERSION,
  MODEL_VERSION,
} from '@/features/detection/constants/modelContract';

import v1ThresholdArtifact from '../../../../../threshold/v1-confidence-caution-threshold.json';
import v2ThresholdArtifact from '../../../../../threshold/v2-confidence-caution-threshold.json';

describe('confidence caution', () => {
  it('uses the frozen V1 threshold artifact and strict below-threshold comparison', () => {
    expect(V1_CONFIDENCE_CAUTION_THRESHOLD).toBe(v1ThresholdArtifact.threshold);
    expect(isBelowV1ConfidenceCautionThreshold(v1ThresholdArtifact.threshold - 0.000001)).toBe(true);
    expect(isBelowV1ConfidenceCautionThreshold(v1ThresholdArtifact.threshold)).toBe(false);
    expect(isBelowV1ConfidenceCautionThreshold(v1ThresholdArtifact.threshold + 0.000001)).toBe(false);
  });

  it('binds the provisional V2 artifact to the deployed SHA and class order', () => {
    expect(v2ThresholdArtifact.model_sha256).toBe(MODEL_V2_SHA256);
    expect(v2ThresholdArtifact.class_order).toEqual([...MODEL_V2_LABELS]);
    expect(v2ThresholdArtifact.provenance).toMatchObject({
      source_path: 'threshold/v2-selected-validation-predictions.csv',
      source_commit: '770cef32af81a5dd26a3144f0423d786779e6c4f',
      source_row_count: 279,
      selected_checkpoint_not_oof: true,
      holdout_predictions_used: false,
    });
    expect(V2_CONFIDENCE_CAUTION_THRESHOLD).toBe(v2ThresholdArtifact.threshold);
    expect(isBelowConfidenceCautionThreshold(v2ThresholdArtifact.threshold - 0.000001, MODEL_V2_VERSION)).toBe(true);
    expect(isBelowConfidenceCautionThreshold(v2ThresholdArtifact.threshold, MODEL_V2_VERSION)).toBe(false);
    expect(isBelowConfidenceCautionThreshold(v2ThresholdArtifact.threshold + 0.000001, MODEL_V2_VERSION)).toBe(false);
  });

  it('keeps the V1 artifact bound to the V1 model contract', () => {
    expect(v1ThresholdArtifact.model_sha256).toBe(MODEL_SHA256);
    expect(v1ThresholdArtifact.class_order).toEqual([...MODEL_LABELS]);
    expect(isBelowConfidenceCautionThreshold(0.6, MODEL_VERSION)).toBe(false);
  });

  it('does not classify non-finite scores as low confidence', () => {
    expect(isBelowConfidenceCautionThreshold(Number.NaN, MODEL_V2_VERSION)).toBe(false);
    expect(isBelowConfidenceCautionThreshold(Number.POSITIVE_INFINITY, MODEL_V2_VERSION)).toBe(false);
  });
});
