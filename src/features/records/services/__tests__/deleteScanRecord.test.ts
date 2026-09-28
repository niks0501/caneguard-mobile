import { Directory, File, Paths } from 'expo-file-system';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError } from '@/database/errors';
import { deleteScanRecordById } from '@/features/records/data/scanRecordRepository';
import { deleteScanRecord } from '@/features/records/services/deleteScanRecord';

const RECORD_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const IMAGE_URI = `file:///documents/caneguard/scan-images/${RECORD_ID}.jpg`;
const SUBMISSION_IMAGE_URI = `file:///documents/caneguard/scan-images/${RECORD_ID}.submission.jpg`;
const SUBMITTER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';

describe('deleteScanRecord', () => {
  const database = {} as CaneGuardDatabase;
  const deleteRecord = jest.fn(
    async (
      _database: CaneGuardDatabase,
      _id: string,
      _submitterIdentity: string,
    ) => ({
      managedImageUri: IMAGE_URI,
      submissionImageUri: null,
    }),
  ) as jest.MockedFunction<typeof deleteScanRecordById>;
  const deleteImage = jest.fn();

  it('deletes the database record before its managed image', async () => {
    await expect(
      deleteScanRecord(database, RECORD_ID, SUBMITTER_ID, {
        deleteRecord,
        deleteImage,
      }),
    ).resolves.toEqual({ id: RECORD_ID, imageCleanupError: null });

    expect(deleteRecord).toHaveBeenCalledWith(
      database,
      RECORD_ID,
      SUBMITTER_ID,
    );
    expect(deleteRecord.mock.invocationCallOrder[0]).toBeLessThan(
      deleteImage.mock.invocationCallOrder[0],
    );
    expect(deleteImage).toHaveBeenCalledWith(IMAGE_URI, SUBMITTER_ID);
  });

  it('deletes the display derivative alongside the preserved image', async () => {
    // The derivative is recorded in no column, so it is derived from the
    // preserved URI. A document-rooted URI is what makes the managed-path check
    // recognise it as ours.
    const ownedImageUri = new File(
      new Directory(
        Paths.document,
        'caneguard',
        'scan-images',
        SUBMITTER_ID,
      ),
      `${RECORD_ID}.jpg`,
    ).uri;
    const ownedDisplayUri = ownedImageUri.replace(/\.jpg$/, '.display.jpg');
    deleteRecord.mockResolvedValueOnce({
      managedImageUri: ownedImageUri,
      submissionImageUri: null,
    });
    deleteImage.mockClear();

    await expect(
      deleteScanRecord(database, RECORD_ID, SUBMITTER_ID, {
        deleteRecord,
        deleteImage,
      }),
    ).resolves.toEqual({ id: RECORD_ID, imageCleanupError: null });

    expect(deleteImage).toHaveBeenCalledTimes(2);
    expect(deleteImage).toHaveBeenNthCalledWith(1, ownedImageUri, SUBMITTER_ID);
    expect(deleteImage).toHaveBeenNthCalledWith(2, ownedDisplayUri, SUBMITTER_ID);
  });

  it('cleans a distinct submission derivative and avoids deleting a reused source twice', async () => {
    deleteRecord.mockResolvedValueOnce({
      managedImageUri: IMAGE_URI,
      submissionImageUri: SUBMISSION_IMAGE_URI,
    });
    deleteImage.mockClear();

    await expect(
      deleteScanRecord(database, RECORD_ID, SUBMITTER_ID, {
        deleteRecord,
        deleteImage,
      }),
    ).resolves.toEqual({ id: RECORD_ID, imageCleanupError: null });
    expect(deleteImage).toHaveBeenCalledTimes(2);
    expect(deleteImage).toHaveBeenNthCalledWith(1, IMAGE_URI, SUBMITTER_ID);
    expect(deleteImage).toHaveBeenNthCalledWith(2, SUBMISSION_IMAGE_URI, SUBMITTER_ID);

    deleteRecord.mockResolvedValueOnce({
      managedImageUri: IMAGE_URI,
      submissionImageUri: IMAGE_URI,
    });
    deleteImage.mockClear();
    await deleteScanRecord(database, RECORD_ID, SUBMITTER_ID, {
      deleteRecord,
      deleteImage,
    });
    expect(deleteImage).toHaveBeenCalledTimes(1);
    expect(deleteImage).toHaveBeenCalledWith(IMAGE_URI, SUBMITTER_ID);
  });

  it('never deletes the image when the database delete fails', async () => {
    deleteRecord.mockRejectedValueOnce(
      new StorageError('DELETE_FAILED', 'database failed'),
    );

    await expect(
      deleteScanRecord(database, RECORD_ID, SUBMITTER_ID, {
        deleteRecord,
        deleteImage,
      }),
    ).rejects.toMatchObject({ code: 'DELETE_FAILED' });
    expect(deleteImage).not.toHaveBeenCalled();
  });

  it('keeps the record deleted and reports an image cleanup failure', async () => {
    const error = new StorageError('IMAGE_DELETE_FAILED', 'image failed');
    deleteImage.mockImplementationOnce(() => {
      throw error;
    });

    await expect(
      deleteScanRecord(database, RECORD_ID, SUBMITTER_ID, {
        deleteRecord,
        deleteImage,
      }),
    ).resolves.toEqual({ id: RECORD_ID, imageCleanupError: error });
  });
});
