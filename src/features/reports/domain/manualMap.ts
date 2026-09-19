export const MAP_TILE_SIZE = 256;
export const DEFAULT_MANUAL_MAP_CENTER = {
  latitude: 14.0667,
  longitude: 120.6319,
};
export const DEFAULT_MANUAL_MAP_ZOOM = 15;
export const MIN_MANUAL_MAP_ZOOM = 11;
export const MAX_MANUAL_MAP_ZOOM = 18;

const MAX_MERCATOR_LATITUDE = 85.05112878;

export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

export interface MapTile {
  key: string;
  left: number;
  top: number;
  url: string;
}

export const DEV_MAP_TILE_URL_TEMPLATE =
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export function isLocalOrLanHostname(hostname: string): boolean {
  const normalized = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    /^127(?:\.\d{1,3}){3}$/.test(normalized) ||
    /^10(?:\.\d{1,3}){3}$/.test(normalized) ||
    /^192\.168(?:\.\d{1,3}){2}$/.test(normalized) ||
    /^172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}$/.test(normalized)
  );
}

/**
 * Third-party tile URLs are intentionally disabled by default in production.
 * Production must provide a CaneGuard-owned HTTPS API/proxy template such as
 * `https://api.example.test/api/v1/mobile/map-tiles/{z}/{x}/{y}.png`
 * matching `EXPO_PUBLIC_API_BASE_URL`.
 *
 * Development exception (`__DEV__`):
 * 1. An `http:` same-origin localhost/LAN proxy template is accepted.
 * 2. If no proxy template is configured, falls back to direct OpenStreetMap
 *    tiles so developers can test the manual map and tap-to-pin without
 *    running or configuring a local proxy backend.
 */
export function getConfiguredMapTileUrlTemplate(): string | null {
  const rawTemplate = process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL?.trim();
  if (!rawTemplate) {
    // Development fallback: allow direct OpenStreetMap tiles so the manual
    // map and coordinate pin work out-of-the-box in dev environments.
    // Production must never make third-party tile requests from the device.
    return __DEV__ ? DEV_MAP_TILE_URL_TEMPLATE : null;
  }

  let tileUrl: URL;
  try {
    tileUrl = new URL(rawTemplate);
  } catch {
    return null;
  }
  if (
    tileUrl.username ||
    tileUrl.password ||
    tileUrl.hostname === 'tile.openstreetmap.org' ||
    tileUrl.hostname.endsWith('.tile.openstreetmap.org') ||
    !['{z}', '{x}', '{y}'].every((placeholder) =>
      rawTemplate.includes(placeholder),
    )
  ) {
    return null;
  }

  const isHttps = tileUrl.protocol === 'https:';
  const isDevHttp =
    __DEV__ &&
    tileUrl.protocol === 'http:' &&
    isLocalOrLanHostname(tileUrl.hostname);
  if (!isHttps && !isDevHttp) {
    return null;
  }

  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (apiBaseUrl) {
    try {
      if (new URL(apiBaseUrl).origin !== tileUrl.origin) {
        return null;
      }
    } catch {
      return null;
    }
  }

  return rawTemplate;
}

export function getMapTiles(
  center: MapCoordinate,
  zoom: number,
  width: number,
  height: number,
  tileUrlTemplate: string | null,
): MapTile[] {
  if (!tileUrlTemplate) {
    return [];
  }
  const world = coordinateToWorldPixel(center, zoom);
  const firstX = Math.floor((world.x - width / 2) / MAP_TILE_SIZE);
  const lastX = Math.floor((world.x + width / 2) / MAP_TILE_SIZE);
  const firstY = Math.floor((world.y - height / 2) / MAP_TILE_SIZE);
  const lastY = Math.floor((world.y + height / 2) / MAP_TILE_SIZE);
  const tileCount = 2 ** zoom;
  const tiles: MapTile[] = [];

  for (let rawY = firstY; rawY <= lastY; rawY += 1) {
    if (rawY < 0 || rawY >= tileCount) continue;
    for (let rawX = firstX; rawX <= lastX; rawX += 1) {
      const wrappedX = ((rawX % tileCount) + tileCount) % tileCount;
      tiles.push({
        key: `${zoom}-${rawX}-${rawY}`,
        left: rawX * MAP_TILE_SIZE - world.x + width / 2,
        top: rawY * MAP_TILE_SIZE - world.y + height / 2,
        url: tileUrlTemplate
          .replaceAll('{z}', String(zoom))
          .replaceAll('{x}', String(wrappedX))
          .replaceAll('{y}', String(rawY)),
      });
    }
  }
  return tiles;
}

export function coordinateAtViewportPoint(
  center: MapCoordinate,
  zoom: number,
  width: number,
  height: number,
  x: number,
  y: number,
): MapCoordinate {
  const world = coordinateToWorldPixel(center, zoom);
  return worldPixelToCoordinate(
    { x: world.x + x - width / 2, y: world.y + y - height / 2 },
    zoom,
  );
}

export function coordinateToViewportPoint(
  center: MapCoordinate,
  coordinate: MapCoordinate,
  zoom: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const centerWorld = coordinateToWorldPixel(center, zoom);
  const coordinateWorld = coordinateToWorldPixel(coordinate, zoom);
  return {
    x: width / 2 + coordinateWorld.x - centerWorld.x,
    y: height / 2 + coordinateWorld.y - centerWorld.y,
  };
}

export function zoomMapAtPoint(
  center: MapCoordinate,
  zoom: number,
  nextZoom: number,
  focalX: number,
  focalY: number,
  width: number,
  height: number,
): MapCoordinate {
  // Keep the coordinate under the pinch focal point fixed on screen while
  // changing zoom: world pixels scale by 2 ** (nextZoom - zoom), so the
  // viewport-space offset of the focal point from the viewport center must
  // scale by the same factor. The center therefore shifts by the difference
  // between the scaled and the unscaled offset (expressed in the new zoom's
  // world pixels via moveMapCenter).
  const scaleFactor = 2 ** (nextZoom - zoom);
  const offsetX = (scaleFactor - 1) * (focalX - width / 2);
  const offsetY = (scaleFactor - 1) * (focalY - height / 2);
  return moveMapCenter(center, nextZoom, offsetX, offsetY);
}

export function moveMapCenter(
  center: MapCoordinate,
  zoom: number,
  deltaX: number,
  deltaY: number,
): MapCoordinate {
  const world = coordinateToWorldPixel(center, zoom);
  return worldPixelToCoordinate(
    { x: world.x + deltaX, y: world.y + deltaY },
    zoom,
  );
}

function coordinateToWorldPixel(
  coordinate: MapCoordinate,
  zoom: number,
): { x: number; y: number } {
  const latitude = Math.max(
    -MAX_MERCATOR_LATITUDE,
    Math.min(MAX_MERCATOR_LATITUDE, coordinate.latitude),
  );
  const scale = MAP_TILE_SIZE * 2 ** zoom;
  const sinLatitude = Math.sin((latitude * Math.PI) / 180);
  return {
    x: ((coordinate.longitude + 180) / 360) * scale,
    y:
      (0.5 -
        Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) *
      scale,
  };
}

function worldPixelToCoordinate(
  point: { x: number; y: number },
  zoom: number,
): MapCoordinate {
  const scale = MAP_TILE_SIZE * 2 ** zoom;
  const longitude = (point.x / scale) * 360 - 180;
  const mercator = Math.PI - (2 * Math.PI * point.y) / scale;
  return {
    latitude: (180 / Math.PI) * Math.atan(Math.sinh(mercator)),
    longitude: ((longitude + 540) % 360) - 180,
  };
}
