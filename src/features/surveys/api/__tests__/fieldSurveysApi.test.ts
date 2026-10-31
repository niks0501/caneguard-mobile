import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';
import { FieldSurveyValidationError, submitFieldSurvey } from '@/features/surveys/api/fieldSurveysApi';

jest.mock('@/features/shared/api/apiClient', () => {
  const actual = jest.requireActual('@/features/shared/api/apiClient');
  return { ...actual, apiRequest: jest.fn() };
});

const mockApiRequest = jest.mocked(apiRequest);
const payload = {
  client_uuid: 'survey-client-1',
  polygon: { type: 'Polygon' as const, coordinates: [[[120, 14], [120.001, 14], [120.001, 14.001], [120, 14.001], [120, 14]]] },
  area_sqm: 5_000,
  affected_area_polygons: [],
  affected_area_sqm: 0,
  measurement_provenance: {
      method: 'wgs84-ellipsoid-geodesic' as const,
    plot_area_sqm: 5_000,
    affected_area_sqm: 0,
    source_polygon_count: 0,
    overlap_removed: false,
  },
  captured_at: '2026-10-05T09:00:00.000Z',
  district_code: 'D-01',
};

describe('field survey sync API contract', () => {
  beforeEach(() => mockApiRequest.mockReset());

  it('posts the stable client UUID and the exact contract under the authenticated token', async () => {
    mockApiRequest.mockResolvedValue({ id: 'remote-1', status: 'kept' });
    await expect(submitFieldSurvey(payload, 'access-token')).resolves.toEqual({ id: 'remote-1', status: 'kept' });
    expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/mobile/field-surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      token: 'access-token',
    });
  });

  it('exposes 422 errors by field for correction on the survey screen', async () => {
    mockApiRequest.mockRejectedValue(new ApiHttpError(422, 'Invalid survey', {
      body: { errors: { polygon: ['Boundary is outside the assigned plot.'], district_code: ['Unknown district.'] } },
    }));
    await expect(submitFieldSurvey(payload, 'access-token')).rejects.toEqual(
      new FieldSurveyValidationError({
        polygon: ['Boundary is outside the assigned plot.'],
        district_code: ['Unknown district.'],
      }),
    );
  });

  it('does not mistake a response without kept status for an idempotent success', async () => {
    mockApiRequest.mockResolvedValue({ id: 'remote-1', status: 'received' });
    await expect(submitFieldSurvey(payload, 'access-token')).rejects.toThrow('did not confirm');
  });
});
