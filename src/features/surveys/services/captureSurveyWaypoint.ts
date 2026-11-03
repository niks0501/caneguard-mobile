import { captureGpsLocation, type ForegroundLocationClient } from '@/features/reports/services/captureGpsLocation';
import type { SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';

/** Survey points sample up to this long; the shared sampler stops early at the preferred accuracy. */
export const SURVEY_GPS_SAMPLE_WINDOW_MS = 8_000;

export type SurveyWaypointCaptureResult =
  | { status: 'captured'; waypoint: SurveyWaypoint }
  | { status: 'permission_denied' | 'services_disabled' | 'unavailable' };

export async function captureSurveyWaypoint(
  client: ForegroundLocationClient,
  now: () => Date = () => new Date(),
  timeoutMs: number = SURVEY_GPS_SAMPLE_WINDOW_MS,
): Promise<SurveyWaypointCaptureResult> {
  const result = await captureGpsLocation(client, now, { timeoutMs });
  if (result.outcome === 'permission_denied') return { status: 'permission_denied' };
  if (result.outcome === 'unavailable') {
    if (result.reason === 'location_services_disabled') return { status: 'services_disabled' };
    // A device that reports coordinates without an accuracy still yields a
    // usable point; the missing measurement is recorded as provenance.
    if (result.fallback) {
      return {
        status: 'captured',
        waypoint: {
          latitude: result.fallback.latitude,
          longitude: result.fallback.longitude,
          accuracyMeters: null,
          capturedAt: result.fallback.capturedAt,
          source: 'gps',
        },
      };
    }
    return { status: 'unavailable' };
  }
  if (result.outcome !== 'resolved' && result.outcome !== 'low_accuracy') return { status: 'unavailable' };
  // Poor accuracy never blocks the point; the actual value is kept as provenance.
  return {
    status: 'captured',
    waypoint: {
      latitude: result.latitude,
      longitude: result.longitude,
      accuracyMeters: result.accuracy,
      capturedAt: result.capturedAt,
      source: 'gps',
    },
  };
}
