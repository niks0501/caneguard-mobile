import { PREFERRED_GPS_ACCURACY_METERS } from '@/features/reports/services/captureGpsLocation';
import type { SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';

export const ACCEPTABLE_GPS_ACCURACY_METERS = 10;

export type BoundaryGpsState = 'good' | 'acceptable' | 'low_accuracy';

export interface BoundaryQuality {
  state: BoundaryGpsState;
  pointCount: number;
  /** Worst point (unknown accuracy ranks worst); null when every point is good. */
  worst: { index: number; accuracyMeters: number | null } | null;
}

export function assessBoundaryQuality(waypoints: SurveyWaypoint[]): BoundaryQuality {
  let worstIndex = -1;
  let worstRank = -1;
  waypoints.forEach((point, index) => {
    const rank = point.accuracyMeters === null ? Number.POSITIVE_INFINITY : point.accuracyMeters;
    if (rank > worstRank) {
      worstRank = rank;
      worstIndex = index;
    }
  });
  const state: BoundaryGpsState = worstRank > ACCEPTABLE_GPS_ACCURACY_METERS
    ? 'low_accuracy'
    : worstRank > PREFERRED_GPS_ACCURACY_METERS ? 'acceptable' : 'good';
  const worstPoint = worstIndex >= 0 ? waypoints[worstIndex] : null;
  return {
    state,
    pointCount: waypoints.length,
    worst: worstPoint && state !== 'good' ? { index: worstIndex, accuracyMeters: worstPoint.accuracyMeters } : null,
  };
}
