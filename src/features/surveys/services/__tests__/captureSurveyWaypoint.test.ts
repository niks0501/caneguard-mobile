import {
  captureSurveyWaypoint,
} from '@/features/surveys/services/captureSurveyWaypoint';
import type { ForegroundLocationClient } from '@/features/reports/services/captureGpsLocation';

function client(overrides: Partial<ForegroundLocationClient> = {}): ForegroundLocationClient {
  return {
    requestForegroundPermission: jest.fn(async () => 'granted' as const),
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
    await expect(captureSurveyWaypoint(client())).resolves.toEqual({
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

  it('preserves weak accuracy rather than discarding the measurement', async () => {
    const weak = client({ getCurrentPosition: jest.fn(async () => ({ accuracy: 25, latitude: 14, longitude: 120, timestamp: Date.now() })) });
    const result = await captureSurveyWaypoint(weak);
    expect(result).toMatchObject({ status: 'captured', waypoint: { accuracyMeters: 25, source: 'gps' } });
  });

  it('does not request a reading when permission or services are unavailable', async () => {
    const denied = client({ requestForegroundPermission: jest.fn(async () => 'denied' as const) });
    await expect(captureSurveyWaypoint(denied)).resolves.toEqual({ status: 'permission_denied' });
    expect(denied.getCurrentPosition).not.toHaveBeenCalled();
    const disabled = client({ hasServicesEnabled: jest.fn(async () => false) });
    await expect(captureSurveyWaypoint(disabled)).resolves.toEqual({ status: 'services_disabled' });
  });

  it('rejects invalid coordinates and invalid accuracy', async () => {
    await expect(captureSurveyWaypoint(client({ getCurrentPosition: jest.fn(async () => ({ accuracy: 3, latitude: 91, longitude: 120, timestamp: Date.now() })) }))).resolves.toEqual({ status: 'unavailable' });
    await expect(captureSurveyWaypoint(client({ getCurrentPosition: jest.fn(async () => ({ accuracy: -1, latitude: 14, longitude: 120, timestamp: Date.now() })) }))).resolves.toEqual({ status: 'unavailable' });
  });
});
