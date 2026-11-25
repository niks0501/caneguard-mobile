import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';
import { FieldSurveyValidationError, fetchAssignmentFieldMap, fetchFieldSurveyOfficeStatus, submitFieldSurvey } from '@/features/surveys/api/fieldSurveysApi';

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
    containment_tolerance_m: 5,
    affected_area_waypoint_provenance: [],
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

describe('field survey office status', () => {
  beforeEach(() => mockApiRequest.mockReset());

  // Intent: the office's verdict is read per map by client uuid; a malformed row is dropped, never guessed.
  it('reads each map\'s verdict by lowercase client uuid and ignores rows it does not understand', async () => {
    mockApiRequest.mockResolvedValue({
      data: [
        { client_uuid: 'AAAA', verdict: 'confirmed' },
        { client_uuid: 'bbbb', verdict: 'wrong_field' },
        { client_uuid: 'cccc', verdict: 'pending' },
        { client_uuid: 'dddd', verdict: 'approved-ish' },
        { client_uuid: 7, verdict: 'confirmed' },
        null,
      ],
    });

    const verdicts = await fetchFieldSurveyOfficeStatus('access-token');

    expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/mobile/field-surveys/office-status', { token: 'access-token' });
    expect([...verdicts.entries()]).toEqual([['aaaa', 'confirmed'], ['bbbb', 'wrong_field'], ['cccc', 'pending']]);
  });

  it('answers an empty map for a body without a list', async () => {
    mockApiRequest.mockResolvedValue({});
    expect((await fetchFieldSurveyOfficeStatus('t')).size).toBe(0);
  });

  it('sends the optional field name on the wire only when given', async () => {
    mockApiRequest.mockResolvedValue({ id: '1', status: 'kept' });
    await submitFieldSurvey({ ...payload, label: 'North lot' }, 't');
    expect(JSON.parse(String(mockApiRequest.mock.calls[0][1]?.body)).label).toBe('North lot');
  });
});

describe('assignment field map', () => {
  beforeEach(() => mockApiRequest.mockReset());

  const ring = [[121, 14], [121.002, 14], [121.002, 14.002], [121, 14]];
  const reply = {
    field_survey_id: 41, source: 'attached', label: ' North lot ',
    geometry: { type: 'Polygon', coordinates: [ring] }, area_sqm: 12_000, inspector: { name: 'Ana' },
  };

  // Intent: the assigned case's map is read for its outline only, from exactly the assignment's own route.
  it('reads the map of the assigned case', async () => {
    mockApiRequest.mockResolvedValue({ data: reply });
    const map = await fetchAssignmentFieldMap('assignment 1', 'tok');

    expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/mobile/assignments/assignment%201/field-map', { token: 'tok' });
    expect(map).toMatchObject({ fieldSurveyId: 41, source: 'attached', label: 'North lot', areaSqm: 12_000, inspectorName: 'Ana' });
    expect(map?.polygon.coordinates[0]).toEqual(ring);
  });

  it('answers null for no map or a reply it cannot trust', async () => {
    for (const body of [{ data: null }, {}, { data: { ...reply, source: 'other' } }, { data: { ...reply, field_survey_id: 0 } },
      { data: { ...reply, geometry: { type: 'Point' } } }, { data: { ...reply, inspector: {} } }]) {
      mockApiRequest.mockResolvedValue(body);
      expect(await fetchAssignmentFieldMap('a', 't')).toBeNull();
    }
  });

  it('sends the earlier map id with the survey only when given', async () => {
    mockApiRequest.mockResolvedValue({ id: '1', status: 'kept' });
    await submitFieldSurvey({ ...payload, outline_from_survey_id: 41 }, 't');
    expect(JSON.parse(String(mockApiRequest.mock.calls[0][1]?.body)).outline_from_survey_id).toBe(41);
  });
});
