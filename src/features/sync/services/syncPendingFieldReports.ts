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

const activeRuns = new WeakMap<
  CaneGuardDatabase,
  Map<
    string,
    { promise: Promise<SyncBatchResult>; token: string | null }
  >
>();

export function syncPendingFieldReports(
  options: SyncPendingFieldReportsOptions,
): Promise<SyncBatchResult> {
  const submitterIdentity = options.submitterIdentity.trim();
  let databaseRuns = activeRuns.get(options.database);
  if (!databaseRuns) {
    databaseRuns = new Map();
    activeRuns.set(options.database, databaseRuns);
  }
  const activeRun = databaseRuns.get(submitterIdentity);
  if (activeRun?.token === options.token) {
    return activeRun.promise;
  }

  const execution = activeRun
    ? activeRun.promise
        .catch(() => undefined)
        .then(() => executeBatch({ ...options, submitterIdentity }))
    : executeBatch({ ...options, submitterIdentity });
  const run = execution.finally(() => {
    if (databaseRuns?.get(submitterIdentity)?.promise === run) {
      databaseRuns.delete(submitterIdentity);
      if (databaseRuns.size === 0) {
        activeRuns.delete(options.database);
      }
    }
  });
  databaseRuns.set(submitterIdentity, { promise: run, token: options.token });
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
