import {
  DEFAULT_MANUAL_MAP_CENTER,
  coordinateAtViewportPoint,
  coordinateToViewportPoint,
  getMapTiles,
  moveMapCenter,
  zoomMapAtPoint,
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

  it('generates only privacy-proxy tile URLs when a proxy is configured', () => {
    const tiles = getMapTiles(
      DEFAULT_MANUAL_MAP_CENTER,
      15,
      390,
      360,
      'https://api.example.test/api/v1/mobile/map-tiles/{z}/{x}/{y}.png',
    );
    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles.length).toBeLessThanOrEqual(9);
    expect(
      tiles.every(({ url }) =>
        /^https:\/\/api\.example\.test\/api\/v1\/mobile\/map-tiles\/15\/\d+\/\d+\.png$/.test(
          url,
        ),
      ),
    ).toBe(true);
  });

  it('does not generate third-party tile URLs without a privacy proxy', () => {
    expect(getMapTiles(DEFAULT_MANUAL_MAP_CENTER, 15, 390, 360, null)).toEqual([]);
  });

  it('moves the center deterministically without selecting a location', () => {
    const moved = moveMapCenter(DEFAULT_MANUAL_MAP_CENTER, 15, 120, 0);
    expect(moved.longitude).toBeGreaterThan(DEFAULT_MANUAL_MAP_CENTER.longitude);
    expect(moved.latitude).toBeCloseTo(DEFAULT_MANUAL_MAP_CENTER.latitude, 8);
  });

  it('zooms in about the focal point without moving the coordinate under it', () => {
    const focal = { x: 300, y: 100 };
    const focusedCoordinate = coordinateAtViewportPoint(
      DEFAULT_MANUAL_MAP_CENTER,
      15,
      390,
      360,
      focal.x,
      focal.y,
    );
    const zoomed = zoomMapAtPoint(
      DEFAULT_MANUAL_MAP_CENTER,
      15,
      16,
      focal.x,
      focal.y,
      390,
      360,
    );
    const stillAtFocal = coordinateToViewportPoint(
      zoomed,
      focusedCoordinate,
      16,
      390,
      360,
    );
    expect(stillAtFocal.x).toBeCloseTo(focal.x, 8);
    expect(stillAtFocal.y).toBeCloseTo(focal.y, 8);
  });

  it('zooms out about the focal point without moving the coordinate under it', () => {
    const focal = { x: 100, y: 300 };
    const focusedCoordinate = coordinateAtViewportPoint(
      DEFAULT_MANUAL_MAP_CENTER,
      15,
      390,
      360,
      focal.x,
      focal.y,
    );
    const zoomed = zoomMapAtPoint(
      DEFAULT_MANUAL_MAP_CENTER,
      15,
      14,
      focal.x,
      focal.y,
      390,
      360,
    );
    const stillAtFocal = coordinateToViewportPoint(
      zoomed,
      focusedCoordinate,
      14,
      390,
      360,
    );
    expect(stillAtFocal.x).toBeCloseTo(focal.x, 8);
    expect(stillAtFocal.y).toBeCloseTo(focal.y, 8);
  });

  it('zooming to the same level keeps the center unchanged', () => {
    const zoomed = zoomMapAtPoint(
      DEFAULT_MANUAL_MAP_CENTER,
      15,
      15,
      300,
      100,
      390,
      360,
    );
    expect(zoomed.latitude).toBeCloseTo(DEFAULT_MANUAL_MAP_CENTER.latitude, 10);
    expect(zoomed.longitude).toBeCloseTo(DEFAULT_MANUAL_MAP_CENTER.longitude, 10);
  });
});
