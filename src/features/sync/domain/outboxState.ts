import { isAutoRetryableSyncErrorCode } from '@/features/sync/errors/syncErrors';

/**
 * The one outbox state every saved item (field report, boundary, visit)
 * follows: Queued -> Waiting(reason) -> Sending(since) -> Sent | Needs you(reason),
 * plus Left sending, which is recovered at the start of every send run.
 */
export type OutboxStatus = 'pending' | 'syncing' | 'synced' | 'failed';

/** Statuses each guarded sync write may start from; a row in any other status is left untouched. */
export const SYNC_TRANSITIONS = {
  pending: ['pending', 'failed'],
  syncing: ['pending', 'failed'],
  synced: ['syncing'],
  failed: ['pending', 'syncing', 'failed'],
} as const satisfies Record<OutboxStatus, readonly OutboxStatus[]>;

export const SYNC_RETRY_COOLDOWN_MS = 60_000;
/** A row that has said "sending" for longer than this was left behind by a closed app. */
export const STALE_SYNCING_MS = 5 * 60_000;

export function staleSyncingCutoff(nowMs: number = Date.now()): string {
  return new Date(nowMs - STALE_SYNCING_MS).toISOString();
}

/** Written when a Left sending row is recovered; bookkeeping only, never a thing to tell the inspector. */
export const STALE_SYNC_RECOVERED_CODE = 'STALE_SYNC_RECOVERED';

/** The error code a row may show: recovery bookkeeping is hidden. */
export function visibleSyncErrorCode(code: string | null | undefined): string | null {
  return code && code !== STALE_SYNC_RECOVERED_CODE ? code : null;
}

export const OUTBOX_WAIT_REASONS = [
  'offline',
  'office-down',
  'cool-down',
  'account-check',
  'boundary-first',
] as const;

export type OutboxWaitReason = (typeof OUTBOX_WAIT_REASONS)[number];

export type OutboxState =
  | { kind: 'queued' }
  | { kind: 'waiting'; reason: OutboxWaitReason }
  | { kind: 'sending'; since: string | null }
  | { kind: 'left-sending' }
  | { kind: 'sent' }
  | { kind: 'needs-you'; code: string | null };

export interface OutboxStateInput {
  /** The account district is still unknown, so boundaries cannot be sent yet. */
  accountCheckPending?: boolean;
  /** A report is held until its boundary has uploaded. */
  boundaryUnsent?: boolean;
  isOnline: boolean | null;
  lastAttemptAt: string | null;
  lastSyncErrorCode: string | null;
  nowMs?: number;
  officeDown?: boolean;
  status: OutboxStatus;
}

/** Pure: names why a saved item is not sent yet, from facts the phone already has. */
export function deriveOutboxState(input: OutboxStateInput): OutboxState {
  const nowMs = input.nowMs ?? Date.now();
  if (input.status === 'synced') return { kind: 'sent' };
  if (input.status === 'syncing') {
    const since = input.lastAttemptAt;
    const sinceMs = since ? Date.parse(since) : Number.NaN;
    return Number.isNaN(sinceMs) || nowMs - sinceMs >= STALE_SYNCING_MS
      ? { kind: 'left-sending' }
      : { kind: 'sending', since };
  }
  const code = input.lastSyncErrorCode;
  if (input.status === 'failed' && !isAutoRetryableSyncErrorCode(code)) {
    return { kind: 'needs-you', code };
  }
  if (input.isOnline === false) return { kind: 'waiting', reason: 'offline' };
  if (input.officeDown) return { kind: 'waiting', reason: 'office-down' };
  if (input.accountCheckPending) return { kind: 'waiting', reason: 'account-check' };
  if (input.boundaryUnsent) return { kind: 'waiting', reason: 'boundary-first' };
  if (input.status === 'failed') {
    const attemptMs = input.lastAttemptAt ? Date.parse(input.lastAttemptAt) : Number.NaN;
    if (!Number.isNaN(attemptMs) && nowMs - attemptMs < SYNC_RETRY_COOLDOWN_MS) {
      return { kind: 'waiting', reason: 'cool-down' };
    }
  }
  return { kind: 'queued' };
}
