import { initialScanSessionState } from '@/features/detection/context/scanSessionReducer';
import {
  buildScanDraftCheckpoint,
  parseScanDraftCheckpoint,
} from '@/features/detection/drafts/scanDraftCheckpoint';
import type { ScanSessionState } from '@/features/detection/types';
import { getManagedScanImageDirectory } from '@/features/records/services/scanImageStorage';

const OWNER = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const ORIGINAL_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const DRAFT_ID = 'c863a5af-e9ad-44fe-a0dc-73f9d3436cac';
const NOTE = 'Edge leaves feel dry and the tip is lighter.';
const MANAGED_URI = `${getManagedScanImageDirectory(OWNER).uri}/${DRAFT_ID}.jpg`;

function completedFollowUp(overrides: Partial<ScanSessionState> = {}): ScanSessionState {
  return {
    ...initialScanSessionState,
    sourceUri: 'file:///picker/follow-up.jpg',
    sourceWidth: 1200,
    sourceHeight: 900,
    sourceType: 'camera',
    status: 'completed',
    followUpOf: ORIGINAL_ID,
    personalNote: NOTE,
    result: {
      predictedLabel: 'rust',
      confidence: 0.82,
      scores: [
        { label: 'healthy', score: 0.05 },
        { label: 'mosaic', score: 0.13 },
        { label: 'rust', score: 0.82 },
        { label: 'smut', score: 0 },
      ],
      timings: { preprocessMs: 4, inferenceMs: 8, totalMs: 12 },
      modelVersion: 'v1.0-mobilenetv2',
    },
    ...overrides,
  };
}

function checkpointFor(state: ScanSessionState) {
  return buildScanDraftCheckpoint({
    draftId: DRAFT_ID,
    imageMimeType: 'image/jpeg',
    imageSizeBytes: 4096,
    managedImageUri: MANAGED_URI,
    savedAt: '2026-10-15T05:30:00.000Z',
    state,
  });
}

/** Round-trips through the JSON the draft row stores. */
function reread(state: ScanSessionState) {
  const checkpoint = checkpointFor(state);
  expect(checkpoint).not.toBeNull();
  return parseScanDraftCheckpoint(JSON.parse(JSON.stringify(checkpoint)), OWNER);
}

describe('scan draft checkpoint Check Again metadata', () => {
  it('keeps the follow-up link and the farmer note across a restart', () => {
    const restored = reread(completedFollowUp());

    expect(restored?.followUpOf).toBe(ORIGINAL_ID);
    expect(restored?.personalNote).toBe(NOTE);
    expect(restored?.status).toBe('completed');
    expect(restored?.result?.predictedLabel).toBe('rust');
  });

  // Proposal - proves the farmer's optional place survives a restart and is capped.
  it('keeps the optional place across a restart', () => {
    expect(reread(completedFollowUp({ personalPlace: 'Near the mill' }))?.personalPlace).toBe(
      'Near the mill',
    );
    expect(reread(completedFollowUp())?.personalPlace).toBeNull();
  });

  it('keeps an ordinary scan ordinary', () => {
    const restored = reread(completedFollowUp({ followUpOf: null, personalNote: null }));

    expect(restored?.followUpOf ?? null).toBeNull();
    expect(restored?.personalNote ?? null).toBeNull();
  });

  it('reads a checkpoint written before the metadata existed as an ordinary scan', () => {
    const legacy = { ...checkpointFor(completedFollowUp()) } as Record<string, unknown>;
    delete legacy.followUpOf;
    delete legacy.personalNote;

    const restored = parseScanDraftCheckpoint(JSON.parse(JSON.stringify(legacy)), OWNER);

    expect(restored?.result?.predictedLabel).toBe('rust');
    expect(restored?.followUpOf ?? null).toBeNull();
    expect(restored?.personalNote ?? null).toBeNull();
  });
});
