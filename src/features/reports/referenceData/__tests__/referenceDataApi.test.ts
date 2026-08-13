import {
  fetchLocationReferenceData,
  LOCATION_REFERENCE_PATH,
} from '@/features/reports/referenceData/referenceDataApi';
import {
  ReferenceDataApiError,
  parseLocationReferenceData,
} from '@/features/reports/referenceData/referenceDataTypes';

const BASE_URL = 'http://127.0.0.1:8000';

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: async () => body,
  } as unknown as Response;
}

describe('parseLocationReferenceData', () => {
  it('accepts a valid payload and normalizes it', () => {
    const data = parseLocationReferenceData(
      {
        version: 'v2',
        regions: [
          {
            province: 'Batangas',
            municipalities: ['Nasugbu', 'Calatagan'],
          },
        ],
        barangays: ['Wawa', 'Lumbangan'],
      },
      { etag: '"v2"', fetchedAt: '2026-08-13T00:00:00.000Z' },
    );

    expect(data).toEqual({
      version: 'v2',
      etag: '"v2"',
      regions: [
        { province: 'Batangas', municipalities: ['Nasugbu', 'Calatagan'] },
      ],
      barangays: ['Wawa', 'Lumbangan'],
      fetchedAt: '2026-08-13T00:00:00.000Z',
    });
  });

  it('trims entries and deduplicates them', () => {
    const data = parseLocationReferenceData(
      {
        version: 'v1',
        regions: [
          { province: ' Batangas ', municipalities: [' Nasugbu ', 'Nasugbu'] },
          { province: 'Batangas', municipalities: ['Calatagan'] },
        ],
        barangays: ['Wawa', ' Wawa ', 'Lumbangan'],
      },
      { etag: null, fetchedAt: '2026-08-13T00:00:00.000Z' },
    );

    expect(data.regions).toEqual([
      { province: 'Batangas', municipalities: ['Nasugbu'] },
    ]);
    expect(data.barangays).toEqual(['Wawa', 'Lumbangan']);
  });

  it('rejects payloads without regions or with empty municipalities', () => {
    expect(() =>
      parseLocationReferenceData(
        { version: 'v1', regions: [], barangays: [] },
        { etag: null, fetchedAt: '2026-08-13T00:00:00.000Z' },
      ),
    ).toThrow(expect.objectContaining<Partial<ReferenceDataApiError>>({ code: 'MALFORMED_RESPONSE' }));

    expect(() =>
      parseLocationReferenceData(
        {
          version: 'v1',
          regions: [{ province: 'Batangas', municipalities: [] }],
          barangays: [],
        },
        { etag: null, fetchedAt: '2026-08-13T00:00:00.000Z' },
      ),
    ).toThrow(expect.objectContaining<Partial<ReferenceDataApiError>>({ code: 'MALFORMED_RESPONSE' }));
  });

  it('rejects non-string or overlong entries', () => {
    expect(() =>
      parseLocationReferenceData(
        {
          version: 'v1',
          regions: [{ province: 'Batangas', municipalities: ['Nasugbu'] }],
          barangays: [42],
        },
        { etag: null, fetchedAt: '2026-08-13T00:00:00.000Z' },
      ),
    ).toThrow(expect.objectContaining<Partial<ReferenceDataApiError>>({ code: 'MALFORMED_RESPONSE' }));

    expect(() =>
      parseLocationReferenceData(
        {
          version: 'v1',
          regions: [{ province: 'Batangas', municipalities: ['Nasugbu'] }],
          barangays: ['x'.repeat(121)],
        },
        { etag: null, fetchedAt: '2026-08-13T00:00:00.000Z' },
      ),
    ).toThrow(expect.objectContaining<Partial<ReferenceDataApiError>>({ code: 'MALFORMED_RESPONSE' }));
  });
});

describe('fetchLocationReferenceData', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns unchanged on a 304', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(null, 304));

    await expect(
      fetchLocationReferenceData({ baseUrl: BASE_URL, etag: '"v1"' }),
    ).resolves.toEqual({ status: 'unchanged' });
    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE_URL}${LOCATION_REFERENCE_PATH}`,
      expect.objectContaining({
        headers: expect.objectContaining({ 'If-None-Match': '"v1"' }),
      }),
    );
  });

  it('returns the parsed payload on 200 and captures the server ETag', async () => {
    const body = {
      version: 'v2',
      regions: [{ province: 'Batangas', municipalities: ['Nasugbu'] }],
      barangays: ['Wawa'],
    };
    global.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse(body, 200, { ETag: '"v2"' }));

    const result = await fetchLocationReferenceData({
      baseUrl: BASE_URL,
      now: () => new Date('2026-08-13T00:00:00.000Z'),
    });

    expect(result.status).toBe('updated');
    if (result.status === 'updated') {
      expect(result.data.etag).toBe('"v2"');
      expect(result.data.version).toBe('v2');
      expect(result.data.fetchedAt).toBe('2026-08-13T00:00:00.000Z');
    }
  });

  it('maps 401 to AUTH_REQUIRED', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(null, 401));

    await expect(fetchLocationReferenceData({ baseUrl: BASE_URL })).rejects.toMatchObject<
      Partial<ReferenceDataApiError>
    >({ code: 'AUTH_REQUIRED' });
  });

  it('maps network failures to NETWORK', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));

    await expect(fetchLocationReferenceData({ baseUrl: BASE_URL })).rejects.toMatchObject<
      Partial<ReferenceDataApiError>
    >({ code: 'NETWORK' });
  });

  it('maps malformed JSON to MALFORMED_RESPONSE', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => {
        throw new Error('bad json');
      },
    } as unknown as Response);

    await expect(fetchLocationReferenceData({ baseUrl: BASE_URL })).rejects.toMatchObject<
      Partial<ReferenceDataApiError>
    >({ code: 'MALFORMED_RESPONSE' });
  });
});
