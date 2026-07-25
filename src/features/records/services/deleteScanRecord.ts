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
  dependencies: {
    deleteImage?: typeof deleteManagedScanImage;
    deleteRecord?: typeof deleteScanRecordById;
  } = {},
): Promise<DeleteScanRecordResult> {
  const deleteRecord = dependencies.deleteRecord ?? deleteScanRecordById;
  const deleteImage = dependencies.deleteImage ?? deleteManagedScanImage;
  const { managedImageUri } = await deleteRecord(database, id);

  try {
    deleteImage(managedImageUri);
    return { id, imageCleanupError: null };
  } catch (error: unknown) {
    return {
      id,
      imageCleanupError: toStorageError(
        error,
        'IMAGE_DELETE_FAILED',
        'Managed image cleanup failed after record deletion.',
      ),
    };
  }
}
