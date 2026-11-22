import {
  accountedBytes,
  isTileExpired,
  isValidTileImage,
  planEviction,
  resolveTileFreshness,
  TILE_MAX_CONCURRENT_REQUESTS,
  TILE_MIN_FREE_DISK_BYTES,
  TILE_RECHECK_COOLDOWN_MS,
  TILE_REQUEST_TIMEOUT_MS,
  TILE_RETRY_DELAYS_MS,
  type TileCacheEntry,
} from './tileCachePolicy';

export interface TileRequest {
  /** Headers for the network request only; never persisted. */
  headers: Record<string, string>;
  sourceId: string;
  url: string;
  x: number;
  y: number;
  z: number;
}

/** `cached`: a local file. `remote`: show straight from the provider (nothing persisted). */
export type TileResult =
  | { kind: 'cached'; uri: string }
  | { headers: Record<string, string>; kind: 'remote'; uri: string };

/** File and index access. The only place that touches the filesystem. */
export interface TileStore {
  /** Free device bytes, or null when the platform cannot say. */
  freeDiskBytes(): number | null;
  /** Names of tile files on disk (only files this cache could have written). */
  listTileFiles(): string[];
  loadIndex(): Promise<string | null>;
  removeTileFile(file: string): void;
  saveIndex(json: string): Promise<void>;
  /** Size in bytes, or null when the file is missing. */
  tileFileSize(file: string): number | null;
  uri(file: string): string;
  writeTileFile(file: string, bytes: Uint8Array): Promise<void>;
}

interface TileCacheDeps {
  /** Tile storage budget; the policy default unless a test shrinks it. */
  budgetBytes?: number;
  fetch: typeof fetch;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
}

interface Job {
  background: boolean;
  key: string;
  promise: Promise<TileResult | null>;
  request: TileRequest;
  /** False when the job was dropped unrun (tile left the view), so it must not start a cooldown. */
  ran: boolean;
  start: () => void;
  waiters: number;
}

const INDEX_VERSION = 1;
const INDEX_FLUSH_INTERVAL_MS = 60_000;

export function tileCacheKey(request: Pick<TileRequest, 'sourceId' | 'x' | 'y' | 'z'>) {
  return `${request.sourceId}/${request.z}/${request.x}/${request.y}`;
}

function isEntry(value: unknown): value is TileCacheEntry {
  const entry = value as Partial<TileCacheEntry> | null;
  return (
    !!entry &&
    typeof entry.file === 'string' &&
    [entry.bytes, entry.fetchedAt, entry.expiresAt, entry.lastUsedAt].every(
      (field) => typeof field === 'number' && Number.isFinite(field),
    ) &&
    (entry.etag === undefined || typeof entry.etag === 'string') &&
    (entry.pinned === undefined || typeof entry.pinned === 'boolean')
  );
}

export class TileCache {
  private active = 0;
  private dirty = false;
  private index: Record<string, TileCacheEntry> = {};
  private readonly inflight = new Map<string, Job>();
  private readonly lastAttempt = new Map<string, number>();
  private lastFlush = 0;
  private readonly listeners = new Set<(key: string) => void>();
  private queue: Job[] = [];
  private ready: Promise<void> | null = null;
  private saving = false;

  constructor(
    private readonly store: TileStore,
    private readonly deps: TileCacheDeps = {
      fetch: (...args) => fetch(...args),
      now: () => Date.now(),
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    },
  ) {}

  /** Called when a background refresh replaced a tile that is already on screen. */
  subscribe(listener: (key: string) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Cached tile (even when expired), else a fetch when online, else null.
   * An expired tile is returned immediately and refreshed in the background.
   * `signal` drops a still-queued fetch once the tile scrolls out of view.
   */
  async resolve(
    request: TileRequest,
    online: boolean,
    signal?: AbortSignal,
  ): Promise<TileResult | null> {
    await this.ensureReady();
    const key = tileCacheKey(request);
    const entry = this.validEntry(key);
    const now = this.deps.now();

    if (entry) {
      entry.lastUsedAt = now;
      this.flushIfDue(now);
      if (online && isTileExpired(entry, now) && this.mayAttempt(key, now)) {
        void this.enqueue(request, true);
      }
      return { kind: 'cached', uri: this.store.uri(entry.file) };
    }
    if (!online || !this.mayAttempt(key, now)) return null;

    if (signal?.aborted) return null;
    const job = this.enqueue(request, false);
    job.waiters += 1;
    signal?.addEventListener('abort', () => {
      job.waiters -= 1;
    });
    return job.promise;
  }

  /** Drop a tile that failed to decode so the next request downloads it again. */
  async discard(request: Pick<TileRequest, 'sourceId' | 'x' | 'y' | 'z'>) {
    await this.ensureReady();
    const key = tileCacheKey(request);
    const entry = this.index[key];
    if (!entry) return;
    delete this.index[key];
    this.store.removeTileFile(entry.file);
    this.lastAttempt.delete(key);
    void this.persist();
  }

  private ensureReady(): Promise<void> {
    this.ready ??= this.load().catch(() => {
      this.index = {};
    });
    return this.ready;
  }

  /** Rebuilds a trustworthy index: corrupt/missing data is discarded, never trusted. */
  private async load() {
    let parsed: unknown = null;
    try {
      const raw = await this.store.loadIndex();
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      parsed = null;
    }
    const source =
      (parsed as { entries?: unknown; version?: unknown } | null)?.version === INDEX_VERSION
        ? (parsed as { entries?: Record<string, unknown> }).entries
        : null;
    const referenced = new Set<string>();
    let changed = false;
    for (const [key, value] of Object.entries(source ?? {})) {
      if (isEntry(value) && !referenced.has(value.file) && this.fileMatches(value)) {
        this.index[key] = value;
        referenced.add(value.file);
      } else {
        changed = true;
      }
    }
    for (const file of this.store.listTileFiles()) {
      if (!referenced.has(file)) {
        this.store.removeTileFile(file);
        changed = true;
      }
    }
    const { evict } = planEviction(this.index, { budgetBytes: this.deps.budgetBytes, now: this.deps.now() });
    for (const key of evict) this.evict(key);
    if (evict.length > 0 || changed) await this.persist();
  }

  private fileMatches(entry: TileCacheEntry) {
    const size = this.store.tileFileSize(entry.file);
    return size !== null && accountedBytes(size) === entry.bytes;
  }

  private validEntry(key: string): TileCacheEntry | null {
    const entry = this.index[key];
    if (!entry) return null;
    if (this.fileMatches(entry)) return entry;
    this.evict(key);
    void this.persist();
    return null;
  }

  private evict(key: string) {
    const entry = this.index[key];
    if (!entry) return;
    delete this.index[key];
    this.store.removeTileFile(entry.file);
  }

  private mayAttempt(key: string, now: number) {
    const last = this.lastAttempt.get(key);
    return last === undefined || now < last || now - last >= TILE_RECHECK_COOLDOWN_MS;
  }

  private enqueue(request: TileRequest, background: boolean): Job {
    const key = tileCacheKey(request);
    const existing = this.inflight.get(key);
    if (existing) return existing;

    let start!: () => void;
    const started = new Promise<void>((resolve) => {
      start = resolve;
    });
    const job: Job = {
      background,
      key,
      promise: Promise.resolve(null),
      ran: false,
      request,
      start,
      waiters: 0,
    };
    job.promise = started
      .then(() => {
        if (!job.background && job.waiters <= 0) return null;
        job.ran = true;
        return this.download(request);
      })
      .finally(() => {
        this.inflight.delete(key);
        this.active -= 1;
        if (job.ran) this.lastAttempt.set(key, this.deps.now());
        this.pump();
      });
    this.inflight.set(key, job);
    this.queue.push(job);
    this.pump();
    return job;
  }

  private pump() {
    while (this.active < TILE_MAX_CONCURRENT_REQUESTS && this.queue.length > 0) {
      // Newest request first: the tile the user is looking at now matters most.
      const job = this.queue.pop()!;
      this.active += 1;
      job.start();
    }
  }

  private async download(request: TileRequest): Promise<TileResult | null> {
    const key = tileCacheKey(request);
    const previous = this.index[key] ?? null;
    const remote: TileResult = {
      headers: request.headers,
      kind: 'remote',
      uri: request.url,
    };

    for (let attempt = 0; ; attempt += 1) {
      try {
        const response = await this.fetchWithTimeout(request, previous?.etag);
        if (response.status === 304 && previous) {
          return this.renew(key, previous, response.headers);
        }
        if (response.status >= 500 || response.status === 408) {
          throw new Error(`Tile server error ${response.status}`);
        }
        if (!response.ok) return previous ? this.cachedResult(previous) : null;
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (!isValidTileImage(bytes)) return previous ? this.cachedResult(previous) : null;
        const freshness = resolveTileFreshness(response.headers, this.deps.now());
        if (!freshness.cacheable) return remote;
        const saved = await this.commit(key, request, bytes, freshness.expiresAt, previous, response.headers);
        return saved ?? remote;
      } catch {
        const delay = TILE_RETRY_DELAYS_MS[attempt];
        if (delay === undefined) return previous ? this.cachedResult(previous) : null;
        await this.deps.sleep(delay);
      }
    }
  }

  private cachedResult(entry: TileCacheEntry): TileResult {
    return { kind: 'cached', uri: this.store.uri(entry.file) };
  }

  private async fetchWithTimeout(request: TileRequest, etag?: string) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TILE_REQUEST_TIMEOUT_MS);
    try {
      return await this.deps.fetch(request.url, {
        headers: { ...request.headers, ...(etag ? { 'If-None-Match': etag } : {}) },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  private renew(key: string, entry: TileCacheEntry, headers: Headers): TileResult {
    const now = this.deps.now();
    const freshness = resolveTileFreshness(headers, now);
    entry.fetchedAt = now;
    entry.expiresAt = freshness.cacheable ? freshness.expiresAt : now;
    void this.persist();
    this.emit(key);
    return this.cachedResult(entry);
  }

  /**
   * Atomic replace: the new file is fully written under a new name before the
   * index points at it; the old file is removed only after that. A crash in
   * between leaves an orphan that the next start deletes.
   */
  private async commit(
    key: string,
    request: TileRequest,
    bytes: Uint8Array,
    expiresAt: number,
    previous: TileCacheEntry | null,
    headers: Headers,
  ): Promise<TileResult | null> {
    const now = this.deps.now();
    const size = accountedBytes(bytes.length);
    const free = this.store.freeDiskBytes();
    if (free !== null && free - size < TILE_MIN_FREE_DISK_BYTES) return null;

    const others = { ...this.index };
    delete others[key];
    const plan = planEviction(others, { budgetBytes: this.deps.budgetBytes, incomingBytes: size, now });
    if (!plan.fits) return null;
    for (const evicted of plan.evict) this.evict(evicted);

    const file = `${request.sourceId}-${request.z}-${request.x}-${request.y}-${now.toString(36)}.tile`;
    try {
      await this.store.writeTileFile(file, bytes);
    } catch {
      this.store.removeTileFile(file);
      return null;
    }
    const etag = headers.get('etag');
    const entry: TileCacheEntry = {
      bytes: size,
      expiresAt,
      fetchedAt: now,
      file,
      lastUsedAt: now,
      ...(etag && etag.length <= 200 ? { etag } : {}),
    };
    this.index[key] = entry;
    if (previous && previous.file !== file) this.store.removeTileFile(previous.file);
    void this.persist();
    if (previous) this.emit(key);
    return this.cachedResult(entry);
  }

  private emit(key: string) {
    for (const listener of this.listeners) listener(key);
  }

  private flushIfDue(now: number) {
    if (now - this.lastFlush >= INDEX_FLUSH_INTERVAL_MS) void this.persist();
  }

  /** Serialized, coalesced index writes so concurrent commits never interleave. */
  private async persist() {
    this.dirty = true;
    if (this.saving) return;
    this.saving = true;
    try {
      while (this.dirty) {
        this.dirty = false;
        this.lastFlush = this.deps.now();
        await this.store
          .saveIndex(JSON.stringify({ entries: this.index, version: INDEX_VERSION }))
          .catch(() => undefined);
      }
    } finally {
      this.saving = false;
    }
  }
}
