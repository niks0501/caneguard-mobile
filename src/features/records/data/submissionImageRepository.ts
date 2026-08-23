import { eq } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
import { scanRecords } from '@/database/schema';
import {
  isValidSubmissionImageMetadata,
  normalizeMobileReportImageMimeType,
} from '@/features/sync/constants/mobileReportUploadContract';
import type { SubmissionImageArtifact } from '@/features/records/services/submissionImageStorage';
import { getSubmissionImageUri } from '@/features/records/services/scanImageStorage';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';

export async function persistSubmissionImageMetadata(
  database: CaneGuardDatabase,
  scanRecordId: string,
  sourceUri: string,
  artifact: SubmissionImageArtifact,
): Promise<void> {
  const mimeType = normalizeMobileReportImageMimeType(artifact.mimeType);
  if (
    !mimeType ||
    !isValidSubmissionImageMetadata({
      sourceUri,
      submissionImageMimeType: mimeType,
      submissionImageSizeBytes: artifact.sizeBytes,
      submissionImageUri: artifact.uri,
      expectedSubmissionImageUri: getSubmissionImageUri(scanRecordId),
    })
  ) {
    throw new StorageError(
      'IMAGE_PREPARATION_FAILED',
      'The submission image metadata is invalid.',
    );
  }

  try {
    const result = await database
      .update(scanRecords)
      .set({
        submissionImageUri: artifact.uri,
        submissionImageMimeType: mimeType,
        submissionImageSizeBytes: artifact.sizeBytes,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(scanRecords.id, scanRecordId));

    if (result.changes === 0) {
      throw new StorageError(
        'RECORD_NOT_FOUND',
        'The Scan Record could not be updated with its submission image.',
      );
    }
    emitSyncRecordsChanged();
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'UPDATE_FAILED',
      'Persisting the submission image metadata failed.',
    );
  }
}
