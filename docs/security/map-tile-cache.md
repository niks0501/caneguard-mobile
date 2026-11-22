# Map-tile cache policy

Implemented in `src/features/reports/tiles/`. The limits live in
`tileCachePolicy.ts`; this page records the decisions and what is deliberately
not built.

## Scope

- **Built:** compliant on-demand caching of tiles the map actually displays
  (manual-map picker and Measure Plot map). Cached tiles stay visible offline,
  including after expiry; expired tiles refresh in the background when online.
- **Not built:** offline map packages (bulk download, pinned areas, Wi-Fi/mobile
  data choice, 2 × 75 MB packages). They need a tile provider that explicitly
  permits offline downloads, and none is configured. The public OpenStreetMap
  servers prohibit bulk prefetching and offline downloads, so the app never
  prefetches. When such a provider exists, add the package flow on top of the
  cache: entries already carry a `pinned` flag that eviction never touches.

## Limits

| Rule | Value |
| --- | --- |
| Total cache | 200 MB, including the index file (4 MB reserved) and 4 KB block rounding |
| Freshness | Provider `Cache-Control`/`Expires`; 7 days when absent or unreadable; capped at 30 days |
| Expired tiles | Shown offline; refreshed when online (conditional `If-None-Match`) |
| Eviction | Unpinned tiles unused for 30 days, then least recently used |
| Concurrent requests | 3; queued tiles that scroll out of view are never fetched |
| Retries | 2 with 1 s / 2 s backoff on network errors and 5xx; none on 4xx |
| Re-check | One network attempt per tile per 60 s |
| Disk guard | No write if less than 500 MB would stay free (the tile is still shown, uncached) |

## Safeguards

- Tiles live in the OS cache directory (`map-tiles/`), apart from SQLite and
  managed images. Cleanup only deletes files matching the cache's own name
  pattern, so it cannot touch GPS coordinates, polygons, Scan Records or Field
  Reports.
- Replacement is atomic: the new file is written under a new name, the index is
  updated, then the old file is removed. Orphans from a crash are deleted on the
  next start.
- Responses are validated (status, image signature, size ≤ 512 KB) before they
  are stored; a tile that later fails to decode is discarded and downloaded again.
- A missing, corrupt or purged index/file is treated as a miss. Missing tiles
  render as the neutral map background and never block drawing, pinning or
  saving a draft.
- `Cache-Control: no-store` tiles are shown from the provider and never stored.
  If a write fails (disk full) the tile is shown uncached.
- Index entries hold only file name, size, timestamps and an optional ETag.
  Bearer tokens, URLs and query strings never enter metadata or file names, and
  the token is never sent to `tile.openstreetmap.org`.
- The OS may purge the cache directory under storage pressure; that is a plain
  cache miss, not data loss.

## Cross-repository prerequisite

The Laravel tile proxy is outside this repository. Public OpenStreetMap tiles
must not be relied on until that proxy forwards the upstream `Cache-Control`
and `Expires` headers (or sends a `max-age` of at least 7 days) instead of its
fixed one-day cache. Laravel's default `no-cache, private` is accepted but makes
every tile revalidate once per 60 s, so the proxy should set explicit headers.
