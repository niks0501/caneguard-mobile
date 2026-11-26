import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  ne,
  or,
  sql,
} from 'drizzle-orm';
import type { SQLiteUpdateSetSource } from 'drizzle-orm/sqlite-core/query-builders/update';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
import { requireOwnerIdentity } from '@/database/ownerIdentity';
import {
  aerialAnalysisOutbox,
  type AerialAnalysisOutboxRow,
  type SyncStatus,
} from '@/database/schema';
import { SYNC_TRANSITIONS } from '@/features/sync/domain/outboxState';
import { AUTO_RETRYABLE_SYNC_ERROR_CODES } from '@/features/sync/errors/syncErrors';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';

export const AERIAL_UPLOAD_RETRY_COOLDOWN_MS = 60_000;

export interface AerialAnalysisOutboxItem {
  id: string;
  ownerIdentity: string;
  assignmentId: string;
  reportUuid: string;
  imageUri: string;
  imageMimeType: string;
  imageSizeBytes: number;
  provenance?: { basis: string | null; verifiedAt: string | null } | null;
  syncStatus: SyncStatus;
  remoteId: string | null;
  syncAttemptCount: number;
  lastSyncErrorCode: string | null;
  lastSyncAttemptAt: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnqueueAerialAnalysisInput {
  id: string;
  ownerIdentity: string;
  assignmentId: string;
  reportUuid: string;
  imageUri: string;
  imageMimeType: string;
  imageSizeBytes: number;
  provenance?: { basis: string | null; verifiedAt: string | null } | null;
  createdAt: string;
}

export interface AerialAnalysisSyncRepository {
  countUnsynced(): Promise<number>;
  findById(id: string): Promise<AerialAnalysisOutboxItem>;
  findLastSuccessfulSyncAt(): Promise<string | null>;
  findSyncCandidates(
    limit: number,
    options?: { failedBefore?: string; includeRetryableFailed?: boolean },
  ): Promise<AerialAnalysisOutboxItem[]>;
  markFailed(id: string, errorCode: string, attemptedAt: string): Promise<void>;
  markSynced(id: string, remoteId: string, syncedAt: string): Promise<void>;
  markSyncing(id: string, attemptedAt: string): Promise<number>;
  releaseClaim(id: string): Promise<void>;
  resetStaleSyncing(staleBefore: string): Promise<void>;
}

export function createAerialAnalysisSyncRepository(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): AerialAnalysisSyncRepository {
  return {
    countUnsynced: () => countUnsyncedAerialAnalyses(database, ownerIdentity),
    findById: (id) => findAerialAnalysisById(database, id, ownerIdentity),
    findLastSuccessfulSyncAt: () => findLastSuccessfulAerialAnalysisSyncAt(database, ownerIdentity),
    findSyncCandidates: (limit, options) =>
      findAerialAnalysisSyncCandidates(database, ownerIdentity, limit, options),
    markFailed: (id, code, at) =>
      markAerialAnalysisFailed(database, id, ownerIdentity, code, at).then(() => undefined),
    markSynced: (id, remoteId, at) =>
      markAerialAnalysisSynced(database, id, ownerIdentity, remoteId, at).then(() => undefined),
    markSyncing: (id, at) =>
      markAerialAnalysisSyncing(database, id, ownerIdentity, at),
    releaseClaim: (id) =>
      releaseAerialAnalysisClaim(database, id, ownerIdentity).then(() => undefined),
    resetStaleSyncing: (before) =>
      resetStaleSyncingAerialAnalyses(database, ownerIdentity, before),
  };
}

export async function enqueueAerialAnalysis(
  database: CaneGuardDatabase,
  input: EnqueueAerialAnalysisInput,
): Promise<AerialAnalysisOutboxItem> {
  const owner = requireOwnerIdentity(input.ownerIdentity);
  try {
    const item = database.transaction((transaction) => {
      transaction
        .insert(aerialAnalysisOutbox)
        .values({
          id: input.id,
          ownerIdentity: owner,
          assignmentId: input.assignmentId,
          reportUuid: input.reportUuid,
          imageUri: input.imageUri,
          imageMimeType: input.imageMimeType,
          imageSizeBytes: input.imageSizeBytes,
          authorizationBasis: input.provenance?.basis ?? null,
          capabilitiesVerifiedAt: input.provenance?.verifiedAt ?? null,
          syncStatus: 'pending',
          createdAt: input.createdAt,
          updatedAt: input.createdAt,
        })
        .run();

      const created = transaction
        .select()
        .from(aerialAnalysisOutbox)
        .where(
          and(
            eq(aerialAnalysisOutbox.id, input.id),
            eq(aerialAnalysisOutbox.ownerIdentity, owner),
          ),
        )
        .get();
      if (!created) {
        throw new StorageError('UPDATE_FAILED', 'The queued drone photo could not be reloaded.');
      }
      return toItem(created);
    });
    emitSyncRecordsChanged();
    return item;
  } catch (error: unknown) {
    throw toStorageError(error, 'UPDATE_FAILED', 'Saving the drone photo upload failed.');
  }
}

export async function findLatestAerialAnalysisForAssignment(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  assignmentId: string,
): Promise<AerialAnalysisOutboxItem | null> {
  const owner = requireOwnerIdentity(ownerIdentity);
  try {
    const row = await database
      .select()
      .from(aerialAnalysisOutbox)
      .where(
        and(
          eq(aerialAnalysisOutbox.ownerIdentity, owner),
          eq(aerialAnalysisOutbox.assignmentId, assignmentId),
        ),
      )
      .orderBy(desc(aerialAnalysisOutbox.createdAt), desc(aerialAnalysisOutbox.id))
      .limit(1)
      .get();
    return row ? toItem(row) : null;
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Reading the queued drone upload failed.');
  }
}

export async function findAerialAnalysisById(
  database: CaneGuardDatabase,
  id: string,
  ownerIdentity: string,
): Promise<AerialAnalysisOutboxItem> {
  const owner = requireOwnerIdentity(ownerIdentity);
  try {
    const row = await database
      .select()
      .from(aerialAnalysisOutbox)
      .where(
        and(
          eq(aerialAnalysisOutbox.id, id),
          eq(aerialAnalysisOutbox.ownerIdentity, owner),
        ),
      )
      .get();
    if (!row) {
      throw new StorageError('RECORD_NOT_FOUND', 'Queued drone upload was not found.');
    }
    return toItem(row);
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Reading the queued drone upload failed.');
  }
}

export async function deleteUnsentAerialAnalysis(
  database: CaneGuardDatabase,
  id: string,
  ownerIdentity: string,
): Promise<AerialAnalysisOutboxItem | null> {
  const owner = requireOwnerIdentity(ownerIdentity);
  try {
    const deleted = database.transaction((transaction) => {
      const existing = transaction
        .select()
        .from(aerialAnalysisOutbox)
        .where(
          and(
            eq(aerialAnalysisOutbox.id, id),
            eq(aerialAnalysisOutbox.ownerIdentity, owner),
            inArray(aerialAnalysisOutbox.syncStatus, ['pending', 'failed']),
          ),
        )
        .get();
      if (!existing) {
        return null;
      }
      transaction
        .delete(aerialAnalysisOutbox)
        .where(
          and(
            eq(aerialAnalysisOutbox.id, id),
            eq(aerialAnalysisOutbox.ownerIdentity, owner),
            inArray(aerialAnalysisOutbox.syncStatus, ['pending', 'failed']),
          ),
        )
        .run();
      return toItem(existing);
    });
    if (deleted) {
      emitSyncRecordsChanged();
    }
    return deleted;
  } catch (error: unknown) {
    throw toStorageError(error, 'DELETE_FAILED', 'Removing the queued drone upload failed.');
  }
}

export async function hasCoolingRetryableAerialAnalysis(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  failedBefore: string,
): Promise<boolean> {
  const row = await database
    .select({ id: aerialAnalysisOutbox.id })
    .from(aerialAnalysisOutbox)
    .where(
      and(
        eq(aerialAnalysisOutbox.ownerIdentity, requireOwnerIdentity(ownerIdentity)),
        eq(aerialAnalysisOutbox.syncStatus, 'failed'),
        inArray(aerialAnalysisOutbox.lastSyncErrorCode, AUTO_RETRYABLE_SYNC_ERROR_CODES),
        gte(aerialAnalysisOutbox.lastSyncAttemptAt, failedBefore),
      ),
    )
    .limit(1)
    .get();
  return row !== undefined;
}

export async function findAerialAnalysisSyncCandidates(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  limit = 10,
  options: { failedBefore?: string; includeRetryableFailed?: boolean } = {},
): Promise<AerialAnalysisOutboxItem[]> {
  const normalizedLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  const failedBefore =
    options.failedBefore ??
    new Date(Date.now() - AERIAL_UPLOAD_RETRY_COOLDOWN_MS).toISOString();

  const eligibleStatus = options.includeRetryableFailed
    ? or(
        eq(aerialAnalysisOutbox.syncStatus, 'pending'),
        and(
          eq(aerialAnalysisOutbox.syncStatus, 'failed'),
          inArray(aerialAnalysisOutbox.lastSyncErrorCode, AUTO_RETRYABLE_SYNC_ERROR_CODES),
          or(
            isNull(aerialAnalysisOutbox.lastSyncAttemptAt),
            lt(aerialAnalysisOutbox.lastSyncAttemptAt, failedBefore),
          ),
        ),
      )
    : eq(aerialAnalysisOutbox.syncStatus, 'pending');

  try {
    const rows = await database
      .select({ id: aerialAnalysisOutbox.id })
      .from(aerialAnalysisOutbox)
      .where(and(eq(aerialAnalysisOutbox.ownerIdentity, requireOwnerIdentity(ownerIdentity)), eligibleStatus))
      .orderBy(asc(aerialAnalysisOutbox.createdAt), asc(aerialAnalysisOutbox.id))
      .limit(normalizedLimit);
    return Promise.all(rows.map(({ id }) => findAerialAnalysisById(database, id, ownerIdentity)));
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Reading pending drone uploads failed.');
  }
}

export async function markAerialAnalysisPending(
  database: CaneGuardDatabase,
  id: string,
  ownerIdentity: string,
): Promise<number> {
  return updateSyncState(
    database,
    id,
    ownerIdentity,
    {
      syncStatus: 'pending',
      lastSyncErrorCode: null,
      updatedAt: new Date().toISOString(),
    },
    SYNC_TRANSITIONS.pending,
  );
}

/**
 * Re-queue failed drone uploads. Excludes AERIAL_DISABLED unless explicitly included
 * so manual retries from the card or sync screen still work once the switch turns back on.
 */
export async function requeueFailedAerialAnalyses(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  codes?: readonly string[],
): Promise<number> {
  const owner = requireOwnerIdentity(ownerIdentity);
  try {
    const whereClause = codes && codes.length > 0
      ? and(
          eq(aerialAnalysisOutbox.ownerIdentity, owner),
          eq(aerialAnalysisOutbox.syncStatus, 'failed'),
          inArray(aerialAnalysisOutbox.lastSyncErrorCode, [...codes]),
        )
      : and(
          eq(aerialAnalysisOutbox.ownerIdentity, owner),
          eq(aerialAnalysisOutbox.syncStatus, 'failed'),
          or(
            isNull(aerialAnalysisOutbox.lastSyncErrorCode),
            ne(aerialAnalysisOutbox.lastSyncErrorCode, 'INVALID_LOCAL_RECORD'),
          ),
        );
    const result = await database
      .update(aerialAnalysisOutbox)
      .set({
        syncStatus: 'pending',
        lastSyncErrorCode: null,
        updatedAt: new Date().toISOString(),
      })
      .where(whereClause);
    emitSyncRecordsChanged();
    return result.changes;
  } catch (error: unknown) {
    throw toStorageError(error, 'UPDATE_FAILED', 'Re-queuing failed drone uploads failed.');
  }
}

export async function releaseAerialAnalysisClaim(
  database: CaneGuardDatabase,
  id: string,
  ownerIdentity: string,
): Promise<number> {
  return updateSyncState(
    database,
    id,
    ownerIdentity,
    {
      syncStatus: 'pending',
      lastSyncErrorCode: null,
      updatedAt: new Date().toISOString(),
    },
    ['syncing'],
  );
}

export async function markAerialAnalysisSyncing(
  database: CaneGuardDatabase,
  id: string,
  ownerIdentity: string,
  attemptedAt: string,
): Promise<number> {
  return updateSyncState(
    database,
    id,
    ownerIdentity,
    {
      syncStatus: 'syncing',
      lastSyncAttemptAt: attemptedAt,
      lastSyncErrorCode: null,
      syncAttemptCount: sql`${aerialAnalysisOutbox.syncAttemptCount} + 1`,
      updatedAt: attemptedAt,
    },
    SYNC_TRANSITIONS.syncing,
  );
}

export async function markAerialAnalysisSynced(
  database: CaneGuardDatabase,
  id: string,
  ownerIdentity: string,
  remoteId: string,
  syncedAt: string,
): Promise<number> {
  return updateSyncState(
    database,
    id,
    ownerIdentity,
    {
      syncStatus: 'synced',
      remoteId,
      lastSyncedAt: syncedAt,
      lastSyncErrorCode: null,
      updatedAt: syncedAt,
    },
    SYNC_TRANSITIONS.synced,
  );
}

export async function markAerialAnalysisFailed(
  database: CaneGuardDatabase,
  id: string,
  ownerIdentity: string,
  errorCode: string,
  attemptedAt: string,
): Promise<number> {
  return updateSyncState(
    database,
    id,
    ownerIdentity,
    {
      syncStatus: 'failed',
      lastSyncAttemptAt: attemptedAt,
      lastSyncErrorCode: errorCode,
      updatedAt: attemptedAt,
    },
    SYNC_TRANSITIONS.failed,
  );
}

export async function resetStaleSyncingAerialAnalyses(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  staleBefore: string,
): Promise<void> {
  try {
    await database
      .update(aerialAnalysisOutbox)
      .set({
        syncStatus: 'pending',
        lastSyncErrorCode: 'STALE_SYNC_RECOVERED',
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(aerialAnalysisOutbox.ownerIdentity, requireOwnerIdentity(ownerIdentity)),
          eq(aerialAnalysisOutbox.syncStatus, 'syncing'),
          or(
            isNull(aerialAnalysisOutbox.lastSyncAttemptAt),
            lt(aerialAnalysisOutbox.lastSyncAttemptAt, staleBefore),
          ),
        ),
      );
    emitSyncRecordsChanged();
  } catch (error: unknown) {
    throw toStorageError(error, 'UPDATE_FAILED', 'Recovering interrupted drone upload failed.');
  }
}

export async function countUnsyncedAerialAnalyses(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): Promise<number> {
  try {
    const row = await database
      .select({ count: sql<number>`count(*)` })
      .from(aerialAnalysisOutbox)
      .where(
        and(
          eq(aerialAnalysisOutbox.ownerIdentity, requireOwnerIdentity(ownerIdentity)),
          inArray(aerialAnalysisOutbox.syncStatus, ['pending', 'syncing', 'failed']),
        ),
      )
      .get();
    return Number(row?.count ?? 0);
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Counting pending drone uploads failed.');
  }
}

export async function findLastSuccessfulAerialAnalysisSyncAt(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): Promise<string | null> {
  try {
    const row = await database
      .select({ value: sql<string | null>`max(${aerialAnalysisOutbox.lastSyncedAt})` })
      .from(aerialAnalysisOutbox)
      .where(eq(aerialAnalysisOutbox.ownerIdentity, requireOwnerIdentity(ownerIdentity)))
      .get();
    return row?.value ?? null;
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Reading the last drone upload time failed.');
  }
}

async function updateSyncState(
  database: CaneGuardDatabase,
  id: string,
  ownerIdentity: string,
  values: SQLiteUpdateSetSource<typeof aerialAnalysisOutbox>,
  allowedStatuses: readonly SyncStatus[],
): Promise<number> {
  try {
    const result = await database
      .update(aerialAnalysisOutbox)
      .set(values)
      .where(
        and(
          eq(aerialAnalysisOutbox.id, id),
          eq(aerialAnalysisOutbox.ownerIdentity, requireOwnerIdentity(ownerIdentity)),
          inArray(aerialAnalysisOutbox.syncStatus, [...allowedStatuses]),
        ),
      );
    emitSyncRecordsChanged();
    return result.changes;
  } catch (error: unknown) {
    throw toStorageError(error, 'UPDATE_FAILED', 'Updating drone upload status failed.');
  }
}

function toItem(row: AerialAnalysisOutboxRow): AerialAnalysisOutboxItem {
  return {
    id: row.id,
    ownerIdentity: row.ownerIdentity,
    assignmentId: row.assignmentId,
    reportUuid: row.reportUuid,
    imageUri: row.imageUri,
    imageMimeType: row.imageMimeType,
    imageSizeBytes: row.imageSizeBytes,
    provenance: row.authorizationBasis
      ? { basis: row.authorizationBasis, verifiedAt: row.capabilitiesVerifiedAt ?? null }
      : null,
    syncStatus: row.syncStatus,
    remoteId: row.remoteId,
    syncAttemptCount: row.syncAttemptCount,
    lastSyncErrorCode: row.lastSyncErrorCode,
    lastSyncAttemptAt: row.lastSyncAttemptAt,
    lastSyncedAt: row.lastSyncedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
