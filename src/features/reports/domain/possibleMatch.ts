import type { FieldReportLocationSource } from '@/database/schema';

/**
 * The local warning is intentionally stricter than a general similarity
 * search: it requires the same report context, AI-supported result, nearby
 * coordinates, and a recent observation.
 */
export const POSSIBLE_MATCH_RECENCY_WINDOW_MS = 7 * 24 * 60 * 60 * 1_000;
export const POSSIBLE_MATCH_MAX_DISTANCE_METERS = 100;
export const POSSIBLE_MATCH_CANDIDATE_LIMIT = 100;

export interface PossibleMatchLookupInput {
  barangay: string | null;
  finalLatitude: number | null;
  finalLongitude: number | null;
  farmerOrFarmOwnerName: string | null;
  locationSource: FieldReportLocationSource | null;
  municipality: string | null;
  observedAt: string;
  predictedLabel: string | null;
  province: string | null;
  reportId: string;
  scanRecordId: string;
}

export interface RecentFieldReportMatchCandidate {
  barangay: string | null;
  finalLatitude: number | null;
  finalLongitude: number | null;
  farmerOrFarmOwnerName: string | null;
  locationSource: FieldReportLocationSource | null;
  municipality: string | null;
  observedAt: string;
  predictedLabel: string | null;
  province: string | null;
  reportId: string;
  scanRecordId: string;
}

export interface PossibleRecentMatch {
  barangay: string;
  distanceMeters: number;
  farmerOrFarmOwnerName: string;
  finalLatitude: number;
  finalLongitude: number;
  locationSource: FieldReportLocationSource;
  municipality: string;
  observedAt: string;
  predictedLabel: string;
  province: string;
  reportId: string;
  scanRecordId: string;
}

export interface PossibleMatchSelectionOptions {
  maxDistanceMeters?: number;
  recencyWindowMs?: number;
}

export function isPossibleRecentMatch(
  value: unknown,
): value is PossibleRecentMatch {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.barangay) &&
    isNonNegativeFiniteNumber(candidate.distanceMeters) &&
    isNonEmptyString(candidate.farmerOrFarmOwnerName) &&
    isValidCoordinates(candidate.finalLatitude, candidate.finalLongitude) &&
    isValidLocationSource(candidate.locationSource) &&
    isNonEmptyString(candidate.municipality) &&
    isNonEmptyString(candidate.observedAt) &&
    Number.isFinite(Date.parse(candidate.observedAt)) &&
    isNonEmptyString(candidate.predictedLabel) &&
    isNonEmptyString(candidate.province) &&
    isNonEmptyString(candidate.reportId) &&
    isNonEmptyString(candidate.scanRecordId)
  );
}

export function isPossibleMatchLookupReady(
  input: PossibleMatchLookupInput,
): boolean {
  return (
    Boolean(input.reportId.trim()) &&
    Boolean(input.scanRecordId.trim()) &&
    Boolean(input.predictedLabel?.trim()) &&
    Boolean(input.farmerOrFarmOwnerName?.trim()) &&
    Boolean(input.province?.trim()) &&
    Boolean(input.municipality?.trim()) &&
    Boolean(input.barangay?.trim()) &&
    isValidLocationSource(input.locationSource) &&
    isValidCoordinates(input.finalLatitude, input.finalLongitude) &&
    Number.isFinite(Date.parse(input.observedAt))
  );
}

export function selectConservativePossibleRecentMatch(
  input: PossibleMatchLookupInput,
  candidates: RecentFieldReportMatchCandidate[],
  options: PossibleMatchSelectionOptions = {},
): PossibleRecentMatch | null {
  if (!isPossibleMatchLookupReady(input)) {
    return null;
  }

  const maxDistanceMeters =
    options.maxDistanceMeters ?? POSSIBLE_MATCH_MAX_DISTANCE_METERS;
  const recencyWindowMs =
    options.recencyWindowMs ?? POSSIBLE_MATCH_RECENCY_WINDOW_MS;
  if (
    !Number.isFinite(maxDistanceMeters) ||
    maxDistanceMeters < 0 ||
    !Number.isFinite(recencyWindowMs) ||
    recencyWindowMs < 0
  ) {
    return null;
  }

  const matches = candidates
    .map((candidate) => matchCandidate(input, candidate, maxDistanceMeters, recencyWindowMs))
    .filter((match): match is PossibleRecentMatch => match !== null)
    .sort((first, second) => {
      const distanceDifference = first.distanceMeters - second.distanceMeters;
      if (distanceDifference !== 0) {
        return distanceDifference;
      }
      return Date.parse(second.observedAt) - Date.parse(first.observedAt);
    });

  return matches[0] ?? null;
}

function matchCandidate(
  input: PossibleMatchLookupInput,
  candidate: RecentFieldReportMatchCandidate,
  maxDistanceMeters: number,
  recencyWindowMs: number,
): PossibleRecentMatch | null {
  if (
    candidate.reportId === input.reportId ||
    candidate.scanRecordId === input.scanRecordId ||
    !isValidLocationSource(candidate.locationSource) ||
    !isValidCoordinates(candidate.finalLatitude, candidate.finalLongitude)
  ) {
    return null;
  }

  const currentObservedAt = Date.parse(input.observedAt);
  const candidateObservedAt = Date.parse(candidate.observedAt);
  if (
    !Number.isFinite(candidateObservedAt) ||
    candidateObservedAt > currentObservedAt ||
    currentObservedAt - candidateObservedAt > recencyWindowMs
  ) {
    return null;
  }

  if (
    normalizeMatchText(candidate.predictedLabel) !==
      normalizeMatchText(input.predictedLabel) ||
    normalizeMatchText(candidate.farmerOrFarmOwnerName) !==
      normalizeMatchText(input.farmerOrFarmOwnerName) ||
    normalizeMatchText(candidate.province) !== normalizeMatchText(input.province) ||
    normalizeMatchText(candidate.municipality) !==
      normalizeMatchText(input.municipality) ||
    normalizeMatchText(candidate.barangay) !== normalizeMatchText(input.barangay)
  ) {
    return null;
  }

  const distanceMeters = haversineDistanceMeters(
    input.finalLatitude!,
    input.finalLongitude!,
    candidate.finalLatitude!,
    candidate.finalLongitude!,
  );
  if (distanceMeters > maxDistanceMeters) {
    return null;
  }

  return {
    barangay: candidate.barangay!.trim(),
    distanceMeters,
    farmerOrFarmOwnerName: candidate.farmerOrFarmOwnerName!.trim(),
    finalLatitude: candidate.finalLatitude!,
    finalLongitude: candidate.finalLongitude!,
    locationSource: candidate.locationSource,
    municipality: candidate.municipality!.trim(),
    observedAt: candidate.observedAt,
    predictedLabel: candidate.predictedLabel!.trim(),
    province: candidate.province!.trim(),
    reportId: candidate.reportId,
    scanRecordId: candidate.scanRecordId,
  };
}

function normalizeMatchText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().replace(/\s+/g, ' ').toLowerCase();
  return normalized || null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim());
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isValidLocationSource(
  value: unknown,
): value is FieldReportLocationSource {
  return value === 'gps' || value === 'manual_map';
}

function isValidCoordinates(
  latitude: unknown,
  longitude: unknown,
): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function haversineDistanceMeters(
  firstLatitude: number,
  firstLongitude: number,
  secondLatitude: number,
  secondLongitude: number,
): number {
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = toRadians(secondLatitude - firstLatitude);
  const longitudeDelta = toRadians(secondLongitude - firstLongitude);
  const firstLatitudeRadians = toRadians(firstLatitude);
  const secondLatitudeRadians = toRadians(secondLatitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitudeRadians) *
      Math.cos(secondLatitudeRadians) *
      Math.sin(longitudeDelta / 2) ** 2;
  return (
    2 *
    earthRadiusMeters *
    Math.asin(Math.sqrt(Math.min(1, Math.max(0, haversine))))
  );
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
