import type { GpsCaptureUnavailableReason } from '@/features/reports/domain/fieldReportTypes';

export const PREFERRED_GPS_ACCURACY_METERS = 5;

/**
 * Bound for one foreground reading. A native promise that never settles must
 * not keep the report, the draft save, or the validation visit waiting.
 */
export const FOREGROUND_GPS_TIMEOUT_MS = 15_000;

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
      outcome: 'error' | 'permission_denied';
    }
  | {
      capturedAt: string;
      outcome: 'unavailable';
      reason: GpsCaptureUnavailableReason;
      /** The bounded foreground attempt ended before the native reading did. */
      timedOut?: boolean;
    };

export interface GpsCaptureOptions {
  timeoutMs?: number;
}

export async function captureGpsLocation(
  client: ForegroundLocationClient,
  now: () => Date = () => new Date(),
  options: GpsCaptureOptions = {},
): Promise<GpsCaptureResult> {
  const attemptedAt = now().toISOString();
  const timeoutMs = options.timeoutMs ?? FOREGROUND_GPS_TIMEOUT_MS;

  try {
    const position = await withForegroundTimeout(readForegroundPosition(client), timeoutMs);
    if (!isCoordinate(position.latitude, -90, 90) ||
        !isCoordinate(position.longitude, -180, 180) ||
        position.accuracy === null ||
        !Number.isFinite(position.accuracy) ||
        position.accuracy < 0) {
      return {
        capturedAt: attemptedAt,
        outcome: 'unavailable',
        reason: 'reading_unavailable',
      };
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
  } catch (error) {
    if (error instanceof GpsPermissionDeniedError) {
      return { capturedAt: attemptedAt, outcome: 'permission_denied' };
    }
    if (error instanceof GpsServicesDisabledError) {
      return {
        capturedAt: attemptedAt,
        outcome: 'unavailable',
        reason: 'location_services_disabled',
      };
    }
    if (error instanceof GpsTimeoutError) {
      // The late native result is abandoned, not persisted: callers treat a
      // timed-out attempt as stale evidence with an explicit reason.
      return {
        capturedAt: attemptedAt,
        outcome: 'unavailable',
        reason: 'reading_unavailable',
        timedOut: true,
      };
    }
    return { capturedAt: attemptedAt, outcome: 'error' };
  }
}

async function readForegroundPosition(client: ForegroundLocationClient) {
  const permission = await client.requestForegroundPermission();
  if (permission !== 'granted') {
    throw new GpsPermissionDeniedError();
  }
  if (!(await client.hasServicesEnabled())) {
    throw new GpsServicesDisabledError();
  }
  return client.getCurrentPosition();
}

class GpsTimeoutError extends Error {}
class GpsPermissionDeniedError extends Error {}
class GpsServicesDisabledError extends Error {}

async function withForegroundTimeout<T>(
  work: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new GpsTimeoutError()), timeoutMs);
  });
  return Promise.race([work, timeout]).finally(() => {
    if (timer !== null) {
      clearTimeout(timer);
    }
  });
}

function isCoordinate(value: number, minimum: number, maximum: number): boolean {
  return Number.isFinite(value) && value >= minimum && value <= maximum;
}
