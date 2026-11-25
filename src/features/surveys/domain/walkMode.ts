import GeographicLib from 'geographiclib-geodesic/geographiclib-geodesic.min.js';

import type { MapCoordinate } from '@/features/reports/domain/manualMap';
import { PREFERRED_GPS_ACCURACY_METERS } from '@/features/reports/services/captureGpsLocation';
import { ACCEPTABLE_GPS_ACCURACY_METERS } from '@/features/surveys/domain/boundaryQuality';
import type { SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';

/** A walker drops a point only after moving this far from the last one. */
const WALK_MIN_SPACING_METERS = 8;
/** Walk mode keeps only fixes at least this accurate; weaker ones wait for the next reading. */
const WALK_MAX_ACCURACY_METERS = ACCEPTABLE_GPS_ACCURACY_METERS;

export interface WalkFix {
  accuracy: number | null;
  latitude: number;
  longitude: number;
  timestamp: number;
}

export type WalkFixDecision =
  | { action: 'accept'; waypoint: SurveyWaypoint }
  | { action: 'skip'; reason: 'invalid' | 'weak_accuracy' | 'too_close' | 'jump' };

/** Where and when the last usable reading was, for the jump check. */
export interface WalkFixMark {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface WalkFixContext {
  /** The previous usable reading, whether or not it became a point. */
  lastGood?: WalkFixMark | null;
  /** A reading that was just refused as a jump: a second reading beside it means the walker really went there. */
  rejectedJump?: WalkFixMark | null;
}

/** A brisk walk is about 1.5 m/s; faster than this between two readings is a GPS error, not a walker. */
export const WALK_MAX_SPEED_MPS = 3;
/** Smaller moves are ordinary jitter and are already handled by the accuracy and spacing rules. */
const WALK_JUMP_MIN_METERS = 15;
/** Under a second apart, timestamp quantisation dominates the speed, so the reading is not judged. */
const WALK_JUMP_MIN_ELAPSED_MS = 1_000;

function isJump(fix: WalkFix, context: WalkFixContext | undefined): boolean {
  const last = context?.lastGood;
  if (!last) return false;
  const elapsed = fix.timestamp - last.timestamp;
  if (!(elapsed >= WALK_JUMP_MIN_ELAPSED_MS)) return false;
  const moved = distanceMeters(last, fix);
  if (moved <= WALK_JUMP_MIN_METERS || (moved / elapsed) * 1_000 <= WALK_MAX_SPEED_MPS) return false;
  const rejected = context?.rejectedJump;
  return !(rejected && distanceMeters(rejected, fix) <= WALK_JUMP_MIN_METERS);
}

export function distanceMeters(from: MapCoordinate, to: MapCoordinate): number {
  return GeographicLib.Geodesic.WGS84.Inverse(from.latitude, from.longitude, to.latitude, to.longitude).s12 ?? Number.POSITIVE_INFINITY;
}

/**
 * Decides whether one position reading from a walk becomes a boundary point.
 * Pure: the caller supplies the last point kept, so spacing never depends on
 * how often the device happens to report.
 */
export function decideWalkFix(fix: WalkFix, previous: MapCoordinate | null, context?: WalkFixContext): WalkFixDecision {
  if (!Number.isFinite(fix.latitude) || !Number.isFinite(fix.longitude) || !Number.isFinite(fix.timestamp)) {
    return { action: 'skip', reason: 'invalid' };
  }
  if (fix.accuracy === null || !Number.isFinite(fix.accuracy) || fix.accuracy > WALK_MAX_ACCURACY_METERS) {
    return { action: 'skip', reason: 'weak_accuracy' };
  }
  // One multipath reading by a shed or a tree line can pass the accuracy rule and still be tens of metres off the path.
  if (isJump(fix, context)) return { action: 'skip', reason: 'jump' };
  // A new point must clear both the walking spacing and this reading's own error radius, or GPS jitter alone
  // (a stationary phone drifting a few metres) would add vertices and zigzag the boundary.
  if (previous && distanceMeters(previous, fix) < Math.max(WALK_MIN_SPACING_METERS, fix.accuracy)) {
    return { action: 'skip', reason: 'too_close' };
  }
  return { action: 'accept', waypoint: waypointFromFix(fix) };
}

/** Walking distances read as whole metres, then kilometres once they stop being small. */
export function formatWalkDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return '–';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export type WalkAccuracyBand = 'good' | 'acceptable' | 'weak';

/** Colour band for a live GPS reading; matches the point-quality thresholds used for saved points. */
export function walkAccuracyBand(accuracy: number | null): WalkAccuracyBand {
  if (accuracy === null || !Number.isFinite(accuracy) || accuracy > ACCEPTABLE_GPS_ACCURACY_METERS) return 'weak';
  return accuracy > PREFERRED_GPS_ACCURACY_METERS ? 'acceptable' : 'good';
}

/** Straight-line distance from the walker to the boundary's first point, or null when there is none yet. */
export function distanceToStart(fix: MapCoordinate, first: MapCoordinate | null): number | null {
  if (!first) return null;
  const meters = distanceMeters(fix, first);
  return Number.isFinite(meters) ? meters : null;
}

/** Converts a radius in metres to degrees of longitude at a latitude, so the accuracy halo can be drawn at map scale. */
export function metersToLongitudeDegrees(meters: number, latitude: number): number {
  const metersPerDegree = 111_320 * Math.max(0.01, Math.cos((latitude * Math.PI) / 180));
  return meters / metersPerDegree;
}

/** How far back "Mark corner" looks for the best reading. */
export const WALK_CORNER_WINDOW_MS = 3_000;
/** A marked corner this close to the last point is the same spot: the last point is flagged instead of duplicated. */
const WALK_CORNER_SAME_SPOT_METERS = 1.5;
/** "Back at start" needs a real loop, not a walker who has barely left the first point. */
export const WALK_NEAR_START_MIN_POINTS = 3;
export const WALK_NEAR_START_MIN_METERS = 30;
/** A final reading older than this no longer says where the walker stopped. */
const WALK_FINAL_FIX_MAX_AGE_MS = 10_000;
const WALK_FINAL_MIN_SPACING_METERS = 3;

function waypointFromFix(fix: WalkFix, isCorner = false): SurveyWaypoint {
  return {
    latitude: fix.latitude,
    longitude: fix.longitude,
    accuracyMeters: fix.accuracy,
    capturedAt: new Date(fix.timestamp).toISOString(),
    source: 'gps',
    ...(isCorner ? { isCorner: true } : {}),
  };
}

function isUsableFix(fix: WalkFix): boolean {
  return Number.isFinite(fix.latitude) && Number.isFinite(fix.longitude) && Number.isFinite(fix.timestamp)
    && fix.accuracy !== null && Number.isFinite(fix.accuracy) && fix.accuracy <= WALK_MAX_ACCURACY_METERS;
}

/** The most accurate usable reading from the last few seconds, or null when GPS has been silent or weak. */
export function pickCornerFix(recent: WalkFix[], now: number): WalkFix | null {
  let best: WalkFix | null = null;
  for (const fix of recent) {
    if (!isUsableFix(fix) || now - fix.timestamp > WALK_CORNER_WINDOW_MS || fix.timestamp > now + 1_000) continue;
    if (best === null || (fix.accuracy as number) < (best.accuracy as number)) best = fix;
  }
  return best;
}

export type MarkCornerDecision =
  | { action: 'add'; waypoint: SurveyWaypoint }
  | { action: 'mark_last' }
  | { action: 'none'; reason: 'no_fix' };

/**
 * A corner ignores walking spacing (the real corner usually falls between two spaced points) but not
 * accuracy: it uses the best reading from the last few seconds.
 */
export function decideMarkCorner(recent: WalkFix[], previous: SurveyWaypoint | null, now: number): MarkCornerDecision {
  const best = pickCornerFix(recent, now);
  if (!best) return { action: 'none', reason: 'no_fix' };
  if (previous && distanceMeters(previous, best) < WALK_CORNER_SAME_SPOT_METERS) return { action: 'mark_last' };
  return { action: 'add', waypoint: waypointFromFix(best, true) };
}

/** True once the walker has looped back to the first point after a real walk. */
export function isBackAtStart(fix: WalkFix, first: MapCoordinate | null, pointCount: number, walkedMeters: number): boolean {
  if (!first || !isUsableFix(fix)) return false;
  if (pointCount < WALK_NEAR_START_MIN_POINTS || walkedMeters < WALK_NEAR_START_MIN_METERS) return false;
  return distanceMeters(first, fix) <= Math.max(ACCEPTABLE_GPS_ACCURACY_METERS, fix.accuracy as number);
}

/**
 * Where the walker stood when they pressed Stop or Finish. Adds nothing when GPS is stale or weak, when it
 * would duplicate the previous point, or when it sits on the first point (the boundary closes there anyway).
 */
export function decideFinalFix(
  latest: WalkFix | null,
  previous: MapCoordinate | null,
  first: MapCoordinate | null,
  now: number,
): SurveyWaypoint | null {
  if (!latest || !isUsableFix(latest) || now - latest.timestamp > WALK_FINAL_FIX_MAX_AGE_MS) return null;
  const accuracy = latest.accuracy as number;
  const spacing = Math.max(WALK_FINAL_MIN_SPACING_METERS, accuracy);
  if (previous && distanceMeters(previous, latest) < spacing) return null;
  if (first && distanceMeters(first, latest) < spacing) return null;
  return waypointFromFix(latest);
}

/** A better reading only replaces a just-added point inside this many following readings or this long. */
const WALK_REFINE_MAX_READINGS = 2;
const WALK_REFINE_MAX_ELAPSED_MS = 4_000;
/** The replacement must be at least this much more accurate, or it is just another jittery reading. */
const WALK_REFINE_MIN_GAIN_METERS = 1;

/**
 * "Best of the window": a point is committed as soon as it clears the walking spacing, but a clearly more
 * accurate reading of the same spot a moment later replaces it instead of being thrown away as too close.
 */
export function refineWalkPoint(committed: SurveyWaypoint, fix: WalkFix, readingsSince: number): SurveyWaypoint | null {
  if (committed.source !== 'gps' || committed.accuracyMeters === null) return null;
  if (readingsSince < 1 || readingsSince > WALK_REFINE_MAX_READINGS || !isUsableFix(fix)) return null;
  const elapsed = fix.timestamp - Date.parse(committed.capturedAt);
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > WALK_REFINE_MAX_ELAPSED_MS) return null;
  if ((fix.accuracy as number) > committed.accuracyMeters - WALK_REFINE_MIN_GAIN_METERS) return null;
  // Only the same spot: a better reading elsewhere is a new position, not a better measurement of this one.
  if (distanceMeters(committed, fix) > Math.max(committed.accuracyMeters, WALK_MIN_SPACING_METERS)) return null;
  return { ...waypointFromFix(fix), ...(committed.isCorner ? { isCorner: true } : {}) };
}

const TIDY_MIN_EPSILON_METERS = 2;
const TIDY_MAX_EPSILON_METERS = 5;

/** Flat metres around a reference point; accurate to well under a centimetre over a field. */
function toLocalMeters(point: MapCoordinate, origin: MapCoordinate): { x: number; y: number } {
  const metersPerDegree = 111_320;
  return {
    x: (point.longitude - origin.longitude) * metersPerDegree * Math.cos((origin.latitude * Math.PI) / 180),
    y: (point.latitude - origin.latitude) * metersPerDegree,
  };
}

function perpendicularMeters(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  return Math.abs(dx * (a.y - p.y) - (a.x - p.x) * dy) / length;
}

/** How far a tidy may move the line: the walk's own typical accuracy, held between 2 m and 5 m. */
export function tidyToleranceMeters(points: SurveyWaypoint[]): number {
  const accuracies = points.map((point) => point.accuracyMeters).filter((value): value is number => value !== null && Number.isFinite(value)).sort((a, b) => a - b);
  if (accuracies.length === 0) return TIDY_MIN_EPSILON_METERS;
  const median = accuracies[Math.floor(accuracies.length / 2)];
  return Math.min(TIDY_MAX_EPSILON_METERS, Math.max(TIDY_MIN_EPSILON_METERS, median));
}

/**
 * Drops points that sit within the tolerance of a straight edge (Douglas–Peucker). The ends and every
 * marked corner always stay, so a walker's deliberate corners are never smoothed away.
 */
export function simplifyWalkSegment(points: SurveyWaypoint[], toleranceMeters = tidyToleranceMeters(points)): SurveyWaypoint[] {
  if (points.length < 3) return points;
  const origin = points[0];
  const flat = points.map((point) => toLocalMeters(point, origin));
  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;
  points.forEach((point, index) => { if (point.isCorner) keep[index] = true; });
  // A kept corner splits the run, so each stretch between kept points is simplified on its own.
  const stack: [number, number][] = [];
  const anchors = keep.map((kept, index) => (kept ? index : -1)).filter((index) => index >= 0);
  for (let i = 0; i < anchors.length - 1; i += 1) stack.push([anchors[i], anchors[i + 1]]);
  while (stack.length > 0) {
    const [from, to] = stack.pop() as [number, number];
    let worst = -1;
    let worstDistance = toleranceMeters;
    for (let index = from + 1; index < to; index += 1) {
      const distance = perpendicularMeters(flat[index], flat[from], flat[to]);
      if (distance > worstDistance) {
        worst = index;
        worstDistance = distance;
      }
    }
    if (worst >= 0) {
      keep[worst] = true;
      stack.push([from, worst], [worst, to]);
    }
  }
  return points.filter((_, index) => keep[index]);
}
