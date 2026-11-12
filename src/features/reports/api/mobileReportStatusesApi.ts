import { apiBaseUrl } from '@/config/env';
import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';
import type {
  AuthorityReviewStatusUpdate,
  MobileReportAdvisory,
} from '@/features/reports/domain/reportReviewTypes';
import {
  envelopePageLimit,
  type SyncEnvelope,
  type SyncFeedSummary,
  parseSyncEnvelope,
  SyncEnvelopeFieldError,
} from '@/features/sync/api/syncEnvelope';
import type { SyncDownloadProgressStore } from '@/features/sync/domain/syncDownloadProgressStore';

const STATUS_PATH = '/api/v3/mobile/reports/statuses';
const PAGE_SIZE = 100;
const MAX_PAGES = 500;
const MAX_FEEDBACK_LENGTH = 1_000;

export interface MobileReportStatusesResult {
  syncBefore: string;
  updates: AuthorityReviewStatusUpdate[];
  sync: SyncFeedSummary;
  /** Pages this download requested; zero when the server confirmed the sent version. */
  pageCount: number;
}

/**
 * Pages already downloaded from one server checkpoint. A retry of the same request
 * continues at `nextPath` instead of restarting from page one, even in a new process.
 */
interface StatusDownloadProgress {
  cursor: string;
  nextPath: string;
  syncBefore: string;
  sync: SyncEnvelope;
  updates: AuthorityReviewStatusUpdate[];
  visited: string[];
  pagesRequested: number;
}

export type ReportStatusesErrorCode =
  | 'AUTH_REQUIRED'
  | 'CAPABILITY_UNAVAILABLE'
  | 'MALFORMED_RESPONSE'
  | 'NETWORK'
  | 'ORIGIN_MISMATCH'
  | 'TIMEOUT';

export class ReportStatusesApiError extends Error {
  readonly code: ReportStatusesErrorCode;
  readonly status: number | null;

  constructor(code: ReportStatusesErrorCode, message: string, status: number | null = null) {
    super(message);
    this.name = 'ReportStatusesApiError';
    this.code = code;
    this.status = status;
  }
}

interface StatusDownloadRequest {
  token: string;
  updatedAfter?: string | null;
  /** The version of the last complete download; an unchanged feed then costs one request. */
  since?: string | null;
  /** Owner-scoped storage where an interrupted download leaves its pages and continuation. */
  progress: SyncDownloadProgressStore;
}

export function fetchAllMobileReportStatuses(
  options: StatusDownloadRequest,
): Promise<MobileReportStatusesResult> {
  return fetchStatusPages(options, false);
}

async function fetchStatusPages(
  options: StatusDownloadRequest,
  restarted: boolean,
): Promise<MobileReportStatusesResult> {
  const since = options.since ?? null;
  const initialPath = buildInitialPath(options.updatedAfter, since);
  // Only a retry of the same first-page request resumes; another cursor starts over.
  const resume = await readProgress(options.progress, initialPath);
  const visited = new Set<string>(resume?.visited ?? []);
  const updates: AuthorityReviewStatusUpdate[] = [...(resume?.updates ?? [])];
  let path: string | null = resume?.nextPath ?? initialPath;
  let syncBefore: string | null = resume?.syncBefore ?? null;
  let sync: SyncEnvelope | null = resume?.sync ?? null;
  let pageLimit = sync ? envelopePageLimit(sync, PAGE_SIZE, MAX_PAGES) : 1;
  let pagesRequested = resume?.pagesRequested ?? 0;
  let resumedPage = Boolean(resume);

  for (let pageNumber = pagesRequested; path; pageNumber += 1) {
    if (pageNumber >= pageLimit || visited.has(path)) {
      throw new ReportStatusesApiError(
        'MALFORMED_RESPONSE',
        'The authority review feed pagination did not complete safely.',
      );
    }
    visited.add(path);

    const page = await requestPage(path, options.token);
    pagesRequested += 1;
    if (
      resumedPage &&
      sync &&
      (page.syncBefore !== syncBefore ||
        page.sync.version !== sync.version ||
        page.sync.total !== sync.total)
    ) {
      if (restarted) {
        throw new ReportStatusesApiError(
          'MALFORMED_RESPONSE',
          'The authority review feed kept changing while the download restarted.',
        );
      }
      // The feed moved on while the download was stored; its pages describe a stale set.
      await options.progress.clear();
      return fetchStatusPages(options, true);
    }
    resumedPage = false;
    if (syncBefore && page.syncBefore !== syncBefore) {
      throw new ReportStatusesApiError(
        'MALFORMED_RESPONSE',
        'The authority review feed checkpoint changed during pagination.',
      );
    }
    syncBefore ??= page.syncBefore;
    if (!sync) {
      sync = page.sync;
      // The reported total tells how many pages the download needs; it replaces the fixed ceiling.
      pageLimit = envelopePageLimit(sync, PAGE_SIZE, MAX_PAGES);
    } else if (page.sync.version !== sync.version || page.sync.total !== sync.total) {
      throw new ReportStatusesApiError(
        'MALFORMED_RESPONSE',
        'The authority review feed version changed during pagination.',
      );
    }
    updates.push(...page.updates);

    if (page.nextPath) {
      assertContinuationCheckpoint(page.nextPath, syncBefore);
    }
    path = page.nextPath;
    if (path && syncBefore && sync) {
      await options.progress.save(
        serializeProgress({
          cursor: initialPath,
          nextPath: path,
          syncBefore,
          sync,
          updates,
          visited: [...visited],
          pagesRequested,
        }),
      );
    }
  }
  await options.progress.clear();

  if (!syncBefore || !sync) {
    throw new ReportStatusesApiError(
      'MALFORMED_RESPONSE',
      'The authority review feed did not provide a server checkpoint.',
    );
  }

  assertUniqueIdentities(updates);
  if (sync.unchanged) {
    if (updates.length > 0 || !since || sync.version !== since) {
      throw new ReportStatusesApiError(
        'MALFORMED_RESPONSE',
        'The authority review feed unchanged answer was inconsistent.',
      );
    }
    return {
      syncBefore,
      updates,
      sync: {
        version: sync.version,
        total: sync.total ?? 0,
        truncated: sync.truncated,
        unchanged: true,
      },
      pageCount: 0,
    };
  }

  if (!isConsistentTotal(sync, updates.length, since)) {
    throw new ReportStatusesApiError(
      'MALFORMED_RESPONSE',
      'The authority review feed total did not match the rows it delivered.',
    );
  }

  return {
    syncBefore,
    updates,
    sync: {
      version: sync.version,
      total: sync.total ?? updates.length,
      truncated: sync.truncated,
      unchanged: false,
    },
    pageCount: pagesRequested,
  };
}

async function readProgress(
  store: SyncDownloadProgressStore,
  initialPath: string,
): Promise<StatusDownloadProgress | null> {
  const payload = await store.read();
  if (payload === null) return null;
  const progress = parseProgress(payload);
  if (progress && progress.cursor === initialPath) return progress;
  await store.clear();
  return null;
}

function serializeProgress(progress: StatusDownloadProgress): string {
  return JSON.stringify({
    ...progress,
    sync: toStoredSync(progress.sync),
    updates: progress.updates.map(toStoredItem),
  });
}

/** A stamp the server never sent is stored as absent, the shape the envelope parser accepts. */
function toStoredSync(sync: SyncEnvelope): Record<string, unknown> {
  const stored: Record<string, unknown> = {
    truncated: sync.truncated,
    unchanged: sync.unchanged,
  };
  if (sync.version !== null) stored.version = sync.version;
  if (sync.total !== null) stored.total = sync.total;
  return stored;
}

/** Stored rows keep the wire shape so reading them back reuses the feed's own item parser. */
function toStoredItem(update: AuthorityReviewStatusUpdate): Record<string, unknown> {
  return {
    uuid: update.remoteUuid,
    client_uuid: update.clientUuid,
    review_status: update.rawStatus,
    workflow_status: update.workflowStatus ?? null,
    updated_at: update.statusUpdatedAt,
    review_notes: update.feedback,
    reference_code: update.referenceCode,
    reviewed_at: update.reviewedAt,
    advisory: update.advisory && {
      uuid: update.advisory.uuid,
      code: update.advisory.code,
      title: update.advisory.title,
      content: update.advisory.content,
      status: update.advisory.status,
      selected_at: update.advisory.selectedAt,
    },
  };
}

/** Stored progress this build cannot read is dropped: the download then starts over. */
function parseProgress(payload: string): StatusDownloadProgress | null {
  let raw: unknown;
  try {
    raw = JSON.parse(payload);
  } catch {
    return null;
  }
  if (
    !isRecord(raw) ||
    !Array.isArray(raw.updates) ||
    !Array.isArray(raw.visited) ||
    typeof raw.pagesRequested !== 'number' ||
    !Number.isInteger(raw.pagesRequested) ||
    raw.pagesRequested < 0
  ) {
    return null;
  }
  try {
    return {
      cursor: requireNonBlankString(raw.cursor, 'cursor'),
      nextPath: toSafeContinuationPath(requireNonBlankString(raw.nextPath, 'next_path')),
      syncBefore: requireTimestamp(raw.syncBefore, 'sync_before'),
      sync: parseSync(readStoredSync(raw.sync)),
      updates: raw.updates.map(parseStatusItem),
      visited: raw.visited.map((path) => requireNonBlankString(path, 'visited')),
      pagesRequested: raw.pagesRequested,
    };
  } catch {
    return null;
  }
}

/** Stored envelopes keep an unsent stamp absent even after a round trip through JSON. */
function readStoredSync(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const sync: Record<string, unknown> = { ...value };
  if (sync.version === null) delete sync.version;
  if (sync.total === null) delete sync.total;
  return sync;
}

async function requestPage(
  path: string,
  token: string,
): Promise<{
  nextPath: string | null;
  syncBefore: string;
  sync: SyncEnvelope;
  updates: AuthorityReviewStatusUpdate[];
}> {
  let body: unknown;
  try {
    body = await apiRequest<unknown>(path, {
      token,
      timeoutMs: 20_000,
    });
  } catch (error: unknown) {
    throw mapApiError(error);
  }

  try {
    return parsePage(body);
  } catch (error: unknown) {
    if (error instanceof ReportStatusesApiError) {
      throw error;
    }
    throw new ReportStatusesApiError(
      'MALFORMED_RESPONSE',
      'The authority review feed response was invalid.',
    );
  }
}

function parsePage(body: unknown): {
  nextPath: string | null;
  syncBefore: string;
  sync: SyncEnvelope;
  updates: AuthorityReviewStatusUpdate[];
} {
  if (!isRecord(body) || !Array.isArray(body.data) || !isRecord(body.links)) {
    throw new ReportStatusesApiError(
      'MALFORMED_RESPONSE',
      'The authority review feed page is incomplete.',
    );
  }

  const meta = isRecord(body.meta) ? body.meta : null;
  const sync = isRecord(body.sync) ? body.sync : null;
  const rawSyncBefore = sync?.before ?? meta?.sync_before ?? body.sync_before;
  const syncBefore = requireTimestamp(rawSyncBefore, 'sync_before');
  const rawNext = body.links.next;
  if (rawNext !== null && typeof rawNext !== 'string') {
    throw new ReportStatusesApiError(
      'MALFORMED_RESPONSE',
      'The authority review feed continuation is invalid.',
    );
  }

  return {
    nextPath: rawNext === null ? null : toSafeContinuationPath(rawNext),
    syncBefore,
    sync: parseSync(sync),
    updates: body.data.map(parseStatusItem),
  };
}

/** Tolerant of servers that predate versioning: absent stamps read as unknown. */
function parseSync(sync: Record<string, unknown> | null): SyncEnvelope {
  try {
    return parseSyncEnvelope(sync);
  } catch (error: unknown) {
    if (error instanceof SyncEnvelopeFieldError) {
      throw new ReportStatusesApiError(
        'MALFORMED_RESPONSE',
        `The authority review feed field sync.${error.field} is invalid.`,
      );
    }
    throw error;
  }
}

function parseStatusItem(value: unknown): AuthorityReviewStatusUpdate {
  if (!isRecord(value)) {
    throw new ReportStatusesApiError(
      'MALFORMED_RESPONSE',
      'The authority review feed contains an invalid item.',
    );
  }

  const remoteUuid = requireNonBlankString(value.uuid, 'uuid');
  const clientUuid = requireNonBlankString(value.client_uuid, 'client_uuid');
  const rawStatus = requireNonBlankString(value.review_status, 'review_status');
  const workflowStatus = optionalString(value.workflow_status, 'workflow_status');
  const statusUpdatedAt = requireTimestamp(value.updated_at, 'updated_at');
  const referenceCode = optionalString(value.reference_code, 'reference_code');
  const reviewedAt = optionalTimestamp(value.reviewed_at, 'reviewed_at');
  const rawFeedback = optionalString(value.review_notes, 'review_notes');
  if (rawFeedback && rawFeedback.length > MAX_FEEDBACK_LENGTH) {
    throw new ReportStatusesApiError(
      'MALFORMED_RESPONSE',
      'The authority review feedback is too long.',
    );
  }

  return {
    advisory: parseAdvisory(value.advisory),
    clientUuid,
    feedback: rawFeedback?.trim() || null,
    referenceCode: referenceCode?.trim() || null,
    reviewedAt,
    remoteUuid,
    rawStatus,
    statusUpdatedAt,
    workflowStatus: workflowStatus?.trim() || null,
  };
}

function parseAdvisory(value: unknown): MobileReportAdvisory | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (!isRecord(value)) {
    throw new ReportStatusesApiError(
      'MALFORMED_RESPONSE',
      'The authority review feed advisory is invalid.',
    );
  }
  const status = requireNonBlankString(value.status, 'advisory.status');
  if (status !== 'validated' && status !== 'retired') {
    throw new ReportStatusesApiError(
      'MALFORMED_RESPONSE',
      'The authority review feed advisory status is invalid.',
    );
  }
  return {
    code: requireNonBlankString(value.code, 'advisory.code'),
    content: requireNonBlankString(value.content, 'advisory.content'),
    selectedAt: requireTimestamp(value.selected_at, 'advisory.selected_at'),
    status,
    title: requireNonBlankString(value.title, 'advisory.title'),
    uuid: requireNonBlankString(value.uuid, 'advisory.uuid'),
  };
}

/**
 * A whole-feed answer must deliver exactly the rows its total promised; a cut
 * or version-scoped answer only has to fit inside that total.
 */
function isConsistentTotal(sync: SyncEnvelope, received: number, since: string | null): boolean {
  if (sync.total === null) return true;
  return !sync.truncated && !since ? sync.total === received : sync.total >= received;
}

function buildInitialPath(updatedAfter: string | null | undefined, since: string | null): string {
  const query = new URLSearchParams({ per_page: String(PAGE_SIZE) });
  // A version stamp supersedes the overlapping timestamp: the feed then reports its own delta.
  if (since) {
    query.set('since', since);
  } else if (updatedAfter) {
    query.set('updated_after', updatedAfter);
  }
  return `${STATUS_PATH}?${query.toString()}`;
}

function toSafeContinuationPath(rawUrl: string): string {
  let url: URL;
  let base: URL;
  try {
    base = new URL(apiBaseUrl);
    url = new URL(rawUrl, base);
  } catch {
    throw new ReportStatusesApiError(
      'ORIGIN_MISMATCH',
      'The authority review feed continuation is not a valid URL.',
    );
  }

  if (url.origin !== base.origin) {
    throw new ReportStatusesApiError(
      'ORIGIN_MISMATCH',
      'The authority review feed continuation left the API origin.',
    );
  }

  const basePath = base.pathname.replace(/\/+$/, '');
  if (basePath && basePath !== '/' && !url.pathname.startsWith(`${basePath}/`)) {
    throw new ReportStatusesApiError(
      'ORIGIN_MISMATCH',
      'The authority review feed continuation left the API path boundary.',
    );
  }
  if (url.pathname !== STATUS_PATH && !url.pathname.startsWith(`${STATUS_PATH}/`)) {
    throw new ReportStatusesApiError(
      'ORIGIN_MISMATCH',
      'The authority review feed continuation left the endpoint boundary.',
    );
  }

  return `${url.pathname}${url.search}`;
}

function assertContinuationCheckpoint(path: string, syncBefore: string): void {
  const url = new URL(path, apiBaseUrl);
  const continuationCheckpoint = url.searchParams.get('sync_before');
  if (continuationCheckpoint && continuationCheckpoint !== syncBefore) {
    throw new ReportStatusesApiError(
      'MALFORMED_RESPONSE',
      'The authority review feed continuation changed its checkpoint.',
    );
  }
}

function assertUniqueIdentities(updates: AuthorityReviewStatusUpdate[]): void {
  const clientUuids = new Set<string>();
  const remoteUuids = new Set<string>();
  for (const update of updates) {
    if (clientUuids.has(update.clientUuid) || remoteUuids.has(update.remoteUuid)) {
      throw new ReportStatusesApiError(
        'MALFORMED_RESPONSE',
        'The authority review feed contains duplicate identities.',
      );
    }
    clientUuids.add(update.clientUuid);
    remoteUuids.add(update.remoteUuid);
  }
}

function requireNonBlankString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ReportStatusesApiError(
      'MALFORMED_RESPONSE',
      `The authority review feed field ${field} is invalid.`,
    );
  }
  return value;
}

function optionalString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new ReportStatusesApiError(
      'MALFORMED_RESPONSE',
      `The authority review feed field ${field} is invalid.`,
    );
  }
  return value;
}

function requireTimestamp(value: unknown, field: string): string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new ReportStatusesApiError(
      'MALFORMED_RESPONSE',
      `The authority review feed timestamp ${field} is invalid.`,
    );
  }
  return value;
}

function optionalTimestamp(value: unknown, field: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return requireTimestamp(value, field);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function mapApiError(error: unknown): ReportStatusesApiError {
  if (error instanceof ReportStatusesApiError) {
    return error;
  }
  if (error instanceof ApiHttpError) {
    if (error.status === 401) {
      return new ReportStatusesApiError(
        'AUTH_REQUIRED',
        'The authority review session expired.',
        error.status,
      );
    }
    if (error.status === 403 || error.status === 404) {
      return new ReportStatusesApiError(
        'CAPABILITY_UNAVAILABLE',
        'Authority review status is unavailable on this server.',
        error.status,
      );
    }
    return new ReportStatusesApiError(
      'NETWORK',
      'The authority review status could not be refreshed.',
      error.status,
    );
  }
  if (isAbortError(error)) {
    return new ReportStatusesApiError('TIMEOUT', 'The authority review status request timed out.');
  }
  return new ReportStatusesApiError(
    'NETWORK',
    'The authority review status could not be refreshed.',
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
