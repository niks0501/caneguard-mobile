import { and, asc, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm';
import type { SQLiteUpdateSetSource } from 'drizzle-orm/sqlite-core/query-builders/update';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
import { fieldReports } from '@/database/schema';
import { findScanRecordById } from '@/features/records/data/scanRecordRepository';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import { findFieldReportById } from '@/features/reports/data/fieldReportRepository';
import type { FieldReport } from '@/features/reports/domain/fieldReportTypes';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';

export interface FieldReportUploadRecord {
  report: FieldReport;
  scanRecord: ScanRecordDetails;
}

export interface FieldReportSyncRepository {
  countUnsynced(): Promise<number>;
  findById(id: string): Promise<FieldReportUploadRecord>;
  findLastSuccessfulSyncAt(): Promise<string | null>;
  findSyncCandidates(limit: number, includeFailed?: boolean): Promise<FieldReport[]>;
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
    findSyncCandidates: (limit, includeFailed) =>
      findFieldReportSyncCandidates(
        database,
        submitterIdentity,
        limit,
        includeFailed,
      ),
    markFailed: (id, code, at) =>
      markFieldReportFailed(database, id, submitterIdentity, code, at),
    markPending: (id) =>
      markFieldReportPending(database, id, submitterIdentity),
    markSynced: (id, remoteId, at) =>
      markFieldReportSynced(database, id, submitterIdentity, remoteId, at),
    markSyncing: (id, at) =>
      markFieldReportSyncing(database, id, submitterIdentity, at),
    resetStaleSyncingReports: (before) =>
      resetStaleSyncingFieldReports(database, submitterIdentity, before),
  };
}

export async function findFieldReportUploadRecord(
  database: CaneGuardDatabase,
  reportId: string,
  submitterIdentity: string,
): Promise<FieldReportUploadRecord> {
  const report = await findFieldReportById(database, reportId);
  if (report.submitterIdentity !== submitterIdentity.trim()) {
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
  const scanRecord = await findScanRecordById(database, report.scanRecordId);
  return { report, scanRecord };
}

export async function findFieldReportSyncCandidates(
  database: CaneGuardDatabase,
  submitterIdentity: string,
  limit: number,
  includeFailed = false,
): Promise<FieldReport[]> {
  const normalizedLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
  try {
    const rows = await database
      .select({ id: fieldReports.id })
      .from(fieldReports)
      .where(
        and(
          eq(fieldReports.authoringState, 'finalized'),
          eq(fieldReports.submitterIdentity, submitterIdentity.trim()),
          includeFailed
            ? inArray(fieldReports.syncStatus, ['pending', 'failed'])
            : eq(fieldReports.syncStatus, 'pending'),
        ),
      )
      .orderBy(asc(fieldReports.submittedAt), asc(fieldReports.createdAt))
      .limit(normalizedLimit);
    return Promise.all(rows.map(({ id }) => findFieldReportById(database, id)));
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
): Promise<void> {
  await updateSyncState(
    database,
    reportId,
    {
      syncStatus: 'pending',
      lastSyncErrorCode: null,
      updatedAt: new Date().toISOString(),
    },
    ['pending', 'failed'],
    submitterIdentity,
  );
}

export async function markFieldReportSyncing(
  database: CaneGuardDatabase,
  reportId: string,
  submitterIdentity: string,
  attemptedAt: string,
): Promise<void> {
  await updateSyncState(
    database,
    reportId,
    {
      syncStatus: 'syncing',
      lastSyncAttemptAt: attemptedAt,
      lastSyncErrorCode: null,
      syncAttemptCount: sql`${fieldReports.syncAttemptCount} + 1`,
      updatedAt: attemptedAt,
    },
    ['pending', 'failed'],
    submitterIdentity,
  );
}

export async function markFieldReportSynced(
  database: CaneGuardDatabase,
  reportId: string,
  submitterIdentity: string,
  remoteId: string,
  syncedAt: string,
): Promise<void> {
  await updateSyncState(
    database,
    reportId,
    {
      syncStatus: 'synced',
      remoteId,
      lastSyncedAt: syncedAt,
      lastSyncErrorCode: null,
      updatedAt: syncedAt,
    },
    ['syncing'],
    submitterIdentity,
  );
}

export async function markFieldReportFailed(
  database: CaneGuardDatabase,
  reportId: string,
  submitterIdentity: string,
  errorCode: string,
  attemptedAt: string,
): Promise<void> {
  await updateSyncState(
    database,
    reportId,
    {
      syncStatus: 'failed',
      lastSyncAttemptAt: attemptedAt,
      lastSyncErrorCode: errorCode,
      updatedAt: attemptedAt,
    },
    ['pending', 'syncing', 'failed'],
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

async function updateSyncState(
  database: CaneGuardDatabase,
  reportId: string,
  values: SQLiteUpdateSetSource<typeof fieldReports>,
  allowedStatuses: FieldReport['syncStatus'][],
  submitterIdentity: string,
): Promise<void> {
  try {
    await database
      .update(fieldReports)
      .set(values)
      .where(
        and(
          eq(fieldReports.id, reportId),
          eq(fieldReports.submitterIdentity, submitterIdentity.trim()),
          eq(fieldReports.authoringState, 'finalized'),
          inArray(fieldReports.syncStatus, allowedStatuses),
        ),
      );
    emitSyncRecordsChanged();
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'UPDATE_FAILED',
      'Updating Field Report synchronization state failed.',
    );
  }
}
