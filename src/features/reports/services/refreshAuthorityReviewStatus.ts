import type { CaneGuardDatabase } from '@/database/database';
import {
  applyAuthorityReviewUpdates,
  findLatestAuthorityReviewUpdatedAt,
} from '@/features/reports/data/fieldReportReviewRepository';
import { fetchAllMobileReportStatuses } from '@/features/reports/api/mobileReportStatusesApi';
import {
  derivePageCount,
  saveSyncCheckpoint,
  SYNC_FEED_PAGE_SIZE,
} from '@/features/sync/data/syncCheckpointRepository';
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

  const operation = executeRefresh({ ...options, submitterIdentity: owner });
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
}): Promise<AuthorityReviewRefreshResult> {
  const latestServerUpdateAt = await findLatestAuthorityReviewUpdatedAt(
    options.database,
    options.submitterIdentity,
  );
  const response = await fetchAllMobileReportStatuses({
    token: options.token,
    updatedAfter: getOverlappedUpdatedAfter(latestServerUpdateAt),
  });
  const fetchedAt = new Date().toISOString();
  const result = await applyAuthorityReviewUpdates(
    options.database,
    options.submitterIdentity,
    response.updates,
    fetchedAt,
  );
  await saveSyncCheckpoint(options.database, options.submitterIdentity, {
    feed: 'authority_status',
    version: null,
    total: response.updates.length,
    truncated: false,
    // Every request returns a page, so an empty feed still took one.
    pageCount: Math.max(1, derivePageCount(response.updates.length, SYNC_FEED_PAGE_SIZE)),
    syncBefore: response.syncBefore,
    fetchedAt,
  });
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
