import type { CaneGuardDatabase } from '@/database/database';
import { createFieldReportSyncRepository } from '@/features/reports/data/fieldReportSyncRepository';
import {
  syncFieldReport,
  type SyncResult,
} from '@/features/sync/services/syncFieldReport';

export type SyncTriggerSource =
  | 'after-save'
  | 'startup'
  | 'resume'
  | 'network-restored'
  | 'manual';

export interface SyncBatchResult {
  attempted: number;
  authRequired: boolean;
  failed: number;
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
  limit = 10,
  source,
  submitterIdentity,
  token,
}: SyncPendingFieldReportsOptions): Promise<SyncBatchResult> {
  const repository = createFieldReportSyncRepository(
    database,
    submitterIdentity,
  );
  const candidates = await repository.findSyncCandidates(
    limit,
    source === 'manual',
  );
  const results: SyncResult[] = [];
  let authRequired = false;

  for (const candidate of candidates) {
    const result = await syncFieldReport({
      reportId: candidate.id,
      repository,
      token,
    });
    results.push(result);
    if (result.status === 'failed' && result.error.code === 'AUTH_REQUIRED') {
      authRequired = true;
      break;
    }
  }

  return {
    attempted: results.length,
    authRequired,
    failed: results.filter((result) => result.status === 'failed').length,
    results,
    source,
    synced: results.filter((result) => result.status === 'synced').length,
  };
}
