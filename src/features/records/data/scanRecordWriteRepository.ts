import { and, eq } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
import { requireOwnerIdentity } from '@/database/ownerIdentity';
import {
  scanClassScores,
  scanQualityWarnings,
  scanRecords,
  scanSymptoms,
} from '@/database/schema';
import type { ScanRecordWriteRepository } from '@/features/records/data/repositoryContracts';
import type { SaveCompletedScanInput } from '@/features/records/domain/recordTypes';
import { validateSaveCompletedScanInput } from '@/features/records/domain/recordValidation';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';

export function createScanRecordWriteRepository(
  database: CaneGuardDatabase,
): ScanRecordWriteRepository {
  return {
    async insert(input) {
      return insertScanRecord(database, input);
    },
  };
}

export async function insertScanRecord(
  database: CaneGuardDatabase,
  input: SaveCompletedScanInput,
): Promise<{ id: string }> {
  validateSaveCompletedScanInput(input);

  try {
    database.transaction((transaction) => {
      const ownerIdentity = requireOwnerIdentity(input.ownerIdentity);
      if (input.followsUpScanId) {
        // A follow-up must follow an original check owned by the same account.
        const original = transaction
          .select({
            ownerIdentity: scanRecords.ownerIdentity,
            followsUpScanId: scanRecords.followsUpScanId,
          })
          .from(scanRecords)
          .where(eq(scanRecords.id, input.followsUpScanId))
          .get();
        if (!original || original.ownerIdentity !== ownerIdentity) {
          throw new StorageError(
            'INVALID_SCAN_RECORD',
            'The scan being followed up is not available to this account.',
          );
        }
        if (original.followsUpScanId) {
          throw new StorageError(
            'INVALID_SCAN_RECORD',
            'A follow-up must link to the first check, not to another follow-up.',
          );
        }
      }

      transaction
        .insert(scanRecords)
        .values({
          id: input.id,
          ownerIdentity,
          followsUpScanId: input.followsUpScanId ?? null,
          personalNote: input.personalNote ?? null,
          managedImageUri: input.managedImageUri,
          imageMimeType: input.imageMimeType,
          imageSizeBytes: input.imageSizeBytes,
          submissionImageUri: input.submissionImageUri ?? null,
          submissionImageMimeType: input.submissionImageMimeType ?? null,
          submissionImageSizeBytes: input.submissionImageSizeBytes ?? null,
          imageSourceType: input.imageSourceType,
          sourceWidth: input.sourceWidth,
          sourceHeight: input.sourceHeight,
          predictedLabel: input.predictedLabel,
          confidence: input.confidence,
          checklistConsistency: input.checklistConsistency,
          reportedSeverity: input.reportedSeverity,
          barangay: input.barangay,
          modelVersion: input.modelVersion,
          decisionSupportWording: input.decisionSupportWording,
          preprocessMs: input.preprocessMs,
          inferenceMs: input.inferenceMs,
          totalMs: input.totalMs,
          syncStatus: 'local_only',
          remoteId: null,
          syncAttemptCount: 0,
          lastSyncErrorCode: null,
          lastSyncAttemptAt: null,
          lastSyncedAt: null,
          createdAt: input.createdAt,
          updatedAt: input.updatedAt,
        })
        .run();

      transaction
        .insert(scanClassScores)
        .values(
          input.classScores.map((score) => ({
            scanRecordId: input.id,
            label: score.label,
            score: score.score,
          })),
        )
        .run();

      if (input.symptoms.length > 0) {
        transaction
          .insert(scanSymptoms)
          .values(
            input.symptoms.map((symptomKey) => ({
              scanRecordId: input.id,
              symptomKey,
            })),
          )
          .run();
      }

      if (input.qualityWarnings.length > 0) {
        transaction
          .insert(scanQualityWarnings)
          .values(
            input.qualityWarnings.map((warningKey) => ({
              scanRecordId: input.id,
              warningKey,
            })),
          )
          .run();
      }
    });
  } catch (error: unknown) {
    if (isDuplicateRecordError(error)) {
      throw new StorageError('DUPLICATE_RECORD', 'The scan record ID already exists.', {
        cause: error,
      });
    }

    if (!(await isOwnedRecordOnDevice(database, input))) {
      throw toStorageError(
        error,
        'SAVE_TRANSACTION_FAILED',
        'The scan record transaction failed.',
      );
    }

    // The record is on the device even though the driver reported an error, so
    // the write is a success; telling the farmer it failed loses a saved scan.
  }

  notifyRecordsChanged();
  return { id: input.id };
}

async function isOwnedRecordOnDevice(
  database: CaneGuardDatabase,
  input: SaveCompletedScanInput,
): Promise<boolean> {
  try {
    const row = await database
      .select({ id: scanRecords.id })
      .from(scanRecords)
      .where(
        and(
          eq(scanRecords.id, input.id),
          eq(scanRecords.ownerIdentity, requireOwnerIdentity(input.ownerIdentity)),
        ),
      )
      .get();
    return Boolean(row);
  } catch {
    return false;
  }
}

function notifyRecordsChanged(): void {
  // A saved record must never be reported as failed because a list refresh
  // subscriber threw after the transaction committed.
  try {
    emitSyncRecordsChanged();
  } catch {
    if (__DEV__) {
      console.warn(
        '[records:SYNC_NOTICE_FAILED] The saved scan was not announced to list subscribers.',
      );
    }
  }
}

function isDuplicateRecordError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /SQLITE_CONSTRAINT_(?:PRIMARYKEY|UNIQUE)/i.test(message) ||
    /UNIQUE constraint failed:\s*scan_records\.id/i.test(message)
  );
}
