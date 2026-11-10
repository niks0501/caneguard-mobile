import {
  BOUNDARY_STATES,
  boundaryCanDelete,
  boundaryCanEdit,
  boundaryCanSubmit,
  boundaryCountsAsWaiting,
  boundaryRetriesItself,
  boundaryState,
  type BoundaryState,
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

  // Intent: no status/code combination falls outside the nine names.
  it('maps every status and every sync error code to a known state', () => {
    const known = new Set<BoundaryState>(BOUNDARY_STATES);
    for (const status of FIELD_SURVEY_STATUSES) {
      for (const code of [null, 'UNHEARD_OF', ...SYNC_ERROR_CODES]) {
        expect(known.has(boundaryState(row(status, code)))).toBe(true);
      }
    }
    expect(new Set(BOUNDARY_STATES).size).toBe(9);
  });

  // Intent: only drafts and server-rejected boundaries can be edited; sent work is never deleted or resubmitted.
  it('derives what each state allows', () => {
    expect(BOUNDARY_STATES.filter(boundaryCanEdit)).toEqual(['draft', 'needs_fix']);
    expect(BOUNDARY_STATES.filter(boundaryRetriesItself)).toEqual(['waiting_to_send', 'will_retry']);
    expect(BOUNDARY_STATES.filter(boundaryCanSubmit)).toEqual(['draft', 'waiting_to_send', 'will_retry', 'needs_fix', 'refused']);
    expect(BOUNDARY_STATES.filter((state) => !boundaryCanDelete(state))).toEqual(['sending', 'sent']);
    expect(BOUNDARY_STATES.filter(boundaryCountsAsWaiting)).toEqual(['waiting_to_send', 'sending', 'will_retry']);
  });
});
