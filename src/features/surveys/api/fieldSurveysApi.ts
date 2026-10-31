import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';
import type { SurveyPolygon } from '@/features/surveys/domain/fieldSurvey';

export interface FieldSurveyMeasurementProvenance {
  method: 'wgs84-ellipsoid-geodesic';
  plot_area_sqm: number;
  affected_area_sqm: number;
  source_polygon_count: number;
  overlap_removed: boolean;
}

export interface FieldSurveyAffectedAreaWaypoint {
  latitude: number;
  longitude: number;
  source: 'map' | 'gps';
  accuracy_meters: number | null;
  captured_at: string;
}

export interface SubmitFieldSurveyPayload {
  area_sqm: number;
  affected_area_polygons: SurveyPolygon[];
  affected_area_sqm: number;
  affected_area_waypoints: FieldSurveyAffectedAreaWaypoint[][];
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
