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
  token: string | null;
}

let activeRun: Promise<SyncBatchResult> | null = null;

export function syncPendingFieldReports(
  options: SyncPendingFieldReportsOptions,
): Promise<SyncBatchResult> {
  if (activeRun) {
    return activeRun;
  }
  const run = executeBatch(options).finally(() => {
    if (activeRun === run) {
      activeRun = null;
    }
  });
  activeRun = run;
  return run;
}

async function executeBatch({
  database,
  limit = 10,
  source,
  token,
}: SyncPendingFieldReportsOptions): Promise<SyncBatchResult> {
  const repository = createFieldReportSyncRepository(database);
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
