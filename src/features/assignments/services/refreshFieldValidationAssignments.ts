import type { CaneGuardDatabase } from '@/database/database';
import {
  ASSIGNMENT_WORK_SET_CAP,
  fetchAllMobileFieldValidationAssignments,
} from '@/features/assignments/api/mobileFieldValidationAssignmentsApi';
import {
  confirmCachedFieldValidationAssignments,
  listCachedFieldValidationAssignments,
  readCachedFieldValidationSkippedCount,
  replaceCachedFieldValidationAssignments,
} from '@/features/assignments/data/assignmentCacheRepository';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import {
  readSyncCheckpoint,
  type SyncCheckpoint,
} from '@/features/sync/data/syncCheckpointRepository';

export interface FieldValidationAssignmentsRefreshResult {
  assignments: FieldValidationAssignment[];
  fetchedAt: string;
  syncBefore: string;
  skippedCount: number;
}

interface ActiveRefresh {
  promise: Promise<FieldValidationAssignmentsRefreshResult>;
  token: string;
}

const activeRefreshes = new WeakMap<CaneGuardDatabase, Map<string, ActiveRefresh>>();
const refreshGenerations = new WeakMap<CaneGuardDatabase, Map<string, number>>();

export function invalidateFieldValidationAssignmentsRefresh(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): void {
  const owner = ownerIdentity.trim();
  let databaseGenerations = refreshGenerations.get(database);
  if (!databaseGenerations) {
    databaseGenerations = new Map();
    refreshGenerations.set(database, databaseGenerations);
  }
  databaseGenerations.set(owner, (databaseGenerations.get(owner) ?? 0) + 1);
  activeRefreshes.get(database)?.delete(owner);
}

export function refreshFieldValidationAssignments(options: {
  database: CaneGuardDatabase;
  ownerIdentity: string;
  token: string;
}): Promise<FieldValidationAssignmentsRefreshResult> {
  const owner = options.ownerIdentity.trim();
  let databaseRefreshes = activeRefreshes.get(options.database);
  if (!databaseRefreshes) {
    databaseRefreshes = new Map();
    activeRefreshes.set(options.database, databaseRefreshes);
  }

  const active = databaseRefreshes.get(owner);
  if (active?.token === options.token) return active.promise;

  let databaseGenerations = refreshGenerations.get(options.database);
  if (!databaseGenerations) {
    databaseGenerations = new Map();
    refreshGenerations.set(options.database, databaseGenerations);
  }
  const generation = (databaseGenerations.get(owner) ?? 0) + 1;
  databaseGenerations.set(owner, generation);

  const operation = executeRefresh({
    ...options,
    isCurrent: () => databaseGenerations?.get(owner) === generation,
    ownerIdentity: owner,
  });
  const promise = operation.finally(() => {
    if (databaseRefreshes?.get(owner)?.promise === promise) databaseRefreshes.delete(owner);
  });
  databaseRefreshes.set(owner, { promise, token: options.token });
  return promise;
}

async function executeRefresh(options: {
  database: CaneGuardDatabase;
  isCurrent: () => boolean;
  ownerIdentity: string;
  token: string;
}): Promise<FieldValidationAssignmentsRefreshResult> {
  const held = await readHeldCheckpoint(options.database, options.ownerIdentity);
  const response = await fetchAllMobileFieldValidationAssignments({
    token: options.token,
    since: held?.version ?? null,
  });
  if (!options.isCurrent()) throw new Error('The assignment refresh was superseded.');
  const fetchedAt = new Date().toISOString();
  const checkpoint: SyncCheckpoint = {
    feed: 'assignments',
    version: response.sync.version,
    total: response.sync.total,
    truncated: response.sync.truncated,
    // An unchanged answer fetched no rows; the held download's page count still describes the cache.
    pageCount: response.sync.unchanged && held ? held.pageCount : response.pageCount,
    syncBefore: response.syncBefore,
    fetchedAt,
  };
  if (response.sync.unchanged) {
    await confirmCachedFieldValidationAssignments(
      options.database,
      options.ownerIdentity,
      fetchedAt,
      checkpoint,
      options.isCurrent,
    );
  } else {
    await replaceCachedFieldValidationAssignments(
      options.database,
      options.ownerIdentity,
      response.assignments,
      fetchedAt,
      options.isCurrent,
      response.skippedCount,
      checkpoint,
    );
  }
  const assignments = await listCachedFieldValidationAssignments(
    options.database,
    options.ownerIdentity,
  );
  const skippedCount = response.sync.unchanged
    ? await readCachedFieldValidationSkippedCount(options.database, options.ownerIdentity)
    : response.skippedCount;
  return { assignments, fetchedAt, syncBefore: response.syncBefore, skippedCount };
}

/**
 * The stored checkpoint, but only while the cache still holds every row that
 * download delivered; a trimmed or cleared cache must refetch instead of
 * trusting an "unchanged" answer.
 */
async function readHeldCheckpoint(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): Promise<(SyncCheckpoint & { version: string }) | null> {
  const checkpoint = await readSyncCheckpoint(database, ownerIdentity, 'assignments');
  if (!checkpoint?.version) return null;
  const delivered = checkpoint.truncated
    ? Math.min(checkpoint.total, ASSIGNMENT_WORK_SET_CAP)
    : checkpoint.total;
  const cached = await listCachedFieldValidationAssignments(database, ownerIdentity);
  const skipped = await readCachedFieldValidationSkippedCount(database, ownerIdentity);
  return cached.length + skipped === delivered
    ? { ...checkpoint, version: checkpoint.version }
    : null;
}
