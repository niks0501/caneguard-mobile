import { ApiHttpError } from '@/features/shared/api/apiClient';
import { toSyncError } from '@/features/sync/errors/syncErrors';
import { toPhoneCompletionState } from '@/features/assignments/domain/fieldValidationCompletionTypes';

const refused = (status: number, body: unknown) =>
  toSyncError(new ApiHttpError(status, 'refused', { body }));

describe('visit refusal end states (proposal tests)', () => {
  // Proves: each web reason code maps to its named end state, not API_VALIDATION_FAILED.
  it.each([
    ['ASSIGNMENT_REASSIGNED', 'VISIT_MOVED'],
    ['CASE_CLOSED', 'VISIT_CASE_CLOSED'],
    ['COMPLETED_ELSEWHERE', 'VISIT_DONE_BY_SOMEONE'],
    ['VISIT_REMOVED', 'VISIT_CANCELLED'],
  ])('maps %s to %s', (reason, code) => {
    const error = refused(409, { reason_code: reason });
    expect(error.code).toBe(code);
    expect(error.retryable).toBe(false);
  });

  // Proves: the removed-visit 404 becomes Visit cancelled, not UNKNOWN_SYNC_ERROR.
  it('maps a 404 to VISIT_CANCELLED', () => {
    expect(refused(404, null).code).toBe('VISIT_CANCELLED');
  });

  // Proves: with no reason code yet from the web, today's mapping is kept.
  it('falls back to the existing mapping when no code is sent', () => {
    expect(refused(409, { message: 'dup' }).code).toBe('API_VALIDATION_FAILED');
    expect(refused(409, { reason_code: 'SOMETHING_NEW' }).code).toBe('API_VALIDATION_FAILED');
    expect(refused(422, {}).code).toBe('API_VALIDATION_FAILED');
  });

  // Proves: a refused row keeps its evidence (stays failed, never synced) and shows its end state.
  it('keeps a refused completion as an end state, not delivered', () => {
    expect(toPhoneCompletionState({ syncStatus: 'failed', lastSyncErrorCode: 'VISIT_MOVED' })).toBe('moved');
    expect(toPhoneCompletionState({ syncStatus: 'failed', lastSyncErrorCode: 'VISIT_CASE_CLOSED' })).toBe('case-closed');
    expect(toPhoneCompletionState({ syncStatus: 'failed', lastSyncErrorCode: 'VISIT_DONE_BY_SOMEONE' })).toBe('done-by-someone');
    expect(toPhoneCompletionState({ syncStatus: 'failed', lastSyncErrorCode: 'VISIT_CANCELLED' })).toBe('visit-cancelled');
    expect(toPhoneCompletionState({ syncStatus: 'failed', lastSyncErrorCode: 'SERVER_ERROR' })).toBe('waiting');
  });
});
