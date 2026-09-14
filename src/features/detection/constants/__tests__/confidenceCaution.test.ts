import {
  isBelowV1ConfidenceCautionThreshold,
  V1_CONFIDENCE_CAUTION_THRESHOLD,
} from '@/features/detection/constants/confidenceCaution';

import thresholdArtifact from '../../../../../threshold/v1-confidence-caution-threshold.json';

describe('V1 confidence caution', () => {
  it('uses the frozen threshold artifact and strict below-threshold comparison', () => {
    expect(V1_CONFIDENCE_CAUTION_THRESHOLD).toBe(thresholdArtifact.threshold);
    expect(isBelowV1ConfidenceCautionThreshold(thresholdArtifact.threshold - 0.000001)).toBe(true);
    expect(isBelowV1ConfidenceCautionThreshold(thresholdArtifact.threshold)).toBe(false);
    expect(isBelowV1ConfidenceCautionThreshold(thresholdArtifact.threshold + 0.000001)).toBe(false);
  });

  it('does not classify non-finite scores as low confidence', () => {
    expect(isBelowV1ConfidenceCautionThreshold(Number.NaN)).toBe(false);
    expect(isBelowV1ConfidenceCautionThreshold(Number.POSITIVE_INFINITY)).toBe(false);
  });
});
