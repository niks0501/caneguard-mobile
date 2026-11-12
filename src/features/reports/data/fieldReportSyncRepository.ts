import { and, asc, eq, gte, inArray, isNull, lt, ne, notInArray, or, sql } from 'drizzle-orm';
import type { SQLiteUpdateSetSource } from 'drizzle-orm/sqlite-core/query-builders/update';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
import { fieldReports, fieldSurveys, scanRecords } from '@/database/schema';
import { findScanRecordById } from '@/features/records/data/scanRecordRepository';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import { findFieldReportById } from '@/features/reports/data/fieldReportRepository';
import type { FieldReport } from '@/features/reports/domain/fieldReportTypes';
import { AUTO_RETRYABLE_SYNC_ERROR_CODES } from '@/features/sync/errors/syncErrors';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';
import { isUploadableSubmissionArtifact } from '@/features/sync/domain/submissionArtifacts';

export const SYNC_RETRY_COOLDOWN_MS = 60_000;

export interface FindSyncCandidatesOptions {
  districtCode: string;
  failedBefore?: string;
  includeRetryableFailed?: boolean;
}

export interface FieldReportUploadRecord {
  report: FieldReport;
  scanRecord: ScanRecordDetails;
}

export interface FieldReportSyncRepository {
  countUnsynced(): Promise<number>;
  findById(id: string): Promise<FieldReportUploadRecord>;
  findLastSuccessfulSyncAt(): Promise<string | null>;
  findSyncCandidates(
    limit: number,
    options: FindSyncCandidatesOptions,
  ): Promise<FieldReport[]>;
  markFailed(reportId: string, errorCode: string, attemptedAt: string): Promise<void>;
  markPending(reportId: string): Promise<void>;
  markSynced(reportId: string, remoteId: string, syncedAt: string): Promise<void>;
  markSyncing(reportId: string, attemptedAt: string): Promise<void>;
  resetStaleSyncingReports(staleBefore: string): Promise<void>;
}

export function createFieldReportSyncRepository(
  database: CaneGuardDatabase,
  submitterIdentity: string,
): FieldReportSyncRepository {
  return {
    countUnsynced: () => countUnsyncedFieldReports(database, submitterIdentity),
    findById: (id) =>
      findFieldReportUploadRecord(database, id, submitterIdentity),
    findLastSuccessfulSyncAt: () =>
      findLastSuccessfulFieldReportSyncAt(database, submitterIdentity),
    findSyncCandidates: (limit, options) =>
      findFieldReportSyncCandidates(
        database,
        submitterIdentity,
        limit,
        options,
      ),
    markFailed: (id, code, at) =>
      markFieldReportFailed(database, id, submitterIdentity, code, at).then(() => undefined),
    markPending: (id) =>
      markFieldReportPending(database, id, submitterIdentity).then(() => undefined),
    markSynced: (id, remoteId, at) =>
      markFieldReportSynced(database, id, submitterIdentity, remoteId, at).then(() => undefined),
    markSyncing: (id, at) =>
      markFieldReportSyncing(database, id, submitterIdentity, at).then(() => undefined),
    resetStaleSyncingReports: (before) =>
      resetStaleSyncingFieldReports(database, submitterIdentity, before),
  };
}

export async function findFieldReportUploadRecord(
  database: CaneGuardDatabase,
  reportId: string,
  submitterIdentity: string,
): Promise<FieldReportUploadRecord> {
  const owner = submitterIdentity.trim();
  const report = await findFieldReportById(database, reportId, owner);
  if (report.submitterIdentity !== owner) {
    throw new StorageError(
      'FIELD_REPORT_NOT_FOUND',
      'The Field Report does not belong to the authenticated submitter.',
    );
  }
  if (report.authoringState !== 'finalized') {
    throw new StorageError(
      'UPDATE_FAILED',
      'Only a finalized Field Report can be synchronized.',
    );
  }
  const scanRecord = await findScanRecordById(database, report.scanRecordId, owner);
  return { report, scanRecord };
}

export async function findFieldReportSyncCandidates(
  database: CaneGuardDatabase,
  submitterIdentity: string,
  limit: number,
  options: FindSyncCandidatesOptions,
): Promise<FieldReport[]> {
  const normalizedLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
  const failedBefore =
    options.failedBefore ??
    new Date(Date.now() - SYNC_RETRY_COOLDOWN_MS).toISOString();
  try {
    const owner = submitterIdentity.trim();
    const coolingBoundaryGuard = options.districtCode.trim() === ''
      ? undefined
      : and(
          eq(fieldSurveys.status, 'failed'),
          inArray(fieldSurveys.lastSyncErrorCode, AUTO_RETRYABLE_SYNC_ERROR_CODES),
          gte(fieldSurveys.updatedAt, failedBefore),
        );
    const unsentBoundaryIds = database
      .select({ clientUuid: fieldSurveys.clientUuid })
      .from(fieldSurveys)
      .where(
        and(
          eq(fieldSurveys.ownerIdentity, owner),
          ne(fieldSurveys.status, 'synced'),
          isNull(fieldSurveys.remoteId),
          ...(coolingBoundaryGuard ? [coolingBoundaryGuard] : []),
        ),
      )
      .all()
      .map(({ clientUuid }) => clientUuid);
    const eligibleStatus = options.includeRetryableFailed
      ? or(
          eq(fieldReports.syncStatus, 'pending'),
          and(
            eq(fieldReports.syncStatus, 'failed'),
            inArray(
              fieldReports.lastSyncErrorCode,
              AUTO_RETRYABLE_SYNC_ERROR_CODES,
            ),
            or(
              isNull(fieldReports.lastSyncAttemptAt),
              lt(fieldReports.lastSyncAttemptAt, failedBefore),
            ),
          ),
        )
      : eq(fieldReports.syncStatus, 'pending');
    const rows = await database
      .select({ id: fieldReports.id })
      .from(fieldReports)
      .innerJoin(
        scanRecords,
        and(
          eq(scanRecords.id, fieldReports.scanRecordId),
          eq(scanRecords.ownerIdentity, submitterIdentity.trim()),
        ),
      )
      .where(
        and(
          ...(unsentBoundaryIds.length === 0
            ? []
            : [
                or(
                  isNull(fieldReports.fieldSurveyClientUuid),
                  notInArray(fieldReports.fieldSurveyClientUuid, unsentBoundaryIds),
                ),
              ]),
          eq(fieldReports.authoringState, 'finalized'),
          eq(fieldReports.submitterIdentity, submitterIdentity.trim()),
          eligibleStatus,
        ),
      )
      .orderBy(asc(fieldReports.submittedAt), asc(fieldReports.createdAt))
      .limit(normalizedLimit);
    const reports = await Promise.all(
      rows.map(({ id }) => findFieldReportById(database, id, submitterIdentity)),
    );
    return reports.filter((report) => isUploadableSubmissionArtifact('field_report', {
      authoringState: report.authoringState,
      syncStatus: report.syncStatus,
    }));
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'QUERY_FAILED',
      'Reading pending Field Reports failed.',
    );
  }
}

export async function markFieldReportPending(
  database: CaneGuardDatabase,
  reportId: string,
  submitterIdentity: string,
): Promise<number> {
  return updateSyncState(
    database,
    reportId,
    {
      syncStatus: 'pending',
      lastSyncErrorCode: null,
      updatedAt: new Date().toISOString(),
    },
    TRANSITIONS.pending,
    submitterIdentity,
  );
}

export async function markFieldReportSyncing(
  database: CaneGuardDatabase,
  reportId: string,
  submitterIdentity: string,
  attemptedAt: string,
): Promise<number> {
  return updateSyncState(
    database,
    reportId,
    {
      syncStatus: 'syncing',
      lastSyncAttemptAt: attemptedAt,
      lastSyncErrorCode: null,
      syncAttemptCount: sql`${fieldReports.syncAttemptCount} + 1`,
      updatedAt: attemptedAt,
    },
    TRANSITIONS.syncing,
    submitterIdentity,
  );
}

export async function markFieldReportSynced(
  database: CaneGuardDatabase,
  reportId: string,
  submitterIdentity: string,
  remoteId: string,
  syncedAt: string,
): Promise<number> {
  return updateSyncState(
    database,
    reportId,
    {
      syncStatus: 'synced',
      remoteId,
      lastSyncedAt: syncedAt,
      lastSyncErrorCode: null,
      updatedAt: syncedAt,
    },
    TRANSITIONS.synced,
    submitterIdentity,
  );
}

export async function markFieldReportFailed(
  database: CaneGuardDatabase,
  reportId: string,
  submitterIdentity: string,
  errorCode: string,
  attemptedAt: string,
): Promise<number> {
  return updateSyncState(
    database,
    reportId,
    {
      syncStatus: 'failed',
      lastSyncAttemptAt: attemptedAt,
      lastSyncErrorCode: errorCode,
      updatedAt: attemptedAt,
    },
    TRANSITIONS.failed,
    submitterIdentity,
  );
}

export async function resetStaleSyncingFieldReports(
  database: CaneGuardDatabase,
  submitterIdentity: string,
  staleBefore: string,
): Promise<void> {
  try {
    await database
      .update(fieldReports)
      .set({
        syncStatus: 'pending',
        lastSyncErrorCode: 'STALE_SYNC_RECOVERED',
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(fieldReports.authoringState, 'finalized'),
          eq(fieldReports.submitterIdentity, submitterIdentity.trim()),
          eq(fieldReports.syncStatus, 'syncing'),
          or(
            isNull(fieldReports.lastSyncAttemptAt),
            lt(fieldReports.lastSyncAttemptAt, staleBefore),
          ),
        ),
      );
    emitSyncRecordsChanged();
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'UPDATE_FAILED',
      'Recovering interrupted Field Report uploads failed.',
    );
  }
}

export async function countUnsyncedFieldReports(
  database: CaneGuardDatabase,
  submitterIdentity: string,
): Promise<number> {
  try {
    const row = await database
      .select({ count: sql<number>`count(*)` })
      .from(fieldReports)
      .where(
        and(
          eq(fieldReports.authoringState, 'finalized'),
          eq(fieldReports.submitterIdentity, submitterIdentity.trim()),
          inArray(fieldReports.syncStatus, ['pending', 'syncing', 'failed']),
        ),
      )
      .get();
    return Number(row?.count ?? 0);
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'QUERY_FAILED',
      'Counting pending Field Reports failed.',
    );
  }
}

export async function findLastSuccessfulFieldReportSyncAt(
  database: CaneGuardDatabase,
  submitterIdentity: string,
): Promise<string | null> {
  try {
    const row = await database
      .select({ value: sql<string | null>`max(${fieldReports.lastSyncedAt})` })
      .from(fieldReports)
      .where(eq(fieldReports.submitterIdentity, submitterIdentity.trim()))
      .get();
    return row?.value ?? null;
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'QUERY_FAILED',
      'Reading the last successful Field Report synchronization time failed.',
    );
  }
}

/** Statuses each guarded update may start from; a row in any other status is left untouched. */
export const TRANSITIONS = {
  pending: ['pending', 'failed'],
  syncing: ['pending', 'failed'],
  synced: ['syncing'],
  failed: ['pending', 'syncing', 'failed'],
} as const satisfies Record<'pending' | 'syncing' | 'synced' | 'failed', readonly FieldReport['syncStatus'][]>;

/** Returns the number of rows changed; 0 means the guard refused the update. */
async function updateSyncState(
  database: CaneGuardDatabase,
  reportId: string,
  values: SQLiteUpdateSetSource<typeof fieldReports>,
  allowedStatuses: readonly FieldReport['syncStatus'][],
  submitterIdentity: string,
): Promise<number> {
  try {
    const result = await database
      .update(fieldReports)
      .set(values)
      .where(
        and(
          eq(fieldReports.id, reportId),
          eq(fieldReports.submitterIdentity, submitterIdentity.trim()),
          eq(fieldReports.authoringState, 'finalized'),
          inArray(fieldReports.syncStatus, [...allowedStatuses]),
        ),
      );
    emitSyncRecordsChanged();
    return result.changes;
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'UPDATE_FAILED',
      'Updating Field Report synchronization state failed.',
    );
  }
}
