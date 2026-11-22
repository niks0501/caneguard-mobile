import {
  accountedBytes,
  isTileExpired,
  isValidTileImage,
  planEviction,
  resolveTileFreshness,
  tileRequestHeaders,
  tileSourceId,
  TILE_FRESHNESS_FALLBACK_MS,
  TILE_FRESHNESS_MAX_MS,
  type TileCacheEntry,
} from '../tileCachePolicy';

const NOW = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

function headers(values: Record<string, string>) {
  return { get: (name: string) => values[name.toLowerCase()] ?? null };
}

function entry(overrides: Partial<TileCacheEntry> = {}): TileCacheEntry {
  return {
    bytes: 4096,
    expiresAt: NOW + DAY,
    fetchedAt: NOW,
    file: 'a.tile',
    lastUsedAt: NOW,
    ...overrides,
  };
}

describe('resolveTileFreshness', () => {
  it('uses the 7-day fallback when headers are missing or unreadable', () => {
    expect(resolveTileFreshness(headers({}), NOW)).toEqual({
      cacheable: true,
      expiresAt: NOW + TILE_FRESHNESS_FALLBACK_MS,
    });
    expect(resolveTileFreshness(null, NOW)).toEqual({
      cacheable: true,
      expiresAt: NOW + TILE_FRESHNESS_FALLBACK_MS,
    });
    const throwing = { get: () => { throw new Error('opaque'); } };
    expect(resolveTileFreshness(throwing, NOW)).toEqual({
      cacheable: true,
      expiresAt: NOW + TILE_FRESHNESS_FALLBACK_MS,
    });
  });

  it('honors max-age, minus Age, and Expires', () => {
    expect(
      resolveTileFreshness(headers({ 'cache-control': 'public, max-age=3600', age: '600' }), NOW),
    ).toEqual({ cacheable: true, expiresAt: NOW + 3_000_000 });
    expect(
      resolveTileFreshness(headers({ expires: new Date(NOW + 60_000).toUTCString() }), NOW),
    ).toEqual({ cacheable: true, expiresAt: NOW + 60_000 });
  });

  it('caps freshness and ignores nonsense', () => {
    expect(
      resolveTileFreshness(headers({ 'cache-control': 'max-age=99999999999' }), NOW),
    ).toEqual({ cacheable: true, expiresAt: NOW + TILE_FRESHNESS_MAX_MS });
    expect(resolveTileFreshness(headers({ expires: 'garbage' }), NOW)).toEqual({
      cacheable: true,
      expiresAt: NOW + TILE_FRESHNESS_FALLBACK_MS,
    });
    // An Expires date in the past means already stale, never "forever".
    expect(resolveTileFreshness(headers({ expires: '0' }), NOW)).toEqual({
      cacheable: true,
      expiresAt: NOW,
    });
  });

  it('treats no-cache as always revalidate and no-store as not persistable', () => {
    expect(
      resolveTileFreshness(headers({ 'cache-control': 'no-cache, private' }), NOW),
    ).toEqual({ cacheable: true, expiresAt: NOW });
    expect(resolveTileFreshness(headers({ 'cache-control': 'no-store' }), NOW)).toEqual({
      cacheable: false,
    });
  });

  it('treats a tile as expired when the clock moved back before it was fetched', () => {
    expect(isTileExpired(entry({ fetchedAt: NOW + DAY }), NOW)).toBe(true);
    expect(isTileExpired(entry(), NOW)).toBe(false);
    expect(isTileExpired(entry({ expiresAt: NOW }), NOW)).toBe(true);
  });
});

describe('isValidTileImage', () => {
  const pad = (head: number[]) => Uint8Array.from([...head, ...new Array(16).fill(0)]);

  it('accepts real image signatures and rejects error pages and oversize bodies', () => {
    expect(isValidTileImage(pad([0x89, 0x50, 0x4e, 0x47]))).toBe(true);
    expect(isValidTileImage(pad([0xff, 0xd8, 0xff]))).toBe(true);
    expect(isValidTileImage(new TextEncoder().encode('<html>403 Forbidden</html>'))).toBe(false);
    expect(isValidTileImage(new Uint8Array(4))).toBe(false);
    expect(isValidTileImage(new Uint8Array(600 * 1024).fill(0x89))).toBe(false);
  });
});

describe('planEviction', () => {
  it('evicts least-recently-used unpinned tiles first and never pinned ones', () => {
    const entries = {
      newest: entry({ bytes: 100, lastUsedAt: NOW }),
      oldest: entry({ bytes: 100, lastUsedAt: NOW - 3000 }),
      pinned: entry({ bytes: 100, lastUsedAt: NOW - 9000, pinned: true }),
      older: entry({ bytes: 100, lastUsedAt: NOW - 2000 }),
    };
    expect(planEviction(entries, { budgetBytes: 300, incomingBytes: 100, now: NOW })).toEqual({
      evict: ['oldest', 'older'],
      fits: true,
    });
  });

  it('reports no room when pinned tiles alone fill the budget', () => {
    const entries = { pinned: entry({ bytes: 300, pinned: true }) };
    expect(planEviction(entries, { budgetBytes: 300, incomingBytes: 100, now: NOW }).fits).toBe(false);
  });

  it('removes unpinned tiles unused for 30 days even when under budget', () => {
    const entries = {
      stale: entry({ lastUsedAt: NOW - 31 * DAY }),
      stalePinned: entry({ lastUsedAt: NOW - 31 * DAY, pinned: true }),
      fresh: entry(),
    };
    expect(planEviction(entries, { now: NOW }).evict).toEqual(['stale']);
  });

  it('bounds the entry count', () => {
    const entries = {
      a: entry({ lastUsedAt: NOW - 2 }),
      b: entry({ lastUsedAt: NOW - 1 }),
    };
    expect(planEviction(entries, { incomingBytes: 1, maxEntries: 2, now: NOW }).evict).toEqual(['a']);
  });
});

describe('helpers', () => {
  it('rounds sizes up to whole disk blocks', () => {
    expect(accountedBytes(1)).toBe(4096);
    expect(accountedBytes(4096)).toBe(4096);
    expect(accountedBytes(4097)).toBe(8192);
  });

  it('keeps query strings and credentials out of the source id', () => {
    const base = 'https://api.example.test/api/v1/mobile/map-tiles/{z}/{x}/{y}.png';
    expect(tileSourceId(`${base}?key=secret`)).toBe(tileSourceId(base));
    expect(tileSourceId(base)).toMatch(/^[0-9a-f]{8}$/);
    expect(tileSourceId('https://other.example.test/{z}/{x}/{y}.png')).not.toBe(tileSourceId(base));
  });

  it('sends the bearer token to the CaneGuard proxy but never to OpenStreetMap', () => {
    expect(tileRequestHeaders('https://api.example.test/t/1/2/3.png', 'tok')).toEqual({
      Authorization: 'Bearer tok',
      'User-Agent': 'CaneGuard-Mobile/1.0',
    });
    expect(tileRequestHeaders('https://tile.openstreetmap.org/1/2/3.png', 'tok')).toEqual({
      'User-Agent': 'CaneGuard-Mobile/1.0',
    });
  });
});
