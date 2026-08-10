import { and, eq } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
import { fieldReports, scanClassScores, scanRecords } from '@/database/schema';
import { managedImageExists } from '@/features/records/services/scanImageStorage';
import type {
  CreateFieldReportDraftInput,
  FieldReport,
  FinalizeFieldReportInput,
  FinalizeFieldReportResult,
  SaveGpsCaptureInput,
  SaveFieldReportDraftInput,
  SaveManualMapLocationInput,
} from '@/features/reports/domain/fieldReportTypes';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';
import {
  getMissingSubmissionRequirements,
  normalizeFinalizeFieldReportInput,
  normalizeFieldReportDraftInput,
  validateGpsCaptureInput,
  validateCreateFieldReportDraftInput,
  validateManualMapLocationInput,
} from '@/features/reports/domain/fieldReportValidation';

export async function createOrGetFieldReportDraft(
  database: CaneGuardDatabase,
  input: CreateFieldReportDraftInput,
): Promise<FieldReport> {
  validateCreateFieldReportDraftInput(input);

  try {
    return database.transaction((transaction) => {
      const scan = transaction
        .select({
          createdAt: scanRecords.createdAt,
          remoteId: scanRecords.remoteId,
          syncStatus: scanRecords.syncStatus,
        })
        .from(scanRecords)
        .where(eq(scanRecords.id, input.scanRecordId))
        .get();

      if (!scan) {
        throw new StorageError(
          'RECORD_NOT_FOUND',
          'A Field Report requires an existing completed Scan Record.',
        );
      }

      const existing = transaction
        .select()
        .from(fieldReports)
        .where(eq(fieldReports.scanRecordId, input.scanRecordId))
        .get();

      if (existing) {
        if (
          existing.submitterIdentity &&
          existing.submitterIdentity !== input.submitterIdentity.trim()
        ) {
          throw new StorageError(
            'FIELD_REPORT_NOT_FOUND',
            'The Field Report belongs to a different submitter.',
          );
        }
        if (!existing.submitterIdentity || !existing.submitterRole) {
          transaction
            .update(fieldReports)
            .set({
              submitterIdentity:
                existing.submitterIdentity ?? input.submitterIdentity.trim(),
              submitterRole: existing.submitterRole ?? input.submitterRole,
              updatedAt: input.createdAt,
            })
            .where(eq(fieldReports.id, existing.id))
            .run();
          const backfilled = transaction
            .select()
            .from(fieldReports)
            .where(eq(fieldReports.id, existing.id))
            .get();
          if (!backfilled) {
            throw new StorageError('UPDATE_FAILED', 'The Field Report could not be reloaded.');
          }
          return toFieldReport(backfilled);
        }
        return toFieldReport(existing);
      }

      if (scan.syncStatus === 'synced' || scan.remoteId) {
        throw new StorageError(
          'UPDATE_FAILED',
          'A report already synchronized by an earlier app version cannot be resubmitted.',
        );
      }

      const reportId =
        scan.syncStatus === 'local_only' ? input.id : input.scanRecordId;

      transaction
        .insert(fieldReports)
        .values({
          id: reportId,
          scanRecordId: input.scanRecordId,
          authoringState: 'draft',
          submitterIdentity: input.submitterIdentity.trim(),
          submitterRole: input.submitterRole,
          observedAt: scan.createdAt,
          syncStatus: 'local_only',
          createdAt: input.createdAt,
          updatedAt: input.createdAt,
        })
        .run();

      const created = transaction
        .select()
        .from(fieldReports)
        .where(eq(fieldReports.id, reportId))
        .get();

      if (!created) {
        throw new StorageError(
          'SAVE_TRANSACTION_FAILED',
          'The Field Report draft was not persisted.',
        );
      }
      return toFieldReport(created);
    });
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'SAVE_TRANSACTION_FAILED',
      'Creating the Field Report draft failed.',
    );
  }
}

export async function saveGpsCapture(
  database: CaneGuardDatabase,
  id: string,
  submitterIdentity: string,
  input: SaveGpsCaptureInput,
): Promise<FieldReport> {
  validateGpsCaptureInput(input);

  try {
    return database.transaction((transaction) => {
      const existing = transaction
        .select({ authoringState: fieldReports.authoringState })
        .from(fieldReports)
        .where(
          and(
            eq(fieldReports.id, id),
            eq(fieldReports.submitterIdentity, submitterIdentity.trim()),
          ),
        )
        .get();
      if (!existing) {
        throw new StorageError('FIELD_REPORT_NOT_FOUND', 'The Field Report does not exist.');
      }
      if (existing.authoringState !== 'draft') {
        throw new StorageError('UPDATE_FAILED', 'Only a Draft Field Report can capture location.');
      }

      const attemptValues =
        'latitude' in input
          ? {
              gpsAttemptLatitude: input.latitude,
              gpsAttemptLongitude: input.longitude,
              gpsAttemptAccuracy: input.accuracy,
              gpsAttemptedAt: input.capturedAt,
            }
          : {};
      const finalValues =
        input.outcome === 'resolved'
          ? {
              finalLatitude: input.latitude,
              finalLongitude: input.longitude,
              gpsAccuracy: input.accuracy,
              locationSource: 'gps' as const,
              manualLocationSelectedAt: null,
            }
          : {};

      transaction
        .update(fieldReports)
        .set({
          ...attemptValues,
          ...finalValues,
          gpsCaptureOutcome: input.outcome,
          gpsOutcomeRecordedAt: input.capturedAt,
          updatedAt: input.updatedAt,
        })
        .where(and(eq(fieldReports.id, id), eq(fieldReports.authoringState, 'draft')))
        .run();

      const saved = transaction
        .select()
        .from(fieldReports)
        .where(eq(fieldReports.id, id))
        .get();
      if (!saved) {
        throw new StorageError('UPDATE_FAILED', 'The GPS result could not be reloaded.');
      }
      return toFieldReport(saved);
    });
  } catch (error: unknown) {
    throw toStorageError(error, 'UPDATE_FAILED', 'Saving the GPS result failed.');
  }
}

export async function saveManualMapLocation(
  database: CaneGuardDatabase,
  id: string,
  submitterIdentity: string,
  input: SaveManualMapLocationInput,
): Promise<FieldReport> {
  validateManualMapLocationInput(input);

  try {
    return database.transaction((transaction) => {
      const existing = transaction
        .select({ authoringState: fieldReports.authoringState })
        .from(fieldReports)
        .where(
          and(
            eq(fieldReports.id, id),
            eq(fieldReports.submitterIdentity, submitterIdentity.trim()),
          ),
        )
        .get();
      if (!existing) {
        throw new StorageError('FIELD_REPORT_NOT_FOUND', 'The Field Report does not exist.');
      }
      if (existing.authoringState !== 'draft') {
        throw new StorageError(
          'UPDATE_FAILED',
          'Only a Draft Field Report can select a manual location.',
        );
      }

      transaction
        .update(fieldReports)
        .set({
          finalLatitude: input.latitude,
          finalLongitude: input.longitude,
          gpsAccuracy: null,
          locationSource: 'manual_map',
          manualLocationSelectedAt: input.selectedAt,
          updatedAt: input.updatedAt,
        })
        .where(and(eq(fieldReports.id, id), eq(fieldReports.authoringState, 'draft')))
        .run();

      const saved = transaction
        .select()
        .from(fieldReports)
        .where(eq(fieldReports.id, id))
        .get();
      if (!saved) {
        throw new StorageError('UPDATE_FAILED', 'The manual location could not be reloaded.');
      }
      return toFieldReport(saved);
    });
  } catch (error: unknown) {
    throw toStorageError(error, 'UPDATE_FAILED', 'Saving the manual location failed.');
  }
}

export async function finalizeFieldReport(
  database: CaneGuardDatabase,
  id: string,
  submitterIdentity: string,
  input: FinalizeFieldReportInput,
  dependencies: { imageExists?: (uri: string) => boolean } = {},
): Promise<FinalizeFieldReportResult> {
  const values = normalizeFinalizeFieldReportInput(input);
  const imageExists = dependencies.imageExists ?? managedImageExists;

  try {
    const result = database.transaction((transaction) => {
      const existing = transaction
        .select()
        .from(fieldReports)
        .where(
          and(
            eq(fieldReports.id, id),
            eq(fieldReports.submitterIdentity, submitterIdentity.trim()),
          ),
        )
        .get();
      if (!existing) {
        throw new StorageError('FIELD_REPORT_NOT_FOUND', 'The Field Report does not exist.');
      }
      if (existing.authoringState !== 'draft') {
        throw new StorageError('UPDATE_FAILED', 'Only a Draft Field Report can be finalized.');
      }

      transaction
        .update(fieldReports)
        .set({
          barangay: values.barangay,
          farmerOrFarmOwnerName: values.farmerOrFarmOwnerName,
          updatedAt: values.updatedAt,
        })
        .where(and(eq(fieldReports.id, id), eq(fieldReports.authoringState, 'draft')))
        .run();

      const draftRow = transaction
        .select()
        .from(fieldReports)
        .where(eq(fieldReports.id, id))
        .get();
      const scan = transaction
        .select({
          checklistConsistency: scanRecords.checklistConsistency,
          confidence: scanRecords.confidence,
          managedImageUri: scanRecords.managedImageUri,
          predictedLabel: scanRecords.predictedLabel,
          sourceHeight: scanRecords.sourceHeight,
          sourceWidth: scanRecords.sourceWidth,
        })
        .from(scanRecords)
        .where(eq(scanRecords.id, existing.scanRecordId))
        .get();
      const classScores = transaction
        .select({ label: scanClassScores.label, score: scanClassScores.score })
        .from(scanClassScores)
        .where(eq(scanClassScores.scanRecordId, existing.scanRecordId))
        .all();
      if (!draftRow || !scan) {
        throw new StorageError(
          'RECORD_NOT_FOUND',
          'The Field Report scan evidence is unavailable.',
        );
      }

      const draft = toFieldReport(draftRow);
      const missingRequirements = getMissingSubmissionRequirements(draft, {
        ...scan,
        classScores,
        managedImageAvailable: imageExists(scan.managedImageUri),
      });
      if (missingRequirements.length > 0) {
        return { missingRequirements, report: draft, status: 'invalid' as const };
      }

      transaction
        .update(fieldReports)
        .set({
          authoringState: 'finalized',
          submittedAt: values.submittedAt,
          syncStatus: 'pending',
          updatedAt: values.updatedAt,
        })
        .where(and(eq(fieldReports.id, id), eq(fieldReports.authoringState, 'draft')))
        .run();
      const finalizedRow = transaction
        .select()
        .from(fieldReports)
        .where(eq(fieldReports.id, id))
        .get();
      if (!finalizedRow) {
        throw new StorageError('UPDATE_FAILED', 'The finalized report could not be reloaded.');
      }
      return { report: toFieldReport(finalizedRow), status: 'finalized' as const };
    });
    if (result.status === 'finalized') {
      emitSyncRecordsChanged();
    }
    return result;
  } catch (error: unknown) {
    throw toStorageError(error, 'UPDATE_FAILED', 'Finalizing the Field Report failed.');
  }
}

export async function findFieldReportById(
  database: CaneGuardDatabase,
  id: string,
): Promise<FieldReport> {
  try {
    const row = await database
      .select()
      .from(fieldReports)
      .where(eq(fieldReports.id, id))
      .get();
    if (!row) {
      throw new StorageError(
        'FIELD_REPORT_NOT_FOUND',
        'The Field Report does not exist.',
      );
    }
    return toFieldReport(row);
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Reading the Field Report failed.');
  }
}

export async function findFieldReportByScanRecordId(
  database: CaneGuardDatabase,
  scanRecordId: string,
  submitterIdentity: string,
): Promise<FieldReport | null> {
  try {
    const row = await database
      .select()
      .from(fieldReports)
      .where(
        and(
          eq(fieldReports.scanRecordId, scanRecordId),
          eq(fieldReports.submitterIdentity, submitterIdentity.trim()),
        ),
      )
      .get();
    return row ? toFieldReport(row) : null;
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Reading the Field Report failed.');
  }
}

export async function saveFieldReportDraft(
  database: CaneGuardDatabase,
  id: string,
  submitterIdentity: string,
  input: SaveFieldReportDraftInput,
): Promise<FieldReport> {
  const values = normalizeFieldReportDraftInput(input);

  try {
    return database.transaction((transaction) => {
      const existing = transaction
        .select({ authoringState: fieldReports.authoringState })
        .from(fieldReports)
        .where(
          and(
            eq(fieldReports.id, id),
            eq(fieldReports.submitterIdentity, submitterIdentity.trim()),
          ),
        )
        .get();

      if (!existing) {
        throw new StorageError(
          'FIELD_REPORT_NOT_FOUND',
          'The Field Report does not exist.',
        );
      }
      if (existing.authoringState !== 'draft') {
        throw new StorageError(
          'UPDATE_FAILED',
          'Only a Draft Field Report can be edited by this workflow.',
        );
      }

      transaction
        .update(fieldReports)
        .set(values)
        .where(
          and(
            eq(fieldReports.id, id),
            eq(fieldReports.authoringState, 'draft'),
          ),
        )
        .run();

      const saved = transaction
        .select()
        .from(fieldReports)
        .where(eq(fieldReports.id, id))
        .get();

      if (!saved) {
        throw new StorageError(
          'UPDATE_FAILED',
          'The Field Report draft could not be reloaded.',
        );
      }
      return toFieldReport(saved);
    });
  } catch (error: unknown) {
    throw toStorageError(error, 'UPDATE_FAILED', 'Saving the draft failed.');
  }
}

function toFieldReport(row: typeof fieldReports.$inferSelect): FieldReport {
  return {
    id: row.id,
    scanRecordId: row.scanRecordId,
    authoringState: row.authoringState,
    farmerOrFarmOwnerName: row.farmerOrFarmOwnerName,
    province: row.province,
    municipality: row.municipality,
    barangay: row.barangay,
    finalLatitude: row.finalLatitude,
    finalLongitude: row.finalLongitude,
    locationSource: row.locationSource,
    manualLocationSelectedAt: row.manualLocationSelectedAt,
    gpsAccuracy: row.gpsAccuracy,
    gpsAttemptLatitude: row.gpsAttemptLatitude,
    gpsAttemptLongitude: row.gpsAttemptLongitude,
    gpsAttemptAccuracy: row.gpsAttemptAccuracy,
    gpsAttemptedAt: row.gpsAttemptedAt,
    gpsCaptureOutcome: row.gpsCaptureOutcome,
    gpsOutcomeRecordedAt: row.gpsOutcomeRecordedAt,
    observedAt: row.observedAt,
    submittedAt: row.submittedAt,
    submitterIdentity: row.submitterIdentity,
    submitterRole: row.submitterRole as FieldReport['submitterRole'],
    remoteId: row.remoteId,
    syncAttemptCount: row.syncAttemptCount,
    lastSyncErrorCode: row.lastSyncErrorCode,
    lastSyncAttemptAt: row.lastSyncAttemptAt,
    lastSyncedAt: row.lastSyncedAt,
    syncStatus: row.syncStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
