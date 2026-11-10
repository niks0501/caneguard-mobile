import { PREFERRED_GPS_ACCURACY_METERS } from '@/features/reports/services/captureGpsLocation';
import { ACCEPTABLE_GPS_ACCURACY_METERS, assessBoundaryQuality, type BoundaryGpsState } from '@/features/surveys/domain/boundaryQuality';
import {
  findAffectedAreasOutsidePlot,
  measureAffectedAreas,
  snapAffectedAreaWaypoints,
  validateSurveyWaypoints,
  type SurveyPolygon,
  type SurveyWaypoint,
} from '@/features/surveys/domain/fieldSurvey';

/** What the drawing tool is doing right now; shown as a chip above the map. */
export type DrawingToolState = 'idle' | 'plot.add' | 'plot.move' | 'affected.add' | 'affected.closable' | 'affected.move';

export function drawingToolState(input: {
  locked: boolean;
  drawingAffectedArea: boolean;
  hasSelection: boolean;
  activeAffectedCount: number;
}): DrawingToolState {
  if (input.locked) return 'idle';
  if (input.hasSelection) return input.drawingAffectedArea ? 'affected.move' : 'plot.move';
  if (!input.drawingAffectedArea) return 'plot.add';
  return input.activeAffectedCount >= 3 ? 'affected.closable' : 'affected.add';
}

/** How one drawn point is shown: placed on the map, or by GPS reading quality. */
export type PointQuality = 'map' | 'good' | 'acceptable' | 'weak' | 'unknown';

export function pointQuality(point: Pick<SurveyWaypoint, 'source' | 'accuracyMeters'>): PointQuality {
  if (point.source !== 'gps') return 'map';
  if (point.accuracyMeters === null) return 'unknown';
  if (point.accuracyMeters <= PREFERRED_GPS_ACCURACY_METERS) return 'good';
  return point.accuracyMeters <= ACCEPTABLE_GPS_ACCURACY_METERS ? 'acceptable' : 'weak';
}

export type BoundaryBadge = 'drawn_on_map' | BoundaryGpsState;

/** Judged on GPS readings only: a point placed on the map has no GPS accuracy to be low. */
export function boundaryBadge(waypoints: SurveyWaypoint[]): BoundaryBadge {
  const gpsPoints = waypoints.filter((point) => point.source === 'gps');
  return gpsPoints.length === 0 ? 'drawn_on_map' : assessBoundaryQuality(gpsPoints).state;
}

/** The shape being drawn, as one value so undo can restore every kind of edit. */
export interface DrawingShape {
  waypoints: SurveyWaypoint[];
  affectedAreas: SurveyPolygon[];
  affectedAreaWaypointSets: SurveyWaypoint[][];
  affectedWaypoints: SurveyWaypoint[];
}

export const MAX_UNDO_STEPS = 50;

export function pushUndo(history: DrawingShape[], shape: DrawingShape): DrawingShape[] {
  return [...history, shape].slice(-MAX_UNDO_STEPS);
}

/** A point in one of the three editable sets: the plot ring, the unfinished area, or a finished area. */
export type PointRef =
  | { set: 'plot'; index: number }
  | { set: 'active'; index: number }
  | { set: 'area'; area: number; index: number };

export function sameRef(a: PointRef | null, b: PointRef | null): boolean {
  if (!a || !b) return a === b;
  if (a.set !== b.set || a.index !== b.index) return false;
  return a.set !== 'area' || (b.set === 'area' && a.area === b.area);
}

export function pointOf(shape: DrawingShape, ref: PointRef): SurveyWaypoint | null {
  const set = ref.set === 'plot' ? shape.waypoints : ref.set === 'active' ? shape.affectedWaypoints : shape.affectedAreaWaypointSets[ref.area];
  return set?.[ref.index] ?? null;
}

export type EditResult = { ok: true; shape: DrawingShape } | { ok: false; message: string };

const AREA_TOO_SMALL = 'An affected area needs at least three points. Remove the area instead.';

/**
 * Applies a new point list to one set. A finished area is re-derived from its
 * points and must stay a valid shape inside the plot, otherwise the edit is refused.
 */
function withSet(shape: DrawingShape, ref: PointRef, next: SurveyWaypoint[]): EditResult {
  if (ref.set === 'plot') return { ok: true, shape: { ...shape, waypoints: next } };
  if (ref.set === 'active') return { ok: true, shape: { ...shape, affectedWaypoints: next } };
  if (next.length < 3) return { ok: false, message: AREA_TOO_SMALL };
  const plot = validateSurveyWaypoints(shape.waypoints);
  const snapped = plot.valid ? snapAffectedAreaWaypoints(plot.polygon, next) : next;
  const candidate = validateSurveyWaypoints(snapped);
  if (!candidate.valid) return { ok: false, message: candidate.error.message };
  const polygons = shape.affectedAreas.map((area, index) => index === ref.area ? candidate.polygon : area);
  if (plot.valid) {
    const measured = measureAffectedAreas(plot.polygon, polygons);
    if (!measured.valid) return { ok: false, message: measured.error.message };
  }
  return {
    ok: true,
    shape: {
      ...shape,
      affectedAreas: polygons,
      affectedAreaWaypointSets: shape.affectedAreaWaypointSets.map((set, index) => index === ref.area ? snapped : set),
    },
  };
}

function setOf(shape: DrawingShape, ref: PointRef): SurveyWaypoint[] {
  return ref.set === 'plot' ? shape.waypoints : ref.set === 'active' ? shape.affectedWaypoints : shape.affectedAreaWaypointSets[ref.area] ?? [];
}

/** A moved point is placed on the map by hand, so its GPS reading no longer applies to it. */
export function movePoint(shape: DrawingShape, ref: PointRef, to: { latitude: number; longitude: number }, capturedAt = new Date().toISOString()): EditResult {
  const current = setOf(shape, ref);
  if (!current[ref.index] || !Number.isFinite(to.latitude) || !Number.isFinite(to.longitude)) return { ok: false, message: '' };
  const moved: SurveyWaypoint = { latitude: to.latitude, longitude: to.longitude, source: 'map', accuracyMeters: null, capturedAt };
  return withSet(shape, ref, current.map((point, index) => index === ref.index ? moved : point));
}

/** Replaces the point with a fresh GPS reading (recapture), keeping its position in the ring. */
export function replacePoint(shape: DrawingShape, ref: PointRef, waypoint: SurveyWaypoint): EditResult {
  const current = setOf(shape, ref);
  if (!current[ref.index]) return { ok: false, message: '' };
  return withSet(shape, ref, current.map((point, index) => index === ref.index ? waypoint : point));
}

export function removePoint(shape: DrawingShape, ref: PointRef): EditResult {
  const current = setOf(shape, ref);
  if (!current[ref.index]) return { ok: false, message: '' };
  return withSet(shape, ref, current.filter((_, index) => index !== ref.index));
}

/** Number of edges a set draws: a ring of three or more closes on itself; a shorter set is an open line. */
export function edgeCount(pointCount: number, closed: boolean): number {
  if (pointCount < 2) return 0;
  return closed && pointCount >= 3 ? pointCount : pointCount - 1;
}

/** Adds a point halfway along edge `edgeIndex` (from point `edgeIndex` to the next one). */
export function insertPointOnEdge(shape: DrawingShape, ref: PointRef, edgeIndex: number, capturedAt = new Date().toISOString()): EditResult {
  const current = setOf(shape, ref);
  const from = current[edgeIndex];
  const to = current[(edgeIndex + 1) % current.length];
  if (!from || !to || edgeIndex >= edgeCount(current.length, ref.set !== 'active')) return { ok: false, message: '' };
  const middle: SurveyWaypoint = {
    latitude: (from.latitude + to.latitude) / 2,
    longitude: (from.longitude + to.longitude) / 2,
    source: 'map',
    accuracyMeters: null,
    capturedAt,
  };
  return withSet(shape, ref, [...current.slice(0, edgeIndex + 1), middle, ...current.slice(edgeIndex + 1)]);
}

export function removeAffectedAreaAt(shape: DrawingShape, area: number): DrawingShape {
  return {
    ...shape,
    affectedAreas: shape.affectedAreas.filter((_, index) => index !== area),
    affectedAreaWaypointSets: shape.affectedAreaWaypointSets.filter((_, index) => index !== area),
  };
}

/** Pre-edit fallback for a restored draft whose undo history is empty: drop the last point of the active tool. */
export function dropLastPoint(shape: DrawingShape, drawingAffectedArea: boolean): DrawingShape {
  return drawingAffectedArea
    ? { ...shape, affectedWaypoints: shape.affectedWaypoints.slice(0, -1) }
    : { ...shape, waypoints: shape.waypoints.slice(0, -1) };
}

export type ValidityIssue = 'too_few_points' | 'too_many_points' | 'invalid_point' | 'crosses_itself' | 'no_area' | 'affected_outside';

export interface ValidityMarks {
  issue: ValidityIssue | null;
  /** Plot edges (edge i runs from point i to the next) that cross another edge. */
  crossingEdges: number[];
  /** Finished affected areas that are not fully inside the plot. */
  outsideAreas: number[];
}

function orientation(a: SurveyWaypoint, b: SurveyWaypoint, c: SurveyWaypoint): number {
  const value = (b.longitude - a.longitude) * (c.latitude - a.latitude) - (b.latitude - a.latitude) * (c.longitude - a.longitude);
  return value === 0 ? 0 : value > 0 ? 1 : -1;
}

function onSegment(a: SurveyWaypoint, b: SurveyWaypoint, c: SurveyWaypoint): boolean {
  return Math.min(a.longitude, b.longitude) <= c.longitude && c.longitude <= Math.max(a.longitude, b.longitude)
    && Math.min(a.latitude, b.latitude) <= c.latitude && c.latitude <= Math.max(a.latitude, b.latitude);
}

function segmentsCross(a: SurveyWaypoint, b: SurveyWaypoint, c: SurveyWaypoint, d: SurveyWaypoint): boolean {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  if (o1 !== o2 && o3 !== o4) return true;
  return (o1 === 0 && onSegment(a, b, c)) || (o2 === 0 && onSegment(a, b, d))
    || (o3 === 0 && onSegment(c, d, a)) || (o4 === 0 && onSegment(c, d, b));
}

/** Edges of the closed plot ring that touch or cross a non-neighbouring edge. */
export function findCrossingEdges(waypoints: SurveyWaypoint[]): number[] {
  const count = waypoints.length;
  if (count < 4) return [];
  const crossing = new Set<number>();
  for (let first = 0; first < count; first += 1) {
    for (let second = first + 2; second < count; second += 1) {
      if (first === 0 && second === count - 1) continue;
      if (segmentsCross(waypoints[first], waypoints[(first + 1) % count], waypoints[second], waypoints[(second + 1) % count])) {
        crossing.add(first);
        crossing.add(second);
      }
    }
  }
  return [...crossing].sort((a, b) => a - b);
}

/** One rulebook for "valid": the same checks the phone enforces on submit, with where each one fails. */
export function assessValidity(waypoints: SurveyWaypoint[], affectedAreas: SurveyPolygon[]): ValidityMarks {
  const plot = validateSurveyWaypoints(waypoints);
  if (!plot.valid) {
    const { code } = plot.error;
    if (code === 'TOO_FEW_VERTICES') return { issue: 'too_few_points', crossingEdges: [], outsideAreas: [] };
    if (code === 'TOO_MANY_VERTICES') return { issue: 'too_many_points', crossingEdges: [], outsideAreas: [] };
    if (code === 'INVALID_COORDINATE') return { issue: 'invalid_point', crossingEdges: [], outsideAreas: [] };
    const crossingEdges = findCrossingEdges(waypoints);
    return { issue: crossingEdges.length > 0 ? 'crosses_itself' : 'no_area', crossingEdges, outsideAreas: [] };
  }
  const outsideAreas = findAffectedAreasOutsidePlot(plot.polygon, affectedAreas);
  return { issue: outsideAreas.length > 0 ? 'affected_outside' : null, crossingEdges: [], outsideAreas };
}
