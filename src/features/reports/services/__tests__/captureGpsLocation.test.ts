import {
  captureGpsLocation,
  FOREGROUND_GPS_TIMEOUT_MS,
  type ForegroundLocationClient,
} from '@/features/reports/services/captureGpsLocation';

const NOW = new Date('2026-08-10T01:00:00.000Z');

function client(
  overrides: Partial<ForegroundLocationClient> = {},
): ForegroundLocationClient {
  return {
    requestForegroundPermission: jest.fn(async () => 'granted'),
    hasServicesEnabled: jest.fn(async () => true),
    getCurrentPosition: jest.fn(async () => ({
      accuracy: 4.4,
      latitude: 14.0667,
      longitude: 120.6319,
      timestamp: Date.parse('2026-08-10T01:00:01.000Z'),
    })),
    ...overrides,
  };
}

describe('captureGpsLocation', () => {
  it('resolves a one-shot reading at the preferred quality target', async () => {
    const locationClient = client();

    await expect(captureGpsLocation(locationClient, () => NOW)).resolves.toEqual({
      accuracy: 4.4,
      capturedAt: '2026-08-10T01:00:01.000Z',
      latitude: 14.0667,
      longitude: 120.6319,
      outcome: 'resolved',
    });
    expect(locationClient.getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('returns a poor reading as attempt evidence instead of resolved GPS', async () => {
    const locationClient = client({
      getCurrentPosition: jest.fn(async () => ({
        accuracy: 42,
        latitude: 14.0667,
        longitude: 120.6319,
        timestamp: NOW.getTime(),
      })),
    });

    await expect(captureGpsLocation(locationClient, () => NOW)).resolves.toMatchObject({
      accuracy: 42,
      outcome: 'low_accuracy',
    });
  });

  it('stops before accessing location when foreground permission is denied', async () => {
    const locationClient = client({
      requestForegroundPermission: jest.fn(async () => 'denied'),
    });

    await expect(captureGpsLocation(locationClient, () => NOW)).resolves.toEqual({
      capturedAt: NOW.toISOString(),
      outcome: 'permission_denied',
    });
    expect(locationClient.hasServicesEnabled).not.toHaveBeenCalled();
    expect(locationClient.getCurrentPosition).not.toHaveBeenCalled();
  });

  it('reports disabled location services as unavailable without starting a reading', async () => {
    const locationClient = client({
      hasServicesEnabled: jest.fn(async () => false),
    });

    await expect(captureGpsLocation(locationClient, () => NOW)).resolves.toEqual({
      capturedAt: NOW.toISOString(),
      outcome: 'unavailable',
      reason: 'location_services_disabled',
    });
    expect(locationClient.getCurrentPosition).not.toHaveBeenCalled();
  });

  it('distinguishes an unreadable position as unavailable without blaming services', async () => {
    const locationClient = client({
      getCurrentPosition: jest.fn(async () => ({
        accuracy: null,
        latitude: 14.0667,
        longitude: 120.6319,
        timestamp: NOW.getTime(),
      })),
    });

    await expect(captureGpsLocation(locationClient, () => NOW)).resolves.toEqual({
      capturedAt: NOW.toISOString(),
      outcome: 'unavailable',
      reason: 'reading_unavailable',
    });
    expect(locationClient.hasServicesEnabled).toHaveBeenCalledTimes(1);
  });

  it('maps a native capture failure to a retryable error', async () => {
    const locationClient = client({
      getCurrentPosition: jest.fn(async () => {
        throw new Error('native failure');
      }),
    });

    await expect(captureGpsLocation(locationClient, () => NOW)).resolves.toEqual({
      capturedAt: NOW.toISOString(),
      outcome: 'error',
    });
  });

  describe('bounded foreground attempts', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('exits Adding location when the native reading never settles', async () => {
      jest.useFakeTimers();
      const locationClient = client({
        getCurrentPosition: jest.fn(
          () => new Promise<never>(() => undefined),
        ),
      });

      const pending = captureGpsLocation(locationClient, () => NOW);
      await jest.advanceTimersByTimeAsync(FOREGROUND_GPS_TIMEOUT_MS);

      await expect(pending).resolves.toEqual({
        capturedAt: NOW.toISOString(),
        outcome: 'unavailable',
        reason: 'reading_unavailable',
        timedOut: true,
      });
      expect(FOREGROUND_GPS_TIMEOUT_MS).toBe(15_000);
    });

    it('treats a reading that arrives after the timeout as stale, not applied', async () => {
      jest.useFakeTimers();
      let resolveReading!: (value: {
        accuracy: number;
        latitude: number;
        longitude: number;
        timestamp: number;
      }) => void;
      const lateReading = new Promise<{
        accuracy: number;
        latitude: number;
        longitude: number;
        timestamp: number;
      }>((resolve) => {
        resolveReading = resolve;
      });
      const locationClient = client({
        getCurrentPosition: jest.fn(() => lateReading),
      });

      const pending = captureGpsLocation(locationClient, () => NOW);
      await jest.advanceTimersByTimeAsync(FOREGROUND_GPS_TIMEOUT_MS);
      const result = await pending;

      resolveReading({
        accuracy: 4,
        latitude: 14.1,
        longitude: 120.7,
        timestamp: NOW.getTime(),
      });
      await Promise.resolve();

      expect(result).toMatchObject({
        outcome: 'unavailable',
        reason: 'reading_unavailable',
        timedOut: true,
      });
    });

    it('honours a caller-supplied bound', async () => {
      jest.useFakeTimers();
      const locationClient = client({
        getCurrentPosition: jest.fn(
          () => new Promise<never>(() => undefined),
        ),
      });

      const pending = captureGpsLocation(locationClient, () => NOW, {
        timeoutMs: 2_000,
      });
      await jest.advanceTimersByTimeAsync(1_999);
      let settled = false;
      void pending.then(() => {
        settled = true;
      });
      await Promise.resolve();
      expect(settled).toBe(false);

      await jest.advanceTimersByTimeAsync(1);
      await expect(pending).resolves.toMatchObject({
        outcome: 'unavailable',
        timedOut: true,
      });
    });
  });
});
