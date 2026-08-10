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

export function getMapTiles(
  center: MapCoordinate,
  zoom: number,
  width: number,
  height: number,
): MapTile[] {
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
        url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${rawY}.png`,
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
