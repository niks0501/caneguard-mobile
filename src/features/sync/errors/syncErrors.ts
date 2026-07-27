import { ApiHttpError } from '@/features/shared/api/apiClient';

export const SYNC_ERROR_CODES = [
  'AUTH_REQUIRED',
  'NETWORK_UNAVAILABLE',
  'NETWORK_REQUEST_FAILED',
  'API_VALIDATION_FAILED',
  'API_FORBIDDEN',
  'API_RATE_LIMITED',
  'IMAGE_MISSING',
  'INVALID_LOCAL_RECORD',
  'SERVER_ERROR',
  'UNKNOWN_SYNC_ERROR',
] as const;

export type SyncErrorCode = (typeof SYNC_ERROR_CODES)[number];

export class SyncError extends Error {
  readonly code: SyncErrorCode;
  readonly retryAfterMs: number | null;
  readonly retryable: boolean;

  constructor(
    code: SyncErrorCode,
    message: string,
    options: { retryable?: boolean; retryAfterMs?: number | null } = {},
  ) {
    super(message);
    this.name = 'SyncError';
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.retryAfterMs = options.retryAfterMs ?? null;
  }
}

export function toSyncError(error: unknown): SyncError {
  if (error instanceof SyncError) {
    return error;
  }

  if (error instanceof ApiHttpError) {
    if (error.status === 401) {
      return new SyncError(
        'AUTH_REQUIRED',
        'Sign in again to upload pending reports.',
      );
    }
    if (error.status === 403) {
      return new SyncError(
        'API_FORBIDDEN',
        'This account is not allowed to submit field reports.',
      );
    }
    if (error.status === 400 || error.status === 422) {
      return new SyncError(
        'API_VALIDATION_FAILED',
        'The server rejected this report. Review its saved details before retrying.',
      );
    }
    if (error.status === 429) {
      return new SyncError(
        'API_RATE_LIMITED',
        'The server asked CaneGuard to wait before uploading again.',
        { retryAfterMs: error.retryAfterMs, retryable: true },
      );
    }
    if (error.status >= 500) {
      return new SyncError(
        'SERVER_ERROR',
        'The server could not accept the report yet.',
        { retryable: true },
      );
    }
  }

  if (error instanceof TypeError || isAbortError(error)) {
    return new SyncError(
      'NETWORK_REQUEST_FAILED',
      'The upload connection failed.',
      { retryable: true },
    );
  }

  return new SyncError(
    'UNKNOWN_SYNC_ERROR',
    'CaneGuard could not upload this report.',
  );
}

export function getSyncErrorMessage(code: string | null): string | null {
  switch (code) {
    case 'AUTH_REQUIRED':
      return 'Sign in again to retry this upload.';
    case 'NETWORK_UNAVAILABLE':
    case 'NETWORK_REQUEST_FAILED':
      return 'The connection was unavailable. Retry when online.';
    case 'API_VALIDATION_FAILED':
      return 'The server rejected saved report data.';
    case 'API_FORBIDDEN':
      return 'This account cannot submit field reports.';
    case 'API_RATE_LIMITED':
      return 'The server requested a short wait before retrying.';
    case 'IMAGE_MISSING':
      return 'The saved image is missing from this device.';
    case 'INVALID_LOCAL_RECORD':
      return 'This saved record is incomplete and cannot be uploaded.';
    case 'SERVER_ERROR':
      return 'The server was unavailable during the last upload.';
    case 'UNKNOWN_SYNC_ERROR':
      return 'The last upload did not finish.';
    default:
      return null;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
