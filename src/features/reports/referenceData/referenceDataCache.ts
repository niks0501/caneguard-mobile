import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  parseLocationReferenceData,
  ReferenceDataApiError,
  type LocationReferenceData,
} from '@/features/reports/referenceData/referenceDataTypes';

const CACHE_KEY = 'caneguard.referenceData.locations.v1';

/**
 * Persists the fetched reference lists so the region and barangay pickers
 * work offline (decisions D2/D3).
 */
export async function loadCachedLocationReferenceData(): Promise<LocationReferenceData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    return parseLocationReferenceData(parsed, {
      etag: null,
      fetchedAt: new Date(0).toISOString(),
    });
  } catch {
    // Corrupted or unreadable cache falls back to the seeded list.
    return null;
  }
}

export async function saveCachedLocationReferenceData(
  data: LocationReferenceData,
): Promise<void> {
  const payload = JSON.stringify({
    version: data.version,
    etag: data.etag,
    regions: data.regions,
    barangays: data.barangays,
    fetchedAt: data.fetchedAt,
  });
  await AsyncStorage.setItem(CACHE_KEY, payload);
}

export async function clearCachedLocationReferenceData(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY);
}

// Re-exported so callers can distinguish cache corruption without importing
// the api module.
export { ReferenceDataApiError };
