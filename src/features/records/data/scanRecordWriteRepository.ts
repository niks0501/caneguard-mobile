import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
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
      transaction
        .insert(scanRecords)
        .values({
          id: input.id,
          managedImageUri: input.managedImageUri,
          imageMimeType: input.imageMimeType,
          imageSizeBytes: input.imageSizeBytes,
          imageSourceType: input.imageSourceType,
          sourceWidth: input.sourceWidth,
          sourceHeight: input.sourceHeight,
          predictedLabel: input.predictedLabel,
          confidence: input.confidence,
          checklistConsistency: input.checklistConsistency,
          reportedSeverity: input.reportedSeverity,
          barangay: input.barangay,
          modelVersion: input.modelVersion,
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

    emitSyncRecordsChanged();
    return { id: input.id };
  } catch (error: unknown) {
    if (isDuplicateRecordError(error)) {
      throw new StorageError('DUPLICATE_RECORD', 'The scan record ID already exists.', {
        cause: error,
      });
    }

    throw toStorageError(
      error,
      'SAVE_TRANSACTION_FAILED',
      'The scan record transaction failed.',
    );
  }
}

function isDuplicateRecordError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /SQLITE_CONSTRAINT_(?:PRIMARYKEY|UNIQUE)/i.test(message) ||
    /UNIQUE constraint failed:\s*scan_records\.id/i.test(message)
  );
}
