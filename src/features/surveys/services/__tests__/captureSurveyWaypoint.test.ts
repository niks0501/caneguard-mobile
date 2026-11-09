import {
  captureSurveyWaypoint,
} from '@/features/surveys/services/captureSurveyWaypoint';
import type { ForegroundLocationClient } from '@/features/reports/services/captureGpsLocation';

function client(overrides: Partial<ForegroundLocationClient> = {}): ForegroundLocationClient {
  return {
    requestForegroundPermission: jest.fn(async () => ({ canAskAgain: true, status: 'granted' as const })),
    hasServicesEnabled: jest.fn(async () => true),
    getCurrentPosition: jest.fn(async () => ({
      accuracy: null,
      latitude: 14.123,
      longitude: 120.456,
      timestamp: Date.parse('2026-10-05T09:00:00.000Z'),
    })),
    ...overrides,
  };
}

describe('captureSurveyWaypoint', () => {
  it('keeps valid GPS coordinates when the device reports unknown accuracy', async () => {
    await expect(captureSurveyWaypoint(client(), undefined, 50)).resolves.toEqual({
      status: 'captured',
      waypoint: {
        accuracyMeters: null,
        capturedAt: '2026-10-05T09:00:00.000Z',
        latitude: 14.123,
        longitude: 120.456,
        source: 'gps',
      },
    });
  });

  it('prefers a measured reading over an unmeasured fallback in the same window', async () => {
    const readings: (number | null)[] = [null, null, 7];
    const getCurrentPosition = jest.fn(async () => ({ accuracy: readings.shift() ?? 7, latitude: 14.123, longitude: 120.456, timestamp: Date.parse('2026-10-05T09:00:00.000Z') }));
    const result = await captureSurveyWaypoint(client({ getCurrentPosition }), undefined, 1500);
    expect(result).toMatchObject({ status: 'captured', waypoint: { accuracyMeters: 7 } });
  });

  it('keeps the unmeasured reading when a later sample fails', async () => {
    const getCurrentPosition = jest.fn()
      .mockResolvedValueOnce({ accuracy: null, latitude: 14.123, longitude: 120.456, timestamp: Date.parse('2026-10-05T09:00:00.000Z') })
      .mockRejectedValueOnce(new Error('native failure'));
    const result = await captureSurveyWaypoint(client({ getCurrentPosition }), undefined, 1500);
    expect(result).toEqual({
      status: 'captured',
      waypoint: {
        accuracyMeters: null,
        capturedAt: '2026-10-05T09:00:00.000Z',
        latitude: 14.123,
        longitude: 120.456,
        source: 'gps',
      },
    });
  });

  it('keeps the reading with the lowest accuracy value across the window', async () => {
    const readings = [12, 7, 9];
    const getCurrentPosition = jest.fn(async () => ({ accuracy: readings.shift() ?? 9, latitude: 14 + (readings.length) / 1000, longitude: 120, timestamp: Date.now() }));
    const result = await captureSurveyWaypoint(client({ getCurrentPosition }), undefined, 1500);
    expect(result).toMatchObject({ status: 'captured', waypoint: { accuracyMeters: 7 } });
  });

  it('stops early once accuracy reaches 5 m', async () => {
    const getCurrentPosition = jest.fn(async () => ({ accuracy: 4, latitude: 14, longitude: 120, timestamp: Date.now() }));
    await captureSurveyWaypoint(client({ getCurrentPosition }));
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('preserves weak accuracy rather than discarding the measurement', async () => {
    const weak = client({ getCurrentPosition: jest.fn(async () => ({ accuracy: 25, latitude: 14, longitude: 120, timestamp: Date.now() })) });
    const result = await captureSurveyWaypoint(weak, undefined, 300);
    expect(result).toMatchObject({ status: 'captured', waypoint: { accuracyMeters: 25, source: 'gps' } });
  });

  it('does not request a reading when permission or services are unavailable', async () => {
    const denied = client({ requestForegroundPermission: jest.fn(async () => ({ canAskAgain: true, status: 'denied' as const })) });
    await expect(captureSurveyWaypoint(denied)).resolves.toEqual({ status: 'permission_denied' });
    expect(denied.getCurrentPosition).not.toHaveBeenCalled();
    const disabled = client({ hasServicesEnabled: jest.fn(async () => false) });
    await expect(captureSurveyWaypoint(disabled)).resolves.toEqual({ status: 'services_disabled' });
  });

  it('rejects invalid coordinates and invalid accuracy', async () => {
    await expect(captureSurveyWaypoint(client({ getCurrentPosition: jest.fn(async () => ({ accuracy: 3, latitude: 91, longitude: 120, timestamp: Date.now() })) }), undefined, 50)).resolves.toEqual({ status: 'unavailable' });
    await expect(captureSurveyWaypoint(client({ getCurrentPosition: jest.fn(async () => ({ accuracy: -1, latitude: 14, longitude: 120, timestamp: Date.now() })) }), undefined, 50)).resolves.toEqual({ status: 'unavailable' });
  });
});
