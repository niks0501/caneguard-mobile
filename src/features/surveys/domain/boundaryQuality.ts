import { PREFERRED_GPS_ACCURACY_METERS } from '@/features/reports/services/captureGpsLocation';
import type { SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';

export const ACCEPTABLE_GPS_ACCURACY_METERS = 10;

export type BoundaryGpsState = 'good' | 'acceptable' | 'low_accuracy' | 'manual';

export interface BoundaryQuality {
  state: BoundaryGpsState;
  pointCount: number;
  /**
   * Worst measured GPS reading, or the first GPS point without a reported
   * accuracy when that is the only reason the boundary is not good; null when
   * no GPS point needs recapture (including boundaries drawn only on the map).
   */
  worst: { index: number; accuracyMeters: number | null } | null;
}

export function assessBoundaryQuality(waypoints: SurveyWaypoint[]): BoundaryQuality {
  let worstMeasuredIndex = -1;
  let worstMeasuredAccuracy = -1;
  let unknownAccuracyIndex = -1;
  let gpsPointCount = 0;
  waypoints.forEach((point, index) => {
    if (point.source !== 'gps') return;
    gpsPointCount += 1;
    if (point.accuracyMeters === null) {
      if (unknownAccuracyIndex < 0) unknownAccuracyIndex = index;
      return;
    }
    if (point.accuracyMeters > worstMeasuredAccuracy) {
      worstMeasuredAccuracy = point.accuracyMeters;
      worstMeasuredIndex = index;
    }
  });
  const state: BoundaryGpsState = gpsPointCount === 0
    ? 'manual'
    : worstMeasuredAccuracy > ACCEPTABLE_GPS_ACCURACY_METERS || unknownAccuracyIndex >= 0
      ? 'low_accuracy'
      : worstMeasuredAccuracy > PREFERRED_GPS_ACCURACY_METERS ? 'acceptable' : 'good';
  const worst = worstMeasuredAccuracy > ACCEPTABLE_GPS_ACCURACY_METERS
    ? { index: worstMeasuredIndex, accuracyMeters: worstMeasuredAccuracy }
    : state === 'manual' || state === 'good'
      ? null
      : unknownAccuracyIndex >= 0
        ? { index: unknownAccuracyIndex, accuracyMeters: null }
        : { index: worstMeasuredIndex, accuracyMeters: worstMeasuredAccuracy };
  return { state, pointCount: waypoints.length, worst };
}
