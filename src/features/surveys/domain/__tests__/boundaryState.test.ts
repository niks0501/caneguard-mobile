import {
  BOUNDARY_STATES,
  boundaryCanDelete,
  boundaryCanEdit,
  boundaryCanSubmit,
  boundaryCountsAsWaiting,
  boundaryRetriesItself,
  boundaryState,
} from '@/features/surveys/domain/boundaryState';
import { FIELD_SURVEY_STATUSES } from '@/database/schema';
import { SYNC_ERROR_CODES } from '@/features/sync/errors/syncErrors';

type Input = Parameters<typeof boundaryState>[0];
const row = (status: Input['status'], lastSyncErrorCode: string | null = null, remoteId: string | null = null): Input =>
  ({ status, lastSyncErrorCode, remoteId });

describe('boundaryState', () => {
  // Intent: every stored boundary maps to exactly one of the nine audit names.
  it('names each stored combination', () => {
    expect(boundaryState(row('draft'))).toBe('draft');
    expect(boundaryState(row('pending', 'STALE_SYNC_RECOVERED'))).toBe('waiting_to_send');
    expect(boundaryState(row('syncing'))).toBe('sending');
    expect(boundaryState(row('synced', null, 'remote-1'))).toBe('sent');
    expect(boundaryState(row('failed', 'NETWORK_REQUEST_FAILED'))).toBe('will_retry');
    expect(boundaryState(row('failed', 'API_RATE_LIMITED'))).toBe('will_retry');
    expect(boundaryState(row('failed', 'SERVER_ERROR'))).toBe('will_retry');
    expect(boundaryState(row('failed', 'API_VALIDATION_FAILED'))).toBe('needs_fix');
    expect(boundaryState(row('failed', 'CLIENT_UUID_CONFLICT'))).toBe('identity_rejected');
    expect(boundaryState(row('failed', 'INVALID_LOCAL_RECORD'))).toBe('damaged');
    expect(boundaryState(row('failed', 'API_FORBIDDEN'))).toBe('refused');
    expect(boundaryState(row('failed', null))).toBe('refused');
  });

  // Intent: nine fixed names; network, rate-limit and server failures retry, API validation needs a fix,
  // an identity conflict starts again, a damaged local record starts again, and everything else is refused.
  it('maps every status and every sync error code to its intended state', () => {
    const stateForStatus: Record<string, string> = {
      draft: 'draft',
      pending: 'waiting_to_send',
      syncing: 'sending',
      synced: 'sent',
    };
    for (const status of FIELD_SURVEY_STATUSES.filter((value) => value !== 'failed')) {
      expect(boundaryState(row(status))).toBe(stateForStatus[status]);
    }
    const stateForCode: Record<string, string> = {
      AUTH_REQUIRED: 'refused',
      NETWORK_UNAVAILABLE: 'will_retry',
      NETWORK_REQUEST_FAILED: 'will_retry',
      API_VALIDATION_FAILED: 'needs_fix',
      CLIENT_UUID_CONFLICT: 'identity_rejected',
      API_FORBIDDEN: 'refused',
      API_RATE_LIMITED: 'will_retry',
      IMAGE_MISSING: 'refused',
      INVALID_LOCAL_RECORD: 'damaged',
      SERVER_ERROR: 'will_retry',
      UNKNOWN_SYNC_ERROR: 'refused',
    };
    for (const code of SYNC_ERROR_CODES) {
      expect(boundaryState(row('failed', code))).toBe(stateForCode[code]);
    }
    for (const status of FIELD_SURVEY_STATUSES.filter((value) => value !== 'failed')) {
      for (const code of SYNC_ERROR_CODES) {
        expect(boundaryState(row(status, code))).toBe(stateForStatus[status]);
      }
    }
    expect(boundaryState(row('failed', 'UNHEARD_OF'))).toBe('refused');
    expect(boundaryState(row('failed', null))).toBe('refused');
    expect([...BOUNDARY_STATES]).toEqual([
      'draft',
      'waiting_to_send',
      'sending',
      'sent',
      'will_retry',
      'needs_fix',
      'identity_rejected',
      'damaged',
      'refused',
    ]);
  });

  // Intent: only drafts and server-rejected boundaries can be edited; only drafts can be deleted.
  it('derives what each state allows', () => {
    expect(BOUNDARY_STATES.filter(boundaryCanEdit)).toEqual(['draft', 'needs_fix']);
    expect(BOUNDARY_STATES.filter(boundaryRetriesItself)).toEqual(['waiting_to_send', 'will_retry']);
    expect(BOUNDARY_STATES.filter(boundaryCanSubmit)).toEqual(['draft', 'waiting_to_send', 'will_retry', 'needs_fix', 'refused']);
    expect(BOUNDARY_STATES.filter(boundaryCanDelete)).toEqual(['draft']);
    expect(BOUNDARY_STATES.filter(boundaryCountsAsWaiting)).toEqual(['waiting_to_send', 'sending', 'will_retry']);
  });
});
