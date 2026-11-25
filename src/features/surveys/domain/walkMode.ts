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
  | { action: 'skip'; reason: 'invalid' | 'weak_accuracy' | 'too_close' };

export function distanceMeters(from: MapCoordinate, to: MapCoordinate): number {
  return GeographicLib.Geodesic.WGS84.Inverse(from.latitude, from.longitude, to.latitude, to.longitude).s12 ?? Number.POSITIVE_INFINITY;
}

/**
 * Decides whether one position reading from a walk becomes a boundary point.
 * Pure: the caller supplies the last point kept, so spacing never depends on
 * how often the device happens to report.
 */
export function decideWalkFix(fix: WalkFix, previous: MapCoordinate | null): WalkFixDecision {
  if (!Number.isFinite(fix.latitude) || !Number.isFinite(fix.longitude) || !Number.isFinite(fix.timestamp)) {
    return { action: 'skip', reason: 'invalid' };
  }
  if (fix.accuracy === null || !Number.isFinite(fix.accuracy) || fix.accuracy > WALK_MAX_ACCURACY_METERS) {
    return { action: 'skip', reason: 'weak_accuracy' };
  }
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
