import { ApiHttpError } from '@/features/shared/api/apiClient';
import {
  isAutoRetryableSyncErrorCode,
  getSyncErrorMessage,
  SyncError,
  toSyncError,
} from '@/features/sync/errors/syncErrors';

describe('synchronization retry policy', () => {
  it.each([
    'NETWORK_UNAVAILABLE',
    'NETWORK_REQUEST_FAILED',
    'API_RATE_LIMITED',
    'OFFICE_NOT_READY',
    'UPLOAD_TOO_LARGE',
    'UPLOAD_TIMED_OUT',
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

  it('classifies in-memory errors and HTTP responses by retryability', () => {
    expect(new SyncError('SERVER_ERROR', 'temporary').retryable).toBe(true);
    expect(new SyncError('API_VALIDATION_FAILED', 'permanent').retryable).toBe(false);
    expect(toSyncError(new ApiHttpError(503, 'unavailable')).retryable).toBe(true);
    expect(toSyncError(new ApiHttpError(409, 'conflict'))).toMatchObject({
      code: 'API_VALIDATION_FAILED',
      retryable: false,
    });
    expect(toSyncError(new ApiHttpError(422, 'invalid')).retryable).toBe(false);
  });

  describe('413 and 408', () => {
    it('keeps a too-large upload saved and retryable with its own copy', () => {
      const error = toSyncError(new ApiHttpError(413, 'too large'));
      expect(error).toMatchObject({ code: 'UPLOAD_TOO_LARGE', retryable: true });
      expect(error.message).toBe(getSyncErrorMessage('UPLOAD_TOO_LARGE'));
      expect(error.message).not.toBe(getSyncErrorMessage('SERVER_ERROR'));
    });

    it('keeps a timed-out upload saved and retryable with its own copy', () => {
      const error = toSyncError(new ApiHttpError(408, 'timeout', { retryAfterMs: 20_000 }));
      expect(error).toMatchObject({ code: 'UPLOAD_TIMED_OUT', retryable: true, retryAfterMs: 20_000 });
      expect(error.message).toBe(getSyncErrorMessage('UPLOAD_TIMED_OUT'));
      expect(error.message).not.toBe(getSyncErrorMessage('SERVER_ERROR'));
    });
  });

  describe('404 by endpoint', () => {
    it.each(['report', 'boundary'] as const)('is a retryable office-not-ready on a %s upload', (endpoint) => {
      const error = toSyncError(new ApiHttpError(404, 'missing', { retryAfterMs: 90_000 }), { endpoint });
      expect(error).toMatchObject({ code: 'OFFICE_NOT_READY', retryable: true, retryAfterMs: 90_000 });
    });

    it('stays a cancelled visit when no upload endpoint is named', () => {
      expect(toSyncError(new ApiHttpError(404, 'gone'))).toMatchObject({ code: 'VISIT_CANCELLED', retryable: false });
    });

    it('treats a non-finite Retry-After as no hint', () => {
      expect(toSyncError(new ApiHttpError(503, 'down', { retryAfterMs: Number.POSITIVE_INFINITY })).retryAfterMs).toBeNull();
    });

    it('carries Retry-After on a 503', () => {
      expect(toSyncError(new ApiHttpError(503, 'down', { retryAfterMs: 30_000 })).retryAfterMs).toBe(30_000);
    });
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
