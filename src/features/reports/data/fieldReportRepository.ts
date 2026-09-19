import { and, eq } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
import { requireOwnerIdentity } from '@/database/ownerIdentity';
import {
  fieldReports,
  scanClassScores,
  scanRecords,
  LOCATION_UNAVAILABLE_REASONS,
  type LocationUnavailableReason,
} from '@/database/schema';
import { persistSubmissionImageMetadata } from '@/features/records/data/submissionImageRepository';
import {
  prepareSubmissionImage,
  type PreparedSubmissionImage,
  type SubmissionImagePreparationInput,
} from '@/features/records/services/submissionImageStorage';
import {
  deleteManagedScanImage,
  getSubmissionImageUri,
  isManagedScanImageUri,
  managedImageExists,
} from '@/features/records/services/scanImageStorage';
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
import { toAuthorityReviewSnapshot } from '@/features/reports/domain/reportReviewTypes';
import {
  getMissingSubmissionRequirements,
  normalizeFinalizeFieldReportInput,
  normalizeFieldReportDraftInput,
  resolveMeasurementProvenance,
  validateGpsCaptureInput,
  validateCreateFieldReportDraftInput,
  validateManualMapLocationInput,
} from '@/features/reports/domain/fieldReportValidation';

export async function createOrGetFieldReportDraft(
  database: CaneGuardDatabase,
  input: CreateFieldReportDraftInput,
): Promise<FieldReport> {
  validateCreateFieldReportDraftInput(input);
  const owner = requireOwnerIdentity(input.submitterIdentity);

  try {
    return database.transaction((transaction) => {
      const scan = transaction
        .select({
          createdAt: scanRecords.createdAt,
          remoteId: scanRecords.remoteId,
          syncStatus: scanRecords.syncStatus,
        })
        .from(scanRecords)
        .where(
          and(
            eq(scanRecords.id, input.scanRecordId),
            eq(scanRecords.ownerIdentity, owner),
          ),
        )
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
          // Region defaults come from the reference-data store (D2); the
          // schema defaults remain the offline fallback.
          ...(input.province === undefined
            ? {}
            : { province: input.province.trim() }),
          ...(input.municipality === undefined
            ? {}
            : { municipality: input.municipality.trim() }),
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
  const owner = requireOwnerIdentity(submitterIdentity);

  try {
    return database.transaction((transaction) => {
      const existing = transaction
        .select({
          authoringState: fieldReports.authoringState,
          scanRecordId: fieldReports.scanRecordId,
        })
        .from(fieldReports)
        .where(
          and(
            eq(fieldReports.id, id),
            eq(fieldReports.submitterIdentity, owner),
          ),
        )
        .get();
      const scan = existing
        ? transaction
            .select({ id: scanRecords.id })
            .from(scanRecords)
            .where(
              and(
                eq(scanRecords.id, existing.scanRecordId),
                eq(scanRecords.ownerIdentity, owner),
              ),
            )
            .get()
        : null;
      if (!existing || !scan) {
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
        'latitude' in input
          ? {
              finalLatitude: input.latitude,
              finalLongitude: input.longitude,
              gpsAccuracy: input.accuracy,
              locationSource: 'gps' as const,
              locationUnavailableReason: null,
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
  const owner = requireOwnerIdentity(submitterIdentity);

  try {
    return database.transaction((transaction) => {
      const existing = transaction
        .select({
          authoringState: fieldReports.authoringState,
          scanRecordId: fieldReports.scanRecordId,
        })
        .from(fieldReports)
        .where(
          and(
            eq(fieldReports.id, id),
            eq(fieldReports.submitterIdentity, owner),
          ),
        )
        .get();
      const scan = existing
        ? transaction
            .select({ id: scanRecords.id })
            .from(scanRecords)
            .where(
              and(
                eq(scanRecords.id, existing.scanRecordId),
                eq(scanRecords.ownerIdentity, owner),
              ),
            )
            .get()
        : null;
      if (!existing || !scan) {
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
          locationUnavailableReason: null,
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

/**
 * D-02: record that the inspector finished the Draft without an exact
 * coordinate. Barangay and every other required detail stay mandatory; only the
 * coordinate requirement is replaced by an explicit, bounded reason.
 */
export async function clearLocationUnavailable(
  database: CaneGuardDatabase,
  id: string,
  submitterIdentity: string,
  input: { updatedAt: string },
): Promise<FieldReport> {
  const owner = requireOwnerIdentity(submitterIdentity);
  if (!isValidUtcTimestampValue(input.updatedAt)) {
    throw new StorageError('INVALID_FIELD_REPORT', 'A draft timestamp is invalid.');
  }

  try {
    return database.transaction((transaction) => {
      const existing = transaction
        .select({ authoringState: fieldReports.authoringState, scanRecordId: fieldReports.scanRecordId })
        .from(fieldReports)
        .where(and(eq(fieldReports.id, id), eq(fieldReports.submitterIdentity, owner)))
        .get();
      const scan = existing
        ? transaction
            .select({ id: scanRecords.id })
            .from(scanRecords)
            .where(and(eq(scanRecords.id, existing.scanRecordId), eq(scanRecords.ownerIdentity, owner)))
            .get()
        : null;
      if (!existing || !scan) {
        throw new StorageError('FIELD_REPORT_NOT_FOUND', 'The Field Report does not exist.');
      }
      if (existing.authoringState !== 'draft') {
        throw new StorageError('UPDATE_FAILED', 'Only a Draft Field Report can change its location.');
      }

      transaction
        .update(fieldReports)
        .set({
          finalLatitude: null,
          finalLongitude: null,
          gpsAccuracy: null,
          locationSource: null,
          locationUnavailableReason: null,
          updatedAt: input.updatedAt,
        })
        .where(and(eq(fieldReports.id, id), eq(fieldReports.authoringState, 'draft')))
        .run();

      const saved = transaction.select().from(fieldReports).where(eq(fieldReports.id, id)).get();
      if (!saved) {
        throw new StorageError('UPDATE_FAILED', 'The location could not be reloaded.');
      }
      return toFieldReport(saved);
    });
  } catch (error: unknown) {
    throw toStorageError(error, 'UPDATE_FAILED', 'Changing the report location failed.');
  }
}

export async function setLocationUnavailable(
  database: CaneGuardDatabase,
  id: string,
  submitterIdentity: string,
  input: { reason: LocationUnavailableReason; updatedAt: string },
): Promise<FieldReport> {
  const owner = requireOwnerIdentity(submitterIdentity);
  if (!isValidUtcTimestampValue(input.updatedAt)) {
    throw new StorageError('INVALID_FIELD_REPORT', 'A draft timestamp is invalid.');
  }
  if (!LOCATION_UNAVAILABLE_REASONS.includes(input.reason)) {
    throw new StorageError(
      'INVALID_FIELD_REPORT',
      'Choose why the location is unavailable.',
    );
  }

  try {
    return database.transaction((transaction) => {
      const existing = transaction
        .select({
          authoringState: fieldReports.authoringState,
          scanRecordId: fieldReports.scanRecordId,
        })
        .from(fieldReports)
        .where(
          and(
            eq(fieldReports.id, id),
            eq(fieldReports.submitterIdentity, owner),
          ),
        )
        .get();
      const scan = existing
        ? transaction
            .select({ id: scanRecords.id })
            .from(scanRecords)
            .where(
              and(
                eq(scanRecords.id, existing.scanRecordId),
                eq(scanRecords.ownerIdentity, owner),
              ),
            )
            .get()
        : null;
      if (!existing || !scan) {
        throw new StorageError('FIELD_REPORT_NOT_FOUND', 'The Field Report does not exist.');
      }
      if (existing.authoringState !== 'draft') {
        throw new StorageError(
          'UPDATE_FAILED',
          'Only a Draft Field Report can record an unavailable location.',
        );
      }

      transaction
        .update(fieldReports)
        .set({
          finalLatitude: null,
          finalLongitude: null,
          gpsAccuracy: null,
          locationSource: 'unavailable',
          locationUnavailableReason: input.reason,
          // An explicit unavailable choice supersedes any earlier successful
          // GPS outcome while retaining the attempt coordinates as evidence.
          gpsCaptureOutcome: 'unavailable',
          gpsOutcomeRecordedAt: input.updatedAt,
          manualLocationSelectedAt: null,
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
        throw new StorageError(
          'UPDATE_FAILED',
          'The unavailable location could not be reloaded.',
        );
      }
      return toFieldReport(saved);
    });
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'UPDATE_FAILED',
      'Recording the unavailable location failed.',
    );
  }
}

function isValidUtcTimestampValue(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
    && !Number.isNaN(Date.parse(value));
}

export interface FinalizeFieldReportDependencies {
  imageExists?: (uri: string) => boolean;
  persistSubmissionImage?: typeof persistSubmissionImageMetadata;
  prepareSubmissionImage?: typeof prepareSubmissionImage;
}

export async function finalizeFieldReport(
  database: CaneGuardDatabase,
  id: string,
  submitterIdentity: string,
  input: FinalizeFieldReportInput,
  dependencies: FinalizeFieldReportDependencies = {},
): Promise<FinalizeFieldReportResult> {
  const values = normalizeFinalizeFieldReportInput(input);
  const owner = requireOwnerIdentity(submitterIdentity);
  const imageExists = dependencies.imageExists ?? managedImageExists;
  const prepareImage = dependencies.prepareSubmissionImage ?? prepareSubmissionImage;
  const persistImage =
    dependencies.persistSubmissionImage ?? persistSubmissionImageMetadata;

  try {
    const draftContext = database.transaction((transaction) => {
      const existing = transaction
        .select()
        .from(fieldReports)
        .where(
          and(
            eq(fieldReports.id, id),
            eq(fieldReports.submitterIdentity, owner),
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
          affectedAreaHectares: values.affectedAreaHectares,
          affectedAreaMeasurement: values.affectedAreaMeasurement,
          affectedPortionPercent: values.affectedPortionPercent,
          affectedPortionMeasurement: values.affectedPortionMeasurement,
          barangay: values.barangay,
          caneClass: values.caneClass,
          cropAge: values.cropAge,
          farmerOrFarmOwnerName: values.farmerOrFarmOwnerName,
          fieldNotes: values.fieldNotes,
          mismatchReported: values.mismatchReported,
          reporterObservationText: values.reporterObservationText,
          reporterSuspectedCondition: values.reporterSuspectedCondition,
          sugarcaneVariety: values.sugarcaneVariety,
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
          imageMimeType: scanRecords.imageMimeType,
          imageSizeBytes: scanRecords.imageSizeBytes,
          managedImageUri: scanRecords.managedImageUri,
          predictedLabel: scanRecords.predictedLabel,
          sourceHeight: scanRecords.sourceHeight,
          sourceWidth: scanRecords.sourceWidth,
          submissionImageMimeType: scanRecords.submissionImageMimeType,
          submissionImageSizeBytes: scanRecords.submissionImageSizeBytes,
          submissionImageUri: scanRecords.submissionImageUri,
        })
        .from(scanRecords)
        .where(
          and(
            eq(scanRecords.id, existing.scanRecordId),
            eq(scanRecords.ownerIdentity, owner),
          ),
        )
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

      return {
        classScores,
        draft: toFieldReport(draftRow),
        scan,
      };
    });

    const initialMissingRequirements = getMissingSubmissionRequirements(
      draftContext.draft,
      toSubmissionEvidence(
        draftContext.scan,
        draftContext.classScores,
        draftContext.draft.scanRecordId,
        owner,
        imageExists,
      ),
    );
    const requirementsBeforeImagePreparation = initialMissingRequirements.filter(
      (requirement) => requirement !== 'submission_image',
    );
    if (requirementsBeforeImagePreparation.length > 0) {
      return {
        missingRequirements: requirementsBeforeImagePreparation,
        report: draftContext.draft,
        status: 'invalid',
      };
    }

    {
      let preparedImage: PreparedSubmissionImage;
      try {
        preparedImage = await prepareImage(
          toSubmissionPreparationInput(
            draftContext.scan,
            draftContext.draft.scanRecordId,
            owner,
          ),
        );
      } catch (error: unknown) {
        if (error instanceof StorageError && error.code === 'IMAGE_PREPARATION_FAILED') {
          return {
            missingRequirements: ['submission_image'],
            report: draftContext.draft,
            status: 'invalid',
          };
        }
        throw error;
      }

      if (preparedImage.requiresPersistence) {
        try {
          await persistImage(
            database,
            draftContext.draft.scanRecordId,
            owner,
            draftContext.scan.managedImageUri,
            preparedImage.artifact,
          );
        } catch (error: unknown) {
          if (preparedImage.created) {
            cleanupPreparedImage(
              preparedImage,
              draftContext.scan.managedImageUri,
              owner,
            );
          }
          throw error;
        }
      }
    }

    const result = database.transaction((transaction) => {
      const existing = transaction
        .select()
        .from(fieldReports)
        .where(
          and(
            eq(fieldReports.id, id),
            eq(fieldReports.submitterIdentity, owner),
          ),
        )
        .get();
      if (!existing) {
        throw new StorageError('FIELD_REPORT_NOT_FOUND', 'The Field Report does not exist.');
      }
      if (existing.authoringState !== 'draft') {
        throw new StorageError('UPDATE_FAILED', 'Only a Draft Field Report can be finalized.');
      }

      const scan = transaction
        .select({
          checklistConsistency: scanRecords.checklistConsistency,
          confidence: scanRecords.confidence,
          managedImageUri: scanRecords.managedImageUri,
          predictedLabel: scanRecords.predictedLabel,
          sourceHeight: scanRecords.sourceHeight,
          sourceWidth: scanRecords.sourceWidth,
          submissionImageMimeType: scanRecords.submissionImageMimeType,
          submissionImageSizeBytes: scanRecords.submissionImageSizeBytes,
          submissionImageUri: scanRecords.submissionImageUri,
        })
        .from(scanRecords)
        .where(
          and(
            eq(scanRecords.id, existing.scanRecordId),
            eq(scanRecords.ownerIdentity, owner),
          ),
        )
        .get();
      const classScores = transaction
        .select({ label: scanClassScores.label, score: scanClassScores.score })
        .from(scanClassScores)
        .where(eq(scanClassScores.scanRecordId, existing.scanRecordId))
        .all();
      if (!scan) {
        throw new StorageError(
          'RECORD_NOT_FOUND',
          'The Field Report scan evidence is unavailable.',
        );
      }

      const report = toFieldReport(existing);
      const missingRequirements = getMissingSubmissionRequirements(
        report,
        toSubmissionEvidence(
          scan,
          classScores,
          existing.scanRecordId,
          owner,
          imageExists,
        ),
      );
      if (missingRequirements.length > 0) {
        return { missingRequirements, report, status: 'invalid' as const };
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

function toSubmissionPreparationInput(
  scan: {
    imageMimeType: string | null;
    imageSizeBytes: number | null;
    managedImageUri: string;
    sourceHeight: number | null;
    sourceWidth: number | null;
    submissionImageMimeType: string | null;
    submissionImageSizeBytes: number | null;
    submissionImageUri: string | null;
  },
  recordId: string,
  ownerIdentity: string,
): SubmissionImagePreparationInput {
  return {
    ownerIdentity,
    recordId,
    sourceHeight: scan.sourceHeight,
    sourceMimeType: scan.imageMimeType ?? null,
    sourceSizeBytes: scan.imageSizeBytes ?? null,
    sourceUri: scan.managedImageUri,
    sourceWidth: scan.sourceWidth,
    submissionImageMimeType: scan.submissionImageMimeType,
    submissionImageSizeBytes: scan.submissionImageSizeBytes,
    submissionImageUri: scan.submissionImageUri,
  };
}

function toSubmissionEvidence(
  scan: {
    checklistConsistency: string | null;
    confidence: number | null;
    managedImageUri: string;
    predictedLabel: string | null;
    sourceHeight: number | null;
    sourceWidth: number | null;
    submissionImageMimeType: string | null;
    submissionImageSizeBytes: number | null;
    submissionImageUri: string | null;
  },
  classScores: { label: string; score: number }[],
  recordId: string,
  ownerIdentity: string,
  imageExists: (uri: string) => boolean,
) {
  return {
    checklistConsistency: scan.checklistConsistency,
    classScores,
    confidence: scan.confidence,
    managedImageUri: scan.managedImageUri,
    managedImageAvailable: imageExists(scan.managedImageUri),
    predictedLabel: scan.predictedLabel,
    sourceHeight: scan.sourceHeight,
    sourceWidth: scan.sourceWidth,
    submissionImageMimeType: scan.submissionImageMimeType,
    submissionImageSizeBytes: scan.submissionImageSizeBytes,
    submissionImageUri: scan.submissionImageUri,
    expectedSubmissionImageUri: getSubmissionImageUri(recordId, ownerIdentity),
    submissionImageAvailable:
      Boolean(scan.submissionImageUri) && imageExists(scan.submissionImageUri!),
  };
}

function cleanupPreparedImage(
  preparedImage: PreparedSubmissionImage,
  sourceUri: string,
  ownerIdentity: string,
): void {
  if (
    preparedImage.artifact.uri === sourceUri ||
    !isManagedScanImageUri(preparedImage.artifact.uri)
  ) {
    return;
  }
  try {
    deleteManagedScanImage(preparedImage.artifact.uri, ownerIdentity);
  } catch {
    // The database failure remains the primary error.
  }
}

export async function findFieldReportById(
  database: CaneGuardDatabase,
  id: string,
  submitterIdentity: string,
): Promise<FieldReport> {
  const owner = requireOwnerIdentity(submitterIdentity);
  try {
    const row = await database
      .select()
      .from(fieldReports)
      .where(
        and(
          eq(fieldReports.id, id),
          eq(fieldReports.submitterIdentity, owner),
        ),
      )
      .get();
    if (!row) {
      throw new StorageError(
        'FIELD_REPORT_NOT_FOUND',
        'The Field Report does not exist.',
      );
    }
    const scan = await database
      .select({ id: scanRecords.id })
      .from(scanRecords)
      .where(
        and(
          eq(scanRecords.id, row.scanRecordId),
          eq(scanRecords.ownerIdentity, owner),
        ),
      )
      .get();
    if (!scan) {
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
  const owner = requireOwnerIdentity(submitterIdentity);
  try {
    const row = await database
      .select()
      .from(fieldReports)
      .where(
        and(
          eq(fieldReports.scanRecordId, scanRecordId),
          eq(fieldReports.submitterIdentity, owner),
        ),
      )
      .get();
    if (!row) {
      return null;
    }
    const scan = await database
      .select({ id: scanRecords.id })
      .from(scanRecords)
      .where(
        and(
          eq(scanRecords.id, scanRecordId),
          eq(scanRecords.ownerIdentity, owner),
        ),
      )
      .get();
    return scan ? toFieldReport(row) : null;
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Reading the Field Report failed.');
  }
}

export async function findScanRecordIdForCase(
  database: CaneGuardDatabase,
  submitterIdentity: string,
  identity: { caseUuid: string | null; referenceCode: string | null },
): Promise<string | null> {
  const owner = requireOwnerIdentity(submitterIdentity);
  const caseUuid = identity.caseUuid?.trim() || null;
  const referenceCode = identity.referenceCode?.trim() || null;
  if (!caseUuid && !referenceCode) {
    return null;
  }

  try {
    const ownedScanRecord = and(
      eq(scanRecords.id, fieldReports.scanRecordId),
      eq(scanRecords.ownerIdentity, owner),
      eq(fieldReports.submitterIdentity, owner),
    );

    if (caseUuid) {
      const byRemoteId = await database
        .select({ scanRecordId: fieldReports.scanRecordId })
        .from(fieldReports)
        .innerJoin(scanRecords, ownedScanRecord)
        .where(eq(fieldReports.remoteId, caseUuid))
        .get();
      if (byRemoteId) {
        return byRemoteId.scanRecordId;
      }
    }

    if (referenceCode) {
      const byReference = await database
        .select({ scanRecordId: fieldReports.scanRecordId })
        .from(fieldReports)
        .innerJoin(scanRecords, ownedScanRecord)
        .where(eq(fieldReports.authorityReferenceCode, referenceCode))
        .get();
      if (byReference) {
        return byReference.scanRecordId;
      }
    }

    return null;
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'QUERY_FAILED',
      'Resolving the notification destination failed.',
    );
  }
}

export async function hasFieldReportOwnedByAnotherSubmitter(
  database: CaneGuardDatabase,
  scanRecordId: string,
  submitterIdentity: string,
): Promise<boolean> {
  const owner = requireOwnerIdentity(submitterIdentity);
  try {
    const scan = await database
      .select({ ownerIdentity: scanRecords.ownerIdentity })
      .from(scanRecords)
      .where(and(eq(scanRecords.id, scanRecordId), eq(scanRecords.ownerIdentity, owner)))
      .get();
    if (!scan) {
      return false;
    }
    const row = await database
      .select({ submitterIdentity: fieldReports.submitterIdentity })
      .from(fieldReports)
      .where(eq(fieldReports.scanRecordId, scanRecordId))
      .get();
    const reportOwner = row?.submitterIdentity?.trim();
    return Boolean(row && reportOwner !== owner);
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'QUERY_FAILED',
      'Checking Field Report ownership failed.',
    );
  }
}

export async function saveFieldReportDraft(
  database: CaneGuardDatabase,
  id: string,
  submitterIdentity: string,
  input: SaveFieldReportDraftInput,
): Promise<FieldReport> {
  const values = normalizeFieldReportDraftInput(input);
  const owner = requireOwnerIdentity(submitterIdentity);

  try {
    return database.transaction((transaction) => {
      const existing = transaction
        .select({
          authoringState: fieldReports.authoringState,
          scanRecordId: fieldReports.scanRecordId,
        })
        .from(fieldReports)
        .where(
          and(
            eq(fieldReports.id, id),
            eq(fieldReports.submitterIdentity, owner),
          ),
        )
        .get();
      const scan = existing
        ? transaction
            .select({ id: scanRecords.id })
            .from(scanRecords)
            .where(
              and(
                eq(scanRecords.id, existing.scanRecordId),
                eq(scanRecords.ownerIdentity, owner),
              ),
            )
            .get()
        : null;

      if (!existing || !scan) {
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

export async function deleteFieldReportDraft(
  database: CaneGuardDatabase,
  id: string,
  submitterIdentity: string,
): Promise<void> {
  const owner = requireOwnerIdentity(submitterIdentity);

  try {
    database.transaction((transaction) => {
      const existing = transaction
        .select({
          authoringState: fieldReports.authoringState,
        })
        .from(fieldReports)
        .where(
          and(
            eq(fieldReports.id, id),
            eq(fieldReports.submitterIdentity, owner),
          ),
        )
        .get();

      if (!existing) {
        return;
      }
      if (existing.authoringState !== 'draft') {
        throw new StorageError(
          'DELETE_FAILED',
          'Only a Draft Field Report can be discarded.',
        );
      }

      transaction
        .delete(fieldReports)
        .where(
          and(
            eq(fieldReports.id, id),
            eq(fieldReports.submitterIdentity, owner),
          ),
        )
        .run();
    });

    emitSyncRecordsChanged();
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'DELETE_FAILED',
      'Discarding the Field Report draft failed.',
    );
  }
}

function toFieldReport(row: typeof fieldReports.$inferSelect): FieldReport {
  return {
    id: row.id,
    scanRecordId: row.scanRecordId,
    authorityReview: row.authorityStatusRaw
      ? toAuthorityReviewSnapshot(
          {
            feedback: row.authorityFeedback,
            rawStatus: row.authorityStatusRaw,
            referenceCode: row.authorityReferenceCode,
            reviewedAt: row.authorityReviewedAt,
            statusUpdatedAt: row.authorityUpdatedAt ?? row.authorityFetchedAt ?? row.updatedAt,
          },
          row.authorityFetchedAt,
        )
      : null,
    authoringState: row.authoringState,
    farmerOrFarmOwnerName: row.farmerOrFarmOwnerName,
    province: row.province,
    municipality: row.municipality,
    barangay: row.barangay,
    sugarcaneVariety: row.sugarcaneVariety,
    cropAge: row.cropAge,
    caneClass: row.caneClass,
    affectedAreaHectares: row.affectedAreaHectares,
    affectedAreaMeasurement:
      row.affectedAreaMeasurement ??
      resolveMeasurementProvenance(row.affectedAreaHectares),
    affectedAreaMeasurementExplicit: row.affectedAreaMeasurement !== null,
    affectedPortionPercent: row.affectedPortionPercent,
    affectedPortionMeasurement:
      row.affectedPortionMeasurement ??
      resolveMeasurementProvenance(row.affectedPortionPercent),
    affectedPortionMeasurementExplicit: row.affectedPortionMeasurement !== null,
    locationUnavailableReason: row.locationUnavailableReason,
    fieldNotes: row.fieldNotes,
    mismatchReported: row.mismatchReported,
    reporterObservationText: row.reporterObservationText,
    reporterSuspectedCondition: row.reporterSuspectedCondition,
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
