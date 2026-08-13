/**
 * Reference data types for the dynamic region (province/municipality) and
 * barangay lists (decisions D2 and D3).
 *
 * The lists are served by a backend endpoint that does not exist yet; the
 * client fetches them, caches them for offline use, detects backend changes
 * through the version/ETag pair, and falls back to a seeded static list until
 * the endpoint is available.
 */

export interface ReferenceRegion {
  province: string;
  municipalities: string[];
}

export interface LocationReferenceData {
  /** Server-provided version; changes whenever the lists change. */
  version: string;
  /** Server ETag for If-None-Match change detection (may be null). */
  etag: string | null;
  regions: ReferenceRegion[];
  barangays: string[];
  /** Local timestamp of when this snapshot was fetched or seeded. */
  fetchedAt: string;
}

export type LocationReferenceDataSource = 'cache' | 'network' | 'seed';

export type LocationReferenceFetchResult =
  | { status: 'unchanged' }
  | { status: 'updated'; data: LocationReferenceData };

export type ReferenceDataErrorCode =
  | 'AUTH_REQUIRED'
  | 'MALFORMED_RESPONSE'
  | 'NETWORK'
  | 'TIMEOUT';

export class ReferenceDataApiError extends Error {
  readonly code: ReferenceDataErrorCode;
  readonly status: number | null;

  constructor(
    code: ReferenceDataErrorCode,
    message: string,
    status: number | null = null,
  ) {
    super(message);
    this.name = 'ReferenceDataApiError';
    this.code = code;
    this.status = status;
  }
}

const MAX_REFERENCE_TEXT_LENGTH = 120;
const MAX_REGIONS = 200;
const MAX_BARANGAYS = 5_000;

/**
 * Validates an untrusted server payload (or a corrupted cache entry) and
 * returns a normalized LocationReferenceData snapshot.
 */
export function parseLocationReferenceData(
  body: unknown,
  options: { etag?: string | null; fetchedAt: string } = {
    etag: null,
    fetchedAt: new Date(0).toISOString(),
  },
): LocationReferenceData {
  if (!body || typeof body !== 'object') {
    throw new ReferenceDataApiError(
      'MALFORMED_RESPONSE',
      'The location reference list is not a JSON object.',
    );
  }
  const record = body as Record<string, unknown>;

  const version = readRequiredString(record.version, 'version');
  const regions = readRegions(record.regions);
  const barangays = readBarangays(record.barangays);
  if (regions.length === 0) {
    throw new ReferenceDataApiError(
      'MALFORMED_RESPONSE',
      'The location reference list has no regions.',
    );
  }

  const etag =
    options.etag ??
    (typeof record.etag === 'string' && record.etag.trim()
      ? record.etag.trim()
      : null);

  return {
    version,
    etag,
    regions,
    barangays,
    fetchedAt: options.fetchedAt,
  };
}

function readRegions(value: unknown): ReferenceRegion[] {
  if (!Array.isArray(value)) {
    throw new ReferenceDataApiError(
      'MALFORMED_RESPONSE',
      'The location reference regions are not a list.',
    );
  }
  if (value.length > MAX_REGIONS) {
    throw new ReferenceDataApiError(
      'MALFORMED_RESPONSE',
      'The location reference regions list is too large.',
    );
  }
  const seen = new Set<string>();
  const regions: ReferenceRegion[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') {
      throw new ReferenceDataApiError(
        'MALFORMED_RESPONSE',
        'A location reference region is invalid.',
      );
    }
    const region = entry as Record<string, unknown>;
    const province = readRequiredString(region.province, 'province');
    if (seen.has(province)) {
      continue;
    }
    seen.add(province);
    const municipalities = readStringList(
      region.municipalities,
      'municipalities',
    );
    if (municipalities.length === 0) {
      throw new ReferenceDataApiError(
        'MALFORMED_RESPONSE',
        `The region ${province} has no municipalities.`,
      );
    }
    regions.push({ province, municipalities });
  }
  return regions;
}

function readBarangays(value: unknown): string[] {
  return readStringList(value, 'barangays').slice(0, MAX_BARANGAYS);
}

function readStringList(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new ReferenceDataApiError(
      'MALFORMED_RESPONSE',
      `The location reference ${label} are not a list.`,
    );
  }
  const seen = new Set<string>();
  const items: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string') {
      throw new ReferenceDataApiError(
        'MALFORMED_RESPONSE',
        `A location reference ${label} entry is not text.`,
      );
    }
    const normalized = entry.trim();
    if (!normalized || normalized.length > MAX_REFERENCE_TEXT_LENGTH) {
      throw new ReferenceDataApiError(
        'MALFORMED_RESPONSE',
        `A location reference ${label} entry is invalid.`,
      );
    }
    if (!seen.has(normalized)) {
      seen.add(normalized);
      items.push(normalized);
    }
  }
  return items;
}

function readRequiredString(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new ReferenceDataApiError(
      'MALFORMED_RESPONSE',
      `The location reference ${label} is not text.`,
    );
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > MAX_REFERENCE_TEXT_LENGTH) {
    throw new ReferenceDataApiError(
      'MALFORMED_RESPONSE',
      `The location reference ${label} is invalid.`,
    );
  }
  return normalized;
}
