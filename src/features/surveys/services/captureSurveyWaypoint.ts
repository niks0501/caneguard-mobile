import type { ForegroundLocationClient } from '@/features/reports/services/captureGpsLocation';
import type { SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';

export type SurveyWaypointCaptureResult =
  | { status: 'captured'; waypoint: SurveyWaypoint }
  | { status: 'permission_denied' | 'services_disabled' | 'unavailable' };

export async function captureSurveyWaypoint(
  client: ForegroundLocationClient,
  now: () => Date = () => new Date(),
): Promise<SurveyWaypointCaptureResult> {
  try {
    if (await client.requestForegroundPermission() !== 'granted') return { status: 'permission_denied' };
    if (!(await client.hasServicesEnabled())) return { status: 'services_disabled' };
    const position = await client.getCurrentPosition();
    if (!Number.isFinite(position.latitude) || position.latitude < -90 || position.latitude > 90 ||
      !Number.isFinite(position.longitude) || position.longitude < -180 || position.longitude > 180 ||
      (position.accuracy !== null && (!Number.isFinite(position.accuracy) || position.accuracy < 0))) {
      return { status: 'unavailable' };
    }
    const timestamp = new Date(position.timestamp);
    return {
      status: 'captured',
      waypoint: {
        latitude: position.latitude,
        longitude: position.longitude,
        accuracyMeters: position.accuracy,
        capturedAt: Number.isNaN(timestamp.getTime()) ? now().toISOString() : timestamp.toISOString(),
        source: 'gps',
      },
    };
  } catch {
    return { status: 'unavailable' };
  }
}
