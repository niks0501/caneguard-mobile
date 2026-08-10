import {
  captureGpsLocation,
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

  it('represents disabled services as unavailable without starting a reading', async () => {
    const locationClient = client({
      hasServicesEnabled: jest.fn(async () => false),
    });

    await expect(captureGpsLocation(locationClient, () => NOW)).resolves.toEqual({
      capturedAt: NOW.toISOString(),
      outcome: 'unavailable',
    });
    expect(locationClient.getCurrentPosition).not.toHaveBeenCalled();
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
});
