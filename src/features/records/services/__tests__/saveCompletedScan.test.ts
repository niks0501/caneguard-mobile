import type { CaneGuardDatabase } from '@/database/database';
import { StorageError } from '@/database/errors';
import { initialScanSessionState } from '@/features/detection/context/scanSessionReducer';
import type { ScanSessionState } from '@/features/detection/types';
import type { SaveCompletedScanInput } from '@/features/records/domain/recordTypes';
import type { ManagedImage } from '@/features/records/services/scanImageStorage';
import { saveCompletedScan } from '@/features/records/services/saveCompletedScan';

const RECORD_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const NOW = new Date('2026-07-25T05:30:00.000Z');
const MANAGED_IMAGE: ManagedImage = {
  managedUri: `file:///documents/caneguard/scan-images/${RECORD_ID}.jpg`,
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
    barangay: 'Wawa',
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
      ],
      timings: { preprocessMs: 3, inferenceMs: 7, totalMs: 10 },
      modelVersion: 'v0.1-baseline',
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

  function save(state = completedState()) {
    return saveCompletedScan({
      database,
      recordId: RECORD_ID,
      state,
      dependencies: {
        copyImage,
        insertRecord,
        cleanupImage,
        now: () => NOW,
      },
    });
  }

  it('copies first, then inserts the exact completed record', async () => {
    await expect(save()).resolves.toEqual({ id: RECORD_ID });

    expect(copyImage).toHaveBeenCalledWith({
      recordId: RECORD_ID,
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
        classScores: [
          { label: 'healthy', score: 0.1 },
          { label: 'mosaic', score: 0.75 },
          { label: 'rust', score: 0.15 },
        ],
        createdAt: '2026-07-25T05:30:00.000Z',
      }),
    );
    expect(cleanupImage).not.toHaveBeenCalled();
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
    expect(cleanupImage).toHaveBeenCalledWith(MANAGED_IMAGE.managedUri);
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
