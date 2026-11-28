import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';
import type { SurveyPolygon } from '@/features/surveys/domain/fieldSurvey';

export interface FieldSurveyAffectedAreaWaypointProvenance {
  source: 'map' | 'gps';
  accuracy_meters: number | null;
  captured_at: string;
}

export interface FieldSurveyMeasurementProvenance {
  method: 'wgs84-ellipsoid-geodesic';
  plot_area_sqm: number;
  affected_area_sqm: number;
  source_polygon_count: number;
  overlap_removed: boolean;
  containment_tolerance_m: number;
  affected_area_waypoint_provenance: FieldSurveyAffectedAreaWaypointProvenance[][];
}

/**
 * Wire names of this payload are proposed and pending Web/API approval.
 * `affected_area_polygons`, `affected_area_sqm`, and `measurement_provenance`
 * must not be renamed or extended here before that approval; per-waypoint
 * affected-area provenance travels inside `measurement_provenance` and never
 * repeats coordinates. `label` is the optional field name, approved with the
 * office contract in `mobile-field-surveys-v1.md`.
 */
export interface SubmitFieldSurveyPayload {
  /** Optional name the inspector typed, at most 60 characters; omitted when blank. */
  label?: string;
  /** Server id of an earlier map whose plot outline this one reused; provenance only. */
  outline_from_survey_id?: number;
  area_sqm: number;
  /** NET-3 provenance frozen when the boundary was queued; stored as-is by the office. */
  authorization_basis?: 'verified' | 'carryover';
  capabilities_verified_at?: string;
  affected_area_polygons: SurveyPolygon[];
  /** Null while the affected ground is unmeasured; 0 only for a confirmed "no affected area found". */
  affected_area_sqm: number | null;
  /** Pairs with `affected_area_sqm`: `not_measured` sends null, `measured` sends the figure (0 allowed). */
  affected_area_measurement: 'measured' | 'not_measured';
  measurement_provenance: FieldSurveyMeasurementProvenance;
  captured_at: string;
  client_uuid: string;
  district_code: string;
  polygon: SurveyPolygon;
}

export interface SubmitFieldSurveyResult {
  id: string;
  status: 'kept';
}

export class FieldSurveyValidationError extends Error {
  readonly fieldErrors: Record<string, string[]>;
  constructor(fieldErrors: Record<string, string[]>) {
    super('The server needs changes to this boundary survey.');
    this.name = 'FieldSurveyValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export async function submitFieldSurvey(
  payload: SubmitFieldSurveyPayload,
  token: string,
): Promise<SubmitFieldSurveyResult> {
  try {
    const result = await apiRequest<SubmitFieldSurveyResult>('/api/v1/mobile/field-surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      token,
    });
    if (!result || result.status !== 'kept' || typeof result.id !== 'string' || !result.id) {
      throw new Error('The server did not confirm that the field survey was kept.');
    }
    return result;
  } catch (error: unknown) {
    if (error instanceof ApiHttpError && error.status === 422) {
      throw new FieldSurveyValidationError(readFieldErrors(error.body));
    }
    throw error;
  }
}

function readFieldErrors(body: unknown): Record<string, string[]> {
  if (!body || typeof body !== 'object') return { survey: ['Please review this boundary and try again.'] };
  const candidate = (body as { errors?: unknown }).errors;
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return { survey: ['Please review this boundary and try again.'] };
  }
  const errors: Record<string, string[]> = {};
  for (const [field, messages] of Object.entries(candidate)) {
    if (Array.isArray(messages)) {
      const safe = messages.filter((message): message is string => typeof message === 'string');
      if (safe.length) errors[field] = safe;
    } else if (typeof messages === 'string') {
      errors[field] = [messages];
    }
  }
  return Object.keys(errors).length ? errors : { survey: ['Please review this boundary and try again.'] };
}

/** What the office decided about one of this inspector's maps. */
export type FieldSurveyOfficeVerdict = 'confirmed' | 'wrong_field' | 'pending';

const OFFICE_VERDICTS: readonly string[] = ['confirmed', 'wrong_field', 'pending'];

/**
 * The office's verdict for each of this inspector's maps attached to a case, keyed by the
 * survey's `client_uuid`. A malformed row is dropped rather than guessed at.
 */
export async function fetchFieldSurveyOfficeStatus(token: string): Promise<Map<string, FieldSurveyOfficeVerdict>> {
  const body = await apiRequest<{ data?: unknown }>('/api/v1/mobile/field-surveys/office-status', { token });
  const verdicts = new Map<string, FieldSurveyOfficeVerdict>();
  if (!body || !Array.isArray(body.data)) return verdicts;
  for (const row of body.data) {
    if (!row || typeof row !== 'object') continue;
    const { client_uuid: clientUuid, verdict } = row as { client_uuid?: unknown; verdict?: unknown };
    if (typeof clientUuid === 'string' && typeof verdict === 'string' && OFFICE_VERDICTS.includes(verdict)) {
      verdicts.set(clientUuid.toLowerCase(), verdict as FieldSurveyOfficeVerdict);
    }
  }
  return verdicts;
}

/** The one map of a case the inspector is assigned to, read-only, for reusing its plot outline. */
export interface AssignmentFieldMap {
  fieldSurveyId: number;
  source: 'confirmed' | 'attached';
  label: string | null;
  polygon: SurveyPolygon;
  areaSqm: number;
  inspectorName: string;
}

/** The assigned case's map, or null when the case has none or the reply cannot be read. */
export async function fetchAssignmentFieldMap(assignmentUuid: string, token: string): Promise<AssignmentFieldMap | null> {
  const body = await apiRequest<{ data?: unknown }>(
    `/api/v1/mobile/assignments/${encodeURIComponent(assignmentUuid)}/field-map`,
    { token },
  );
  const data = body?.data;
  if (!data || typeof data !== 'object') return null;
  const map = data as Record<string, unknown>;
  const geometry = map.geometry as { type?: unknown; coordinates?: unknown } | null;
  const inspector = map.inspector as { name?: unknown } | null;
  if (
    !Number.isSafeInteger(map.field_survey_id) || (map.field_survey_id as number) <= 0 ||
    (map.source !== 'confirmed' && map.source !== 'attached') ||
    geometry?.type !== 'Polygon' || !Array.isArray(geometry.coordinates) ||
    typeof map.area_sqm !== 'number' || typeof inspector?.name !== 'string'
  ) return null;
  return {
    fieldSurveyId: map.field_survey_id as number,
    source: map.source,
    label: typeof map.label === 'string' && map.label.trim() ? map.label.trim() : null,
    polygon: { type: 'Polygon', coordinates: geometry.coordinates as number[][][] },
    areaSqm: map.area_sqm,
    inspectorName: inspector.name,
  };
}
