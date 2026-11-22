import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { MapTile } from '@/features/reports/domain/manualMap';

import { tileCache } from './index';
import { tileCacheKey, type TileRequest, type TileResult } from './tileCache';
import { tileRequestHeaders, tileSourceId } from './tileCachePolicy';

export interface TileImageSource {
  headers?: Record<string, string>;
  uri: string;
}

export interface TileSources {
  /** Tile keys that settled with no image: not cached and not loadable right now. */
  missing: ReadonlySet<string>;
  /** Call when an image failed to decode so the cache drops it and re-downloads. */
  reportTileError: (tileKey: string) => void;
  /** Stable per-tile source, so a re-render never makes expo-image reload. */
  sources: ReadonlyMap<string, TileImageSource>;
}

function toSource(result: TileResult): TileImageSource {
  return result.kind === 'cached'
    ? { uri: result.uri }
    : { headers: result.headers, uri: result.uri };
}

/**
 * Resolves each visible tile through the on-device cache: cached tiles show
 * even offline or expired, expired ones refresh in the background when online,
 * and missing ones download once online. Nothing here ever blocks drawing or
 * saving; an unavailable tile simply stays out of `sources`.
 */
export function useTileSources(
  tiles: readonly MapTile[],
  urlTemplate: string | null,
  { authToken, isOnline }: { authToken?: string | null; isOnline: boolean | null },
): TileSources {
  const [state, setState] = useState<{
    missing: ReadonlySet<string>;
    sources: ReadonlyMap<string, TileImageSource>;
  }>({ missing: new Set(), sources: new Map() });
  const online = isOnline === true;
  const requests = useRef(new Map<string, TileRequest>());

  const tilesSignature = tiles.map((tile) => tile.key).join('|');
  const resolvedRequests = useMemo(() => {
    const sourceId = urlTemplate ? tileSourceId(urlTemplate) : '';
    return tiles.map((tile) => ({
      key: tile.key,
      request: {
        headers: tileRequestHeaders(tile.url, authToken),
        sourceId,
        url: tile.url,
        x: tile.x,
        y: tile.y,
        z: tile.z,
      } satisfies TileRequest,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tiles are fully described by their keys
  }, [authToken, tilesSignature, urlTemplate]);

  const load = useCallback(
    async (key: string, request: TileRequest, signal?: AbortSignal) => {
      let result: TileResult | null = null;
      try {
        result = await tileCache.resolve(request, online, signal);
      } catch {
        result = null;
      }
      if (signal?.aborted) return;
      setState((current) => {
        // Prune to the tiles currently requested so state cannot grow while panning.
        const sources = new Map(
          [...current.sources].filter(([tileKey]) => requests.current.has(tileKey)),
        );
        const missing = new Set(
          [...current.missing].filter((tileKey) => requests.current.has(tileKey)),
        );
        if (result) {
          const next = toSource(result);
          const previous = sources.get(key);
          if (previous?.uri !== next.uri) sources.set(key, next);
          missing.delete(key);
        } else if (!sources.has(key)) {
          missing.add(key);
        }
        return { missing, sources };
      });
    },
    [online],
  );

  useEffect(() => {
    const controller = new AbortController();
    requests.current = new Map(resolvedRequests.map(({ key, request }) => [key, request]));
    for (const { key, request } of resolvedRequests) {
      void load(key, request, controller.signal);
    }
    return () => controller.abort();
  }, [load, resolvedRequests]);

  useEffect(
    () =>
      tileCache.subscribe((cacheKey) => {
        for (const [key, request] of requests.current) {
          if (tileCacheKey(request) === cacheKey) void load(key, request);
        }
      }),
    [load],
  );

  const reportTileError = useCallback(
    (key: string) => {
      const request = requests.current.get(key);
      if (!request) return;
      void tileCache.discard(request).then(() => {
        setState((current) => {
          const sources = new Map(current.sources);
          sources.delete(key);
          return { missing: current.missing, sources };
        });
        return load(key, request);
      });
    },
    [load],
  );

  // Only tiles currently on screen count; keeps state from growing while panning.
  const visible = new Set(tiles.map((tile) => tile.key));
  const sources = useMemo(
    () => new Map([...state.sources].filter(([key]) => visible.has(key))),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- visible derives from tilesSignature
    [state.sources, tilesSignature],
  );
  const missing = useMemo(
    () => new Set([...state.missing].filter((key) => visible.has(key) && !sources.has(key))),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- visible derives from tilesSignature
    [state.missing, sources, tilesSignature],
  );

  return { missing, reportTileError, sources };
}
