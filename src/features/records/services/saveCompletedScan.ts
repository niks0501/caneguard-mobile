import type { CaneGuardDatabase } from '@/database/database';
import { toStorageError } from '@/database/errors';
import type { ScanSessionState } from '@/features/detection/types';
import { insertScanRecord } from '@/features/records/data/scanRecordWriteRepository';
import { createCompletedScanDraft } from '@/features/records/domain/recordValidation';
import {
  compensateManagedImageCopy,
  copyScanImageToManagedStorage,
  type ManagedImage,
} from '@/features/records/services/scanImageStorage';

export interface SaveCompletedScanOptions {
  database: CaneGuardDatabase;
  dependencies?: {
    cleanupImage?: typeof compensateManagedImageCopy;
    copyImage?: typeof copyScanImageToManagedStorage;
    insertRecord?: typeof insertScanRecord;
    now?: () => Date;
  };
  recordId: string;
  state: ScanSessionState;
}

export async function saveCompletedScan({
  database,
  dependencies,
  recordId,
  state,
}: SaveCompletedScanOptions): Promise<{ id: string }> {
  const now = dependencies?.now ?? (() => new Date());
  const copyImage = dependencies?.copyImage ?? copyScanImageToManagedStorage;
  const insertRecord = dependencies?.insertRecord ?? insertScanRecord;
  const cleanupImage = dependencies?.cleanupImage ?? compensateManagedImageCopy;
  const draft = createCompletedScanDraft(state, recordId, now());
  const managedImage = await copyImage({
    recordId: draft.id,
    sourceUri: draft.sourceUri,
    sourceType: draft.imageSourceType,
    sourceWidth: draft.sourceWidth,
    sourceHeight: draft.sourceHeight,
  });

  try {
    return await insertRecord(database, toPersistenceInput(draft, managedImage));
  } catch (error: unknown) {
    try {
      cleanupImage(managedImage.managedUri);
    } catch {
      // The database error is the primary failure; orphan cleanup is best effort.
    }
    throw toStorageError(
      error,
      'SAVE_TRANSACTION_FAILED',
      'Saving the completed scan failed.',
    );
  }
}

function toPersistenceInput(
  draft: ReturnType<typeof createCompletedScanDraft>,
  managedImage: ManagedImage,
) {
  const { sourceUri: _sourceUri, ...record } = draft;
  return {
    ...record,
    managedImageUri: managedImage.managedUri,
    imageMimeType: managedImage.mimeType,
    imageSizeBytes: managedImage.sizeBytes,
  };
}
