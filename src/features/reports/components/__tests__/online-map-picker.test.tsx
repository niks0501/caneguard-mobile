import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { OnlineMapPicker } from '@/features/reports/components/online-map-picker';
import {
  DEFAULT_MANUAL_MAP_CENTER,
  DEFAULT_MANUAL_MAP_ZOOM,
  MAP_TILE_SIZE,
  coordinateAtViewportPoint,
  coordinateToViewportPoint,
} from '@/features/reports/domain/manualMap';

describe('OnlineMapPicker', () => {
  it('keeps selection unavailable when the device is offline', async () => {
    const onSelectionChange = jest.fn();
    await render(
      <OnlineMapPicker
        initialCenter={DEFAULT_MANUAL_MAP_CENTER}
        isOnline={false}
        onSelectionChange={onSelectionChange}
      />,
    );
    await act(async () => undefined);

    expect(screen.getByText(/Connect to the internet/)).toBeOnTheScreen();
    expect(screen.queryAllByTestId('manual-map.tile')).toHaveLength(0);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('selects coordinates only after an online tile loads', async () => {
    const onSelectionChange = jest.fn();
    await render(
      <OnlineMapPicker
        initialCenter={DEFAULT_MANUAL_MAP_CENTER}
        isOnline={true}
        onSelectionChange={onSelectionChange}
      />,
    );
    await act(async () => undefined);

    const viewport = screen.getByTestId('manual-map.viewport');
    await act(async () => {
      viewport.props.onLayout({
        nativeEvent: { layout: { height: 360, width: 390, x: 0, y: 0 } },
      });
    });
    for (const tile of screen.getAllByTestId('manual-map.tile')) {
      await act(async () => {
        tile.props.onLoad();
      });
    }
    const loadedViewport = screen.getByTestId('manual-map.viewport');
    expect(loadedViewport).not.toBeDisabled();
    await fireEvent(loadedViewport, 'press', {
      nativeEvent: { locationX: 195, locationY: 180 },
    });

    expect(onSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: expect.closeTo(DEFAULT_MANUAL_MAP_CENTER.latitude, 6),
        longitude: expect.closeTo(DEFAULT_MANUAL_MAP_CENTER.longitude, 6),
      }),
    );
    expect(screen.getByTestId('manual-map.pin')).toBeOnTheScreen();
    expect(screen.getByTestId('manual-map.coordinates')).toHaveTextContent(
      '14.066700, 120.631900',
    );
  });

  it('keeps the picker disabled when any required map tile fails', async () => {
    const onSelectionChange = jest.fn();
    await render(
      <OnlineMapPicker
        initialCenter={DEFAULT_MANUAL_MAP_CENTER}
        isOnline={true}
        onSelectionChange={onSelectionChange}
      />,
    );
    await act(async () => undefined);

    await act(async () => {
      screen.getAllByTestId('manual-map.tile')[0].props.onError();
    });
    expect(screen.getByText(/online map could not load/)).toBeOnTheScreen();
    expect(screen.getByTestId('manual-map.viewport')).toBeDisabled();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('records the exact tapped viewport point when the tap lands on a tile', async () => {
    const onSelectionChange = jest.fn();
    await render(
      <OnlineMapPicker
        initialCenter={DEFAULT_MANUAL_MAP_CENTER}
        isOnline={true}
        onSelectionChange={onSelectionChange}
      />,
    );
    await act(async () => undefined);
    await act(async () => {
      screen.getByTestId('manual-map.viewport').props.onLayout({
        nativeEvent: { layout: { height: 360, width: 390, x: 0, y: 0 } },
      });
    });
    for (const tile of screen.getAllByTestId('manual-map.tile')) {
      await act(async () => tile.props.onLoad());
    }

    // The root cause of the old tap offset: absolutely-positioned tile images
    // intercepted touches, so locationX/locationY were relative to the tile
    // under the finger instead of the map viewport. Tiles must be
    // pointer-transparent so the press event targets the viewport itself.
    const tiles = screen.getAllByTestId('manual-map.tile');
    expect(tiles.length).toBeGreaterThan(0);
    for (const tile of tiles) {
      expect(tile.props.pointerEvents).toBe('none');
    }

    // Tap a viewport point that lies inside a tile (not the viewport center).
    const tapX = 300;
    const tapY = 100;
    const coveringTile = tiles.find((tile) => {
      const tileStyle = Array.isArray(tile.props.style)
        ? Object.assign({}, ...tile.props.style)
        : tile.props.style;
      return (
        tileStyle.left <= tapX &&
        tapX < tileStyle.left + MAP_TILE_SIZE &&
        tileStyle.top <= tapY &&
        tapY < tileStyle.top + MAP_TILE_SIZE
      );
    });
    expect(coveringTile).toBeTruthy();

    await fireEvent(screen.getByTestId('manual-map.viewport'), 'press', {
      nativeEvent: { locationX: tapX, locationY: tapY },
    });

    const expected = coordinateAtViewportPoint(
      DEFAULT_MANUAL_MAP_CENTER,
      DEFAULT_MANUAL_MAP_ZOOM,
      390,
      360,
      tapX,
      tapY,
    );
    expect(onSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: expect.closeTo(expected.latitude, 8),
        longitude: expect.closeTo(expected.longitude, 8),
      }),
    );
    // The pin must render at the tapped viewport spot.
    const expectedPin = coordinateToViewportPoint(
      DEFAULT_MANUAL_MAP_CENTER,
      expected,
      DEFAULT_MANUAL_MAP_ZOOM,
      390,
      360,
    );
    expect(screen.getByTestId('manual-map.pin')).toHaveStyle({
      left: expectedPin.x - 16,
      top: expectedPin.y - 32,
    });
  });

  it('requests fullscreen expansion and marks the map as fullscreen', async () => {
    const onToggleFullscreen = jest.fn();
    const view = await render(
      <OnlineMapPicker
        initialCenter={DEFAULT_MANUAL_MAP_CENTER}
        isOnline={false}
        onSelectionChange={jest.fn()}
        onToggleFullscreen={onToggleFullscreen}
      />,
    );
    await act(async () => undefined);

    const toggle = screen.getByTestId('manual-map.fullscreen-toggle');
    expect(screen.getByLabelText('Expand map to fullscreen')).toBeOnTheScreen();
    await fireEvent.press(toggle);
    expect(onToggleFullscreen).toHaveBeenCalledTimes(1);

    await view.rerender(
      <OnlineMapPicker
        fullscreen
        initialCenter={DEFAULT_MANUAL_MAP_CENTER}
        isOnline={false}
        onSelectionChange={jest.fn()}
        onToggleFullscreen={onToggleFullscreen}
      />,
    );
    expect(screen.getByLabelText('Exit fullscreen map')).toBeOnTheScreen();
    expect(screen.getByTestId('manual-map.viewport')).toHaveStyle({ flex: 1 });
  });

  it('retains loaded overlap after panning into a new tile set', async () => {
    await render(
      <OnlineMapPicker
        initialCenter={DEFAULT_MANUAL_MAP_CENTER}
        isOnline={true}
        onSelectionChange={jest.fn()}
      />,
    );
    await act(async () => undefined);
    await act(async () => {
      screen.getByTestId('manual-map.viewport').props.onLayout({
        nativeEvent: { layout: { height: 360, width: 390, x: 0, y: 0 } },
      });
    });

    for (const tile of screen.getAllByTestId('manual-map.tile')) {
      await act(async () => tile.props.onLoad());
    }
    const initialTileUrls = new Set(
      screen
        .getAllByTestId('manual-map.tile')
        .map((tile) => tile.props.source.uri),
    );

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Pan east'));
    });
    const newTiles = screen
      .getAllByTestId('manual-map.tile')
      .filter((tile) => !initialTileUrls.has(tile.props.source.uri));
    expect(newTiles.length).toBeGreaterThan(0);

    for (const tile of newTiles) {
      await act(async () => tile.props.onLoad());
    }

    expect(screen.getByTestId('manual-map.viewport')).not.toBeDisabled();
  });
});
