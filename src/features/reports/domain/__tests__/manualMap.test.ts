import {
  DEFAULT_MANUAL_MAP_CENTER,
  coordinateAtViewportPoint,
  coordinateToViewportPoint,
  getMapTiles,
  moveMapCenter,
} from '@/features/reports/domain/manualMap';

describe('manual map Web Mercator helpers', () => {
  it('maps the viewport center back to the exact center coordinate', () => {
    expect(
      coordinateAtViewportPoint(
        DEFAULT_MANUAL_MAP_CENTER,
        15,
        390,
        360,
        195,
        180,
      ),
    ).toEqual(expect.objectContaining({
      latitude: expect.closeTo(DEFAULT_MANUAL_MAP_CENTER.latitude, 8),
      longitude: expect.closeTo(DEFAULT_MANUAL_MAP_CENTER.longitude, 8),
    }));
  });

  it('round-trips a selected coordinate to a viewport point', () => {
    const selected = { latitude: 14.071, longitude: 120.635 };
    const point = coordinateToViewportPoint(
      DEFAULT_MANUAL_MAP_CENTER,
      selected,
      15,
      390,
      360,
    );
    const roundTrip = coordinateAtViewportPoint(
      DEFAULT_MANUAL_MAP_CENTER,
      15,
      390,
      360,
      point.x,
      point.y,
    );
    expect(roundTrip.latitude).toBeCloseTo(selected.latitude, 8);
    expect(roundTrip.longitude).toBeCloseTo(selected.longitude, 8);
  });

  it('generates only online OpenStreetMap tile URLs needed by the viewport', () => {
    const tiles = getMapTiles(DEFAULT_MANUAL_MAP_CENTER, 15, 390, 360);
    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles.length).toBeLessThanOrEqual(9);
    expect(tiles.every(({ url }) => /^https:\/\/tile\.openstreetmap\.org\/15\/\d+\/\d+\.png$/.test(url))).toBe(true);
  });

  it('moves the center deterministically without selecting a location', () => {
    const moved = moveMapCenter(DEFAULT_MANUAL_MAP_CENTER, 15, 120, 0);
    expect(moved.longitude).toBeGreaterThan(DEFAULT_MANUAL_MAP_CENTER.longitude);
    expect(moved.latitude).toBeCloseTo(DEFAULT_MANUAL_MAP_CENTER.latitude, 8);
  });
});
