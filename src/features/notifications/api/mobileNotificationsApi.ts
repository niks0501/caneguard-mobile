import { apiBaseUrl } from '@/config/env';
import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';
import type {
  MobileNotificationAdvisory,
  MobileNotificationUpdate,
} from '@/features/notifications/domain/notificationTypes';
import {
  envelopePageLimit,
  type SyncEnvelope,
  type SyncFeedSummary,
  parseSyncEnvelope,
  SyncEnvelopeFieldError,
} from '@/features/sync/api/syncEnvelope';

const NOTIFICATION_PATH = '/api/v1/mobile/notifications';
const PAGE_SIZE = 100;
const MAX_PAGES = 500;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface MobileNotificationsResult {
  syncBefore: string;
  notifications: MobileNotificationUpdate[];
  partial: boolean;
  sync: SyncFeedSummary;
  /** Pages this download requested; zero when the server confirmed the sent version. */
  pageCount: number;
}

export type MobileNotificationsApiErrorCode =
  | 'AUTH_REQUIRED'
  | 'CAPABILITY_UNAVAILABLE'
  | 'MALFORMED_RESPONSE'
  | 'NETWORK'
  | 'ORIGIN_MISMATCH'
  | 'TIMEOUT';

export class MobileNotificationsApiError extends Error {
  readonly code: MobileNotificationsApiErrorCode;
  readonly status: number | null;

  constructor(
    code: MobileNotificationsApiErrorCode,
    message: string,
    status: number | null = null,
  ) {
    super(message);
    this.name = 'MobileNotificationsApiError';
    this.code = code;
    this.status = status;
  }
}

export async function fetchAllMobileNotifications(options: {
  token: string;
  /** The version of the last complete download; an unchanged feed then costs one request. */
  since?: string | null;
}): Promise<MobileNotificationsResult> {
  const since = options.since ?? null;
  const visited = new Set<string>();
  const notifications: MobileNotificationUpdate[] = [];
  let partial = false;
  let path: string | null = buildInitialPath(since);
  let syncBefore: string | null = null;
  let sync: SyncEnvelope | null = null;
  let pageLimit = 1;
  let pagesRequested = 0;
  let recordCount = 0;

  for (let pageNumber = 0; path; pageNumber += 1) {
    if (pageNumber >= pageLimit || visited.has(path)) {
      throw new MobileNotificationsApiError(
        'MALFORMED_RESPONSE',
        'The notification feed pagination did not complete safely.',
      );
    }
    visited.add(path);

    const page = await requestPage(path, options.token);
    pagesRequested += 1;
    if (syncBefore && page.syncBefore !== syncBefore) {
      throw new MobileNotificationsApiError(
        'MALFORMED_RESPONSE',
        'The notification feed checkpoint changed during pagination.',
      );
    }
    syncBefore ??= page.syncBefore;
    if (!sync) {
      sync = page.sync;
      // The reported total tells how many pages the download needs; it replaces the fixed ceiling.
      pageLimit = envelopePageLimit(sync, PAGE_SIZE, MAX_PAGES);
    } else if (page.sync.version !== sync.version || page.sync.total !== sync.total) {
      throw new MobileNotificationsApiError(
        'MALFORMED_RESPONSE',
        'The notification feed version changed during pagination.',
      );
    }
    notifications.push(...page.notifications);
    partial ||= page.skippedCount > 0;
    recordCount += page.recordCount;

    if (page.nextPath) {
      assertContinuationCheckpoint(page.nextPath, syncBefore);
    }
    path = page.nextPath;
  }

  if (!syncBefore || !sync) {
    throw new MobileNotificationsApiError(
      'MALFORMED_RESPONSE',
      'The notification feed did not provide a server checkpoint.',
    );
  }

  assertUniqueIdentities(notifications);
  if (sync.unchanged) {
    if (recordCount > 0 || !since || sync.version !== since) {
      throw new MobileNotificationsApiError(
        'MALFORMED_RESPONSE',
        'The notification feed unchanged answer was inconsistent.',
      );
    }
    return {
      syncBefore,
      notifications,
      partial,
      sync: {
        version: sync.version,
        total: sync.total ?? 0,
        truncated: sync.truncated,
        unchanged: true,
      },
      pageCount: 0,
    };
  }

  if (!isConsistentTotal(sync, recordCount, since)) {
    throw new MobileNotificationsApiError(
      'MALFORMED_RESPONSE',
      'The notification feed total did not match the rows it delivered.',
    );
  }

  return {
    syncBefore,
    notifications,
    partial,
    sync: {
      version: sync.version,
      total: sync.total ?? recordCount,
      truncated: sync.truncated,
      unchanged: false,
    },
    pageCount: pagesRequested,
  };
}

async function requestPage(
  path: string,
  token: string,
): Promise<{
  nextPath: string | null;
  syncBefore: string;
  sync: SyncEnvelope;
  notifications: MobileNotificationUpdate[];
  recordCount: number;
  skippedCount: number;
}> {
  let body: unknown;
  try {
    body = await apiRequest<unknown>(path, { token, timeoutMs: 20_000 });
  } catch (error: unknown) {
    throw mapApiError(error);
  }

  try {
    return parsePage(body);
  } catch (error: unknown) {
    if (error instanceof MobileNotificationsApiError) throw error;
    throw new MobileNotificationsApiError(
      'MALFORMED_RESPONSE',
      'The notification feed response was invalid.',
    );
  }
}

export interface MobileNotificationReadResult {
  notification: MobileNotificationUpdate;
  unreadCount: number | null;
}

export interface MobileNotificationsReadAllResult {
  markedCount: number;
  unreadCount: number;
}

/**
 * Mark one owner-scoped notification as read. The server returns the updated
 * item so the local cache never guesses at the acknowledgment state.
 */
export async function markMobileNotificationRead(options: {
  id: string;
  token: string;
}): Promise<MobileNotificationReadResult> {
  let body: unknown;
  try {
    body = await apiRequest<unknown>(
      `${NOTIFICATION_PATH}/${encodeURIComponent(options.id)}/read`,
      { method: 'PATCH', token: options.token, timeoutMs: 20_000 },
    );
  } catch (error: unknown) {
    throw mapApiError(error);
  }

  try {
    if (!isRecord(body) || !isRecord(body.data)) throw malformed('data');
    const notification = parseNotification(body.data);
    if (notification.id !== options.id) throw malformed('data.id');
    return {
      notification,
      unreadCount: optionalCount(body.meta, 'unread_count'),
    };
  } catch (error: unknown) {
    if (error instanceof MobileNotificationsApiError) throw error;
    throw new MobileNotificationsApiError(
      'MALFORMED_RESPONSE',
      'The notification read response was invalid.',
    );
  }
}

/** Mark every unread notification owned by the signed-in inspector as read. */
export async function markAllMobileNotificationsRead(options: {
  token: string;
}): Promise<MobileNotificationsReadAllResult> {
  let body: unknown;
  try {
    body = await apiRequest<unknown>(`${NOTIFICATION_PATH}/read-all`, {
      method: 'POST',
      token: options.token,
      timeoutMs: 20_000,
    });
  } catch (error: unknown) {
    throw mapApiError(error);
  }

  if (!isRecord(body) || !isRecord(body.meta)) throw malformed('meta');
  return {
    markedCount: requireCount(body.meta.marked_count, 'meta.marked_count'),
    unreadCount: requireCount(body.meta.unread_count, 'meta.unread_count'),
  };
}

function requireCount(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw malformed(field);
  }
  return value;
}

function optionalCount(container: unknown, field: string): number | null {
  if (container === undefined) return null;
  if (!isRecord(container)) throw malformed('meta');
  const value = container[field];
  if (value === undefined || value === null) return null;
  return requireCount(value, `meta.${field}`);
}

function parsePage(body: unknown): {
  nextPath: string | null;
  syncBefore: string;
  sync: SyncEnvelope;
  notifications: MobileNotificationUpdate[];
  recordCount: number;
  skippedCount: number;
} {
  if (!isRecord(body) || !Array.isArray(body.data) || !isRecord(body.links)) {
    throw malformed('page');
  }
  const sync = isRecord(body.sync) ? body.sync : null;
  const syncBefore = requireTimestamp(sync?.before, 'sync.before');
  const rawNext = body.links.next;
  if (rawNext !== null && typeof rawNext !== 'string') {
    throw malformed('links.next');
  }

  const notifications: MobileNotificationUpdate[] = [];
  let skippedCount = 0;
  body.data.forEach((value, index) => {
    try {
      notifications.push(parseNotification(value));
    } catch (error: unknown) {
      if (
        !(error instanceof MobileNotificationsApiError) ||
        error.code !== 'MALFORMED_RESPONSE'
      ) {
        throw error;
      }
      skippedCount += 1;
      console.warn(
        `[notifications] Skipping malformed notification item at index ${index}: ${error.message}`,
      );
    }
  });

  return {
    nextPath: rawNext === null ? null : toSafeContinuationPath(rawNext),
    syncBefore,
    sync: parseSync(sync),
    notifications,
    recordCount: body.data.length,
    skippedCount,
  };
}

/** Tolerant of servers that predate versioning: absent stamps read as unknown. */
function parseSync(sync: Record<string, unknown> | null): SyncEnvelope {
  try {
    return parseSyncEnvelope(sync);
  } catch (error: unknown) {
    if (error instanceof SyncEnvelopeFieldError) throw malformed(`sync.${error.field}`);
    throw error;
  }
}

function parseNotification(value: unknown): MobileNotificationUpdate {
  if (!isRecord(value)) throw malformed('notification');
  const id = requireUuid(value.id, 'id');
  const eventType = requireString(value.event_type, 'event_type');
  const title = requireString(value.title, 'title');
  const message = requireString(value.message, 'message');
  const rawCase = isRecord(value.case) ? value.case : null;
  if (!rawCase) throw malformed('case');

  return {
    id,
    eventType,
    title,
    message,
    caseUuid: optionalUuid(rawCase.uuid, 'case.uuid'),
    referenceCode: optionalString(rawCase.reference_code, 'case.reference_code'),
    assignmentUuid: optionalUuid(value.assignment_uuid, 'assignment_uuid'),
    content: nullableString(value.content, 'content'),
    advisory: parseAdvisory(value.advisory),
    isRead: requireBoolean(value.is_read, 'is_read'),
    readAt: optionalTimestamp(value.read_at, 'read_at'),
    createdAt: optionalTimestamp(value.created_at, 'created_at'),
  };
}

function parseAdvisory(value: unknown): MobileNotificationAdvisory | null {
  if (value === undefined || value === null) return null;
  if (!isRecord(value)) throw malformed('advisory');

  const status = value.status;
  if (status !== 'validated') throw malformed('advisory.status');

  return {
    uuid: requireUuid(value.uuid, 'advisory.uuid'),
    code: requireString(value.code, 'advisory.code'),
    title: requireString(value.title, 'advisory.title'),
    content: requireString(value.content, 'advisory.content'),
    status,
    selectedAt: requireTimestamp(value.selected_at, 'advisory.selected_at'),
  };
}

/**
 * A whole-feed answer must deliver exactly the rows its total promised; a cut
 * or version-scoped answer only has to fit inside that total.
 */
function isConsistentTotal(
  sync: SyncEnvelope,
  received: number,
  since: string | null,
): boolean {
  if (sync.total === null) return true;
  return !sync.truncated && !since ? sync.total === received : sync.total >= received;
}

function buildInitialPath(since: string | null): string {
  const query = new URLSearchParams({ per_page: String(PAGE_SIZE) });
  if (since) query.set('since', since);
  return `${NOTIFICATION_PATH}?${query.toString()}`;
}

function toSafeContinuationPath(rawUrl: string): string {
  let url: URL;
  let base: URL;
  try {
    base = new URL(apiBaseUrl);
    url = new URL(rawUrl, base);
  } catch {
    throw new MobileNotificationsApiError(
      'ORIGIN_MISMATCH',
      'The notification feed continuation is not a valid URL.',
    );
  }
  if (url.origin !== base.origin) {
    throw new MobileNotificationsApiError(
      'ORIGIN_MISMATCH',
      'The notification feed continuation left the API origin.',
    );
  }
  const basePath = base.pathname.replace(/\/+$/, '');
  if (basePath && basePath !== '/' && !url.pathname.startsWith(`${basePath}/`)) {
    throw new MobileNotificationsApiError(
      'ORIGIN_MISMATCH',
      'The notification feed continuation left the API path boundary.',
    );
  }
  if (url.pathname !== NOTIFICATION_PATH && !url.pathname.startsWith(`${NOTIFICATION_PATH}/`)) {
    throw new MobileNotificationsApiError(
      'ORIGIN_MISMATCH',
      'The notification feed continuation left the endpoint boundary.',
    );
  }
  return `${url.pathname}${url.search}`;
}

function assertContinuationCheckpoint(path: string, syncBefore: string): void {
  const url = new URL(path, apiBaseUrl);
  const checkpoint = url.searchParams.get('sync_before');
  if (checkpoint && checkpoint !== syncBefore) {
    throw new MobileNotificationsApiError(
      'MALFORMED_RESPONSE',
      'The notification feed continuation changed its checkpoint.',
    );
  }
}

function assertUniqueIdentities(notifications: MobileNotificationUpdate[]): void {
  const ids = new Set<string>();
  for (const notification of notifications) {
    if (ids.has(notification.id)) {
      throw new MobileNotificationsApiError(
        'MALFORMED_RESPONSE',
        'The notification feed contains duplicate identities.',
      );
    }
    ids.add(notification.id);
  }
}

function requireUuid(value: unknown, field: string): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) throw malformed(field);
  return value;
}

function optionalUuid(value: unknown, field: string): string | null {
  if (value === null) return null;
  return requireUuid(value, field);
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw malformed(field);
  return value;
}

function optionalString(value: unknown, field: string): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') throw malformed(field);
  return value;
}

function nullableString(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null;
  return optionalString(value, field);
}

function requireTimestamp(value: unknown, field: string): string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) throw malformed(field);
  return value;
}

function optionalTimestamp(value: unknown, field: string): string | null {
  if (value === null) return null;
  return requireTimestamp(value, field);
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw malformed(field);
  return value;
}

function malformed(field: string): MobileNotificationsApiError {
  return new MobileNotificationsApiError(
    'MALFORMED_RESPONSE',
    `The notification feed field ${field} is invalid.`,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function mapApiError(error: unknown): MobileNotificationsApiError {
  if (error instanceof MobileNotificationsApiError) return error;
  if (error instanceof ApiHttpError) {
    if (error.status === 401) return new MobileNotificationsApiError('AUTH_REQUIRED', 'The notification session expired.', error.status);
    if (error.status === 403 || error.status === 404) return new MobileNotificationsApiError('CAPABILITY_UNAVAILABLE', 'Mobile notifications are unavailable on this server.', error.status);
    return new MobileNotificationsApiError('NETWORK', 'Notifications could not be refreshed.', error.status);
  }
  if (isAbortError(error)) return new MobileNotificationsApiError('TIMEOUT', 'The notification request timed out.');
  return new MobileNotificationsApiError('NETWORK', 'Notifications could not be refreshed.');
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
