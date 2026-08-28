import { apiBaseUrl } from '@/config/env';
import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';
import type { MobileNotificationUpdate } from '@/features/notifications/domain/notificationTypes';

const NOTIFICATION_PATH = '/api/v1/mobile/notifications';
const PAGE_SIZE = 100;
const MAX_PAGES = 500;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface MobileNotificationsResult {
  syncBefore: string;
  notifications: MobileNotificationUpdate[];
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
}): Promise<MobileNotificationsResult> {
  const visited = new Set<string>();
  const notifications: MobileNotificationUpdate[] = [];
  let path: string | null = buildInitialPath();
  let syncBefore: string | null = null;

  for (let pageNumber = 0; path; pageNumber += 1) {
    if (pageNumber >= MAX_PAGES || visited.has(path)) {
      throw new MobileNotificationsApiError(
        'MALFORMED_RESPONSE',
        'The notification feed pagination did not complete safely.',
      );
    }
    visited.add(path);

    const page = await requestPage(path, options.token);
    if (syncBefore && page.syncBefore !== syncBefore) {
      throw new MobileNotificationsApiError(
        'MALFORMED_RESPONSE',
        'The notification feed checkpoint changed during pagination.',
      );
    }
    syncBefore ??= page.syncBefore;
    notifications.push(...page.notifications);

    if (page.nextPath) {
      assertContinuationCheckpoint(page.nextPath, syncBefore);
    }
    path = page.nextPath;
  }

  if (!syncBefore) {
    throw new MobileNotificationsApiError(
      'MALFORMED_RESPONSE',
      'The notification feed did not provide a server checkpoint.',
    );
  }

  assertUniqueIdentities(notifications);
  return { syncBefore, notifications };
}

async function requestPage(
  path: string,
  token: string,
): Promise<{
  nextPath: string | null;
  syncBefore: string;
  notifications: MobileNotificationUpdate[];
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

function parsePage(body: unknown): {
  nextPath: string | null;
  syncBefore: string;
  notifications: MobileNotificationUpdate[];
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

  return {
    nextPath: rawNext === null ? null : toSafeContinuationPath(rawNext),
    syncBefore,
    notifications: body.data.map(parseNotification),
  };
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
    isRead: requireBoolean(value.is_read, 'is_read'),
    readAt: optionalTimestamp(value.read_at, 'read_at'),
    createdAt: optionalTimestamp(value.created_at, 'created_at'),
  };
}

function buildInitialPath(): string {
  return `${NOTIFICATION_PATH}?${new URLSearchParams({ per_page: String(PAGE_SIZE) }).toString()}`;
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
