import type { FieldSurveyRow } from '@/database/schema';
import { isAutoRetryableSyncErrorCode } from '@/features/sync/errors/syncErrors';

/**
 * The nine states a stored boundary can be in. They hide in `status` combined
 * with `lastSyncErrorCode` and `remoteId`; every consumer (screen, report
 * card, home count, sync query, My boundaries) reads them from here.
 */
export const BOUNDARY_STATES = [
  'draft',
  'waiting_to_send',
  'sending',
  'sent',
  'will_retry',
  'needs_fix',
  'identity_rejected',
  'damaged',
  'refused',
] as const;
export type BoundaryState = (typeof BOUNDARY_STATES)[number];

export type BoundaryStateInput = Pick<FieldSurveyRow, 'status' | 'lastSyncErrorCode' | 'remoteId'>;

/** Maps any stored row to exactly one state. */
export function boundaryState(row: BoundaryStateInput): BoundaryState {
  switch (row.status) {
    case 'draft':
      return 'draft';
    case 'pending':
      return 'waiting_to_send';
    case 'syncing':
      return 'sending';
    case 'synced':
      return 'sent';
    case 'failed':
      if (row.lastSyncErrorCode === 'API_VALIDATION_FAILED') return 'needs_fix';
      if (row.lastSyncErrorCode === 'CLIENT_UUID_CONFLICT') return 'identity_rejected';
      if (row.lastSyncErrorCode === 'INVALID_LOCAL_RECORD') return 'damaged';
      return isAutoRetryableSyncErrorCode(row.lastSyncErrorCode) ? 'will_retry' : 'refused';
  }
}

/** The boundary can still be drawn on. */
export function boundaryCanEdit(state: BoundaryState): boolean {
  return state === 'draft' || state === 'needs_fix';
}

/** The background sync picks it up without anyone pressing a button. */
export function boundaryRetriesItself(state: BoundaryState): boolean {
  return state === 'waiting_to_send' || state === 'will_retry';
}

/** "Save and sync" may be pressed (it re-sends the same payload when nothing changed). */
export function boundaryCanSubmit(state: BoundaryState): boolean {
  return state === 'draft' || state === 'needs_fix' || state === 'waiting_to_send' ||
    state === 'will_retry' || state === 'refused';
}

/** Only a draft is throwaway; queued work is owed to the office and never deleted here. */
export function boundaryCanDelete(state: BoundaryState): boolean {
  return state === 'draft';
}

/** Only unsent work the phone still owes the office counts as waiting to send. */
export function boundaryCountsAsWaiting(state: BoundaryState): boolean {
  return state === 'waiting_to_send' || state === 'sending' || state === 'will_retry';
}
