import type { CaneGuardDatabase } from '@/database/database';
import { StorageError } from '@/database/errors';
import { initialScanSessionState } from '@/features/detection/context/scanSessionReducer';
import type { ScanSessionState } from '@/features/detection/types';
import type { SaveCompletedScanInput } from '@/features/records/domain/recordTypes';
import type { ManagedImage } from '@/features/records/services/scanImageStorage';
import { saveCompletedScan } from '@/features/records/services/saveCompletedScan';

const RECORD_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const OWNER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const NOW = new Date('2026-07-25T05:30:00.000Z');
const MANAGED_IMAGE: ManagedImage = {
  managedUri: `file:///documents/caneguard/scan-images/${OWNER_ID}/${RECORD_ID}.jpg`,
  extension: 'jpg',
  mimeType: 'image/jpeg',
  sizeBytes: 4096,
  sourceType: 'camera',
  sourceWidth: 1200,
  sourceHeight: 900,
};

function completedState(
  overrides: Partial<ScanSessionState> = {},
): ScanSessionState {
  return {
    ...initialScanSessionState,
    status: 'completed',
    sourceUri: 'file:///camera/leaf.jpg',
    sourceType: 'camera',
    sourceWidth: 1200,
    sourceHeight: 900,
    selectedSymptoms: ['mosaic'],
    reportedSeverity: 'Mild',
    result: {
      predictedLabel: 'mosaic',
      confidence: 0.75,
      scores: [
        { label: 'healthy', score: 0.1 },
        { label: 'mosaic', score: 0.75 },
        { label: 'rust', score: 0.15 },
        { label: 'smut', score: 0 },
      ],
      timings: { preprocessMs: 3, inferenceMs: 7, totalMs: 10 },
      modelVersion: 'v1.0-mobilenetv2',
    },
    ...overrides,
  };
}

describe('saveCompletedScan', () => {
  const database = {} as CaneGuardDatabase;
  const copyImage = jest.fn(async () => MANAGED_IMAGE);
  const insertRecord = jest.fn(
    async (_database: CaneGuardDatabase, input: SaveCompletedScanInput) => ({
      id: input.id,
    }),
  );
  const cleanupImage = jest.fn();
  const writeDisplayImage = jest.fn(async () => MANAGED_IMAGE.managedUri);

  function save(state = completedState()) {
    return saveCompletedScan({
      database,
      ownerIdentity: OWNER_ID,
      recordId: RECORD_ID,
      state,
      dependencies: {
        copyImage,
        insertRecord,
        cleanupImage,
        now: () => NOW,
        writeDisplayImage,
      },
    });
  }

  it('copies first, then inserts the exact completed record', async () => {
    await expect(save()).resolves.toEqual({ id: RECORD_ID });

    expect(copyImage).toHaveBeenCalledWith({
      recordId: RECORD_ID,
      ownerIdentity: OWNER_ID,
      sourceUri: 'file:///camera/leaf.jpg',
      sourceType: 'camera',
      sourceWidth: 1200,
      sourceHeight: 900,
    });
    expect(copyImage.mock.invocationCallOrder[0]).toBeLessThan(
      insertRecord.mock.invocationCallOrder[0],
    );
    expect(insertRecord).toHaveBeenCalledWith(
      database,
      expect.objectContaining({
        id: RECORD_ID,
        managedImageUri: MANAGED_IMAGE.managedUri,
        imageMimeType: 'image/jpeg',
        imageSizeBytes: 4096,
        confidence: 0.75,
        decisionSupportWording: expect.stringContaining('does not confirm'),
        classScores: [
          { label: 'healthy', score: 0.1 },
          { label: 'mosaic', score: 0.75 },
          { label: 'rust', score: 0.15 },
          { label: 'smut', score: 0 },
        ],
        createdAt: '2026-07-25T05:30:00.000Z',
      }),
    );
    expect(cleanupImage).not.toHaveBeenCalled();
  });

  it('writes the display derivative from the preserved copy', async () => {
    await expect(save()).resolves.toEqual({ id: RECORD_ID });

    expect(writeDisplayImage).toHaveBeenCalledWith({
      ownerIdentity: OWNER_ID,
      recordId: RECORD_ID,
      sourceHeight: 900,
      sourceUri: MANAGED_IMAGE.managedUri,
      sourceWidth: 1200,
    });
  });

  it('keeps the save successful when the display derivative fails', async () => {
    writeDisplayImage.mockRejectedValueOnce(
      new StorageError('IMAGE_PREPARATION_FAILED', 'derivative failed'),
    );

    // Lists fall back to the preserved original, so a derivative failure must
    // not turn a completed scan into a failed save.
    await expect(save()).resolves.toEqual({ id: RECORD_ID });
    expect(insertRecord).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid session before file or database writes', async () => {
    await expect(save(completedState({ status: 'running' }))).rejects.toMatchObject({
      code: 'INVALID_SCAN_RECORD',
    });

    expect(copyImage).not.toHaveBeenCalled();
    expect(insertRecord).not.toHaveBeenCalled();
  });

  it('does not insert or clean up when the image copy fails', async () => {
    copyImage.mockRejectedValueOnce(
      new StorageError('IMAGE_COPY_FAILED', 'copy failed'),
    );

    await expect(save()).rejects.toMatchObject({ code: 'IMAGE_COPY_FAILED' });
    expect(insertRecord).not.toHaveBeenCalled();
    expect(cleanupImage).not.toHaveBeenCalled();
  });

  it('removes the managed copy and preserves the database error on failure', async () => {
    insertRecord.mockRejectedValueOnce(
      new StorageError('DUPLICATE_RECORD', 'duplicate'),
    );

    await expect(save()).rejects.toMatchObject({ code: 'DUPLICATE_RECORD' });
    expect(cleanupImage).toHaveBeenCalledWith(
      MANAGED_IMAGE.managedUri,
      OWNER_ID,
    );
  });

  it('preserves the transaction error when best-effort cleanup also fails', async () => {
    insertRecord.mockRejectedValueOnce(new Error('database failed'));
    cleanupImage.mockImplementationOnce(() => {
      throw new Error('cleanup failed');
    });

    await expect(save()).rejects.toMatchObject({
      code: 'SAVE_TRANSACTION_FAILED',
    });
  });
});
