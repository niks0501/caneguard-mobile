import {
  deriveOutboxState,
  staleSyncingCutoff,
  SYNC_TRANSITIONS,
  visibleSyncErrorCode,
} from '@/features/sync/domain/outboxState';
import { getOutboxStateSentence, OUTBOX_WAIT_COPY } from '@/features/sync/utils/syncStatusCopy';
import { getSyncAttention } from '@/features/sync/utils/syncAttention';

const NOW = Date.parse('2026-11-12T10:00:00.000Z');
const base = { isOnline: true, lastAttemptAt: null, lastSyncErrorCode: null, nowMs: NOW } as const;

describe('outbox state', () => {
  // Proves: "Collapse the three TRANSITIONS tables into one shared table".
  it('keeps one shared transition table', () => {
    expect(SYNC_TRANSITIONS).toEqual({
      pending: ['pending', 'failed'],
      syncing: ['pending', 'failed'],
      synced: ['syncing'],
      failed: ['pending', 'syncing', 'failed'],
    });
  });

  // Proves: "Named wait reasons" - each reason is derived and has one sentence.
  it.each([
    [{ isOnline: false }, 'offline'],
    [{ officeDown: true }, 'office-down'],
    [{ accountCheckPending: true }, 'account-check'],
    [{ boundaryUnsent: true }, 'boundary-first'],
    [
      { status: 'failed', lastSyncErrorCode: 'NETWORK_REQUEST_FAILED', lastAttemptAt: new Date(NOW - 10_000).toISOString() },
      'cool-down',
    ],
  ] as const)('names the wait reason for %j', (override, reason) => {
    const state = deriveOutboxState({ ...base, status: 'pending', ...override });
    expect(state).toEqual({ kind: 'waiting', reason });
    expect(getOutboxStateSentence(state)).toBe(OUTBOX_WAIT_COPY[reason]);
  });

  // Proves: "Queued -> ... Sent | Needs you(reason)".
  it('maps queued, sent and needs-you', () => {
    expect(deriveOutboxState({ ...base, status: 'pending' })).toEqual({ kind: 'queued' });
    expect(deriveOutboxState({ ...base, status: 'synced' })).toEqual({ kind: 'sent' });
    expect(deriveOutboxState({ ...base, status: 'failed', lastSyncErrorCode: 'API_VALIDATION_FAILED' }))
      .toEqual({ kind: 'needs-you', code: 'API_VALIDATION_FAILED' });
  });

  // Proves: "Sending(since)" and "Left sending ... 5-minute stale guard".
  it('separates a live send from a left sending row at five minutes', () => {
    const live = new Date(NOW - 4 * 60_000).toISOString();
    const stale = new Date(NOW - 5 * 60_000).toISOString();
    expect(deriveOutboxState({ ...base, status: 'syncing', lastAttemptAt: live })).toEqual({ kind: 'sending', since: live });
    expect(deriveOutboxState({ ...base, status: 'syncing', lastAttemptAt: stale })).toEqual({ kind: 'left-sending' });
    expect(staleSyncingCutoff(NOW)).toBe(stale);
  });

  // Proves: "never surface STALE_SYNC_RECOVERED on a pending row".
  it('hides the recovery bookkeeping code', () => {
    expect(visibleSyncErrorCode('STALE_SYNC_RECOVERED')).toBeNull();
    expect(getSyncAttention('STALE_SYNC_RECOVERED')).toBeNull();
    expect(visibleSyncErrorCode('SERVER_ERROR')).toBe('SERVER_ERROR');
  });
});
