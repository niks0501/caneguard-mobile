import { ApiHttpError } from '@/features/shared/api/apiClient';
import {
  ACCESS_REFUSAL_SYNC_ERROR_CODES,
  getSyncErrorMessage,
  SYNC_ERROR_CODES,
  toSyncError,
} from '@/features/sync/errors/syncErrors';

describe('CAPABILITY_REVOKED (NET-3)', () => {
  // Intent: "map CAPABILITY_REVOKED to its own code": a 403 that names it is not the generic forbidden.
  it('maps a 403 naming CAPABILITY_REVOKED to its own code, in every body shape the web sends', () => {
    for (const body of [
      { code: 'CAPABILITY_REVOKED' },
      { reason_code: 'capability_revoked' },
      { data: { code: 'CAPABILITY_REVOKED' } },
    ]) {
      const error = toSyncError(new ApiHttpError(403, 'Forbidden', { body }));
      expect(error.code).toBe('CAPABILITY_REVOKED');
      expect(error.retryable).toBe(false);
      expect(error.message).toBe(getSyncErrorMessage('CAPABILITY_REVOKED'));
    }
  });

  // Intent: only the named code changes; any other 403 keeps its existing meaning.
  it('keeps every other 403 as API_FORBIDDEN', () => {
    for (const body of [undefined, {}, { code: 'FORBIDDEN' }, { message: 'CAPABILITY_REVOKED soon' }]) {
      expect(toSyncError(new ApiHttpError(403, 'Forbidden', { body })).code).toBe('API_FORBIDDEN');
    }
  });

  // Intent: the new code is its own list, so the codes every upload kind shares are unchanged.
  it('lives outside the shared upload codes', () => {
    expect(ACCESS_REFUSAL_SYNC_ERROR_CODES).toEqual(['CAPABILITY_REVOKED']);
    expect(SYNC_ERROR_CODES).not.toContain('CAPABILITY_REVOKED');
  });
});
