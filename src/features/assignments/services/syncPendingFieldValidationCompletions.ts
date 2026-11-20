import type { CaneGuardDatabase } from '@/database/database';
import {
  countCoolingRetryableFieldValidationCompletions,
  createFieldValidationCompletionSyncRepository,
  FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS,
} from '@/features/assignments/data/fieldValidationCompletionRepository';
import {
  syncFieldValidationCompletion,
  type FieldValidationCompletionSyncResult,
} from '@/features/assignments/services/syncFieldValidationCompletion';
import { staleSyncingCutoff } from '@/features/sync/domain/outboxState';
import { isAutoRetryableSyncErrorCode } from '@/features/sync/errors/syncErrors';
import type { SyncBatchResult, SyncHaltReason, SyncTriggerSource } from '@/features/sync/services/syncPendingFieldReports';

export { FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS };

export interface FieldValidationCompletionSyncBatchResult extends Omit<SyncBatchResult, 'results'> {
  results: FieldValidationCompletionSyncResult[];
}

interface ActiveRun {
  promise: Promise<FieldValidationCompletionSyncBatchResult>;
  token: string | null;
}

interface DatabaseRunState {
  runs: Map<string, ActiveRun>;
  tail: Promise<void>;
}

const activeRuns = new WeakMap<CaneGuardDatabase, DatabaseRunState>();

export function syncPendingFieldValidationCompletions(options: {
  database: CaneGuardDatabase;
  isSendHeld?: () => boolean;
  limit?: number;
  source: SyncTriggerSource;
  ownerIdentity: string;
  token: string | null;
}): Promise<FieldValidationCompletionSyncBatchResult> {
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
    if (state?.runs.get(ownerIdentity)?.promise === promise) state.runs.delete(ownerIdentity);
  });
  state.runs.set(ownerIdentity, { promise, token: options.token });
  state.tail = promise.then(() => undefined, () => undefined);
  return promise;
}

async function executeBatch(options: {
  database: CaneGuardDatabase;
  isSendHeld?: () => boolean;
  limit?: number;
  source: SyncTriggerSource;
  ownerIdentity: string;
  token: string | null;
}): Promise<FieldValidationCompletionSyncBatchResult> {
  const repository = createFieldValidationCompletionSyncRepository(options.database, options.ownerIdentity);
  const batchSize = Math.min(Math.max(Math.trunc(options.limit ?? 10), 1), 50);
  const results: FieldValidationCompletionSyncResult[] = [];
  await repository.resetStaleSyncing(staleSyncingCutoff());
  let authRequired = false;
  let haltReason: SyncHaltReason = null;

  while (results.length < 50) {
    const failedBefore = new Date(Date.now() - FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS).toISOString();
    const candidates = await repository.findSyncCandidates(
      Math.min(batchSize, 50 - results.length),
      {
        failedBefore,
        includeRetryableFailed: true,
      },
    );
    if (candidates.length === 0) {
      // A visit still cooling down is not "empty": keep a retry scheduled so it resumes.
      haltReason = (await countCoolingRetryableFieldValidationCompletions(options.database, options.ownerIdentity, failedBefore)) > 0
        ? 'transient-blocker'
        : 'empty';
      break;
    }

    for (const candidate of candidates) {
      if (options.isSendHeld?.()) {
        haltReason = 'transient-blocker';
        break;
      }
      const result = await syncFieldValidationCompletion({
        allowImmediateRetries: options.source === 'manual',
        completionId: candidate.id,
        repository,
        token: options.token,
      });
      results.push(result);
      if (result.status !== 'failed') continue;
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
