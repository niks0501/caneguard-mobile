import type { CaneGuardDatabase } from '@/database/database';
import {
  applyAuthorityReviewUpdates,
  findLatestAuthorityReviewUpdatedAt,
} from '@/features/reports/data/fieldReportReviewRepository';
import { fetchAllMobileReportStatuses } from '@/features/reports/api/mobileReportStatusesApi';
import {
  readSyncCheckpoint,
  type SyncCheckpoint,
} from '@/features/sync/data/syncCheckpointRepository';
import { createSyncDownloadProgressStore } from '@/features/sync/data/syncDownloadProgressStorage';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';

const OVERLAP_MS = 1_000;

export interface AuthorityReviewRefreshResult {
  applied: number;
  fetchedAt: string;
  syncBefore: string;
}

interface ActiveRefresh {
  promise: Promise<AuthorityReviewRefreshResult>;
  token: string;
}

const activeRefreshes = new WeakMap<
  CaneGuardDatabase,
  Map<string, ActiveRefresh>
>();
const refreshGenerations = new WeakMap<CaneGuardDatabase, Map<string, number>>();

export function invalidateAuthorityReviewStatusRefresh(
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

export function refreshAuthorityReviewStatus(options: {
  database: CaneGuardDatabase;
  submitterIdentity: string;
  token: string;
}): Promise<AuthorityReviewRefreshResult> {
  const owner = options.submitterIdentity.trim();
  let databaseRefreshes = activeRefreshes.get(options.database);
  if (!databaseRefreshes) {
    databaseRefreshes = new Map();
    activeRefreshes.set(options.database, databaseRefreshes);
  }

  const active = databaseRefreshes.get(owner);
  if (active?.token === options.token) {
    return active.promise;
  }

  let databaseGenerations = refreshGenerations.get(options.database);
  if (!databaseGenerations) {
    databaseGenerations = new Map();
    refreshGenerations.set(options.database, databaseGenerations);
  }
  const generation = (databaseGenerations.get(owner) ?? 0) + 1;
  databaseGenerations.set(owner, generation);

  const operation = executeRefresh({
    ...options,
    submitterIdentity: owner,
    isCurrent: () => databaseGenerations?.get(owner) === generation,
  });
  const promise = operation.finally(() => {
    if (databaseRefreshes?.get(owner)?.promise === promise) {
      databaseRefreshes.delete(owner);
    }
  });
  databaseRefreshes.set(owner, { promise, token: options.token });
  return promise;
}

async function executeRefresh(options: {
  database: CaneGuardDatabase;
  submitterIdentity: string;
  token: string;
  isCurrent: () => boolean;
}): Promise<AuthorityReviewRefreshResult> {
  const latestServerUpdateAt = await findLatestAuthorityReviewUpdatedAt(
    options.database,
    options.submitterIdentity,
  );
  const held = await readSyncCheckpoint(
    options.database,
    options.submitterIdentity,
    'authority_status',
  );
  const response = await fetchAllMobileReportStatuses({
    token: options.token,
    // The cursor is the last fully stored download's server checkpoint, not the newest row.
    updatedAfter: getOverlappedUpdatedAfter(held?.syncBefore ?? latestServerUpdateAt),
    since: held?.version ?? null,
    progress: createSyncDownloadProgressStore(
      options.submitterIdentity,
      'authority_status',
      options.isCurrent,
    ),
  });
  if (!options.isCurrent()) throw new Error('The authority review refresh was superseded.');
  const fetchedAt = new Date().toISOString();
  const result = await applyAuthorityReviewUpdates(
    options.database,
    options.submitterIdentity,
    response.updates,
    fetchedAt,
    {
      feed: 'authority_status',
      version: response.sync.version,
      total: response.sync.unchanged && held ? held.total : response.sync.total,
      truncated: response.sync.unchanged && held ? held.truncated : response.sync.truncated,
      // An unchanged answer fetched no rows; the held download still describes the cache.
      pageCount: response.sync.unchanged && held ? held.pageCount : response.pageCount,
      syncBefore: response.syncBefore,
      fetchedAt,
    } satisfies SyncCheckpoint,
  );
  emitSyncRecordsChanged();
  return {
    applied: result.applied,
    fetchedAt,
    syncBefore: response.syncBefore,
  };
}

function getOverlappedUpdatedAfter(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return new Date(Math.max(0, timestamp - OVERLAP_MS)).toISOString();
}
