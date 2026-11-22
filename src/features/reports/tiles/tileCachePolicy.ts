/**
 * Map-tile cache policy: the limits and the pure decisions (freshness,
 * eviction, validation). No I/O lives here so every rule is unit-testable.
 *
 * Scope: compliant on-demand caching of tiles the map actually displays.
 * Offline map packages (bulk download, pinned tiles) are deliberately not
 * implemented: they need a tile provider that explicitly permits offline
 * downloads, and none is configured. Public OpenStreetMap servers forbid
 * bulk prefetching. See docs/security/map-tile-cache.md.
 */

const MB = 1024 * 1024;
const DAY_MS = 24 * 60 * 60 * 1000;

export const TILE_CACHE_MAX_BYTES = 200 * MB;
/** Reserved for the index file so tiles + index never exceed the 200 MB cap. */
export const TILE_CACHE_INDEX_RESERVE_BYTES = 4 * MB;
export const TILE_CACHE_TILE_BUDGET_BYTES =
  TILE_CACHE_MAX_BYTES - TILE_CACHE_INDEX_RESERVE_BYTES;
/** Guards the index file size when many tiny tiles are cached. */
export const TILE_CACHE_MAX_ENTRIES = 20_000;
/** Filesystems allocate whole blocks; account for them so the cap is real. */
export const TILE_BLOCK_BYTES = 4096;
/** A real map tile is a few KB to tens of KB; anything larger is rejected. */
export const TILE_MAX_RESPONSE_BYTES = 512 * 1024;

export const TILE_FRESHNESS_FALLBACK_MS = 7 * DAY_MS;
/** Provider headers may shorten freshness but never keep a tile "fresh" past this. */
export const TILE_FRESHNESS_MAX_MS = 30 * DAY_MS;
export const TILE_UNUSED_MAX_AGE_MS = 30 * DAY_MS;
/** Refuse to write when less than this would stay free on the device. */
export const TILE_MIN_FREE_DISK_BYTES = 500 * MB;

export const TILE_MAX_CONCURRENT_REQUESTS = 3;
export const TILE_RETRY_DELAYS_MS: readonly number[] = [1_000, 2_000];
export const TILE_REQUEST_TIMEOUT_MS = 15_000;
/** One network attempt per tile per this window, so panning cannot hammer a server. */
export const TILE_RECHECK_COOLDOWN_MS = 60_000;

export interface TileCacheEntry {
  /** Stored file name inside the tile directory. */
  file: string;
  /** Block-rounded size used for the cap. */
  bytes: number;
  fetchedAt: number;
  expiresAt: number;
  lastUsedAt: number;
  /** Validator only; never a credential. */
  etag?: string;
  /** Reserved for future provider-approved offline packages: never evicted. */
  pinned?: boolean;
}

export function accountedBytes(byteLength: number): number {
  return Math.ceil(byteLength / TILE_BLOCK_BYTES) * TILE_BLOCK_BYTES;
}

export interface HeaderReader {
  get(name: string): string | null;
}

export type TileFreshness =
  | { cacheable: true; expiresAt: number }
  | { cacheable: false };

function safeHeader(headers: HeaderReader | null | undefined, name: string) {
  try {
    return headers?.get(name) ?? null;
  } catch {
    return null;
  }
}

/**
 * Freshness from the provider's HTTP headers, falling back to seven days when
 * they are missing or unreadable (the OpenStreetMap tile usage minimum).
 * `no-store` means the tile must not be persisted at all.
 */
export function resolveTileFreshness(
  headers: HeaderReader | null | undefined,
  now: number,
): TileFreshness {
  const cacheControl = (safeHeader(headers, 'cache-control') ?? '').toLowerCase();
  const directives = cacheControl.split(',').map((part) => part.trim());
  // `private` is fine: this is a per-device cache, not a shared one.
  if (directives.includes('no-store')) {
    return { cacheable: false };
  }
  if (directives.includes('no-cache')) {
    return { cacheable: true, expiresAt: now };
  }

  const maxAge = directives
    .map((part) => /^max-age=(\d+)$/.exec(part))
    .find(Boolean);
  let ttlMs = TILE_FRESHNESS_FALLBACK_MS;
  if (maxAge) {
    ttlMs = Number(maxAge[1]) * 1000;
  } else {
    const expires = Date.parse(safeHeader(headers, 'expires') ?? '');
    if (Number.isFinite(expires)) ttlMs = expires - now;
  }
  if (!Number.isFinite(ttlMs)) ttlMs = TILE_FRESHNESS_FALLBACK_MS;
  const age = Number(safeHeader(headers, 'age'));
  if (maxAge && Number.isFinite(age) && age > 0) ttlMs -= age * 1000;
  return {
    cacheable: true,
    expiresAt: now + Math.min(Math.max(ttlMs, 0), TILE_FRESHNESS_MAX_MS),
  };
}

export function isTileExpired(entry: TileCacheEntry, now: number): boolean {
  // fetchedAt in the future means the device clock moved back: do not trust freshness.
  return entry.fetchedAt > now || entry.expiresAt <= now;
}

/** PNG, JPEG or WebP signature; rejects HTML error pages and truncated junk. */
export function isValidTileImage(bytes: Uint8Array): boolean {
  if (bytes.length < 12 || bytes.length > TILE_MAX_RESPONSE_BYTES) return false;
  const png =
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const webp =
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return png || jpeg || webp;
}

/**
 * Which cache keys to remove: unpinned tiles unused for 30 days first, then
 * least-recently-used unpinned tiles until `incomingBytes` fits the budget.
 * `fits` is false when pinned tiles alone leave no room.
 */
export function planEviction(
  entries: Readonly<Record<string, TileCacheEntry>>,
  {
    incomingBytes = 0,
    now,
    budgetBytes = TILE_CACHE_TILE_BUDGET_BYTES,
    maxEntries = TILE_CACHE_MAX_ENTRIES,
  }: { incomingBytes?: number; now: number; budgetBytes?: number; maxEntries?: number },
): { evict: string[]; fits: boolean } {
  const evict: string[] = [];
  const evictable: [string, TileCacheEntry][] = [];
  let total = 0;
  let count = 0;
  for (const [key, entry] of Object.entries(entries)) {
    if (!entry.pinned && now - entry.lastUsedAt > TILE_UNUSED_MAX_AGE_MS) {
      evict.push(key);
      continue;
    }
    total += entry.bytes;
    count += 1;
    if (!entry.pinned) evictable.push([key, entry]);
  }
  evictable.sort((a, b) => a[1].lastUsedAt - b[1].lastUsedAt);
  for (const [key, entry] of evictable) {
    if (total + incomingBytes <= budgetBytes && (incomingBytes === 0 ? count : count + 1) <= maxEntries) break;
    evict.push(key);
    total -= entry.bytes;
    count -= 1;
  }
  return {
    evict,
    fits: total + incomingBytes <= budgetBytes && (incomingBytes === 0 ? count : count + 1) <= maxEntries,
  };
}

/**
 * Stable id for a tile source: origin + path only. Query strings (which could
 * carry a provider key) and credentials never enter cache keys or file names.
 */
export function tileSourceId(urlTemplate: string): string {
  let identity = urlTemplate;
  try {
    const url = new URL(urlTemplate);
    identity = `${url.origin}${decodeURIComponent(url.pathname)}`;
  } catch {
    // Keep the raw template; it is only hashed.
  }
  let hash = 0x811c9dc5;
  for (let index = 0; index < identity.length; index += 1) {
    hash ^= identity.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** The bearer token only ever goes to a CaneGuard proxy, never to OpenStreetMap. */
export function tileRequestHeaders(
  url: string,
  authToken: string | null | undefined,
): Record<string, string> {
  const headers: Record<string, string> = { 'User-Agent': 'CaneGuard-Mobile/1.0' };
  if (authToken && !url.includes('tile.openstreetmap.org')) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return headers;
}
