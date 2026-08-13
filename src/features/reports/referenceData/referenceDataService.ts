import {
  loadCachedLocationReferenceData,
  saveCachedLocationReferenceData,
} from '@/features/reports/referenceData/referenceDataCache';
import {
  fetchLocationReferenceData,
  type FetchLocationReferenceOptions,
} from '@/features/reports/referenceData/referenceDataApi';
import { SEED_LOCATION_REFERENCE_DATA } from '@/features/reports/referenceData/nasugbuSeed';
import {
  ReferenceDataApiError,
  type LocationReferenceData,
  type LocationReferenceDataSource,
  type LocationReferenceFetchResult,
} from '@/features/reports/referenceData/referenceDataTypes';

export interface ReferenceDataResolution {
  data: LocationReferenceData;
  source: LocationReferenceDataSource;
  /** True when a network snapshot replaced the previous local snapshot. */
  refreshed: boolean;
  errorMessage: string | null;
}

export interface ResolveLocationReferenceOptions {
  fetchData?: (options: FetchLocationReferenceOptions) => Promise<LocationReferenceFetchResult>;
  loadCache?: () => Promise<LocationReferenceData | null>;
  saveCache?: (data: LocationReferenceData) => Promise<void>;
  now?: () => Date;
}

/**
 * Resolves the location reference lists for offline-first use (D2/D3):
 *
 * 1. Serve the cached snapshot when one exists, otherwise the seeded list —
 *    the pickers always have data, online or offline.
 * 2. Attempt one network refresh (with the cached ETag). A changed server
 *    snapshot replaces the local one and is persisted; a 304/unchanged keeps
 *    the cache; a network failure keeps the local snapshot and reports the
 *    reason without failing the call.
 */
export async function resolveLocationReferenceData(
  options: ResolveLocationReferenceOptions = {},
): Promise<ReferenceDataResolution> {
  const loadCache = options.loadCache ?? loadCachedLocationReferenceData;
  const saveCache = options.saveCache ?? saveCachedLocationReferenceData;
  const fetchData =
    options.fetchData ??
    ((fetchOptions: FetchLocationReferenceOptions) =>
      fetchLocationReferenceData(fetchOptions));
  const now = options.now ?? (() => new Date());

  const cached = await loadCache();
  let data = cached ?? SEED_LOCATION_REFERENCE_DATA;
  let source: LocationReferenceDataSource = cached ? 'cache' : 'seed';
  let errorMessage: string | null = null;

  try {
    const result = await fetchData({
      etag: data.etag,
      now,
    });
    if (result.status === 'updated' && result.data) {
      if (result.data.version !== data.version) {
        data = result.data;
        source = 'network';
        await saveCache(result.data);
      }
    }
  } catch (error: unknown) {
    errorMessage =
      error instanceof ReferenceDataApiError
        ? error.message
        : 'The location reference list could not be refreshed.';
  }

  return { data, source, refreshed: source === 'network', errorMessage };
}
