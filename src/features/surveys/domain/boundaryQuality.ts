import { PREFERRED_GPS_ACCURACY_METERS } from '@/features/reports/services/captureGpsLocation';
import type { SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';

export const ACCEPTABLE_GPS_ACCURACY_METERS = 10;

export type BoundaryGpsState = 'good' | 'acceptable' | 'low_accuracy';

export interface BoundaryQuality {
  state: BoundaryGpsState;
  pointCount: number;
  /**
   * Numerically worst real GPS reading; unknown accuracy ranks worst only when
   * no reading is worse than the acceptable threshold. Tap-placed map vertices
   * are never named, so they are never offered for recapture.
   */
  worst: { index: number; accuracyMeters: number | null } | null;
}

export function assessBoundaryQuality(waypoints: SurveyWaypoint[]): BoundaryQuality {
  let worstAccuracy = -1;
  let unknownIndex = -1;
  let worstGpsIndex = -1;
  let worstGpsAccuracy = -1;
  let unknownGpsIndex = -1;
  waypoints.forEach((point, index) => {
    if (point.accuracyMeters === null) {
      if (unknownIndex < 0) unknownIndex = index;
    } else if (point.accuracyMeters > worstAccuracy) {
      worstAccuracy = point.accuracyMeters;
    }
    if (point.source !== 'gps') return;
    if (point.accuracyMeters === null) {
      if (unknownGpsIndex < 0) unknownGpsIndex = index;
    } else if (point.accuracyMeters > worstGpsAccuracy) {
      worstGpsAccuracy = point.accuracyMeters;
      worstGpsIndex = index;
    }
  });
  const state: BoundaryGpsState = worstAccuracy > ACCEPTABLE_GPS_ACCURACY_METERS || unknownIndex >= 0
    ? 'low_accuracy'
    : worstAccuracy > PREFERRED_GPS_ACCURACY_METERS ? 'acceptable' : 'good';
  const worst = worstGpsAccuracy > ACCEPTABLE_GPS_ACCURACY_METERS
    ? { index: worstGpsIndex, accuracyMeters: worstGpsAccuracy }
    : state === 'good'
      ? null
      : unknownGpsIndex >= 0
        ? { index: unknownGpsIndex, accuracyMeters: null }
        : worstGpsIndex >= 0 ? { index: worstGpsIndex, accuracyMeters: worstGpsAccuracy } : null;
  return { state, pointCount: waypoints.length, worst };
}
