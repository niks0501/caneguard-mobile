import { and, eq, inArray, lt } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { toStorageError, type StorageError } from '@/database/errors';
import { requireOwnerIdentity } from '@/database/ownerIdentity';
import {
  fieldReports,
  fieldValidationAssignments,
  fieldValidationCompletions,
  mobileNotifications,
  scanRecords,
} from '@/database/schema';
import { deleteFieldValidationPhoto } from '@/features/assignments/services/fieldValidationPhotoStorage';
import { deleteManagedScanImage } from '@/features/records/services/scanImageStorage';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';

/** Keep completed, successfully synchronized local PII for a bounded period. */
export const LOCAL_DATA_RETENTION_DAYS = 90;

export interface LocalDataCleanupResult {
  deletedRows: number;
  imageCleanupErrors: StorageError[];
}

interface ImageCleanupTargets {
  managedScanImages: string[];
  fieldValidationPhotos: string[];
}

export async function clearLocalDataForOwner(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): Promise<LocalDataCleanupResult> {
  const owner = requireOwnerIdentity(ownerIdentity);
  const targets = await readCleanupTargets(database, owner);
  let deletedRows = 0;

  try {
    database.transaction((transaction) => {
      deletedRows += transaction
        .delete(fieldReports)
        .where(eq(fieldReports.submitterIdentity, owner))
        .run().changes;
      deletedRows += transaction
        .delete(scanRecords)
        .where(eq(scanRecords.ownerIdentity, owner))
        .run().changes;
      deletedRows += transaction
        .delete(fieldValidationCompletions)
        .where(eq(fieldValidationCompletions.ownerIdentity, owner))
        .run().changes;
      deletedRows += transaction
        .delete(fieldValidationAssignments)
        .where(eq(fieldValidationAssignments.ownerIdentity, owner))
        .run().changes;
      deletedRows += transaction
        .delete(mobileNotifications)
        .where(eq(mobileNotifications.ownerIdentity, owner))
        .run().changes;
    });
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'DELETE_FAILED',
      'Clearing local data failed before the stored images were removed.',
    );
  }

  const imageCleanupErrors = cleanupImages(targets, owner);
  emitSyncRecordsChanged();
  return { deletedRows, imageCleanupErrors };
}

/**
 * Purge only synchronized data past the retention window. Pending, failed,
 * draft, and local-only work is intentionally retained so an offline reporter
 * does not lose retryable evidence.
 */
export async function purgeExpiredLocalData(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  now = new Date(),
  retentionDays = LOCAL_DATA_RETENTION_DAYS,
): Promise<LocalDataCleanupResult> {
  const owner = requireOwnerIdentity(ownerIdentity);
  if (!Number.isFinite(retentionDays) || retentionDays < 1) {
    throw toStorageError(
      new Error('Invalid local data retention period.'),
      'UPDATE_FAILED',
      'The local data retention period is invalid.',
    );
  }
  const cutoff = new Date(
    now.getTime() - Math.trunc(retentionDays) * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [scanRows, allReportRows, completionRows] = await Promise.all([
    database
      .select({
        id: scanRecords.id,
        managedImageUri: scanRecords.managedImageUri,
        submissionImageUri: scanRecords.submissionImageUri,
      })
      .from(scanRecords)
      .where(
        and(
          eq(scanRecords.ownerIdentity, owner),
          eq(scanRecords.syncStatus, 'synced'),
          lt(scanRecords.createdAt, cutoff),
        ),
      ),
    database
      .select({
        id: fieldReports.id,
        scanRecordId: fieldReports.scanRecordId,
        submitterIdentity: fieldReports.submitterIdentity,
        syncStatus: fieldReports.syncStatus,
        updatedAt: fieldReports.updatedAt,
      })
      .from(fieldReports),
    database
      .select({ freshPhotoUri: fieldValidationCompletions.freshPhotoUri })
      .from(fieldValidationCompletions)
      .where(
        and(
          eq(fieldValidationCompletions.ownerIdentity, owner),
          eq(fieldValidationCompletions.syncStatus, 'synced'),
          lt(fieldValidationCompletions.createdAt, cutoff),
        ),
      ),
  ]);

  const reportByScanId = new Map(
    allReportRows.map((row) => [row.scanRecordId, row]),
  );
  const expiredReportRows = allReportRows.filter(
    (row) =>
      row.submitterIdentity === owner &&
      row.syncStatus === 'synced' &&
      row.updatedAt < cutoff,
  );
  const scanIds = scanRows
    .filter((row) => {
      const report = reportByScanId.get(row.id);
      return (
        !report ||
        (report.submitterIdentity === owner &&
          report.syncStatus === 'synced' &&
          report.updatedAt < cutoff)
      );
    })
    .map((row) => row.id);
  const reportIds = expiredReportRows.map((row) => row.id);
  const targets: ImageCleanupTargets = {
    managedScanImages: scanRows
      .filter((row) => scanIds.includes(row.id))
      .flatMap((row) => [row.managedImageUri, row.submissionImageUri])
      .filter((uri): uri is string => Boolean(uri)),
    fieldValidationPhotos: completionRows
      .map((row) => row.freshPhotoUri)
      .filter((uri): uri is string => Boolean(uri)),
  };
  let deletedRows = 0;

  try {
    database.transaction((transaction) => {
      if (reportIds.length > 0) {
        deletedRows += transaction
          .delete(fieldReports)
          .where(
            and(
              eq(fieldReports.submitterIdentity, owner),
              inArray(fieldReports.id, reportIds),
            ),
          )
          .run().changes;
      }
      if (scanIds.length > 0) {
        deletedRows += transaction
          .delete(scanRecords)
          .where(
            and(
              eq(scanRecords.ownerIdentity, owner),
              inArray(scanRecords.id, scanIds),
            ),
          )
          .run().changes;
      }
      deletedRows += transaction
        .delete(fieldValidationCompletions)
        .where(
          and(
            eq(fieldValidationCompletions.ownerIdentity, owner),
            eq(fieldValidationCompletions.syncStatus, 'synced'),
            lt(fieldValidationCompletions.createdAt, cutoff),
          ),
        )
        .run().changes;
      deletedRows += transaction
        .delete(fieldValidationAssignments)
        .where(
          and(
            eq(fieldValidationAssignments.ownerIdentity, owner),
            lt(fieldValidationAssignments.updatedAt, cutoff),
          ),
        )
        .run().changes;
      deletedRows += transaction
        .delete(mobileNotifications)
        .where(
          and(
            eq(mobileNotifications.ownerIdentity, owner),
            lt(mobileNotifications.cachedAt, cutoff),
          ),
        )
        .run().changes;
    });
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'DELETE_FAILED',
      'Purging expired local data failed before stored images were removed.',
    );
  }

  const imageCleanupErrors = cleanupImages(targets, owner);
  if (deletedRows > 0 || imageCleanupErrors.length > 0) {
    emitSyncRecordsChanged();
  }
  return { deletedRows, imageCleanupErrors };
}

async function readCleanupTargets(
  database: CaneGuardDatabase,
  owner: string,
): Promise<ImageCleanupTargets> {
  const [scanRows, completionRows] = await Promise.all([
    database
      .select({
        managedImageUri: scanRecords.managedImageUri,
        submissionImageUri: scanRecords.submissionImageUri,
      })
      .from(scanRecords)
      .where(eq(scanRecords.ownerIdentity, owner)),
    database
      .select({ freshPhotoUri: fieldValidationCompletions.freshPhotoUri })
      .from(fieldValidationCompletions)
      .where(eq(fieldValidationCompletions.ownerIdentity, owner)),
  ]);
  return {
    managedScanImages: scanRows
      .flatMap((row) => [row.managedImageUri, row.submissionImageUri])
      .filter((uri): uri is string => Boolean(uri)),
    fieldValidationPhotos: completionRows
      .map((row) => row.freshPhotoUri)
      .filter((uri): uri is string => Boolean(uri)),
  };
}

function cleanupImages(
  targets: ImageCleanupTargets,
  ownerIdentity: string,
): StorageError[] {
  const errors: StorageError[] = [];
  for (const uri of new Set(targets.managedScanImages)) {
    try {
      deleteManagedScanImage(uri, ownerIdentity);
    } catch (error: unknown) {
      errors.push(
        toStorageError(
          error,
          'IMAGE_DELETE_FAILED',
          'A managed scan image could not be removed during local-data cleanup.',
        ),
      );
    }
  }
  for (const uri of new Set(targets.fieldValidationPhotos)) {
    try {
      deleteFieldValidationPhoto(uri, ownerIdentity);
    } catch (error: unknown) {
      errors.push(
        toStorageError(
          error,
          'IMAGE_DELETE_FAILED',
          'A field-validation photo could not be removed during local-data cleanup.',
        ),
      );
    }
  }
  return errors;
}
