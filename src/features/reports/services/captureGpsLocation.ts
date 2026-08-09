export const PREFERRED_GPS_ACCURACY_METERS = 5;

export interface ForegroundLocationClient {
  getCurrentPosition(): Promise<{
    accuracy: number | null;
    latitude: number;
    longitude: number;
    timestamp: number;
  }>;
  hasServicesEnabled(): Promise<boolean>;
  requestForegroundPermission(): Promise<'denied' | 'granted'>;
}

export type GpsCaptureResult =
  | {
      accuracy: number;
      capturedAt: string;
      latitude: number;
      longitude: number;
      outcome: 'low_accuracy' | 'resolved';
    }
  | {
      capturedAt: string;
      outcome: 'error' | 'permission_denied' | 'unavailable';
    };

export async function captureGpsLocation(
  client: ForegroundLocationClient,
  now: () => Date = () => new Date(),
): Promise<GpsCaptureResult> {
  const attemptedAt = now().toISOString();

  try {
    const permission = await client.requestForegroundPermission();
    if (permission !== 'granted') {
      return { capturedAt: attemptedAt, outcome: 'permission_denied' };
    }
    if (!(await client.hasServicesEnabled())) {
      return { capturedAt: attemptedAt, outcome: 'unavailable' };
    }

    const position = await client.getCurrentPosition();
    if (!isCoordinate(position.latitude, -90, 90) ||
        !isCoordinate(position.longitude, -180, 180) ||
        position.accuracy === null ||
        !Number.isFinite(position.accuracy) ||
        position.accuracy < 0) {
      return { capturedAt: attemptedAt, outcome: 'unavailable' };
    }

    const recordedDate = new Date(position.timestamp);
    const capturedAt = Number.isNaN(recordedDate.getTime())
      ? attemptedAt
      : recordedDate.toISOString();
    return {
      accuracy: position.accuracy,
      capturedAt,
      latitude: position.latitude,
      longitude: position.longitude,
      outcome:
        position.accuracy <= PREFERRED_GPS_ACCURACY_METERS
          ? 'resolved'
          : 'low_accuracy',
    };
  } catch {
    return { capturedAt: attemptedAt, outcome: 'error' };
  }
}

function isCoordinate(value: number, minimum: number, maximum: number): boolean {
  return Number.isFinite(value) && value >= minimum && value <= maximum;
}
