import GeographicLib from 'geographiclib-geodesic/geographiclib-geodesic.min.js';

import type { MapCoordinate } from '@/features/reports/domain/manualMap';
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

function distanceMeters(from: MapCoordinate, to: MapCoordinate): number {
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
  if (previous && distanceMeters(previous, fix) < WALK_MIN_SPACING_METERS) {
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
