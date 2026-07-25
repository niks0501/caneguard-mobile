import type { CaneGuardDatabase } from '@/database/database';
import { StorageError } from '@/database/errors';
import { deleteScanRecord } from '@/features/records/services/deleteScanRecord';

const RECORD_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const IMAGE_URI = `file:///documents/caneguard/scan-images/${RECORD_ID}.jpg`;

describe('deleteScanRecord', () => {
  const database = {} as CaneGuardDatabase;
  const deleteRecord = jest.fn(async () => ({ managedImageUri: IMAGE_URI }));
  const deleteImage = jest.fn();

  it('deletes the database record before its managed image', async () => {
    await expect(
      deleteScanRecord(database, RECORD_ID, { deleteRecord, deleteImage }),
    ).resolves.toEqual({ id: RECORD_ID, imageCleanupError: null });

    expect(deleteRecord).toHaveBeenCalledWith(database, RECORD_ID);
    expect(deleteRecord.mock.invocationCallOrder[0]).toBeLessThan(
      deleteImage.mock.invocationCallOrder[0],
    );
    expect(deleteImage).toHaveBeenCalledWith(IMAGE_URI);
  });

  it('never deletes the image when the database delete fails', async () => {
    deleteRecord.mockRejectedValueOnce(
      new StorageError('DELETE_FAILED', 'database failed'),
    );

    await expect(
      deleteScanRecord(database, RECORD_ID, { deleteRecord, deleteImage }),
    ).rejects.toMatchObject({ code: 'DELETE_FAILED' });
    expect(deleteImage).not.toHaveBeenCalled();
  });

  it('keeps the record deleted and reports an image cleanup failure', async () => {
    const error = new StorageError('IMAGE_DELETE_FAILED', 'image failed');
    deleteImage.mockImplementationOnce(() => {
      throw error;
    });

    await expect(
      deleteScanRecord(database, RECORD_ID, { deleteRecord, deleteImage }),
    ).resolves.toEqual({ id: RECORD_ID, imageCleanupError: error });
  });
});
