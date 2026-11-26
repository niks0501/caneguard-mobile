// Expo's global fetch wraps native transport failures in this class, but
// expo/fetch does not re-export it. Use identity, not names or message matching.
import { FetchError } from 'expo/src/winter/fetch/FetchErrors';

import {
  ApiHttpError,
  ApiTransportError,
} from '@/features/shared/api/apiClient';

export const SYNC_ERROR_CODES = [
  'AUTH_REQUIRED',
  'NETWORK_UNAVAILABLE',
  'NETWORK_REQUEST_FAILED',
  'API_VALIDATION_FAILED',
  'CLIENT_UUID_CONFLICT',
  'API_FORBIDDEN',
  'API_RATE_LIMITED',
  'OFFICE_NOT_READY',
  'UPLOAD_TOO_LARGE',
  'UPLOAD_TIMED_OUT',
  'IMAGE_MISSING',
  'INVALID_LOCAL_RECORD',
  'SERVER_ERROR',
  'UNKNOWN_SYNC_ERROR',
] as const;

/**
 * Visit refusals: each is a named end state, never retried automatically.
 * Kept apart from SYNC_ERROR_CODES, which lists the codes every upload kind shares.
 */
export const VISIT_REFUSAL_SYNC_ERROR_CODES = [
  'VISIT_MOVED',
  'VISIT_CASE_CLOSED',
  'VISIT_DONE_BY_SOMEONE',
  'VISIT_CANCELLED',
] as const;

/**
 * A 403 whose body names CAPABILITY_REVOKED: the office took access away while
 * the token survives. Its own code, kept apart like the visit refusals, so it is
 * never read as the generic API_FORBIDDEN.
 */
export const ACCESS_REFUSAL_SYNC_ERROR_CODES = ['CAPABILITY_REVOKED'] as const;

/**
 * Aerial refusals: the office turned aerial canopy check off. Saved drone
 * photos remain on this device; automatic background retries stop until the
 * user chooses to retry or remove the queued upload.
 */
export const AERIAL_REFUSAL_SYNC_ERROR_CODES = ['AERIAL_DISABLED'] as const;

export type SyncErrorCode =
  | (typeof SYNC_ERROR_CODES)[number]
  | (typeof VISIT_REFUSAL_SYNC_ERROR_CODES)[number]
  | (typeof ACCESS_REFUSAL_SYNC_ERROR_CODES)[number]
  | (typeof AERIAL_REFUSAL_SYNC_ERROR_CODES)[number];

/** Web reason code on a refused visit completion -> the phone's end state. */
const VISIT_REFUSAL_REASON_CODES: Record<string, SyncErrorCode> = {
  ASSIGNMENT_REASSIGNED: 'VISIT_MOVED',
  CASE_CLOSED: 'VISIT_CASE_CLOSED',
  COMPLETED_ELSEWHERE: 'VISIT_DONE_BY_SOMEONE',
  VISIT_REMOVED: 'VISIT_CANCELLED',
  AERIAL_DISABLED: 'AERIAL_DISABLED',
};

/** True when the response body names the web's CAPABILITY_REVOKED reason code. */
export function bodyNamesCapabilityRevoked(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const record = body as Record<string, unknown>;
  const nested =
    record.data && typeof record.data === 'object'
      ? (record.data as Record<string, unknown>)
      : {};
  return [record.code, record.reason_code, record.reason, nested.code, nested.reason_code, nested.reason].some(
    (candidate) =>
      typeof candidate === 'string' && candidate.trim().toUpperCase() === 'CAPABILITY_REVOKED',
  );
}

/**
 * Reads the web's refusal reason from a response body, or null while the web
 * has not sent one (older server) or sent an unknown code.
 */
export function readVisitRefusalCode(body: unknown): SyncErrorCode | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  const nested =
    record.data && typeof record.data === 'object'
      ? (record.data as Record<string, unknown>)
      : {};
  for (const candidate of [
    record.reason_code,
    record.reason,
    record.code,
    nested.reason_code,
    nested.reason,
    nested.code,
  ]) {
    if (typeof candidate === 'string') {
      const mapped = VISIT_REFUSAL_REASON_CODES[candidate.trim().toUpperCase()];
      if (mapped) return mapped;
    }
  }
  return null;
}


export const AUTO_RETRYABLE_SYNC_ERROR_CODES = [
  'NETWORK_UNAVAILABLE',
  'NETWORK_REQUEST_FAILED',
  'API_RATE_LIMITED',
  'OFFICE_NOT_READY',
  'UPLOAD_TOO_LARGE',
  'UPLOAD_TIMED_OUT',
  'SERVER_ERROR',
] as const satisfies readonly SyncErrorCode[];

/**
 * Failures caused by the account's standing, not by the record: they end in
 * "failed" with no automatic retry, and are re-queued once the phone has a
 * fresh sign-in.
 */
export const ACCESS_FAILURE_SYNC_ERROR_CODES = [
  'AUTH_REQUIRED',
  'API_FORBIDDEN',
  'CAPABILITY_REVOKED',
] as const satisfies readonly SyncErrorCode[];

/**
 * Every failed code that sending again could still fix. The rest (a conflicting
 * identity, a missing image, an unusable record, a refused visit) end the same
 * way on every attempt, so "send all again" leaves them alone.
 */
export const RESENDABLE_SYNC_ERROR_CODES = [
  ...AUTO_RETRYABLE_SYNC_ERROR_CODES,
  ...ACCESS_FAILURE_SYNC_ERROR_CODES,
  'API_VALIDATION_FAILED',
  'UNKNOWN_SYNC_ERROR',
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
    const hintMs = options.retryAfterMs ?? null;
    this.retryAfterMs = hintMs !== null && Number.isFinite(hintMs) && hintMs > 0 ? hintMs : null;
    this.detail = options.detail ?? null;
  }
}

/**
 * Which upload a failure came from. A 404 means different things per endpoint:
 * on a report or boundary upload the office has not published that endpoint
 * yet (retryable), while on a visit completion the visit no longer exists.
 */
export type SyncEndpoint = 'report' | 'boundary';

export function toSyncError(
  error: unknown,
  options: { endpoint?: SyncEndpoint } = {},
): SyncError {
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
      if (bodyNamesCapabilityRevoked(error.body)) {
        return new SyncError(
          'CAPABILITY_REVOKED',
          getSyncErrorMessage('CAPABILITY_REVOKED') ?? '',
        );
      }
      return new SyncError(
        'API_FORBIDDEN',
        'This account is not allowed to submit field reports.',
      );
    }
    if (error.status === 409) {
      const refusal = readVisitRefusalCode(error.body);
      if (refusal) {
        return new SyncError(refusal, getSyncErrorMessage(refusal) ?? '');
      }
      return new SyncError(
        'API_VALIDATION_FAILED',
        'The server reported a conflicting upload identity. Review its saved details before retrying.',
        { detail: extractValidationDetail(error.body) },
      );
    }
    if (error.status === 404 && options.endpoint) {
      return new SyncError(
        'OFFICE_NOT_READY',
        getSyncErrorMessage('OFFICE_NOT_READY') ?? '',
        { retryAfterMs: error.retryAfterMs },
      );
    }
    if (error.status === 404) {
      // The visit no longer exists on the office side.
      return new SyncError(
        'VISIT_CANCELLED',
        getSyncErrorMessage('VISIT_CANCELLED') ?? '',
      );
    }
    if (error.status === 400 || error.status === 422) {
      const refusal = readVisitRefusalCode(error.body);
      if (refusal) {
        return new SyncError(refusal, getSyncErrorMessage(refusal) ?? '');
      }
      return new SyncError(
        'API_VALIDATION_FAILED',
        'The server rejected this report. Review its saved details before retrying.',
        { detail: extractValidationDetail(error.body) },
      );
    }
    if (error.status === 413) {
      return new SyncError(
        'UPLOAD_TOO_LARGE',
        getSyncErrorMessage('UPLOAD_TOO_LARGE') ?? '',
        { retryAfterMs: error.retryAfterMs },
      );
    }
    if (error.status === 408) {
      return new SyncError(
        'UPLOAD_TIMED_OUT',
        getSyncErrorMessage('UPLOAD_TIMED_OUT') ?? '',
        { retryAfterMs: error.retryAfterMs },
      );
    }
    if (error.status === 423) {
      return new SyncError(
        'SERVER_ERROR',
        'This case is currently open for office review. CaneGuard will retry shortly.',
        { retryAfterMs: error.retryAfterMs ?? 15_000 },
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
        'The server could not accept the report yet.',
        { retryAfterMs: error.retryAfterMs },
      );
    }
  }

  if (
    error instanceof TypeError ||
    error instanceof ApiTransportError ||
    error instanceof FetchError ||
    isAbortError(error)
  ) {
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
    case 'CAPABILITY_REVOKED':
      return 'Your access changed. Ask your office to restore it. Your saved work is safe.';
    case 'API_FORBIDDEN':
      return 'This account cannot submit field reports.';
    case 'API_RATE_LIMITED':
      return 'The server requested a short wait before retrying.';
    case 'IMAGE_MISSING':
      return 'The saved image is missing from this device.';
    case 'INVALID_LOCAL_RECORD':
      return 'This saved record is incomplete and cannot be sent.';
    case 'OFFICE_NOT_READY':
      return 'The office is not ready to receive this yet. Try again later.';
    case 'UPLOAD_TOO_LARGE':
      return 'The office could not take this upload because it was too big. It stays saved and will be tried again.';
    case 'UPLOAD_TIMED_OUT':
      return 'The upload took too long. It stays saved and will be tried again. A stronger signal helps.';
    case 'SERVER_ERROR':
      return 'The office was unavailable. Try again later.';
    case 'UNKNOWN_SYNC_ERROR':
      return 'Could not send the report.';
    case 'VISIT_MOVED':
      return 'This visit was moved to another inspector.';
    case 'VISIT_CASE_CLOSED':
      return 'The office closed this case.';
    case 'VISIT_DONE_BY_SOMEONE':
      return 'Someone else already finished this visit.';
    case 'VISIT_CANCELLED':
      return 'The office cancelled this visit.';
    case 'AERIAL_DISABLED':
      return 'Aerial canopy checks are turned off by the office. Your saved drone photo stays on this device.';
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
