import { and, asc, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm';
import type { SQLiteUpdateSetSource } from 'drizzle-orm/sqlite-core/query-builders/update';

import type { CaneGuardDatabase } from '@/database/database';
import { toStorageError } from '@/database/errors';
import { scanRecords } from '@/database/schema';
import { findScanRecordById } from '@/features/records/data/scanRecordRepository';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';

export interface ScanRecordSyncRepository {
  countUnsynced(): Promise<number>;
  findLastSuccessfulSyncAt(): Promise<string | null>;
  findById(id: string): Promise<ScanRecordDetails>;
  findSyncCandidates(
    limit: number,
    includeFailed?: boolean,
  ): Promise<ScanRecordDetails[]>;
  markFailed(
    recordId: string,
    errorCode: string,
    attemptedAt: string,
  ): Promise<void>;
  markPending(recordId: string): Promise<void>;
  markSynced(
    recordId: string,
    remoteId: string,
    syncedAt: string,
  ): Promise<void>;
  markSyncing(recordId: string, attemptedAt: string): Promise<void>;
  resetStaleSyncingRecords(staleBefore: string): Promise<void>;
}

export function createScanRecordSyncRepository(
  database: CaneGuardDatabase,
): ScanRecordSyncRepository {
  return {
    countUnsynced: () => countUnsyncedRecords(database),
    findLastSuccessfulSyncAt: () => findLastSuccessfulSyncAt(database),
    findById: (id) => findScanRecordById(database, id),
    findSyncCandidates: (limit, includeFailed) =>
      findSyncCandidates(database, limit, includeFailed),
    markFailed: (id, code, at) => markFailed(database, id, code, at),
    markPending: (id) => markPending(database, id),
    markSynced: (id, remoteId, at) =>
      markSynced(database, id, remoteId, at),
    markSyncing: (id, at) => markSyncing(database, id, at),
    resetStaleSyncingRecords: (before) =>
      resetStaleSyncingRecords(database, before),
  };
}

export async function findSyncCandidates(
  database: CaneGuardDatabase,
  limit: number,
  includeFailed = false,
): Promise<ScanRecordDetails[]> {
  const normalizedLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
  try {
    const rows = await database
      .select({ id: scanRecords.id })
      .from(scanRecords)
      .where(
        includeFailed
          ? inArray(scanRecords.syncStatus, ['pending', 'failed'])
          : eq(scanRecords.syncStatus, 'pending'),
      )
      .orderBy(asc(scanRecords.createdAt))
      .limit(normalizedLimit);
    return Promise.all(rows.map(({ id }) => findScanRecordById(database, id)));
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'QUERY_FAILED',
      'Reading pending scan records failed.',
    );
  }
}

export async function markPending(
  database: CaneGuardDatabase,
  recordId: string,
): Promise<void> {
  await updateSyncState(database, recordId, {
    syncStatus: 'pending',
    lastSyncErrorCode: null,
    updatedAt: new Date().toISOString(),
  });
}

export async function markSyncing(
  database: CaneGuardDatabase,
  recordId: string,
  attemptedAt: string,
): Promise<void> {
  await updateSyncState(database, recordId, {
    syncStatus: 'syncing',
    lastSyncAttemptAt: attemptedAt,
    lastSyncErrorCode: null,
    syncAttemptCount: sql`${scanRecords.syncAttemptCount} + 1`,
    updatedAt: attemptedAt,
  });
}

export async function markSynced(
  database: CaneGuardDatabase,
  recordId: string,
  remoteId: string,
  syncedAt: string,
): Promise<void> {
  await updateSyncState(database, recordId, {
    syncStatus: 'synced',
    remoteId,
    lastSyncedAt: syncedAt,
    lastSyncErrorCode: null,
    updatedAt: syncedAt,
  });
}

export async function markFailed(
  database: CaneGuardDatabase,
  recordId: string,
  errorCode: string,
  attemptedAt: string,
): Promise<void> {
  await updateSyncState(database, recordId, {
    syncStatus: 'failed',
    lastSyncAttemptAt: attemptedAt,
    lastSyncErrorCode: errorCode,
    updatedAt: attemptedAt,
  });
}

export async function resetStaleSyncingRecords(
  database: CaneGuardDatabase,
  staleBefore: string,
): Promise<void> {
  try {
    await database
      .update(scanRecords)
      .set({
        syncStatus: 'pending',
        lastSyncErrorCode: 'STALE_SYNC_RECOVERED',
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(scanRecords.syncStatus, 'syncing'),
          or(
            isNull(scanRecords.lastSyncAttemptAt),
            lt(scanRecords.lastSyncAttemptAt, staleBefore),
          ),
        ),
      );
    emitSyncRecordsChanged();
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'UPDATE_FAILED',
      'Recovering interrupted scan uploads failed.',
    );
  }
}

export async function countUnsyncedRecords(
  database: CaneGuardDatabase,
): Promise<number> {
  try {
    const row = await database
      .select({ count: sql<number>`count(*)` })
      .from(scanRecords)
      .where(
        inArray(scanRecords.syncStatus, ['pending', 'syncing', 'failed']),
      )
      .get();
    return Number(row?.count ?? 0);
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'QUERY_FAILED',
      'Counting pending scan records failed.',
    );
  }
}

export async function findLastSuccessfulSyncAt(
  database: CaneGuardDatabase,
): Promise<string | null> {
  try {
    const row = await database
      .select({
        value: sql<string | null>`max(${scanRecords.lastSyncedAt})`,
      })
      .from(scanRecords)
      .get();
    return row?.value ?? null;
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'QUERY_FAILED',
      'Reading the last successful synchronization time failed.',
    );
  }
}

async function updateSyncState(
  database: CaneGuardDatabase,
  recordId: string,
  values: SQLiteUpdateSetSource<typeof scanRecords>,
): Promise<void> {
  try {
    await database
      .update(scanRecords)
      .set(values)
      .where(eq(scanRecords.id, recordId));
    emitSyncRecordsChanged();
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'UPDATE_FAILED',
      'Updating scan synchronization state failed.',
    );
  }
}
