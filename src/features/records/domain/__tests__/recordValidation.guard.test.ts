import { createCompletedScanDraft } from '@/features/records/domain/recordValidation';
import { initialScanSessionState } from '@/features/detection/context/scanSessionReducer';
import type { DetectionResult, ScanSessionState } from '@/features/detection/types';

const unguarded = {
  predictedLabel: 'rust',
  confidence: 0.8,
  scores: [],
  timings: { preprocessMs: 1, inferenceMs: 1, totalMs: 2 },
  modelVersion: 'v2.0-mobilenetv2',
} as unknown as DetectionResult;

const state = (result: DetectionResult): ScanSessionState => ({
  ...initialScanSessionState,
  status: 'completed',
  sourceUri: 'file:///leaf.jpg',
  sourceType: 'camera',
  result,
});

describe('record creation requires the Guard V1 marker', () => {
  // Proves: a completed result that did not pass Guard V1 can never become a saved or reportable record.
  it.each([[undefined], ['other-model']])('refuses a result with marker %p', (marker) => {
    const result = { ...unguarded, ...(marker ? { guardModelId: marker } : {}) } as DetectionResult;
    expect(() =>
      createCompletedScanDraft(state(result), '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2', new Date()),
    ).toThrow(/Guard V1/);
  });
});
