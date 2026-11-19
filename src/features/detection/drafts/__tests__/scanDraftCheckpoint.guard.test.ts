import { parseScanDraftCheckpoint } from '@/features/detection/drafts/scanDraftCheckpoint';

const OWNER = 'owner-1';
const checkpoint = (guardModelId: unknown) => ({
  draftId: 'd1',
  managedImageUri: `file:///x/scan-images/${OWNER}/rec.jpg`,
  status: 'completed',
  sourceType: 'camera',
  selectedSymptoms: ['rust'],
  result: {
    predictedLabel: 'rust',
    confidence: 0.6,
    scores: ['healthy', 'mosaic', 'rust', 'smut', 'rssi'].map((label) => ({ label, score: 0.2 })),
    timings: { preprocessMs: 1, inferenceMs: 1, totalMs: 2 },
    modelVersion: 'v2.0-mobilenetv2',
    ...(guardModelId === undefined ? {} : { guardModelId }),
  },
});

jest.mock('@/features/records/services/scanImageStorage', () => ({
  deleteManagedScanImage: jest.fn(),
  isManagedScanImageUri: () => true,
  managedImageExists: () => true,
}));

describe('resumed scan drafts and the guard marker', () => {
  // Proves: a guard-accepted completed draft resumes as completed.
  it('keeps a guarded completed result', () => {
    const parsed = parseScanDraftCheckpoint(checkpoint('caneguard_guard_v1'), OWNER);
    expect(parsed?.status).toBe('completed');
    expect(parsed?.result?.guardModelId).toBe('caneguard_guard_v1');
  });

  // Proves: a completed draft that never passed the guard (or carries a forged marker) resumes with the photo and answers but NO result, so it must be re-checked and can never be saved or reported.
  it.each([[undefined], ['other-model'], [true]])('drops the result for marker %p', (marker) => {
    const parsed = parseScanDraftCheckpoint(checkpoint(marker), OWNER);
    expect(parsed).not.toBeNull();
    expect(parsed?.status).toBe('image-selected');
    expect(parsed?.result).toBeNull();
    expect(parsed?.selectedSymptoms).toEqual(['rust']);
  });
});
