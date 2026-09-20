import {
  and,
  asc,
  eq,
  inArray,
  isNull,
  lt,
  or,
  sql,
} from 'drizzle-orm';
import type { SQLiteUpdateSetSource } from 'drizzle-orm/sqlite-core/query-builders/update';

import type { CaneGuardDatabase } from '@/database/database';
import { markCachedFieldValidationAssignmentCompleted } from '@/features/assignments/data/assignmentCacheRepository';
import { StorageError, toStorageError } from '@/database/errors';
import {
  fieldValidationCompletions,
  type FieldValidationCompletionRow,
  type SyncStatus,
} from '@/database/schema';
import type {
  FieldValidationCompletion,
  SaveFieldValidationCompletionInput,
} from '@/features/assignments/domain/fieldValidationCompletionTypes';
import { validateFieldValidationCompletionInput } from '@/features/assignments/domain/fieldValidationCompletionValidation';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';

export const FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS = 60_000;

export interface FieldValidationCompletionSyncRepository {
  countUnsynced(): Promise<number>;
  findById(id: string): Promise<FieldValidationCompletion>;
  findLastSuccessfulSyncAt(): Promise<string | null>;
  findSyncCandidates(
    limit: number,
    options?: { failedBefore?: string; includeRetryableFailed?: boolean },
  ): Promise<FieldValidationCompletion[]>;
  markFailed(id: string, errorCode: string, attemptedAt: string): Promise<void>;
  markPending(id: string): Promise<void>;
  markSynced(id: string, remoteId: string, syncedAt: string): Promise<void>;
  markSyncing(id: string, attemptedAt: string): Promise<void>;
  resetStaleSyncing(staleBefore: string): Promise<void>;
}

export function createFieldValidationCompletionSyncRepository(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): FieldValidationCompletionSyncRepository {
  return {
    countUnsynced: () => countUnsyncedFieldValidationCompletions(database, ownerIdentity),
    findById: (id) => findFieldValidationCompletionById(database, id, ownerIdentity),
    findLastSuccessfulSyncAt: () => findLastSuccessfulFieldValidationCompletionSyncAt(database, ownerIdentity),
    findSyncCandidates: (limit, options) => findFieldValidationCompletionSyncCandidates(database, ownerIdentity, limit, options),
    markFailed: (id, code, at) => markFieldValidationCompletionFailed(database, id, ownerIdentity, code, at),
    markPending: (id) => markFieldValidationCompletionPending(database, id, ownerIdentity),
    markSynced: (id, remoteId, at) => markFieldValidationCompletionSynced(database, id, ownerIdentity, remoteId, at),
    markSyncing: (id, at) => markFieldValidationCompletionSyncing(database, id, ownerIdentity, at),
    resetStaleSyncing: (before) => resetStaleSyncingFieldValidationCompletions(database, ownerIdentity, before),
  };
}

export async function saveFieldValidationCompletion(
  database: CaneGuardDatabase,
  input: SaveFieldValidationCompletionInput,
): Promise<FieldValidationCompletion> {
  validateFieldValidationCompletionInput(input);
  const owner = requireOwner(input.ownerIdentity);
  try {
    return database.transaction((transaction) => {
      const existing = transaction
        .select()
        .from(fieldValidationCompletions)
        .where(
          and(
            eq(fieldValidationCompletions.ownerIdentity, owner),
            eq(fieldValidationCompletions.assignmentId, input.assignmentId),
          ),
        )
        .get();
      if (existing) {
        if (existing.id !== input.id) {
          throw new StorageError(
            'UPDATE_FAILED',
            'This assignment already has saved validation evidence.',
          );
        }
        return toCompletion(existing);
      }

      transaction
        .insert(fieldValidationCompletions)
        .values({
          id: input.id,
          ownerIdentity: owner,
          assignmentId: input.assignmentId,
          reportUuid: input.reportUuid,
          fieldObservation: input.fieldObservation,
          fieldFinding: input.fieldFinding,
          actionTaken: input.actionTaken,
          followUpOutcome: input.followUpOutcome,
          visitedAt: input.visitedAt,
          gpsOutcome: input.gpsOutcome,
          gpsAttemptedAt: input.gpsAttemptedAt,
          gpsLatitude: input.gpsLatitude ?? null,
          gpsLongitude: input.gpsLongitude ?? null,
          gpsAccuracy: input.gpsAccuracy ?? null,
          freshPhotoUri: input.freshPhotoUri ?? null,
          freshPhotoMimeType: input.freshPhotoMimeType ?? null,
          freshPhotoSizeBytes: input.freshPhotoSizeBytes ?? null,
          syncStatus: 'pending',
          createdAt: input.visitedAt,
          updatedAt: input.visitedAt,
        })
        .run();

      const created = transaction
        .select()
        .from(fieldValidationCompletions)
        .where(eq(fieldValidationCompletions.id, input.id))
        .get();
      if (!created) {
        throw new StorageError('UPDATE_FAILED', 'The saved validation evidence could not be reloaded.');
      }
      return toCompletion(created);
    });
  } catch (error: unknown) {
    throw toStorageError(error, 'UPDATE_FAILED', 'Saving field validation evidence failed.');
  }
}

export async function listFieldValidationCompletions(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): Promise<FieldValidationCompletion[]> {
  try {
    const rows = await database
      .select()
      .from(fieldValidationCompletions)
      .where(eq(fieldValidationCompletions.ownerIdentity, requireOwner(ownerIdentity)))
      .orderBy(asc(fieldValidationCompletions.visitedAt), asc(fieldValidationCompletions.createdAt));
    return rows.map(toCompletion);
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Reading saved field validation visits failed.');
  }
}

export async function listFieldValidationCompletionSummaries(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): Promise<{ assignmentId: string; visitedAt: string }[]> {
  try {
    return await database
      .select({
        assignmentId: fieldValidationCompletions.assignmentId,
        visitedAt: fieldValidationCompletions.visitedAt,
      })
      .from(fieldValidationCompletions)
      .where(eq(fieldValidationCompletions.ownerIdentity, requireOwner(ownerIdentity)))
      .orderBy(asc(fieldValidationCompletions.visitedAt));
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Reading saved field validation visits failed.');
  }
}

export async function findFieldValidationCompletion(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  assignmentId: string,
): Promise<FieldValidationCompletion | null> {
  try {
    const row = await database
      .select()
      .from(fieldValidationCompletions)
      .where(
        and(
          eq(fieldValidationCompletions.ownerIdentity, requireOwner(ownerIdentity)),
          eq(fieldValidationCompletions.assignmentId, assignmentId),
        ),
      )
      .get();
    return row ? toCompletion(row) : null;
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Reading saved field validation evidence failed.');
  }
}

export async function findFieldValidationCompletionById(
  database: CaneGuardDatabase,
  id: string,
  ownerIdentity: string,
): Promise<FieldValidationCompletion> {
  try {
    const row = await database
      .select()
      .from(fieldValidationCompletions)
      .where(
        and(
          eq(fieldValidationCompletions.id, id),
          eq(fieldValidationCompletions.ownerIdentity, requireOwner(ownerIdentity)),
        ),
      )
      .get();
    if (!row) {
      throw new StorageError('FIELD_VALIDATION_COMPLETION_NOT_FOUND', 'The saved validation evidence does not exist.');
    }
    return toCompletion(row);
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Reading saved field validation evidence failed.');
  }
}

export async function findFieldValidationCompletionSyncCandidates(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  limit: number,
  options: { failedBefore?: string; includeRetryableFailed?: boolean } = {},
): Promise<FieldValidationCompletion[]> {
  const normalizedLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
  const failedBefore = options.failedBefore ?? new Date(Date.now() - FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS).toISOString();
  const eligibleStatus = options.includeRetryableFailed
    ? or(
        eq(fieldValidationCompletions.syncStatus, 'pending'),
        and(
          eq(fieldValidationCompletions.syncStatus, 'failed'),
          inArray(fieldValidationCompletions.lastSyncErrorCode, [
            'NETWORK_UNAVAILABLE',
            'NETWORK_REQUEST_FAILED',
            'API_RATE_LIMITED',
            'SERVER_ERROR',
          ]),
          or(
            isNull(fieldValidationCompletions.lastSyncAttemptAt),
            lt(fieldValidationCompletions.lastSyncAttemptAt, failedBefore),
          ),
        ),
      )
    : eq(fieldValidationCompletions.syncStatus, 'pending');

  try {
    const rows = await database
      .select({ id: fieldValidationCompletions.id })
      .from(fieldValidationCompletions)
      .where(and(eq(fieldValidationCompletions.ownerIdentity, requireOwner(ownerIdentity)), eligibleStatus))
      .orderBy(asc(fieldValidationCompletions.visitedAt), asc(fieldValidationCompletions.createdAt))
      .limit(normalizedLimit);
    return Promise.all(rows.map(({ id }) => findFieldValidationCompletionById(database, id, ownerIdentity)));
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Reading pending field validation evidence failed.');
  }
}

export async function markFieldValidationCompletionPending(
  database: CaneGuardDatabase,
  id: string,
  ownerIdentity: string,
): Promise<void> {
  await updateSyncState(database, id, ownerIdentity, {
    syncStatus: 'pending',
    lastSyncErrorCode: null,
    updatedAt: new Date().toISOString(),
  }, ['pending', 'failed']);
}

export async function markFieldValidationCompletionSyncing(
  database: CaneGuardDatabase,
  id: string,
  ownerIdentity: string,
  attemptedAt: string,
): Promise<void> {
  await updateSyncState(database, id, ownerIdentity, {
    syncStatus: 'syncing',
    lastSyncAttemptAt: attemptedAt,
    lastSyncErrorCode: null,
    syncAttemptCount: sql`${fieldValidationCompletions.syncAttemptCount} + 1`,
    updatedAt: attemptedAt,
  }, ['pending', 'failed']);
}

export async function markFieldValidationCompletionSynced(
  database: CaneGuardDatabase,
  id: string,
  ownerIdentity: string,
  remoteId: string,
  syncedAt: string,
): Promise<void> {
  await updateSyncState(database, id, ownerIdentity, {
    syncStatus: 'synced',
    remoteId,
    lastSyncedAt: syncedAt,
    lastSyncErrorCode: null,
    updatedAt: syncedAt,
  }, ['syncing']);
  const completion = await findFieldValidationCompletionById(database, id, ownerIdentity);
  await markCachedFieldValidationAssignmentCompleted(
    database,
    ownerIdentity,
    completion.assignmentId,
    syncedAt,
  );
}

export async function markFieldValidationCompletionFailed(
  database: CaneGuardDatabase,
  id: string,
  ownerIdentity: string,
  errorCode: string,
  attemptedAt: string,
): Promise<void> {
  await updateSyncState(database, id, ownerIdentity, {
    syncStatus: 'failed',
    lastSyncAttemptAt: attemptedAt,
    lastSyncErrorCode: errorCode,
    updatedAt: attemptedAt,
  }, ['pending', 'syncing', 'failed']);
}

export async function resetStaleSyncingFieldValidationCompletions(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  staleBefore: string,
): Promise<void> {
  try {
    await database
      .update(fieldValidationCompletions)
      .set({
        syncStatus: 'pending',
        lastSyncErrorCode: 'STALE_SYNC_RECOVERED',
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(fieldValidationCompletions.ownerIdentity, requireOwner(ownerIdentity)),
          eq(fieldValidationCompletions.syncStatus, 'syncing'),
          or(
            isNull(fieldValidationCompletions.lastSyncAttemptAt),
            lt(fieldValidationCompletions.lastSyncAttemptAt, staleBefore),
          ),
        ),
      );
    emitSyncRecordsChanged();
  } catch (error: unknown) {
    throw toStorageError(error, 'UPDATE_FAILED', 'Recovering interrupted field validation synchronization failed.');
  }
}

export async function countUnsyncedFieldValidationCompletions(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): Promise<number> {
  try {
    const row = await database
      .select({ count: sql<number>`count(*)` })
      .from(fieldValidationCompletions)
      .where(
        and(
          eq(fieldValidationCompletions.ownerIdentity, requireOwner(ownerIdentity)),
          inArray(fieldValidationCompletions.syncStatus, ['pending', 'syncing', 'failed']),
        ),
      )
      .get();
    return Number(row?.count ?? 0);
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Counting pending field validation evidence failed.');
  }
}

export async function findLastSuccessfulFieldValidationCompletionSyncAt(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): Promise<string | null> {
  try {
    const row = await database
      .select({ value: sql<string | null>`max(${fieldValidationCompletions.lastSyncedAt})` })
      .from(fieldValidationCompletions)
      .where(eq(fieldValidationCompletions.ownerIdentity, requireOwner(ownerIdentity)))
      .get();
    return row?.value ?? null;
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Reading the last field validation synchronization time failed.');
  }
}

async function updateSyncState(
  database: CaneGuardDatabase,
  id: string,
  ownerIdentity: string,
  values: SQLiteUpdateSetSource<typeof fieldValidationCompletions>,
  allowedStatuses: SyncStatus[],
): Promise<void> {
  try {
    await database
      .update(fieldValidationCompletions)
      .set(values)
      .where(
        and(
          eq(fieldValidationCompletions.id, id),
          eq(fieldValidationCompletions.ownerIdentity, requireOwner(ownerIdentity)),
          inArray(fieldValidationCompletions.syncStatus, allowedStatuses),
        ),
      );
    emitSyncRecordsChanged();
  } catch (error: unknown) {
    throw toStorageError(error, 'UPDATE_FAILED', 'Updating field validation synchronization state failed.');
  }
}

function toCompletion(row: FieldValidationCompletionRow): FieldValidationCompletion {
  return {
    id: row.id,
    ownerIdentity: row.ownerIdentity,
    assignmentId: row.assignmentId,
    reportUuid: row.reportUuid,
    fieldObservation: row.fieldObservation,
    fieldFinding: row.fieldFinding,
    actionTaken: row.actionTaken,
    followUpOutcome: row.followUpOutcome,
    visitedAt: row.visitedAt,
    gpsOutcome: row.gpsOutcome,
    gpsAttemptedAt: row.gpsAttemptedAt,
    gpsLatitude: row.gpsLatitude,
    gpsLongitude: row.gpsLongitude,
    gpsAccuracy: row.gpsAccuracy,
    freshPhotoUri: row.freshPhotoUri,
    freshPhotoMimeType: row.freshPhotoMimeType,
    freshPhotoSizeBytes: row.freshPhotoSizeBytes,
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

function requireOwner(value: string): string {
  const owner = value.trim();
  if (!owner) throw new StorageError('UPDATE_FAILED', 'The field validation owner is invalid.');
  return owner;
}
