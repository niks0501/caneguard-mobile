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
  return {
    action: 'accept',
    waypoint: {
      latitude: fix.latitude,
      longitude: fix.longitude,
      accuracyMeters: fix.accuracy,
      capturedAt: new Date(fix.timestamp).toISOString(),
      source: 'gps',
    },
  };
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
