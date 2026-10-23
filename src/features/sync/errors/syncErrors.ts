import { ApiHttpError } from '@/features/shared/api/apiClient';

export const SYNC_ERROR_CODES = [
  'AUTH_REQUIRED',
  'NETWORK_UNAVAILABLE',
  'NETWORK_REQUEST_FAILED',
  'API_VALIDATION_FAILED',
  'CLIENT_UUID_CONFLICT',
  'API_FORBIDDEN',
  'API_RATE_LIMITED',
  'IMAGE_MISSING',
  'INVALID_LOCAL_RECORD',
  'SERVER_ERROR',
  'UNKNOWN_SYNC_ERROR',
] as const;

export type SyncErrorCode = (typeof SYNC_ERROR_CODES)[number];

export const AUTO_RETRYABLE_SYNC_ERROR_CODES = [
  'NETWORK_UNAVAILABLE',
  'NETWORK_REQUEST_FAILED',
  'API_RATE_LIMITED',
  'SERVER_ERROR',
] as const satisfies readonly SyncErrorCode[];

export function isAutoRetryableSyncErrorCode(
  code: string | null | undefined,
): boolean {
  return (
    typeof code === 'string' &&
    (AUTO_RETRYABLE_SYNC_ERROR_CODES as readonly string[]).includes(code)
  );
}

export class SyncError extends Error {
  readonly code: SyncErrorCode;
  readonly retryAfterMs: number | null;
  readonly retryable: boolean;
  /**
   * A bounded, non-sensitive extraction of the server's validation detail.
   * Never a raw response body, and never persisted with report evidence.
   */
  readonly detail: string | null;

  constructor(
    code: SyncErrorCode,
    message: string,
    options: {
      detail?: string | null;
      retryable?: boolean;
      retryAfterMs?: number | null;
    } = {},
  ) {
    super(message);
    this.name = 'SyncError';
    this.code = code;
    this.retryable = options.retryable ?? isAutoRetryableSyncErrorCode(code);
    this.retryAfterMs = options.retryAfterMs ?? null;
    this.detail = options.detail ?? null;
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
    if (error.status === 409) {
      return new SyncError(
        'API_VALIDATION_FAILED',
        'The server reported a conflicting upload identity. Review its saved details before retrying.',
        { detail: extractValidationDetail(error.body) },
      );
    }
    if (error.status === 400 || error.status === 422) {
      return new SyncError(
        'API_VALIDATION_FAILED',
        'The server rejected this report. Review its saved details before retrying.',
        { detail: extractValidationDetail(error.body) },
      );
    }
    if (error.status === 429) {
      return new SyncError(
        'API_RATE_LIMITED',
        'The server asked CaneGuard to wait before uploading again.',
        { retryAfterMs: error.retryAfterMs },
      );
    }
    if (error.status >= 500) {
      return new SyncError(
        'SERVER_ERROR',
        'The server could not accept the report yet.'
      );
    }
  }

  if (error instanceof TypeError || isAbortError(error)) {
    return new SyncError(
      'NETWORK_REQUEST_FAILED',
      'The upload connection failed.'
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
      return 'Sign in again to send this report.';
    case 'NETWORK_UNAVAILABLE':
    case 'NETWORK_REQUEST_FAILED':
      return 'The connection was unavailable. Retry when online.';
    case 'API_VALIDATION_FAILED':
      return 'The server rejected saved report data.';
    case 'CLIENT_UUID_CONFLICT':
      return 'Start a new boundary before sending again.';
    case 'API_FORBIDDEN':
      return 'This account cannot submit field reports.';
    case 'API_RATE_LIMITED':
      return 'The server requested a short wait before retrying.';
    case 'IMAGE_MISSING':
      return 'The saved image is missing from this device.';
    case 'INVALID_LOCAL_RECORD':
      return 'This saved record is incomplete and cannot be sent.';
    case 'SERVER_ERROR':
      return 'The office was unavailable. Try again later.';
    case 'UNKNOWN_SYNC_ERROR':
      return 'Could not send the report.';
    default:
      return null;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

const MAX_VALIDATION_DETAIL_LENGTH = 300;
const MAX_VALIDATION_FIELDS = 4;

/**
 * Extracts bounded field names and their first message from a Laravel-style
 * validation body. Unknown shapes, raw objects and personal field values are
 * never copied into the message.
 */
function extractValidationDetail(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const record = body as Record<string, unknown>;
  const errors = record.errors;
  if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
    const parts: string[] = [];
    for (const [field, value] of Object.entries(errors as Record<string, unknown>)) {
      if (parts.length >= MAX_VALIDATION_FIELDS) {
        break;
      }
      const first = Array.isArray(value)
        ? value.find((entry): entry is string => typeof entry === 'string')
        : typeof value === 'string'
          ? value
          : null;
      if (
        typeof field !== 'string' ||
        field.length === 0 ||
        field.length > 60 ||
        !first
      ) {
        continue;
      }
      parts.push(`${field}: ${first.trim().slice(0, 80)}`);
    }
    return parts.length > 0
      ? parts.join('; ').slice(0, MAX_VALIDATION_DETAIL_LENGTH)
      : null;
  }
  const message = record.message;
  return typeof message === 'string' && message.trim()
    ? message.trim().slice(0, MAX_VALIDATION_DETAIL_LENGTH)
    : null;
}
