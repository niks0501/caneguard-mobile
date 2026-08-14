import { SEED_LOCATION_REFERENCE_DATA } from '@/features/reports/referenceData/nasugbuSeed';
import { resolveLocationReferenceData } from '@/features/reports/referenceData/referenceDataService';
import type { LocationReferenceData } from '@/features/reports/referenceData/referenceDataTypes';

const SERVER_DATA: LocationReferenceData = {
  version: 'v2',
  etag: '"v2"',
  regions: [{ province: 'Batangas', municipalities: ['Nasugbu'] }],
  barangays: ['Wawa', 'Lumbangan', 'Aga'],
  fetchedAt: '2026-08-13T00:00:00.000Z',
};

const CACHED_DATA: LocationReferenceData = {
  version: 'v1',
  etag: '"v1"',
  regions: [{ province: 'Batangas', municipalities: ['Nasugbu'] }],
  barangays: ['Wawa'],
  fetchedAt: '2026-08-12T00:00:00.000Z',
};

function fetchResolving(data: LocationReferenceData) {
  return jest.fn().mockResolvedValue({ status: 'updated', data });
}

describe('resolveLocationReferenceData', () => {
  it('serves the seeded list when there is no cache and the endpoint is missing', async () => {
    const resolution = await resolveLocationReferenceData({
      loadCache: async () => null,
      fetchData: jest.fn().mockRejectedValue(new Error('offline')),
    });

    expect(resolution).toMatchObject({
      data: SEED_LOCATION_REFERENCE_DATA,
      source: 'seed',
      refreshed: false,
    });
    expect(resolution.errorMessage).toBeTruthy();
  });

  it('serves the offline cache when the endpoint is unreachable', async () => {
    const resolution = await resolveLocationReferenceData({
      loadCache: async () => CACHED_DATA,
      fetchData: jest.fn().mockRejectedValue(new Error('offline')),
    });

    expect(resolution).toMatchObject({
      data: CACHED_DATA,
      source: 'cache',
      refreshed: false,
    });
  });

  it('replaces the cache when the server version changes', async () => {
    const saveCache = jest.fn().mockResolvedValue(undefined);
    const resolution = await resolveLocationReferenceData({
      loadCache: async () => CACHED_DATA,
      saveCache,
      fetchData: fetchResolving(SERVER_DATA),
    });

    expect(resolution).toMatchObject({
      data: SERVER_DATA,
      source: 'network',
      refreshed: true,
      errorMessage: null,
    });
    expect(saveCache).toHaveBeenCalledWith(SERVER_DATA);
  });

  it('keeps the cache when the server reports the same version', async () => {
    const saveCache = jest.fn().mockResolvedValue(undefined);
    const sameVersion = { ...SERVER_DATA, version: CACHED_DATA.version };
    const resolution = await resolveLocationReferenceData({
      loadCache: async () => CACHED_DATA,
      saveCache,
      fetchData: fetchResolving(sameVersion),
    });

    expect(resolution).toMatchObject({
      data: CACHED_DATA,
      source: 'cache',
      refreshed: false,
    });
    expect(saveCache).not.toHaveBeenCalled();
  });

  it('keeps the cache on an unchanged 304 response', async () => {
    const resolution = await resolveLocationReferenceData({
      loadCache: async () => CACHED_DATA,
      fetchData: jest.fn().mockResolvedValue({ status: 'unchanged' }),
    });

    expect(resolution).toMatchObject({
      data: CACHED_DATA,
      source: 'cache',
      refreshed: false,
      errorMessage: null,
    });
  });

  it('passes the cached ETag to the fetch for change detection', async () => {
    const fetchData = fetchResolving(SERVER_DATA);
    await resolveLocationReferenceData({
      loadCache: async () => CACHED_DATA,
      fetchData,
    });

    expect(fetchData).toHaveBeenCalledWith(
      expect.objectContaining({ etag: '"v1"' }),
    );
  });
});
