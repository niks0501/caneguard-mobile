import {
  DEFAULT_MANUAL_MAP_CENTER,
  DEV_MAP_TILE_URL_TEMPLATE,
  coordinateAtViewportPoint,
  coordinateToViewportPoint,
  getConfiguredMapTileUrlTemplate,
  getMapTiles,
  isLocalOrLanHostname,
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

describe('getConfiguredMapTileUrlTemplate', () => {
  const previousApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  const previousMapTileProxyUrl = process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL;
  const originalDev = (global as any).__DEV__;

  beforeEach(() => {
    (global as any).__DEV__ = true;
  });

  afterEach(() => {
    if (previousApiBaseUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
    } else {
      process.env.EXPO_PUBLIC_API_BASE_URL = previousApiBaseUrl;
    }
    if (previousMapTileProxyUrl === undefined) {
      delete process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL;
    } else {
      process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL = previousMapTileProxyUrl;
    }
    (global as any).__DEV__ = originalDev;
  });

  describe('development environment (__DEV__ = true)', () => {
    it('falls back to direct OpenStreetMap tiles when no proxy is configured', () => {
      delete process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL;
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
      expect(getConfiguredMapTileUrlTemplate()).toBe(DEV_MAP_TILE_URL_TEMPLATE);
    });

    it('falls back to direct OpenStreetMap tiles when dev API base URL is set without proxy URL', () => {
      delete process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL;
      process.env.EXPO_PUBLIC_API_BASE_URL = 'http://127.0.0.1:8000';
      expect(getConfiguredMapTileUrlTemplate()).toBe(DEV_MAP_TILE_URL_TEMPLATE);
    });

    it('accepts an http localhost proxy matching EXPO_PUBLIC_API_BASE_URL', () => {
      process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:8000';
      process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL =
        'http://localhost:8000/api/v1/mobile/map-tiles/{z}/{x}/{y}.png';
      expect(getConfiguredMapTileUrlTemplate()).toBe(
        'http://localhost:8000/api/v1/mobile/map-tiles/{z}/{x}/{y}.png',
      );
    });

    it('accepts an http 127.0.0.1 proxy matching EXPO_PUBLIC_API_BASE_URL', () => {
      process.env.EXPO_PUBLIC_API_BASE_URL = 'http://127.0.0.1:8000';
      process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL =
        'http://127.0.0.1:8000/api/v1/mobile/map-tiles/{z}/{x}/{y}.png';
      expect(getConfiguredMapTileUrlTemplate()).toBe(
        'http://127.0.0.1:8000/api/v1/mobile/map-tiles/{z}/{x}/{y}.png',
      );
    });

    it('accepts an http LAN 10.x proxy matching EXPO_PUBLIC_API_BASE_URL', () => {
      process.env.EXPO_PUBLIC_API_BASE_URL = 'http://10.0.2.2:8000';
      process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL =
        'http://10.0.2.2:8000/api/v1/mobile/map-tiles/{z}/{x}/{y}.png';
      expect(getConfiguredMapTileUrlTemplate()).toBe(
        'http://10.0.2.2:8000/api/v1/mobile/map-tiles/{z}/{x}/{y}.png',
      );
    });

    it('accepts an http LAN 192.168.x proxy matching EXPO_PUBLIC_API_BASE_URL', () => {
      process.env.EXPO_PUBLIC_API_BASE_URL = 'http://192.168.1.50:8000';
      process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL =
        'http://192.168.1.50:8000/api/v1/mobile/map-tiles/{z}/{x}/{y}.png';
      expect(getConfiguredMapTileUrlTemplate()).toBe(
        'http://192.168.1.50:8000/api/v1/mobile/map-tiles/{z}/{x}/{y}.png',
      );
    });

    it('accepts an https proxy matching EXPO_PUBLIC_API_BASE_URL', () => {
      process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.test';
      process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL =
        'https://api.example.test/api/v1/mobile/map-tiles/{z}/{x}/{y}.png';
      expect(getConfiguredMapTileUrlTemplate()).toBe(
        'https://api.example.test/api/v1/mobile/map-tiles/{z}/{x}/{y}.png',
      );
    });

    it('rejects an http proxy with non-localhost/LAN hostname in dev', () => {
      process.env.EXPO_PUBLIC_API_BASE_URL = 'http://api.example.test';
      process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL =
        'http://api.example.test/api/v1/mobile/map-tiles/{z}/{x}/{y}.png';
      expect(getConfiguredMapTileUrlTemplate()).toBeNull();
    });

    it('rejects tile.openstreetmap.org as a configured proxy template in dev', () => {
      process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL =
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      expect(getConfiguredMapTileUrlTemplate()).toBeNull();
    });

    it('rejects configured proxy template when origin differs from EXPO_PUBLIC_API_BASE_URL', () => {
      process.env.EXPO_PUBLIC_API_BASE_URL = 'http://127.0.0.1:8000';
      process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL =
        'http://127.0.0.1:9000/api/v1/mobile/map-tiles/{z}/{x}/{y}.png';
      expect(getConfiguredMapTileUrlTemplate()).toBeNull();
    });

    it('rejects template missing required placeholders', () => {
      process.env.EXPO_PUBLIC_API_BASE_URL = 'http://127.0.0.1:8000';
      process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL =
        'http://127.0.0.1:8000/api/v1/mobile/map-tiles/{z}/{x}.png';
      expect(getConfiguredMapTileUrlTemplate()).toBeNull();
    });
  });

  describe('production environment (__DEV__ = false)', () => {
    beforeEach(() => {
      (global as any).__DEV__ = false;
    });

    it('returns null when no proxy is configured in production', () => {
      delete process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL;
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
      expect(getConfiguredMapTileUrlTemplate()).toBeNull();
    });

    it('rejects http proxy in production even on localhost', () => {
      process.env.EXPO_PUBLIC_API_BASE_URL = 'http://127.0.0.1:8000';
      process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL =
        'http://127.0.0.1:8000/api/v1/mobile/map-tiles/{z}/{x}/{y}.png';
      expect(getConfiguredMapTileUrlTemplate()).toBeNull();
    });

    it('rejects tile.openstreetmap.org as configured template in production', () => {
      process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL =
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      expect(getConfiguredMapTileUrlTemplate()).toBeNull();
    });

    it('accepts valid HTTPS same-origin proxy in production', () => {
      process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.test';
      process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL =
        'https://api.example.test/api/v1/mobile/map-tiles/{z}/{x}/{y}.png';
      expect(getConfiguredMapTileUrlTemplate()).toBe(
        'https://api.example.test/api/v1/mobile/map-tiles/{z}/{x}/{y}.png',
      );
    });

    it('rejects HTTPS proxy with origin mismatch in production', () => {
      process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.test';
      process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL =
        'https://other.example.test/api/v1/mobile/map-tiles/{z}/{x}/{y}.png';
      expect(getConfiguredMapTileUrlTemplate()).toBeNull();
    });
  });
});

describe('isLocalOrLanHostname', () => {
  it.each([
    'localhost',
    '127.0.0.1',
    '127.0.0.2',
    '::1',
    '[::1]',
    '10.0.0.1',
    '10.0.2.2',
    '192.168.0.1',
    '192.168.1.100',
    '172.16.0.1',
    '172.24.0.1',
    '172.31.255.255',
  ])('recognizes %s as a local/LAN hostname', (hostname) => {
    expect(isLocalOrLanHostname(hostname)).toBe(true);
  });

  it.each([
    'example.com',
    'api.caneguard.test',
    'tile.openstreetmap.org',
    '8.8.8.8',
    '11.0.0.1',
    '192.169.1.1',
    '172.32.0.1',
  ])('rejects non-LAN hostname %s', (hostname) => {
    expect(isLocalOrLanHostname(hostname)).toBe(false);
  });
});
