import { TileCache, type TileRequest, type TileStore } from '../tileCache';
import { TILE_MIN_FREE_DISK_BYTES } from '../tileCachePolicy';

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, ...new Array(40).fill(1)]);
const DAY = 24 * 60 * 60 * 1000;
const GB = 1024 * 1024 * 1024;

class MemoryStore implements TileStore {
  files = new Map<string, Uint8Array>();
  index: string | null = null;
  free: number | null = 10 * GB;
  failWrites = false;
  saveIndex = jest.fn(async (json: string) => {
    this.index = json;
  });
  freeDiskBytes() {
    return this.free;
  }
  listTileFiles() {
    return [...this.files.keys()];
  }
  async loadIndex() {
    return this.index;
  }
  removeTileFile(file: string) {
    this.files.delete(file);
  }
  tileFileSize(file: string) {
    return this.files.get(file)?.length ?? null;
  }
  uri(file: string) {
    return `file:///tiles/${file}`;
  }
  async writeTileFile(file: string, bytes: Uint8Array) {
    if (this.failWrites) throw new Error('disk full');
    this.files.set(file, bytes);
  }
}

function response(status: number, body: Uint8Array | string = PNG, headers: Record<string, string> = {}) {
  return {
    arrayBuffer: async () =>
      (typeof body === 'string' ? new TextEncoder().encode(body) : body).slice().buffer,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    ok: status >= 200 && status < 300,
    status,
  } as unknown as Response;
}

function request(x = 1, extra: Partial<TileRequest> = {}): TileRequest {
  return {
    headers: { Authorization: 'Bearer secret-token', 'User-Agent': 'test' },
    sourceId: 'abcdef12',
    url: `https://api.example.test/tiles/15/${x}/2.png`,
    x,
    y: 2,
    z: 15,
    ...extra,
  };
}

function setup(responder: (url: string, init: RequestInit) => Promise<Response> | Response) {
  const store = new MemoryStore();
  const clock = { now: 1_700_000_000_000 };
  const fetchMock = jest.fn(async (url: string, init: RequestInit) => responder(url, init));
  const sleep = jest.fn(async () => undefined);
  const make = () =>
    new TileCache(store, { fetch: fetchMock as unknown as typeof fetch, now: () => clock.now, sleep });
  return { clock, fetchMock, make, sleep, store, cache: make() };
}

describe('TileCache', () => {
  it('downloads a missing tile once, then serves it from disk', async () => {
    const { cache, fetchMock, store } = setup(() => response(200));
    const first = await cache.resolve(request(), true);
    expect(first).toEqual({ kind: 'cached', uri: expect.stringMatching(/^file:\/\/\/tiles\/abcdef12-15-1-2-/) });
    expect(await cache.resolve(request(), false)).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(store.files.size).toBe(1);
  });

  it('keeps tokens and request headers out of the persisted index', async () => {
    const { cache, store } = setup(() => response(200, PNG, { etag: '"v1"' }));
    await cache.resolve(request(), true);
    await new Promise((resolve) => setImmediate(resolve));
    expect(store.index).not.toContain('secret-token');
    expect(store.index).not.toContain('api.example.test');
    expect(store.index).toContain('v1');
  });

  it('serves expired tiles offline and returns null for tiles never saved', async () => {
    const { cache, clock } = setup(() => response(200));
    const saved = await cache.resolve(request(), true);
    clock.now += 40 * DAY - 1;
    expect(await cache.resolve(request(), false)).toEqual(saved);
    expect(await cache.resolve(request(2), false)).toBeNull();
  });

  it('shows the stale tile at once, refreshes it in the background, then swaps files atomically', async () => {
    let version = 0;
    const { cache, clock, store, fetchMock } = setup(() =>
      response(200, Uint8Array.from([0x89, 0x50, 0x4e, 0x47, ...new Array(40 + version++).fill(2)])),
    );
    const refreshed = jest.fn();
    cache.subscribe(refreshed);
    const first = await cache.resolve(request(), true);
    clock.now += 8 * DAY;

    const stale = await cache.resolve(request(), true);
    expect(stale).toEqual(first);
    await new Promise((resolve) => setImmediate(resolve));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(refreshed).toHaveBeenCalledWith('abcdef12/15/1/2');
    expect(store.files.size).toBe(1);
    const next = await cache.resolve(request(), false);
    expect(next).not.toEqual(first);
  });

  it('keeps the existing tile when the refresh fails or returns junk', async () => {
    let mode: 'ok' | 'junk' | 'fail' = 'ok';
    const { cache, clock, store } = setup(() => {
      if (mode === 'fail') throw new Error('offline');
      return mode === 'junk' ? response(200, '<html>nope</html>') : response(200);
    });
    const first = await cache.resolve(request(), true);
    for (const next of ['junk', 'fail'] as const) {
      mode = next;
      clock.now += 8 * DAY;
      await cache.resolve(request(), true);
      await new Promise((resolve) => setImmediate(resolve));
      expect(await cache.resolve(request(), false)).toEqual(first);
      expect(store.files.size).toBe(1);
    }
  });

  it('sends If-None-Match and extends freshness on 304 without rewriting the file', async () => {
    const calls: RequestInit[] = [];
    const { cache, clock, store } = setup((_url, init) => {
      calls.push(init);
      return calls.length === 1 ? response(200, PNG, { etag: '"abc"' }) : response(304);
    });
    await cache.resolve(request(), true);
    const [file] = [...store.files.keys()];
    clock.now += 8 * DAY;
    await cache.resolve(request(), true);
    await new Promise((resolve) => setImmediate(resolve));
    expect((calls[1].headers as Record<string, string>)['If-None-Match']).toBe('"abc"');
    expect([...store.files.keys()]).toEqual([file]);
  });

  it('retries twice with backoff on server errors, then gives up without retrying 4xx', async () => {
    const server = setup(() => response(503));
    expect(await server.cache.resolve(request(), true)).toBeNull();
    expect(server.fetchMock).toHaveBeenCalledTimes(3);
    expect(server.sleep.mock.calls).toEqual([[1000], [2000]]);

    const blocked = setup(() => response(403));
    expect(await blocked.cache.resolve(request(), true)).toBeNull();
    expect(blocked.fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not hammer a failing tile: one network attempt per cooldown window', async () => {
    const { cache, clock, fetchMock } = setup(() => response(404));
    await cache.resolve(request(), true);
    await cache.resolve(request(), true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    clock.now += 61_000;
    await cache.resolve(request(), true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('never persists no-store tiles and serves them straight from the provider', async () => {
    const { cache, store } = setup(() => response(200, PNG, { 'cache-control': 'no-store' }));
    expect(await cache.resolve(request(), true)).toEqual({
      headers: expect.any(Object),
      kind: 'remote',
      uri: 'https://api.example.test/tiles/15/1/2.png',
    });
    expect(store.files.size).toBe(0);
  });

  it('stops writing when the device would drop below 500 MB free, but still shows the tile', async () => {
    const { cache, store } = setup(() => response(200));
    store.free = TILE_MIN_FREE_DISK_BYTES + 1000;
    expect(await cache.resolve(request(), true)).toMatchObject({ kind: 'remote' });
    expect(store.files.size).toBe(0);
  });

  it('falls back to the provider when the write fails and leaves no partial file', async () => {
    const { cache, store } = setup(() => response(200));
    store.failWrites = true;
    expect(await cache.resolve(request(), true)).toMatchObject({ kind: 'remote' });
    expect(store.files.size).toBe(0);
  });

  it('evicts the least recently used tile when the cap is reached', async () => {
    const store = new MemoryStore();
    const clock = { now: 1_700_000_000_000 };
    const cache = new TileCache(store, {
      budgetBytes: 4096 * 2, // room for two tiles
      fetch: (async () => response(200)) as unknown as typeof fetch,
      now: () => clock.now,
      sleep: async () => undefined,
    });
    await cache.resolve(request(1), true);
    clock.now += 1000;
    await cache.resolve(request(2), true);
    clock.now += 1000;
    await cache.resolve(request(1), false); // tile 2 is now the least recently used
    clock.now += 1000;

    await cache.resolve(request(3), true);
    expect(await cache.resolve(request(2), false)).toBeNull();
    expect(await cache.resolve(request(1), false)).not.toBeNull();
    expect(await cache.resolve(request(3), false)).not.toBeNull();
    expect(store.files.size).toBe(2);
  });

  it('survives an app restart with its tiles intact', async () => {
    const { cache, make, store } = setup(() => response(200));
    const saved = await cache.resolve(request(), true);
    await new Promise((resolve) => setImmediate(resolve));
    expect(await make().resolve(request(), false)).toEqual(saved);
    expect(store.files.size).toBe(1);
  });

  it('rebuilds from a corrupted index by deleting unreferenced tile files', async () => {
    const { cache, make, store } = setup(() => response(200));
    await cache.resolve(request(), true);
    await new Promise((resolve) => setImmediate(resolve));
    store.index = '{not json';
    expect(await make().resolve(request(), false)).toBeNull();
    expect(store.files.size).toBe(0);
  });

  it('drops index entries whose file vanished or no longer matches its size', async () => {
    const { cache, make, store } = setup(() => response(200));
    await cache.resolve(request(1), true);
    await cache.resolve(request(2), true);
    await new Promise((resolve) => setImmediate(resolve));
    const [first, second] = [...store.files.keys()];
    store.files.delete(first); // purged by the OS
    store.files.set(second, new Uint8Array(100_000)); // truncated/replaced
    const restarted = make();
    expect(await restarted.resolve(request(1), false)).toBeNull();
    expect(await restarted.resolve(request(2), false)).toBeNull();
  });

  it('discards a tile that fails to decode so it downloads again', async () => {
    const { cache, fetchMock, store, clock } = setup(() => response(200));
    await cache.resolve(request(), true);
    await cache.discard(request());
    expect(store.files.size).toBe(0);
    clock.now += 1;
    await cache.resolve(request(), true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(store.files.size).toBe(1);
  });

  it('runs at most 3 requests at once and skips queued tiles that scrolled away', async () => {
    let active = 0;
    let peak = 0;
    const gates: (() => void)[] = [];
    const { cache, fetchMock } = setup(async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise<void>((resolve) => gates.push(resolve));
      active -= 1;
      return response(200);
    });
    const controllers = Array.from({ length: 6 }, () => new AbortController());
    const pending = controllers.map((controller, index) =>
      cache.resolve(request(index + 1), true, controller.signal),
    );
    await new Promise((resolve) => setImmediate(resolve));
    expect(active).toBe(3);
    // Tiles 1-3 are running. Scroll away from the three still queued.
    controllers.slice(0, 3).forEach(() => undefined);
    controllers.slice(3).forEach((controller) => controller.abort());
    gates.splice(0).forEach((open) => open());
    await Promise.all(pending);
    await new Promise((resolve) => setImmediate(resolve));
    expect(peak).toBe(3);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not start a cooldown for a queued tile that was dropped unrun', async () => {
    const gates: (() => void)[] = [];
    const { cache, fetchMock } = setup(async () => {
      await new Promise<void>((resolve) => gates.push(resolve));
      return response(200);
    });
    const running = [1, 2, 3].map((x) => cache.resolve(request(x), true));
    const abort = new AbortController();
    const dropped = cache.resolve(request(4), true, abort.signal);
    await new Promise((resolve) => setImmediate(resolve));
    abort.abort();
    gates.splice(0).forEach((open) => open());
    await Promise.all([...running, dropped]);
    expect(await dropped).toBeNull();
    const again = cache.resolve(request(4), true);
    await new Promise((resolve) => setImmediate(resolve));
    gates.splice(0).forEach((open) => open());
    expect(await again).toMatchObject({ kind: 'cached' });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
