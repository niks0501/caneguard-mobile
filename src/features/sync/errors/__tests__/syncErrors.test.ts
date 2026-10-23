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

  describe('bounded validation detail (M13)', () => {
    it('keeps a short field-level reason from a 422 response', () => {
      const error = toSyncError(
        new ApiHttpError(422, 'invalid', {
          body: {
            errors: {
              affected_area_hectares: ['The affected area must be a number.'],
              barangay: ['The barangay field is required.'],
            },
            farmer: 'Sensitive farmer text must not leak',
          },
        }),
      );
      expect(error.code).toBe('API_VALIDATION_FAILED');
      expect(error.detail).toContain('affected_area_hectares:');
      expect(error.detail).toContain('The affected area must be a number.');
      expect(error.detail).not.toContain('Sensitive farmer text');
      expect((error.detail ?? '').length).toBeLessThanOrEqual(300);
    });

    it('never copies a raw body or unbounded values', () => {
      const longMessage = 'x'.repeat(2_000);
      const error = toSyncError(
        new ApiHttpError(422, 'invalid', {
          body: { message: longMessage, token: 'secret-token' },
        }),
      );
      expect(error.detail?.length).toBeLessThanOrEqual(300);
      expect(error.detail).not.toContain('secret-token');
    });

    it('has no detail for a network failure', () => {
      const error = toSyncError(new TypeError('network down'));
      expect(error.detail).toBeNull();
    });
  });
});
