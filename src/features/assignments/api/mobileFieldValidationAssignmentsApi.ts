import { apiBaseUrl } from '@/config/env';
import { ApiHttpError, apiRequest, buildApiUrl } from '@/features/shared/api/apiClient';
import {
  FIELD_VALIDATION_ASSIGNMENT_STATES,
  FIELD_VALIDATION_FOLLOW_UP_OUTCOMES,
  type FieldValidationAssignmentState,
  type FieldValidationFollowUpOutcome,
} from '@/database/schema';
import {
  UNKNOWN_PREDICTED_LABEL,
  type FieldValidationAssignmentUpdate,
} from '@/features/assignments/domain/assignmentTypes';
import type { PreviousVisitContext } from '@/features/assignments/domain/previousVisit';
import {
  envelopeExpectedRows,
  envelopePageLimit,
  type SyncEnvelope,
  type SyncFeedSummary,
  parseSyncEnvelope,
  SyncEnvelopeFieldError,
} from '@/features/sync/api/syncEnvelope';
import { MODEL_LABELS } from '@/features/detection/constants/modelContract';

const ASSIGNMENT_PATH = '/api/v1/mobile/assignments';
export const ASSIGNMENT_PAGE_SIZE = 100;
/** The most assignments one download asks for; the server honours at most 300. */
export const ASSIGNMENT_WORK_SET_CAP = 300;
const PAGE_SIZE = ASSIGNMENT_PAGE_SIZE;
/** Ceiling for servers that do not report sync.total; a reported total replaces it. */
const MAX_PAGES = 500;
const MAX_RESTARTS = 2;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface MobileFieldValidationAssignmentsResult {
  syncBefore: string;
  assignments: FieldValidationAssignmentUpdate[];
  /** Records dropped because their vocabulary (field_validation_state) is unknown to this build. */
  skippedCount: number;
  sync: AssignmentSyncSummary;
  /** Pages this download requested; zero when the server answered unchanged. */
  pageCount: number;
}

export type AssignmentSyncSummary = SyncFeedSummary;

export type MobileFieldValidationAssignmentsErrorCode =
  | 'AUTH_REQUIRED'
  | 'CAPABILITY_UNAVAILABLE'
  | 'MALFORMED_RESPONSE'
  | 'NETWORK'
  | 'ORIGIN_MISMATCH'
  | 'SYNC_RESTART'
  | 'TIMEOUT';

export class MobileFieldValidationAssignmentsApiError extends Error {
  readonly code: MobileFieldValidationAssignmentsErrorCode;
  readonly status: number | null;

  constructor(
    code: MobileFieldValidationAssignmentsErrorCode,
    message: string,
    status: number | null = null,
  ) {
    super(message);
    this.name = 'MobileFieldValidationAssignmentsApiError';
    this.code = code;
    this.status = status;
  }
}

export async function fetchAllMobileFieldValidationAssignments(options: {
  token: string;
  updatedAfter?: string | null;
  /** The version of the last complete download; an unchanged work set then costs one request. */
  since?: string | null;
}): Promise<MobileFieldValidationAssignmentsResult> {
  let since = options.since ?? null;
  for (let restarts = 0; ; restarts += 1) {
    try {
      return await downloadAssignments({ ...options, since });
    } catch (error: unknown) {
      if (!isSyncRestart(error)) throw error;
      if (restarts >= MAX_RESTARTS) {
        throw new MobileFieldValidationAssignmentsApiError(
          'NETWORK',
          'The assignment set kept changing during the download.',
          409,
        );
      }
      // A partial download is discarded; the retry asks for the full set.
      since = null;
    }
  }
}

async function downloadAssignments(options: {
  token: string;
  updatedAfter?: string | null;
  since: string | null;
}): Promise<MobileFieldValidationAssignmentsResult> {
  const initialPath = buildInitialPath(options.updatedAfter, options.since);
  const visited = new Set<string>();
  const identities: AssignmentIdentityIndex = { ids: new Set(), reportIds: new Set() };
  const assignments: FieldValidationAssignmentUpdate[] = [];
  let skippedCount = 0;
  let path: string | null = initialPath;
  let syncBefore: string | null = null;
  let sync: SyncEnvelope | null = null;
  let pagesRequested = 0;
  let pageLimit = 1;

  for (let pageNumber = 0; path; pageNumber += 1) {
    if (pageNumber >= pageLimit || visited.has(path)) {
      throw new MobileFieldValidationAssignmentsApiError(
        'MALFORMED_RESPONSE',
        'The assignment feed pagination did not complete safely.',
      );
    }
    visited.add(path);

    const page = await requestPage(path, options.token, identities);
    pagesRequested += 1;
    if (syncBefore && page.syncBefore !== syncBefore) {
      throw new MobileFieldValidationAssignmentsApiError(
        'MALFORMED_RESPONSE',
        'The assignment feed checkpoint changed during pagination.',
      );
    }
    syncBefore ??= page.syncBefore;
    if (!sync) {
      sync = page.sync;
      // The reported total tells how many pages the download needs; it replaces the fixed ceiling.
      pageLimit = envelopePageLimit(
        sync,
        PAGE_SIZE,
        MAX_PAGES,
        ASSIGNMENT_WORK_SET_CAP,
      );
    } else if (page.sync.version !== sync.version || page.sync.total !== sync.total) {
      throw new MobileFieldValidationAssignmentsApiError(
        'MALFORMED_RESPONSE',
        'The assignment feed version changed during pagination.',
      );
    }
    assignments.push(...page.assignments);
    skippedCount += page.skippedCount;

    if (page.nextPath) {
      assertContinuationCheckpoint(page.nextPath, syncBefore);
    }
    path = page.nextPath;
  }

  if (!syncBefore || !sync) {
    throw new MobileFieldValidationAssignmentsApiError(
      'MALFORMED_RESPONSE',
      'The assignment feed did not provide a server checkpoint.',
    );
  }

  const received = assignments.length + skippedCount;
  if (sync.unchanged) {
    if (received > 0 || !options.since || sync.version !== options.since) {
      throw new MobileFieldValidationAssignmentsApiError(
        'MALFORMED_RESPONSE',
        'The assignment feed unchanged answer was inconsistent.',
      );
    }
    return {
      syncBefore,
      assignments,
      skippedCount,
      sync: { version: sync.version, total: sync.total ?? 0, truncated: sync.truncated, unchanged: true },
      pageCount: 0,
    };
  }

  if (sync.total !== null) {
    const expectedRows = envelopeExpectedRows(sync, ASSIGNMENT_WORK_SET_CAP);
    if (received !== expectedRows || pagesRequested !== pageLimit) {
      throw new MobileFieldValidationAssignmentsApiError(
        'MALFORMED_RESPONSE',
        'The assignment feed did not deliver the rows its total promised.',
      );
    }
  }

  return {
    syncBefore,
    assignments,
    skippedCount,
    sync: {
      version: sync.version,
      total: sync.total ?? received,
      truncated: sync.truncated,
      unchanged: false,
    },
    pageCount: pagesRequested,
  };
}

function isSyncRestart(error: unknown): boolean {
  return (
    error instanceof MobileFieldValidationAssignmentsApiError &&
    error.status === 409 &&
    error.code === 'SYNC_RESTART'
  );
}

async function requestPage(
  path: string,
  token: string,
  identities: AssignmentIdentityIndex,
): Promise<{
  nextPath: string | null;
  syncBefore: string;
  sync: SyncEnvelope;
  assignments: FieldValidationAssignmentUpdate[];
  skippedCount: number;
}> {
  let body: unknown;
  try {
    body = await apiRequest<unknown>(path, { token, timeoutMs: 20_000 });
  } catch (error: unknown) {
    throw mapApiError(error);
  }

  try {
    return parsePage(body, identities);
  } catch (error: unknown) {
    if (error instanceof MobileFieldValidationAssignmentsApiError) throw error;
    throw new MobileFieldValidationAssignmentsApiError(
      'MALFORMED_RESPONSE',
      'The assignment feed response was invalid.',
    );
  }
}

function parsePage(body: unknown, identities: AssignmentIdentityIndex): {
  nextPath: string | null;
  syncBefore: string;
  sync: SyncEnvelope;
  assignments: FieldValidationAssignmentUpdate[];
  skippedCount: number;
} {
  if (!isRecord(body) || !Array.isArray(body.data) || !isRecord(body.links)) {
    throw new MobileFieldValidationAssignmentsApiError(
      'MALFORMED_RESPONSE',
      'The assignment feed page is incomplete.',
    );
  }
  const sync = isRecord(body.sync) ? body.sync : null;
  const syncBefore = requireTimestamp(sync?.before, 'sync.before');
  const rawNext = body.links.next;
  if (rawNext !== null && typeof rawNext !== 'string') {
    throw new MobileFieldValidationAssignmentsApiError(
      'MALFORMED_RESPONSE',
      'The assignment feed continuation is invalid.',
    );
  }

  const assignments: FieldValidationAssignmentUpdate[] = [];
  let skippedCount = 0;
  body.data.forEach((item, index) => {
    try {
      const assignment = parseAssignment(item, identities);
      if (assignment) assignments.push(assignment);
      else skippedCount += 1;
    } catch (error: unknown) {
      throw withItemReference(error, item, index);
    }
  });

  return {
    nextPath: rawNext === null ? null : toSafeContinuationPath(rawNext),
    syncBefore,
    sync: parseSync(sync),
    assignments,
    skippedCount,
  };
}

/** Names the failing record so a broken identity is traceable to one item. */
function withItemReference(error: unknown, item: unknown, index: number): unknown {
  if (
    !(error instanceof MobileFieldValidationAssignmentsApiError) ||
    error.code !== 'MALFORMED_RESPONSE'
  ) {
    return error;
  }
  const reference =
    isRecord(item) && typeof item.reference_code === 'string' && item.reference_code.trim()
      ? `reference ${item.reference_code}`
      : `index ${index}`;
  return new MobileFieldValidationAssignmentsApiError(
    'MALFORMED_RESPONSE',
    `${error.message} (record ${reference})`,
    error.status,
  );
}

/** Returns null when the record is skipped for an unknown field_validation_state. */
function parseAssignment(
  value: unknown,
  identities: AssignmentIdentityIndex,
): FieldValidationAssignmentUpdate | null {
  if (!isRecord(value)) throw malformed('assignment item');
  const id = requireUuid(value.uuid, 'uuid');
  const reportUuid = requireUuid(value.report_uuid, 'report_uuid');
  const reportClientUuid = requireUuid(value.report_client_uuid, 'report_client_uuid');
  const referenceCode = requireString(value.reference_code, 'reference_code');
  registerIdentity(identities, id, reportUuid);
  const submitter = parsePerson(value.submitter, 'submitter');
  const assignee = parsePerson(value.assignee, 'assignee');
  const targetVisitDate = parseDate(value.target_visit_date, 'target_visit_date');
  const fieldValidationState = parseAssignmentState(value.field_validation_state);
  const assignedAt = requireTimestamp(value.assigned_at, 'assigned_at');
  const updatedAt = requireTimestamp(value.updated_at, 'updated_at');
  const rawCase = isRecord(value.case) ? value.case : null;
  if (!rawCase) throw malformed('case');

  const update = {
    id,
    reportUuid,
    reportClientUuid,
    referenceCode,
    submitter,
    assignee,
    submitterIsAssignee: requireBoolean(value.submitter_is_assignee, 'submitter_is_assignee'),
    targetVisitDate,
    assignedAt,
    updatedAt,
    case: {
      barangay: requireString(rawCase.barangay, 'case.barangay'),
      province: optionalString(rawCase.province, 'case.province'),
      municipality: optionalString(rawCase.municipality, 'case.municipality'),
      farmerOrFarmOwnerName: optionalString(
        rawCase.farmer_or_farm_owner_name,
        'case.farmer_or_farm_owner_name',
      ),
      affectedAreaHectares: optionalNumber(
        rawCase.affected_area_hectares,
        'case.affected_area_hectares',
        0,
      ),
      affectedPortionPercent: optionalNumber(
        rawCase.affected_portion_percent,
        'case.affected_portion_percent',
        0,
        100,
      ),
      capturedAt: requireTimestamp(rawCase.captured_at, 'case.captured_at'),
      observedAt: optionalTimestamp(rawCase.observed_at, 'case.observed_at'),
      submittedAt: requireTimestamp(rawCase.submitted_at, 'case.submitted_at'),
      predictedLabel: parsePredictedLabel(rawCase.predicted_label),
      confidence: requireNumber(rawCase.confidence, 'case.confidence', 0, 1),
    },
    previousVisit: parsePreviousVisit(value.previous_visit),
  };
  // Vocabulary is filtered only after identity and the whole record shape validated.
  if (fieldValidationState === null) return null;
  return { ...update, fieldValidationState };
}

function parsePreviousVisit(value: unknown): PreviousVisitContext | null {
  if (value === undefined || value === null) return null;
  if (!isRecord(value)) throw malformed('previous_visit');
  return {
    referenceCode: requireString(value.reference_code, 'previous_visit.reference_code'),
    visitedAt: requireTimestamp(value.visited_at, 'previous_visit.visited_at'),
    reporterSuspectedCondition: optionalString(
      value.reporter_suspected_condition,
      'previous_visit.reporter_suspected_condition',
    ),
    authorityClassifiedCondition: optionalString(
      value.authority_classified_condition,
      'previous_visit.authority_classified_condition',
    ),
    actionTaken: requireString(value.action_taken, 'previous_visit.action_taken'),
    followUpOutcome: parseFollowUpOutcome(value.follow_up_outcome),
    fieldObservation: optionalString(value.field_observation, 'previous_visit.field_observation'),
    fieldFinding: optionalString(value.field_finding, 'previous_visit.field_finding'),
    freshPhotoAvailable: requireBoolean(
      value.fresh_photo_available,
      'previous_visit.fresh_photo_available',
    ),
  };
}

export function buildMobilePreviousEvidencePhotoPath(assignmentId: string): string {
  if (!UUID_PATTERN.test(assignmentId)) throw malformed('assignment uuid');
  return `${ASSIGNMENT_PATH}/${encodeURIComponent(assignmentId)}/previous-evidence-photo`;
}

export function buildMobilePreviousEvidencePhotoUrl(assignmentId: string): string {
  return buildApiUrl(buildMobilePreviousEvidencePhotoPath(assignmentId));
}

function parsePerson(value: unknown, field: string): { uuid: string; name: string } {
  if (!isRecord(value)) throw malformed(field);
  return {
    uuid: requireUuid(value.uuid, `${field}.uuid`),
    name: requireString(value.name, `${field}.name`),
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

function buildInitialPath(updatedAfter: string | null | undefined, since: string | null): string {
  const query = new URLSearchParams({
    per_page: String(PAGE_SIZE),
    limit: String(ASSIGNMENT_WORK_SET_CAP),
  });
  if (updatedAfter) query.set('updated_after', updatedAfter);
  if (since) query.set('since', since);
  return `${ASSIGNMENT_PATH}?${query.toString()}`;
}

function toSafeContinuationPath(rawUrl: string): string {
  let url: URL;
  let base: URL;
  try {
    base = new URL(apiBaseUrl);
    url = new URL(rawUrl, base);
  } catch {
    throw new MobileFieldValidationAssignmentsApiError(
      'ORIGIN_MISMATCH',
      'The assignment feed continuation is not a valid URL.',
    );
  }
  if (url.origin !== base.origin) {
    throw new MobileFieldValidationAssignmentsApiError(
      'ORIGIN_MISMATCH',
      'The assignment feed continuation left the API origin.',
    );
  }
  const basePath = base.pathname.replace(/\/+$/, '');
  if (basePath && basePath !== '/' && !url.pathname.startsWith(`${basePath}/`)) {
    throw new MobileFieldValidationAssignmentsApiError(
      'ORIGIN_MISMATCH',
      'The assignment feed continuation left the API path boundary.',
    );
  }
  if (url.pathname !== ASSIGNMENT_PATH && !url.pathname.startsWith(`${ASSIGNMENT_PATH}/`)) {
    throw new MobileFieldValidationAssignmentsApiError(
      'ORIGIN_MISMATCH',
      'The assignment feed continuation left the endpoint boundary.',
    );
  }
  return `${url.pathname}${url.search}`;
}

function assertContinuationCheckpoint(path: string, syncBefore: string): void {
  const url = new URL(path, apiBaseUrl);
  const checkpoint = url.searchParams.get('sync_before');
  if (checkpoint && checkpoint !== syncBefore) {
    throw new MobileFieldValidationAssignmentsApiError(
      'MALFORMED_RESPONSE',
      'The assignment feed continuation changed its checkpoint.',
    );
  }
}

interface AssignmentIdentityIndex {
  ids: Set<string>;
  reportIds: Set<string>;
}

/** Checked for every record in the feed, including records skipped for unknown vocabulary. */
function registerIdentity(
  identities: AssignmentIdentityIndex,
  id: string,
  reportUuid: string,
): void {
  // UUIDs are case-insensitive: compare their lowercase form.
  id = id.toLowerCase();
  reportUuid = reportUuid.toLowerCase();
  if (identities.ids.has(id) || identities.reportIds.has(reportUuid)) {
    throw new MobileFieldValidationAssignmentsApiError(
      'MALFORMED_RESPONSE',
      'The assignment feed contains duplicate identities.',
    );
  }
  identities.ids.add(id);
  identities.reportIds.add(reportUuid);
}

function requireUuid(value: unknown, field: string): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) throw malformed(field);
  return value;
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

function parseDate(value: unknown, field: string): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || !DATE_PATTERN.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw malformed(field);
  }
  return value;
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw malformed(field);
  return value;
}

function requireNumber(value: unknown, field: string, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) throw malformed(field);
  return value;
}

function optionalNumber(value: unknown, field: string, minimum: number, maximum = Number.POSITIVE_INFINITY): number | null {
  if (value === null) return null;
  return requireNumber(value, field, minimum, maximum);
}

/** Strict on shape (must be a string), tolerant on vocabulary (unknown state => null). */
function parseAssignmentState(value: unknown): FieldValidationAssignmentState | null {
  if (typeof value !== 'string' || !value.trim()) throw malformed('field_validation_state');
  return (FIELD_VALIDATION_ASSIGNMENT_STATES as readonly string[]).includes(value)
    ? (value as FieldValidationAssignmentState)
    : null;
}

/** Strict on shape (must be a string or null), tolerant on vocabulary (unknown outcome => null). */
function parseFollowUpOutcome(value: unknown): FieldValidationFollowUpOutcome | null {
  if (value === null) return null;
  if (typeof value !== 'string' || !value.trim()) throw malformed('previous_visit.follow_up_outcome');
  return (FIELD_VALIDATION_FOLLOW_UP_OUTCOMES as readonly string[]).includes(value)
    ? (value as FieldValidationFollowUpOutcome)
    : null;
}

/** Strict on shape (must be a string), tolerant on vocabulary (unknown label => 'unknown'). */
function parsePredictedLabel(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw malformed('case.predicted_label');
  return (MODEL_LABELS as readonly string[]).includes(value) ? value : UNKNOWN_PREDICTED_LABEL;
}

function malformed(field: string): MobileFieldValidationAssignmentsApiError {
  return new MobileFieldValidationAssignmentsApiError(
    'MALFORMED_RESPONSE',
    `The assignment feed field ${field} is invalid.`,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function mapApiError(error: unknown): MobileFieldValidationAssignmentsApiError {
  if (error instanceof MobileFieldValidationAssignmentsApiError) return error;
  if (error instanceof ApiHttpError) {
    if (error.status === 401) return new MobileFieldValidationAssignmentsApiError('AUTH_REQUIRED', 'The assignment session expired.', error.status);
    if (error.status === 409 && isRecord(error.body) && error.body.code === 'SYNC_RESTART') return new MobileFieldValidationAssignmentsApiError('SYNC_RESTART', 'The assignment set changed during the download.', error.status);
    if (error.status === 403 || error.status === 404) return new MobileFieldValidationAssignmentsApiError('CAPABILITY_UNAVAILABLE', 'Field validation assignments are unavailable on this server.', error.status);
    return new MobileFieldValidationAssignmentsApiError('NETWORK', 'Field validation assignments could not be refreshed.', error.status);
  }
  if (isAbortError(error)) return new MobileFieldValidationAssignmentsApiError('TIMEOUT', 'The assignment request timed out.');
  return new MobileFieldValidationAssignmentsApiError('NETWORK', 'Field validation assignments could not be refreshed.');
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
