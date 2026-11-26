import type { CaneGuardDatabase } from '@/database/database';
import {
  AERIAL_UPLOAD_RETRY_COOLDOWN_MS,
  createAerialAnalysisSyncRepository,
  hasCoolingRetryableAerialAnalysis,
} from '@/features/assignments/data/aerialAnalysisOutboxRepository';
import { updateCachedAssignmentAerialCheck } from '@/features/assignments/data/assignmentCacheRepository';
import {
  syncAerialAnalysis,
  type AerialAnalysisSyncResult,
} from '@/features/assignments/services/syncAerialAnalysis';
import { staleSyncingCutoff } from '@/features/sync/domain/outboxState';
import { isAutoRetryableSyncErrorCode } from '@/features/sync/errors/syncErrors';
import type {
  SyncBatchResult,
  SyncHaltReason,
  SyncTriggerSource,
} from '@/features/sync/services/syncPendingFieldReports';

export { AERIAL_UPLOAD_RETRY_COOLDOWN_MS };

export interface AerialAnalysisSyncBatchResult extends Omit<SyncBatchResult, 'results'> {
  results: AerialAnalysisSyncResult[];
}

interface ActiveRun {
  promise: Promise<AerialAnalysisSyncBatchResult>;
  token: string | null;
}

interface DatabaseRunState {
  runs: Map<string, ActiveRun>;
  tail: Promise<void>;
}

const activeRuns = new WeakMap<CaneGuardDatabase, DatabaseRunState>();

export function syncPendingAerialAnalyses(options: {
  database: CaneGuardDatabase;
  isSendHeld?: () => boolean;
  limit?: number;
  onOutcome?: (result: AerialAnalysisSyncResult) => void;
  source: SyncTriggerSource;
  ownerIdentity: string;
  token: string | null;
}): Promise<AerialAnalysisSyncBatchResult> {
  const ownerIdentity = options.ownerIdentity.trim();
  let state = activeRuns.get(options.database);
  if (!state) {
    state = { runs: new Map(), tail: Promise.resolve() };
    activeRuns.set(options.database, state);
  }
  const active = state.runs.get(ownerIdentity);
  if (active?.token === options.token) return active.promise;

  const execution = state.tail
    .catch(() => undefined)
    .then(() => executeBatch({ ...options, ownerIdentity }));
  const promise = execution.finally(() => {
    if (state?.runs.get(ownerIdentity)?.promise === promise) {
      state.runs.delete(ownerIdentity);
    }
  });
  state.runs.set(ownerIdentity, { promise, token: options.token });
  state.tail = promise.then(() => undefined, () => undefined);
  return promise;
}

async function executeBatch(options: {
  database: CaneGuardDatabase;
  isSendHeld?: () => boolean;
  limit?: number;
  onOutcome?: (result: AerialAnalysisSyncResult) => void;
  source: SyncTriggerSource;
  ownerIdentity: string;
  token: string | null;
}): Promise<AerialAnalysisSyncBatchResult> {
  const repository = createAerialAnalysisSyncRepository(
    options.database,
    options.ownerIdentity,
  );
  const batchSize = Math.min(Math.max(Math.trunc(options.limit ?? 10), 1), 50);
  const results: AerialAnalysisSyncResult[] = [];
  await repository.resetStaleSyncing(staleSyncingCutoff());
  let authRequired = false;
  let haltReason: SyncHaltReason = null;

  while (results.length < 50) {
    const failedBefore = new Date(
      Date.now() - AERIAL_UPLOAD_RETRY_COOLDOWN_MS,
    ).toISOString();
    const candidates = await repository.findSyncCandidates(
      Math.min(batchSize, 50 - results.length),
      {
        failedBefore,
        includeRetryableFailed: true,
      },
    );
    if (candidates.length === 0) {
      haltReason = (await hasCoolingRetryableAerialAnalysis(
        options.database,
        options.ownerIdentity,
        failedBefore,
      ))
        ? 'transient-blocker'
        : 'empty';
      break;
    }

    for (const candidate of candidates) {
      if (options.isSendHeld?.()) {
        haltReason = 'transient-blocker';
        break;
      }
      const result = await syncAerialAnalysis({
        allowImmediateRetries: options.source === 'manual',
        isSendHeld: options.isSendHeld,
        onAerialCheckUpdated: (assignmentId, aerialCheck) =>
          updateCachedAssignmentAerialCheck(
            options.database,
            options.ownerIdentity,
            assignmentId,
            aerialCheck,
          ),
        onOutcome: options.onOutcome,
        repository,
        token: options.token,
        uploadId: candidate.id,
      });
      results.push(result);
      if (result.status !== 'failed') continue;
      if (result.error.code === 'AUTH_REQUIRED') {
        authRequired = true;
        haltReason = 'auth-required';
        break;
      }
      if (
        result.error.code !== 'UPLOAD_TOO_LARGE' &&
        isAutoRetryableSyncErrorCode(result.error.code)
      ) {
        haltReason = 'transient-blocker';
        break;
      }
    }
    if (haltReason) break;
  }

  if (!haltReason && results.length >= 50) haltReason = 'run-limit';
  return {
    attempted: results.length,
    authRequired,
    failed: results.filter((result) => result.status === 'failed').length,
    haltReason,
    results,
    source: options.source,
    synced: results.filter((result) => result.status === 'synced').length,
  };
}
