import type { CaneGuardDatabase } from '@/database/database';
import { toStorageError } from '@/database/errors';
import type { ScanSessionState } from '@/features/detection/types';
import { insertScanRecord } from '@/features/records/data/scanRecordWriteRepository';
import { createCompletedScanDraft } from '@/features/records/domain/recordValidation';
import {
  compensateManagedImageCopy,
  copyScanImageToManagedStorage,
  writeScanDisplayImage,
  type ManagedImage,
} from '@/features/records/services/scanImageStorage';
import {
  canReuseSourceAsSubmissionImage,
  normalizeMobileReportImageMimeType,
} from '@/features/sync/constants/mobileReportUploadContract';

export interface SaveCompletedScanOptions {
  database: CaneGuardDatabase;
  dependencies?: {
    cleanupImage?: typeof compensateManagedImageCopy;
    copyImage?: typeof copyScanImageToManagedStorage;
    insertRecord?: typeof insertScanRecord;
    now?: () => Date;
    writeDisplayImage?: typeof writeScanDisplayImage;
  };
  ownerIdentity: string;
  recordId: string;
  state: ScanSessionState;
}

export async function saveCompletedScan({
  database,
  dependencies,
  ownerIdentity,
  recordId,
  state,
}: SaveCompletedScanOptions): Promise<{ id: string }> {
  const now = dependencies?.now ?? (() => new Date());
  const copyImage = dependencies?.copyImage ?? copyScanImageToManagedStorage;
  const insertRecord = dependencies?.insertRecord ?? insertScanRecord;
  const cleanupImage = dependencies?.cleanupImage ?? compensateManagedImageCopy;
  const writeDisplayImage = dependencies?.writeDisplayImage ?? writeScanDisplayImage;
  const draft = createCompletedScanDraft(state, recordId, now());
  const managedImage = await copyImage({
    ownerIdentity,
    recordId: draft.id,
    sourceUri: draft.sourceUri,
    sourceType: draft.imageSourceType,
    sourceWidth: draft.sourceWidth,
    sourceHeight: draft.sourceHeight,
  });

  // Best effort: lists render the small derivative, and every screen falls back
  // to the preserved original, so a derivative failure must not fail the save.
  try {
    await writeDisplayImage({
      ownerIdentity,
      recordId: draft.id,
      sourceWidth: managedImage.sourceWidth,
      sourceHeight: managedImage.sourceHeight,
      sourceUri: managedImage.managedUri,
    });
  } catch {
    if (__DEV__) {
      console.warn(
        '[storage:IMAGE_PREPARATION_FAILED] The scan display image was not prepared; lists will render the preserved original.',
      );
    }
  }

  try {
    return await insertRecord(
      database,
      toPersistenceInput(draft, managedImage, ownerIdentity),
    );
  } catch (error: unknown) {
    try {
      cleanupImage(managedImage.managedUri, ownerIdentity);
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
  ownerIdentity: string,
) {
  const { sourceUri: _sourceUri, ...record } = draft;
  const sourceCanBeSubmitted = canReuseSourceAsSubmissionImage({
    mimeType: managedImage.mimeType,
    sizeBytes: managedImage.sizeBytes,
  });
  const submissionImageMimeType = sourceCanBeSubmitted
    ? normalizeMobileReportImageMimeType(managedImage.mimeType)
    : null;

  return {
    ...record,
    ownerIdentity,
    managedImageUri: managedImage.managedUri,
    imageMimeType: managedImage.mimeType,
    imageSizeBytes: managedImage.sizeBytes,
    submissionImageUri: sourceCanBeSubmitted ? managedImage.managedUri : null,
    submissionImageMimeType,
    submissionImageSizeBytes: sourceCanBeSubmitted ? managedImage.sizeBytes : null,
  };
}
