import type { CaneGuardDatabase } from '@/database/database';
import {
  createFieldReportSyncRepository,
  SYNC_RETRY_COOLDOWN_MS,
} from '@/features/reports/data/fieldReportSyncRepository';
import { isAutoRetryableSyncErrorCode } from '@/features/sync/errors/syncErrors';
import {
  syncFieldReport,
  type SyncResult,
} from '@/features/sync/services/syncFieldReport';

export const DEFAULT_SYNC_BATCH_SIZE = 10;
export const MAX_SYNC_REPORTS_PER_RUN = 50;

export type SyncTriggerSource =
  | 'after-save'
  | 'startup'
  | 'resume'
  | 'network-restored'
  | 'retry-timer'
  | 'manual';

export type SyncHaltReason =
  | 'empty'
  | 'auth-required'
  | 'transient-blocker'
  | 'run-limit'
  | null;

export interface SyncBatchResult {
  attempted: number;
  authRequired: boolean;
  failed: number;
  haltReason: SyncHaltReason;
  results: SyncResult[];
  source: SyncTriggerSource;
  synced: number;
}

interface SyncPendingFieldReportsOptions {
  database: CaneGuardDatabase;
  limit?: number;
  source: SyncTriggerSource;
  submitterIdentity: string;
  token: string | null;
}

interface DatabaseRunState {
  runs: Map<string, { promise: Promise<SyncBatchResult>; token: string | null }>;
  tail: Promise<void>;
}

const activeRuns = new WeakMap<CaneGuardDatabase, DatabaseRunState>();

export function syncPendingFieldReports(
  options: SyncPendingFieldReportsOptions,
): Promise<SyncBatchResult> {
  const submitterIdentity = options.submitterIdentity.trim();
  let databaseState = activeRuns.get(options.database);
  if (!databaseState) {
    databaseState = { runs: new Map(), tail: Promise.resolve() };
    activeRuns.set(options.database, databaseState);
  }
  const activeRun = databaseState.runs.get(submitterIdentity);
  if (activeRun?.token === options.token) {
    return activeRun.promise;
  }

  const execution = databaseState.tail
    .catch(() => undefined)
    .then(() => executeBatch({ ...options, submitterIdentity }));
  const run = execution.finally(() => {
    if (databaseState?.runs.get(submitterIdentity)?.promise === run) {
      databaseState.runs.delete(submitterIdentity);
    }
  });
  databaseState.runs.set(submitterIdentity, {
    promise: run,
    token: options.token,
  });
  databaseState.tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function executeBatch({
  database,
  limit = DEFAULT_SYNC_BATCH_SIZE,
  source,
  submitterIdentity,
  token,
}: SyncPendingFieldReportsOptions): Promise<SyncBatchResult> {
  const repository = createFieldReportSyncRepository(
    database,
    submitterIdentity,
  );
  const batchSize = Math.min(
    Math.max(Math.trunc(limit), 1),
    MAX_SYNC_REPORTS_PER_RUN,
  );
  const results: SyncResult[] = [];
  let authRequired = false;
  let haltReason: SyncHaltReason = null;

  while (results.length < MAX_SYNC_REPORTS_PER_RUN) {
    const remaining = MAX_SYNC_REPORTS_PER_RUN - results.length;
    const candidates = await repository.findSyncCandidates(
      Math.min(batchSize, remaining),
      {
        failedBefore: new Date(
          Date.now() - SYNC_RETRY_COOLDOWN_MS,
        ).toISOString(),
        includeRetryableFailed: true,
      },
    );
    if (candidates.length === 0) {
      haltReason = 'empty';
      break;
    }

    for (const candidate of candidates) {
      const result = await syncFieldReport({
        reportId: candidate.id,
        repository,
        token,
      });
      results.push(result);

      if (result.status !== 'failed') {
        if (results.length >= MAX_SYNC_REPORTS_PER_RUN) {
          haltReason = 'run-limit';
          break;
        }
        continue;
      }
      if (result.error.code === 'AUTH_REQUIRED') {
        authRequired = true;
        haltReason = 'auth-required';
        break;
      }
      if (isAutoRetryableSyncErrorCode(result.error.code)) {
        haltReason = 'transient-blocker';
        break;
      }
      if (results.length >= MAX_SYNC_REPORTS_PER_RUN) {
        haltReason = 'run-limit';
        break;
      }
    }

    if (haltReason) {
      break;
    }
  }

  if (!haltReason && results.length >= MAX_SYNC_REPORTS_PER_RUN) {
    haltReason = 'run-limit';
  }

  return {
    attempted: results.length,
    authRequired,
    failed: results.filter((result) => result.status === 'failed').length,
    haltReason,
    results,
    source,
    synced: results.filter((result) => result.status === 'synced').length,
  };
}
