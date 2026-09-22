import { apiBaseUrl } from '@/config/env';
import { ApiHttpError, apiRequest, buildApiUrl } from '@/features/shared/api/apiClient';
import {
  FIELD_VALIDATION_ASSIGNMENT_STATES,
  FIELD_VALIDATION_FOLLOW_UP_OUTCOMES,
  type FieldValidationAssignmentState,
} from '@/database/schema';
import type {
  FieldValidationAssignmentUpdate,
} from '@/features/assignments/domain/assignmentTypes';
import type { PreviousVisitContext } from '@/features/assignments/domain/previousVisit';
import { MODEL_LABELS } from '@/features/detection/constants/modelContract';

const ASSIGNMENT_PATH = '/api/v1/mobile/assignments';
const PAGE_SIZE = 100;
const MAX_PAGES = 500;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface MobileFieldValidationAssignmentsResult {
  syncBefore: string;
  assignments: FieldValidationAssignmentUpdate[];
}

export type MobileFieldValidationAssignmentsErrorCode =
  | 'AUTH_REQUIRED'
  | 'CAPABILITY_UNAVAILABLE'
  | 'MALFORMED_RESPONSE'
  | 'NETWORK'
  | 'ORIGIN_MISMATCH'
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
}): Promise<MobileFieldValidationAssignmentsResult> {
  const initialPath = buildInitialPath(options.updatedAfter);
  const visited = new Set<string>();
  const assignments: FieldValidationAssignmentUpdate[] = [];
  let path: string | null = initialPath;
  let syncBefore: string | null = null;

  for (let pageNumber = 0; path; pageNumber += 1) {
    if (pageNumber >= MAX_PAGES || visited.has(path)) {
      throw new MobileFieldValidationAssignmentsApiError(
        'MALFORMED_RESPONSE',
        'The assignment feed pagination did not complete safely.',
      );
    }
    visited.add(path);

    const page = await requestPage(path, options.token);
    if (syncBefore && page.syncBefore !== syncBefore) {
      throw new MobileFieldValidationAssignmentsApiError(
        'MALFORMED_RESPONSE',
        'The assignment feed checkpoint changed during pagination.',
      );
    }
    syncBefore ??= page.syncBefore;
    assignments.push(...page.assignments);

    if (page.nextPath) {
      assertContinuationCheckpoint(page.nextPath, syncBefore);
    }
    path = page.nextPath;
  }

  if (!syncBefore) {
    throw new MobileFieldValidationAssignmentsApiError(
      'MALFORMED_RESPONSE',
      'The assignment feed did not provide a server checkpoint.',
    );
  }

  assertUniqueIdentities(assignments);
  return { syncBefore, assignments };
}

async function requestPage(
  path: string,
  token: string,
): Promise<{
  nextPath: string | null;
  syncBefore: string;
  assignments: FieldValidationAssignmentUpdate[];
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
    if (error instanceof MobileFieldValidationAssignmentsApiError) throw error;
    throw new MobileFieldValidationAssignmentsApiError(
      'MALFORMED_RESPONSE',
      'The assignment feed response was invalid.',
    );
  }
}

function parsePage(body: unknown): {
  nextPath: string | null;
  syncBefore: string;
  assignments: FieldValidationAssignmentUpdate[];
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

  return {
    nextPath: rawNext === null ? null : toSafeContinuationPath(rawNext),
    syncBefore,
    assignments: body.data.map(parseAssignment),
  };
}

function parseAssignment(value: unknown): FieldValidationAssignmentUpdate {
  if (!isRecord(value)) throw malformed('assignment item');
  const id = requireUuid(value.uuid, 'uuid');
  const reportUuid = requireUuid(value.report_uuid, 'report_uuid');
  const reportClientUuid = requireUuid(value.report_client_uuid, 'report_client_uuid');
  const referenceCode = requireString(value.reference_code, 'reference_code');
  const submitter = parsePerson(value.submitter, 'submitter');
  const assignee = parsePerson(value.assignee, 'assignee');
  const targetVisitDate = parseDate(value.target_visit_date, 'target_visit_date');
  const fieldValidationState = parseAssignmentState(value.field_validation_state);
  const assignedAt = requireTimestamp(value.assigned_at, 'assigned_at');
  const updatedAt = requireTimestamp(value.updated_at, 'updated_at');
  const rawCase = isRecord(value.case) ? value.case : null;
  if (!rawCase) throw malformed('case');

  return {
    id,
    reportUuid,
    reportClientUuid,
    referenceCode,
    submitter,
    assignee,
    submitterIsAssignee: requireBoolean(value.submitter_is_assignee, 'submitter_is_assignee'),
    targetVisitDate,
    fieldValidationState,
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
      predictedLabel: requireEnum(
        rawCase.predicted_label,
        'case.predicted_label',
        MODEL_LABELS,
      ),
      confidence: requireNumber(rawCase.confidence, 'case.confidence', 0, 1),
    },
    previousVisit: parsePreviousVisit(value.previous_visit),
  };
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
    followUpOutcome: optionalEnum(
      value.follow_up_outcome,
      'previous_visit.follow_up_outcome',
      FIELD_VALIDATION_FOLLOW_UP_OUTCOMES,
    ),
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

function buildInitialPath(updatedAfter: string | null | undefined): string {
  const query = new URLSearchParams({ per_page: String(PAGE_SIZE) });
  if (updatedAfter) query.set('updated_after', updatedAfter);
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

function assertUniqueIdentities(assignments: FieldValidationAssignmentUpdate[]): void {
  const ids = new Set<string>();
  const reportIds = new Set<string>();
  for (const assignment of assignments) {
    if (ids.has(assignment.id) || reportIds.has(assignment.reportUuid)) {
      throw new MobileFieldValidationAssignmentsApiError(
        'MALFORMED_RESPONSE',
        'The assignment feed contains duplicate identities.',
      );
    }
    ids.add(assignment.id);
    reportIds.add(assignment.reportUuid);
  }
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

function optionalEnum<T extends string>(value: unknown, field: string, values: readonly T[]): T | null {
  if (value === null) return null;
  return requireEnum(value, field, values);
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

function requireEnum<T extends string>(value: unknown, field: string, values: readonly T[]): T {
  if (typeof value !== 'string' || !values.includes(value as T)) throw malformed(field);
  return value as T;
}

function parseAssignmentState(value: unknown): FieldValidationAssignmentState {
  return requireEnum(value, 'field_validation_state', FIELD_VALIDATION_ASSIGNMENT_STATES);
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
    if (error.status === 403 || error.status === 404) return new MobileFieldValidationAssignmentsApiError('CAPABILITY_UNAVAILABLE', 'Field validation assignments are unavailable on this server.', error.status);
    return new MobileFieldValidationAssignmentsApiError('NETWORK', 'Field validation assignments could not be refreshed.', error.status);
  }
  if (isAbortError(error)) return new MobileFieldValidationAssignmentsApiError('TIMEOUT', 'The assignment request timed out.');
  return new MobileFieldValidationAssignmentsApiError('NETWORK', 'Field validation assignments could not be refreshed.');
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
