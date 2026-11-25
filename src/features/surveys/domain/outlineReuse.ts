import type { FieldSurveyRow } from '@/database/schema';
import {
  validateSurveyPolygon,
  validateSurveyWaypoints,
  type SurveyPolygon,
  type SurveyWaypoint,
} from '@/features/surveys/domain/fieldSurvey';

/**
 * Reusing a plot outline starts a NEW map: only the outer edge is copied, never the damage,
 * so % affected always describes today's visit.
 */
export interface ReusableOutline {
  clientUuid: string;
  /** The office's id for the map this outline came from; null while that map has not been sent. */
  remoteId: string | null;
  name: string | null;
  hectares: string;
  waypoints: SurveyWaypoint[];
}

/** The most earlier maps offered at once. */
export const REUSABLE_OUTLINE_LIMIT = 5;

/** Plot corners of a polygon as map-drawn waypoints, or null when the polygon is not a usable plot. */
export function waypointsFromOutline(polygon: SurveyPolygon, capturedAt: string): SurveyWaypoint[] | null {
  if (!validateSurveyPolygon(polygon).valid) return null;
  const ring = polygon.coordinates[0];
  const waypoints: SurveyWaypoint[] = ring.slice(0, -1).map(([longitude, latitude]) => ({
    latitude,
    longitude,
    accuracyMeters: null,
    capturedAt,
    source: 'map',
  }));
  return validateSurveyWaypoints(waypoints).valid ? waypoints : null;
}

function plotWaypoints(row: FieldSurveyRow): SurveyWaypoint[] | null {
  try {
    const parsed: unknown = JSON.parse(row.waypointsJson);
    return Array.isArray(parsed) ? (parsed as SurveyWaypoint[]) : null;
  } catch {
    return null;
  }
}

/** The inspector's own earlier maps whose plot measures cleanly, newest first. */
export function reusableOutlines(
  rows: FieldSurveyRow[],
  excludeClientUuid: string,
  limit = REUSABLE_OUTLINE_LIMIT,
): ReusableOutline[] {
  const outlines: ReusableOutline[] = [];
  for (const row of rows) {
    if (outlines.length >= limit) break;
    if (row.clientUuid === excludeClientUuid) continue;
    const waypoints = plotWaypoints(row);
    if (!waypoints) continue;
    const plot = validateSurveyWaypoints(waypoints);
    if (!plot.valid) continue;
    outlines.push({
      clientUuid: row.clientUuid,
      remoteId: row.remoteId,
      name: row.label?.trim() || null,
      hectares: (plot.areaSqm / 10_000).toFixed(2),
      waypoints,
    });
  }
  return outlines;
}

/** The office id as the wire number, or null when it is not a positive integer. */
export function outlineSourceId(remoteId: string | null | undefined): number | null {
  if (!remoteId || !/^\d+$/.test(remoteId)) return null;
  const id = Number(remoteId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
