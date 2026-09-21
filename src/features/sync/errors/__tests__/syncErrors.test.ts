import { ApiHttpError } from '@/features/shared/api/apiClient';
import {
  AUTO_RETRYABLE_SYNC_ERROR_CODES,
  isAutoRetryableSyncErrorCode,
  SyncError,
  toSyncError,
} from '@/features/sync/errors/syncErrors';

describe('synchronization retry policy', () => {
  it.each([
    'NETWORK_UNAVAILABLE',
    'NETWORK_REQUEST_FAILED',
    'API_RATE_LIMITED',
    'SERVER_ERROR',
  ])('classifies %s as automatically retryable', (code) => {
    expect(isAutoRetryableSyncErrorCode(code)).toBe(true);
  });

  it.each([
    'AUTH_REQUIRED',
    'API_VALIDATION_FAILED',
    'API_FORBIDDEN',
    'IMAGE_MISSING',
    'INVALID_LOCAL_RECORD',
    'UNKNOWN_SYNC_ERROR',
    'not-a-real-code',
    null,
    undefined,
  ])('does not automatically retry %s', (code) => {
    expect(isAutoRetryableSyncErrorCode(code)).toBe(false);
  });

  it('uses the persisted code policy for in-memory errors and HTTP mapping', () => {
    expect(AUTO_RETRYABLE_SYNC_ERROR_CODES).toEqual([
      'NETWORK_UNAVAILABLE',
      'NETWORK_REQUEST_FAILED',
      'API_RATE_LIMITED',
      'SERVER_ERROR',
    ]);
    expect(new SyncError('SERVER_ERROR', 'temporary').retryable).toBe(true);
    expect(new SyncError('API_VALIDATION_FAILED', 'permanent').retryable).toBe(false);
    expect(toSyncError(new ApiHttpError(503, 'unavailable')).retryable).toBe(true);
    expect(toSyncError(new ApiHttpError(409, 'conflict'))).toMatchObject({
      code: 'API_VALIDATION_FAILED',
      retryable: false,
    });
    expect(toSyncError(new ApiHttpError(422, 'invalid')).retryable).toBe(false);
  });
});
