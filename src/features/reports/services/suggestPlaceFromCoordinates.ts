import * as Location from 'expo-location';

import type { LocationReferenceData } from '@/features/reports/referenceData/referenceDataTypes';

export interface PlaceSuggestion {
  barangay: string;
  municipality: string;
  province: string;
}

/** Address parts a reverse lookup returns; any of them may be missing. */
export interface GeocodedAddress {
  city?: string | null;
  district?: string | null;
  name?: string | null;
  region?: string | null;
  street?: string | null;
  subregion?: string | null;
}

export type ReverseGeocoder = (
  latitude: number,
  longitude: number,
) => Promise<GeocodedAddress[]>;

const expoReverseGeocoder: ReverseGeocoder = (latitude, longitude) =>
  Location.reverseGeocodeAsync({ latitude, longitude });

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/\b(barangay|brgy\.?|city of|municipality of|province of)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function findListed(candidates: (string | null | undefined)[], list: string[]) {
  const wanted = candidates.map(normalize).filter(Boolean);
  return list.find((entry) => wanted.includes(normalize(entry))) ?? null;
}

/**
 * Matches a reverse lookup against the place list saved on the phone. Only
 * names that exist in that list are suggested, and a barangay match is
 * required: a town alone is not worth interrupting the inspector for.
 */
export function matchPlaceToReferenceList(
  addresses: GeocodedAddress[],
  reference: Pick<LocationReferenceData, 'barangays' | 'regions'>,
): PlaceSuggestion | null {
  for (const address of addresses) {
    const barangay = findListed(
      [address.district, address.name, address.street, address.subregion],
      reference.barangays,
    );
    if (!barangay) {
      continue;
    }
    for (const region of reference.regions) {
      const municipality = findListed(
        [address.city, address.subregion, address.district],
        region.municipalities,
      );
      if (municipality) {
        return { barangay, municipality, province: region.province };
      }
    }
  }
  return null;
}

/** Best effort: a failed or empty lookup just means no suggestion. */
export async function suggestPlaceFromCoordinates(
  latitude: number,
  longitude: number,
  reference: Pick<LocationReferenceData, 'barangays' | 'regions'>,
  geocode: ReverseGeocoder = expoReverseGeocoder,
): Promise<PlaceSuggestion | null> {
  try {
    return matchPlaceToReferenceList(await geocode(latitude, longitude), reference);
  } catch {
    return null;
  }
}
