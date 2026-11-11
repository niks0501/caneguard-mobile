import type { FieldSurveyRow } from '@/database/schema';
import {
  boundaryCanEdit,
  boundaryRetriesItself,
  boundaryState,
} from '@/features/surveys/domain/boundaryState';
import {
  measureAffectedAreas,
  validateAffectedAreaWaypoints,
  validateSurveyWaypoints,
  type SurveyPolygon,
  type SurveyWaypoint,
} from '@/features/surveys/domain/fieldSurvey';

export type AttachedBoundaryInput = Pick<
  FieldSurveyRow,
  | 'activeAffectedWaypointsJson'
  | 'affectedAreaPolygonsJson'
  | 'affectedAreaWaypointsJson'
  | 'capturedAt'
  | 'districtCode'
  | 'lastSyncErrorCode'
  | 'remoteId'
  | 'status'
  | 'waypointsJson'
>;

export interface AttachedBoundarySend {
  affectedAreaSqm: number;
  affectedAreaWaypoints: SurveyWaypoint[][];
  affectedAreas: SurveyPolygon[];
  areaSqm: number;
  capturedAt: string;
  polygon: SurveyPolygon;
}

/**
 * `on_its_way` — the office already has it, or it retries without anyone pressing
 * a button. `queue` — it is still a local draft that must be queued now.
 * `blocked` — it is attached to a report but cannot be sent, so the report must wait.
 */
export type AttachedBoundarySendPlan =
  | { status: 'blocked' }
  | { status: 'on_its_way' }
  | { status: 'queue'; send: AttachedBoundarySend };

function jsonArray(text: string | null): unknown[] | null {
  if (text === null) return [];
  try {
    const parsed: unknown = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function asWaypoints(value: unknown): SurveyWaypoint[] | null {
  return Array.isArray(value) &&
    value.every((point) => typeof point === 'object' && point !== null)
    ? (value as SurveyWaypoint[])
    : null;
}

/**
 * "Send together": decides how an attached boundary travels with its report.
 * A boundary that can still be edited is queued with its current measurement; a
 * boundary the office will never receive without more work blocks the report.
 */
export function planAttachedBoundarySend(
  row: AttachedBoundaryInput,
): AttachedBoundarySendPlan {
  const state = boundaryState(row);
  if (row.remoteId || state === 'sent') return { status: 'on_its_way' };
  if (!boundaryCanEdit(state)) {
    return boundaryRetriesItself(state) || state === 'sending'
      ? { status: 'on_its_way' }
      : { status: 'blocked' };
  }
  if (!row.districtCode.trim() || row.districtCode === 'UNSPECIFIED') {
    return { status: 'blocked' };
  }
  const waypoints = asWaypoints(jsonArray(row.waypointsJson));
  if (!waypoints) return { status: 'blocked' };
  const plot = validateSurveyWaypoints(waypoints);
  if (!plot.valid) return { status: 'blocked' };
  const affectedAreaJson = jsonArray(row.affectedAreaPolygonsJson);
  if (affectedAreaJson === null) return { status: 'blocked' };
  const affectedAreas = affectedAreaJson as SurveyPolygon[];
  const affected = measureAffectedAreas(plot.polygon, affectedAreas);
  if (!affected.valid) return { status: 'blocked' };
  const affectedAreaWaypointJson = jsonArray(row.affectedAreaWaypointsJson);
  if (affectedAreaWaypointJson === null) return { status: 'blocked' };
  const affectedAreaWaypoints: SurveyWaypoint[][] = [];
  for (const set of affectedAreaWaypointJson) {
    const points = asWaypoints(set);
    if (!points) return { status: 'blocked' };
    affectedAreaWaypoints.push(points);
  }
  if (!validateAffectedAreaWaypoints(affectedAreas, affectedAreaWaypoints).valid) {
    return { status: 'blocked' };
  }
  const activeAffectedWaypoints = jsonArray(row.activeAffectedWaypointsJson);
  if (activeAffectedWaypoints === null || activeAffectedWaypoints.length > 0) {
    return { status: 'blocked' };
  }
  return {
    status: 'queue',
    send: {
      affectedAreaSqm: affected.areaSqm,
      affectedAreaWaypoints,
      affectedAreas,
      areaSqm: plot.areaSqm,
      capturedAt: row.capturedAt,
      polygon: plot.polygon,
    },
  };
}
