// Supplemental worker proposal: not promoted to an acceptance/proof test.
import { FetchError } from 'expo/src/winter/fetch/FetchErrors';

import { SyncError, toSyncError } from '@/features/sync/errors/syncErrors';

describe('Expo native fetch retry classification (proposal)', () => {
  it('keeps an unreachable office retryable when Expo wraps the native connection failure', () => {
    const failure = FetchError.createFromError(
      new Error('java.net.ConnectException: Failed to connect to the isolated API'),
    );
    expect(failure).not.toBeInstanceOf(TypeError);
    expect(toSyncError(failure)).toMatchObject({
      code: 'NETWORK_REQUEST_FAILED',
      retryable: true,
      detail: null,
    });
  });

  it('does not turn an arbitrary error with a fetch-like message into an automatic retry', () => {
    expect(toSyncError(new Error('fetch failed: unexpected application bug'))).toMatchObject({
      code: 'UNKNOWN_SYNC_ERROR',
      retryable: false,
    });
    const invalid = new SyncError('INVALID_LOCAL_RECORD', 'Invalid saved evidence');
    expect(toSyncError(invalid)).toBe(invalid);
    expect(invalid.retryable).toBe(false);
  });
});
