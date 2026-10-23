import { and, eq, inArray, lt } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { toStorageError, type StorageError } from '@/database/errors';
import { requireOwnerIdentity } from '@/database/ownerIdentity';
import {
  fieldReports,
  fieldSurveys,
  fieldValidationAssignments,
  fieldValidationCompletions,
  localDrafts,
  mobileNotifications,
  scanRecords,
} from '@/database/schema';
import {
  deleteFieldValidationPhoto,
  listFieldValidationPhotoUris,
} from '@/features/assignments/services/fieldValidationPhotoStorage';
import { invalidateFieldValidationAssignmentsRefresh } from '@/features/assignments/services/refreshFieldValidationAssignments';
import {
  deleteManagedScanImage,
  listManagedScanImageUris,
  managedDisplayImageUri,
} from '@/features/records/services/scanImageStorage';
import { invalidateMobileNotificationsRefresh } from '@/features/notifications/services/refreshMobileNotifications';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';
import { clearOwnerMobileDataStore } from '@/features/mobile-data/data/mobileDataStore';
import { readFieldValidationCheckpoint } from '@/features/assignments/drafts/fieldValidationDraft';
import { readScanDraftCheckpoint } from '@/features/detection/drafts/scanDraftCheckpoint';

/** Keep completed, successfully synchronized local PII for a bounded period. */
export const LOCAL_DATA_RETENTION_DAYS = 90;

export interface LocalDataCleanupResult {
  deletedRows: number;
  imageCleanupErrors: StorageError[];
}

interface ImageCleanupTargets {
  draftScanImages: string[];
  draftValidationPhotos: string[];
  managedScanImages: string[];
  fieldValidationPhotos: string[];
}

export interface LocalDataRemovalPreview {
  assignments: number;
  boundaries: number;
  draftCheckpoints: number;
  draftReports: number;
  finalizedUnsentReports: number;
  notifications: number;
  reports: number;
  scans: number;
  totalRecords: number;
  totalUnsent: number;
  unsentBoundaries: number;
  unsentScans: number;
  unsentVisits: number;
  uploadInFlight: boolean;
  visits: number;
}

/**
 * Counts exactly what a permanent owner-data removal would delete. The same
 * counts are recomputed inside the deletion transaction so a confirmation can
 * never act on a stale list.
 */
export function getLocalDataRemovalPreview(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): LocalDataRemovalPreview {
  const owner = requireOwnerIdentity(ownerIdentity);
  return readRemovalPreview(database, owner);
}

function readRemovalPreview(
  database: Pick<CaneGuardDatabase, 'select'>,
  owner: string,
): LocalDataRemovalPreview {
  const reports = database.select().from(fieldReports).where(eq(fieldReports.submitterIdentity, owner)).all();
  const visits = database
    .select()
    .from(fieldValidationCompletions)
    .where(eq(fieldValidationCompletions.ownerIdentity, owner))
    .all();
  const boundaries = database.select().from(fieldSurveys).where(eq(fieldSurveys.ownerIdentity, owner)).all();
  const scans = database.select().from(scanRecords).where(eq(scanRecords.ownerIdentity, owner)).all();
  const assignments = database
    .select()
    .from(fieldValidationAssignments)
    .where(eq(fieldValidationAssignments.ownerIdentity, owner))
    .all();
  const notifications = database
    .select()
    .from(mobileNotifications)
    .where(eq(mobileNotifications.ownerIdentity, owner))
    .all();
  const checkpoints = database.select().from(localDrafts).where(eq(localDrafts.ownerIdentity, owner)).all();

  const draftReports = reports.filter((row) => row.authoringState === 'draft').length;
  const finalizedUnsentReports = reports.filter(
    (row) => row.authoringState === 'finalized' && row.syncStatus !== 'synced',
  ).length;
  const unsentVisits = visits.filter((row) => row.syncStatus !== 'synced').length;
  const unsentBoundaries = boundaries.filter((row) => row.status !== 'synced').length;
  const reportSyncStatusByScanId = new Map(
    reports.map((row) => [row.scanRecordId, row.syncStatus]),
  );
  const unsentScans = scans.filter(
    (row) => (reportSyncStatusByScanId.get(row.id) ?? 'local_only') !== 'synced',
  ).length;
  const uploadInFlight =
    reports.some((row) => row.syncStatus === 'syncing') ||
    visits.some((row) => row.syncStatus === 'syncing') ||
    boundaries.some((row) => row.status === 'syncing');

  return {
    assignments: assignments.length,
    boundaries: boundaries.length,
    draftCheckpoints: checkpoints.length,
    draftReports,
    finalizedUnsentReports,
    notifications: notifications.length,
    reports: reports.length,
    scans: scans.length,
    totalRecords:
      reports.length +
      visits.length +
      boundaries.length +
      scans.length +
      assignments.length +
      notifications.length +
      checkpoints.length,
    totalUnsent:
      draftReports +
      finalizedUnsentReports +
      unsentVisits +
      unsentBoundaries +
      unsentScans +
      checkpoints.length,
    unsentBoundaries,
    unsentScans,
    unsentVisits,
    uploadInFlight,
    visits: visits.length,
  };
}

/**
 * Routine cleanup: removes only office data that can be downloaded again
 * (cached assignments and notifications). Every scan, draft, local-only,
 * pending and failed record — and its referenced image — is preserved.
 */
export async function clearCachedOfficeDataForOwner(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): Promise<LocalDataCleanupResult> {
  const owner = requireOwnerIdentity(ownerIdentity);
  invalidateFieldValidationAssignmentsRefresh(database, owner);
  invalidateMobileNotificationsRefresh(database, owner);
  let deletedRows = 0;
  try {
    database.transaction((transaction) => {
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
      'Clearing downloaded office data failed.',
    );
  }
  clearOwnerMobileDataStore(database, owner);
  emitSyncRecordsChanged();
  return { deletedRows, imageCleanupErrors: [] };
}

export async function clearLocalDataForOwner(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  options: {
    expectedPreview?: LocalDataRemovalPreview;
    refuseUploadInFlight?: boolean;
  } = {},
): Promise<LocalDataCleanupResult> {
  const owner = requireOwnerIdentity(ownerIdentity);
  invalidateFieldValidationAssignmentsRefresh(database, owner);
  invalidateMobileNotificationsRefresh(database, owner);
  const targets = await readCleanupTargets(database, owner);
  let deletedRows = 0;

  try {
    validateRemovalConfirmation(database, owner, options);
    database.transaction((transaction) => {
      deletedRows += transaction
        .delete(fieldReports)
        .where(eq(fieldReports.submitterIdentity, owner))
        .run().changes;
      deletedRows += transaction
        .delete(fieldSurveys)
        .where(eq(fieldSurveys.ownerIdentity, owner))
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
      deletedRows += transaction
        .delete(localDrafts)
        .where(eq(localDrafts.ownerIdentity, owner))
        .run().changes;
    });
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'DELETE_FAILED',
      'Clearing local data failed before the stored images were removed.',
    );
  }

  clearOwnerMobileDataStore(database, owner);
  const imageCleanupErrors = [
    ...cleanupImages(targets, owner),
    ...sweepOrphanedOwnerImages(database, owner),
  ];
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

  const [scanRows, allReportRows, surveyRows, completionRows, assignmentRows, notificationRows] = await Promise.all([
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
      .select({ clientUuid: fieldSurveys.clientUuid })
      .from(fieldSurveys)
      .where(and(
        eq(fieldSurveys.ownerIdentity, owner),
        eq(fieldSurveys.status, 'synced'),
        lt(fieldSurveys.updatedAt, cutoff),
      )),
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
    database
      .select({ id: fieldValidationAssignments.id })
      .from(fieldValidationAssignments)
      .where(
        and(
          eq(fieldValidationAssignments.ownerIdentity, owner),
          lt(fieldValidationAssignments.updatedAt, cutoff),
        ),
      ),
    database
      .select({ id: mobileNotifications.id })
      .from(mobileNotifications)
      .where(
        and(
          eq(mobileNotifications.ownerIdentity, owner),
          lt(mobileNotifications.cachedAt, cutoff),
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
    draftScanImages: [],
    draftValidationPhotos: [],
    managedScanImages: scanRows
      .filter((row) => scanIds.includes(row.id))
      .flatMap((row) => [row.managedImageUri, row.submissionImageUri])
      .filter((uri): uri is string => Boolean(uri)),
    fieldValidationPhotos: completionRows
      .map((row) => row.freshPhotoUri)
      .filter((uri): uri is string => Boolean(uri)),
  };
  let deletedRows = 0;
  if (
    scanIds.length > 0 ||
    reportIds.length > 0 ||
    surveyRows.length > 0 ||
    completionRows.length > 0 ||
    assignmentRows.length > 0 ||
    notificationRows.length > 0
  ) {
    invalidateFieldValidationAssignmentsRefresh(database, owner);
    invalidateMobileNotificationsRefresh(database, owner);
  }

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
      if (surveyRows.length > 0) {
        deletedRows += transaction
          .delete(fieldSurveys)
          .where(and(
            eq(fieldSurveys.ownerIdentity, owner),
            eq(fieldSurveys.status, 'synced'),
            lt(fieldSurveys.updatedAt, cutoff),
          ))
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

  if (deletedRows > 0) {
    clearOwnerMobileDataStore(database, owner, { cacheFetchedAt: 0 });
  }
  const imageCleanupErrors = [
    ...cleanupImages(targets, owner),
    ...sweepOrphanedOwnerImages(database, owner),
  ];
  if (deletedRows > 0 || imageCleanupErrors.length > 0) {
    emitSyncRecordsChanged();
  }
  return { deletedRows, imageCleanupErrors };
}

function validateRemovalConfirmation(
  database: CaneGuardDatabase,
  owner: string,
  options: {
    expectedPreview?: LocalDataRemovalPreview;
    refuseUploadInFlight?: boolean;
  },
): void {
  const current = readRemovalPreview(database, owner);
  if (options.refuseUploadInFlight !== false && current.uploadInFlight) {
    throw toStorageError(
      new Error('An upload is in progress.'),
      'UPDATE_FAILED',
      'An upload is still running. Wait for it to finish before removing local records.',
    );
  }
  if (
    options.expectedPreview &&
    !sameRemovalPreview(current, options.expectedPreview)
  ) {
    throw toStorageError(
      new Error('The local record list changed.'),
      'DELETE_FAILED',
      'Local records changed since the confirmation. Review the updated counts and confirm again.',
    );
  }
}

function sameRemovalPreview(
  current: LocalDataRemovalPreview,
  expected: LocalDataRemovalPreview,
): boolean {
  const keys = Object.keys(current) as (keyof LocalDataRemovalPreview)[];
  return keys.every((key) => current[key] === expected[key]);
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
  const draftScanImages: string[] = [];
  const draftValidationPhotos: string[] = [];
  const draftRows = database
    .select({
      draftKey: localDrafts.draftKey,
      kind: localDrafts.kind,
    })
    .from(localDrafts)
    .where(eq(localDrafts.ownerIdentity, owner))
    .all();
  for (const draft of draftRows) {
    if (draft.kind === 'scan') {
      const record = readScanDraftCheckpoint(database, owner);
      if (record) {
        draftScanImages.push(record.checkpoint.managedImageUri);
      }
    }
    if (draft.kind === 'field_validation') {
      const record = readFieldValidationCheckpoint(database, owner, draft.draftKey);
      if (record?.checkpoint.photo) {
        draftValidationPhotos.push(record.checkpoint.photo.uri);
      }
    }
  }
  return {
    draftScanImages,
    draftValidationPhotos,
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
): StorageError[] {  const errors: StorageError[] = [];
  for (const uri of new Set(targets.draftScanImages)) {
    try {
      deleteManagedScanImage(uri, ownerIdentity);
    } catch (error: unknown) {
      errors.push(
        toStorageError(
          error,
          'IMAGE_DELETE_FAILED',
          'A saved scan draft image could not be removed during local-data cleanup.',
        ),
      );
    }
  }
  for (const uri of new Set(targets.draftValidationPhotos)) {
    try {
      deleteFieldValidationPhoto(uri, ownerIdentity);
    } catch (error: unknown) {
      errors.push(
        toStorageError(
          error,
          'IMAGE_DELETE_FAILED',
          'A saved visit draft photo could not be removed during local-data cleanup.',
        ),
      );
    }
  }
  for (const uri of new Set(targets.managedScanImages)) {
    // The display derivative is deleted with the image it was generated from:
    // it is recorded nowhere else, so nothing would ever clean it up later.
    const displayUri = managedDisplayImageUri(uri);
    for (const candidate of displayUri ? [uri, displayUri] : [uri]) {
      try {
        deleteManagedScanImage(candidate, ownerIdentity);
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

/**
 * Removes owner image files that no draft checkpoint, scan record or completion
 * names any more, so leftovers from interrupted drafts cannot survive cleanup.
 */
function sweepOrphanedOwnerImages(
  database: CaneGuardDatabase,
  owner: string,
): StorageError[] {
  const referenced = readReferencedImageUris(database, owner);
  const errors: StorageError[] = [];
  for (const uri of listManagedScanImageUris(owner)) {
    if (referenced.has(uri)) {
      continue;
    }
    try {
      deleteManagedScanImage(uri, owner);
    } catch (error: unknown) {
      errors.push(
        toStorageError(
          error,
          'IMAGE_DELETE_FAILED',
          'A leftover scan image could not be removed during local-data cleanup.',
        ),
      );
    }
  }
  for (const uri of listFieldValidationPhotoUris(owner)) {
    if (referenced.has(uri)) {
      continue;
    }
    try {
      deleteFieldValidationPhoto(uri, owner);
    } catch (error: unknown) {
      errors.push(
        toStorageError(
          error,
          'IMAGE_DELETE_FAILED',
          'A leftover visit photo could not be removed during local-data cleanup.',
        ),
      );
    }
  }
  return errors;
}

function readReferencedImageUris(
  database: CaneGuardDatabase,
  owner: string,
): Set<string> {
  const referenced = new Set<string>();
  const scanRows = database
    .select({
      managedImageUri: scanRecords.managedImageUri,
      submissionImageUri: scanRecords.submissionImageUri,
    })
    .from(scanRecords)
    .where(eq(scanRecords.ownerIdentity, owner))
    .all();
  for (const row of scanRows) {
    for (const uri of [row.managedImageUri, row.submissionImageUri]) {
      if (!uri) {
        continue;
      }
      referenced.add(uri);
      const displayUri = managedDisplayImageUri(uri);
      if (displayUri) {
        referenced.add(displayUri);
      }
    }
  }
  const completionRows = database
    .select({ freshPhotoUri: fieldValidationCompletions.freshPhotoUri })
    .from(fieldValidationCompletions)
    .where(eq(fieldValidationCompletions.ownerIdentity, owner))
    .all();
  for (const row of completionRows) {
    if (row.freshPhotoUri) {
      referenced.add(row.freshPhotoUri);
    }
  }
  const draftRows = database
    .select({ draftKey: localDrafts.draftKey, kind: localDrafts.kind })
    .from(localDrafts)
    .where(eq(localDrafts.ownerIdentity, owner))
    .all();
  for (const draft of draftRows) {
    if (draft.kind === 'scan') {
      const record = readScanDraftCheckpoint(database, owner);
      if (record) {
        referenced.add(record.checkpoint.managedImageUri);
      }
    }
    if (draft.kind === 'field_validation') {
      const record = readFieldValidationCheckpoint(database, owner, draft.draftKey);
      const photo = record?.checkpoint.photo;
      if (photo) {
        referenced.add(photo.uri);
      }
    }
  }
  return referenced;
}
