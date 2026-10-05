import type { CaneGuardDatabase } from '@/database/database';
import { SYNC_RETRY_COOLDOWN_MS } from '@/features/reports/data/fieldReportSyncRepository';
import { isAutoRetryableSyncErrorCode } from '@/features/sync/errors/syncErrors';
import type { SyncBatchResult, SyncHaltReason, SyncTriggerSource } from '@/features/sync/services/syncPendingFieldReports';
import { DEFAULT_SYNC_BATCH_SIZE, MAX_SYNC_REPORTS_PER_RUN } from '@/features/sync/services/syncPendingFieldReports';
import { findFieldSurveySyncCandidates } from '@/features/surveys/data/fieldSurveySyncRepository';
import { syncFieldSurvey } from '@/features/surveys/services/syncFieldSurvey';
import type { SyncResult } from '@/features/sync/services/syncFieldReport';

interface Options {
  database: CaneGuardDatabase;
  limit?: number;
  ownerIdentity: string;
  source: SyncTriggerSource;
  token: string | null;
}

interface RunState {
  runs: Map<string, { promise: Promise<SyncBatchResult>; token: string | null }>;
  tail: Promise<void>;
}

const activeRuns = new WeakMap<CaneGuardDatabase, RunState>();

export function syncPendingFieldSurveys(options: Options): Promise<SyncBatchResult> {
  const ownerIdentity = options.ownerIdentity.trim();
  let state = activeRuns.get(options.database);
  if (!state) {
    state = { runs: new Map(), tail: Promise.resolve() };
    activeRuns.set(options.database, state);
  }
  const active = state.runs.get(ownerIdentity);
  if (active?.token === options.token) return active.promise;
  const execution = state.tail.catch(() => undefined).then(() => executeBatch({ ...options, ownerIdentity }));
  const run = execution.finally(() => {
    if (state?.runs.get(ownerIdentity)?.promise === run) state.runs.delete(ownerIdentity);
  });
  state.runs.set(ownerIdentity, { promise: run, token: options.token });
  state.tail = run.then(() => undefined, () => undefined);
  return run;
}

async function executeBatch(options: Options & { ownerIdentity: string }): Promise<SyncBatchResult> {
  const batchSize = Math.min(Math.max(Math.trunc(options.limit ?? DEFAULT_SYNC_BATCH_SIZE), 1), MAX_SYNC_REPORTS_PER_RUN);
  const results: SyncResult[] = [];
  let haltReason: SyncHaltReason = null;
  let authRequired = false;
  while (results.length < MAX_SYNC_REPORTS_PER_RUN) {
    const remaining = MAX_SYNC_REPORTS_PER_RUN - results.length;
    const candidates = findFieldSurveySyncCandidates(options.database, options.ownerIdentity, Math.min(batchSize, remaining), {
      failedBefore: new Date(Date.now() - SYNC_RETRY_COOLDOWN_MS).toISOString(),
      includeRetryableFailed: true,
    });
    if (!candidates.length) { haltReason = 'empty'; break; }
    for (const { clientUuid } of candidates) {
      const result = await syncFieldSurvey({
        allowImmediateRetries: options.source === 'manual',
        clientUuid, database: options.database, ownerIdentity: options.ownerIdentity, token: options.token,
      });
      if (result.status !== 'failed') {
        results.push({ reportId: clientUuid, status: result.status, remoteId: result.remoteId });
      } else {
        results.push({ reportId: clientUuid, status: 'failed', error: result.error });
        if (result.error.code === 'AUTH_REQUIRED') {
          authRequired = true;
          haltReason = 'auth-required';
          break;
        }
        if (isAutoRetryableSyncErrorCode(result.error.code)) {
          haltReason = 'transient-blocker';
          break;
        }
      }
      if (results.length >= MAX_SYNC_REPORTS_PER_RUN) { haltReason = 'run-limit'; break; }
    }
    if (haltReason) break;
  }
  if (!haltReason && results.length >= MAX_SYNC_REPORTS_PER_RUN) haltReason = 'run-limit';
  return {
    attempted: results.length, authRequired,
    failed: results.filter((result) => result.status === 'failed').length,
    haltReason, results, source: options.source,
    synced: results.filter((result) => result.status === 'synced').length,
  };
}
