import type { CaneGuardDatabase } from '@/database/database';
import { toStorageError, type StorageError } from '@/database/errors';
import { deleteScanRecordById } from '@/features/records/data/scanRecordRepository';
import { deleteManagedScanImage } from '@/features/records/services/scanImageStorage';

export interface DeleteScanRecordResult {
  id: string;
  imageCleanupError: StorageError | null;
}

export async function deleteScanRecord(
  database: CaneGuardDatabase,
  id: string,
  submitterIdentity: string,
  dependencies: {
    deleteImage?: typeof deleteManagedScanImage;
    deleteRecord?: typeof deleteScanRecordById;
  } = {},
): Promise<DeleteScanRecordResult> {
  const deleteRecord = dependencies.deleteRecord ?? deleteScanRecordById;
  const deleteImage = dependencies.deleteImage ?? deleteManagedScanImage;
  const { managedImageUri, submissionImageUri } = await deleteRecord(
    database,
    id,
    submitterIdentity,
  );
  const imageUris = [
    ...new Set(
      [managedImageUri, submissionImageUri].filter(
        (uri): uri is string => Boolean(uri),
      ),
    ),
  ];
  let imageCleanupError: StorageError | null = null;

  for (const imageUri of imageUris) {
    try {
      deleteImage(imageUri, submitterIdentity);
    } catch (error: unknown) {
      imageCleanupError ??= toStorageError(
        error,
        'IMAGE_DELETE_FAILED',
        'Managed image cleanup failed after record deletion.',
      );
    }
  }

  return { id, imageCleanupError };
}
