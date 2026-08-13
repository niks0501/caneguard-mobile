import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import type {
  GestureStateChangeEvent,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
  PinchGestureHandlerEventPayload,
} from 'react-native-gesture-handler';

import {
  OnlineMapPicker,
  viewportPointFromPressEvent,
} from '@/features/reports/components/online-map-picker';
import { useManualMapGestures } from '@/features/reports/components/use-manual-map-gestures';
import {
  DEFAULT_MANUAL_MAP_CENTER,
  DEFAULT_MANUAL_MAP_ZOOM,
  MAP_TILE_SIZE,
  MAX_MANUAL_MAP_ZOOM,
  MIN_MANUAL_MAP_ZOOM,
  coordinateAtViewportPoint,
  coordinateToViewportPoint,
  moveMapCenter,
  zoomMapAtPoint,
  type MapCoordinate,
} from '@/features/reports/domain/manualMap';

const LAYER_OFFSET = MAP_TILE_SIZE;

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
    // under the finger instead of the map viewport. Tiles (and the layer that
    // wraps them) must be pointer-transparent so the press event targets the
    // viewport itself.
    const tiles = screen.getAllByTestId('manual-map.tile');
    expect(tiles.length).toBeGreaterThan(0);
    for (const tile of tiles) {
      expect(tile.props.pointerEvents).toBe('none');
    }

    // Tap a viewport point that lies inside a tile (not the viewport center).
    const tapX = 300;
    const tapY = 100;
    // The tile layer is offset by one tile so tiles can overscan the viewport
    // during drags; a viewport point (x, y) lives at (x + LAYER_OFFSET,
    // y + LAYER_OFFSET) inside the layer.
    const coveringTile = tiles.find((tile) => {
      const tileStyle = Array.isArray(tile.props.style)
        ? Object.assign({}, ...tile.props.style)
        : tile.props.style;
      return (
        tileStyle.left <= tapX + LAYER_OFFSET &&
        tapX + LAYER_OFFSET < tileStyle.left + MAP_TILE_SIZE &&
        tileStyle.top <= tapY + LAYER_OFFSET &&
        tapY + LAYER_OFFSET < tileStyle.top + MAP_TILE_SIZE
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
    // The pin must render at the tapped viewport spot (inside the offset
    // layer), with its tip anchored to the tap point.
    const expectedPin = coordinateToViewportPoint(
      DEFAULT_MANUAL_MAP_CENTER,
      expected,
      DEFAULT_MANUAL_MAP_ZOOM,
      390,
      360,
    );
    expect(screen.getByTestId('manual-map.pin')).toHaveStyle({
      left: expectedPin.x - 16 + LAYER_OFFSET,
      top: expectedPin.y - 32 + LAYER_OFFSET,
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
    // Fullscreen: the map covers the whole wrapper...
    expect(screen.getByTestId('manual-map.viewport')).toHaveStyle({
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
    // ...the pan/zoom controls float over it instead of taking layout space...
    expect(screen.getByTestId('manual-map.controls')).toHaveStyle({
      position: 'absolute',
    });
    // ...and the below-map prose is hidden, but the coordinates stay visible.
    expect(
      screen.queryByText(/Tiles load only for the visible online map/),
    ).not.toBeOnTheScreen();
    expect(screen.getByTestId('manual-map.coordinates')).toBeOnTheScreen();
  });

  it('keeps selection and center across the fullscreen toggle', async () => {
    const onSelectionChange = jest.fn();
    const view = await render(
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
    await fireEvent(screen.getByTestId('manual-map.viewport'), 'press', {
      nativeEvent: { locationX: 300, locationY: 100 },
    });
    const selected = onSelectionChange.mock.calls[0][0] as MapCoordinate;

    await view.rerender(
      <OnlineMapPicker
        fullscreen
        initialCenter={DEFAULT_MANUAL_MAP_CENTER}
        isOnline={true}
        onSelectionChange={onSelectionChange}
      />,
    );
    // Selection and pin survive the toggle.
    expect(screen.getByTestId('manual-map.coordinates')).toHaveTextContent(
      `${selected.latitude.toFixed(6)}, ${selected.longitude.toFixed(6)}`,
    );
    expect(screen.getByTestId('manual-map.pin')).toBeOnTheScreen();

    await view.rerender(
      <OnlineMapPicker
        initialCenter={DEFAULT_MANUAL_MAP_CENTER}
        isOnline={true}
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(screen.getByTestId('manual-map.coordinates')).toHaveTextContent(
      `${selected.latitude.toFixed(6)}, ${selected.longitude.toFixed(6)}`,
    );
  });

  it('places the pin exactly under the finger in fullscreen', async () => {
    const onSelectionChange = jest.fn();
    await render(
      <OnlineMapPicker
        fullscreen
        initialCenter={DEFAULT_MANUAL_MAP_CENTER}
        isOnline={true}
        onSelectionChange={onSelectionChange}
      />,
    );
    await act(async () => undefined);
    // Fullscreen layout: the map covers the full device screen.
    const fullscreenWidth = 390;
    const fullscreenHeight = 844;
    await act(async () => {
      screen.getByTestId('manual-map.viewport').props.onLayout({
        nativeEvent: {
          layout: {
            height: fullscreenHeight,
            width: fullscreenWidth,
            x: 0,
            y: 0,
          },
        },
      });
    });
    for (const tile of screen.getAllByTestId('manual-map.tile')) {
      await act(async () => tile.props.onLoad());
    }

    const tapX = 300;
    const tapY = 100;
    await fireEvent(screen.getByTestId('manual-map.viewport'), 'press', {
      nativeEvent: { locationX: tapX, locationY: tapY },
    });

    const expected = coordinateAtViewportPoint(
      DEFAULT_MANUAL_MAP_CENTER,
      DEFAULT_MANUAL_MAP_ZOOM,
      fullscreenWidth,
      fullscreenHeight,
      tapX,
      tapY,
    );
    expect(onSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: expect.closeTo(expected.latitude, 8),
        longitude: expect.closeTo(expected.longitude, 8),
      }),
    );
    const expectedPin = coordinateToViewportPoint(
      DEFAULT_MANUAL_MAP_CENTER,
      expected,
      DEFAULT_MANUAL_MAP_ZOOM,
      fullscreenWidth,
      fullscreenHeight,
    );
    expect(screen.getByTestId('manual-map.pin')).toHaveStyle({
      left: expectedPin.x - 16 + LAYER_OFFSET,
      top: expectedPin.y - 32 + LAYER_OFFSET,
    });
  });

  it('recomputes tiles for the new viewport size when fullscreen resizes the map', async () => {
    const onSelectionChange = jest.fn();
    const view = await render(
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
    const inlineTiles = screen.getAllByTestId('manual-map.tile');
    expect(inlineTiles.length).toBeGreaterThan(6);
    // Tiles overscan the viewport so drags do not expose blank edges: some
    // tiles must extend beyond the left/top edges of the viewport.
    const hasOverscan = inlineTiles.some((tile) => {
      const tileStyle = Array.isArray(tile.props.style)
        ? Object.assign({}, ...tile.props.style)
        : tile.props.style;
      return tileStyle.left < 0 || tileStyle.top < 0;
    });
    expect(hasOverscan).toBe(true);

    await view.rerender(
      <OnlineMapPicker
        fullscreen
        initialCenter={DEFAULT_MANUAL_MAP_CENTER}
        isOnline={true}
        onSelectionChange={onSelectionChange}
      />,
    );
    await act(async () => {
      screen.getByTestId('manual-map.viewport').props.onLayout({
        nativeEvent: { layout: { height: 844, width: 390, x: 0, y: 0 } },
      });
    });
    const fullscreenTiles = screen.getAllByTestId('manual-map.tile');
    expect(fullscreenTiles.length).toBeGreaterThan(inlineTiles.length);
    for (const tile of fullscreenTiles) {
      await act(async () => tile.props.onLoad());
    }

    // A tap after the resize must resolve against the fullscreen viewport.
    const tapX = 60;
    const tapY = 700;
    await fireEvent(screen.getByTestId('manual-map.viewport'), 'press', {
      nativeEvent: { locationX: tapX, locationY: tapY },
    });
    const expected = coordinateAtViewportPoint(
      DEFAULT_MANUAL_MAP_CENTER,
      DEFAULT_MANUAL_MAP_ZOOM,
      390,
      844,
      tapX,
      tapY,
    );
    expect(onSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: expect.closeTo(expected.latitude, 8),
        longitude: expect.closeTo(expected.longitude, 8),
      }),
    );
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

describe('viewportPointFromPressEvent', () => {
  it('derives the viewport point from pageX/pageY and the measured window origin', () => {
    const event = {
      nativeEvent: {
        locationX: 999,
        locationY: 999,
        pageX: 310,
        pageY: 460,
      },
    } as Parameters<typeof viewportPointFromPressEvent>[0];
    expect(
      viewportPointFromPressEvent(event, { x: 12, y: 380 }),
    ).toEqual({ x: 298, y: 80 });
  });

  it('falls back to locationX/locationY when the origin is unknown', () => {
    const event = {
      nativeEvent: {
        locationX: 298,
        locationY: 80,
        pageX: 310,
        pageY: 460,
      },
    } as Parameters<typeof viewportPointFromPressEvent>[0];
    expect(viewportPointFromPressEvent(event, null)).toEqual({
      x: 298,
      y: 80,
    });
  });
});

describe('useManualMapGestures', () => {
  const CENTER: MapCoordinate = { latitude: 14.0667, longitude: 120.6319 };
  const VIEWPORT = { height: 360, width: 390 };
  const ZOOM = DEFAULT_MANUAL_MAP_ZOOM;

  function renderGestures(onCommit = jest.fn()) {
    return renderHook(() =>
      useManualMapGestures({
        center: CENTER,
        enabled: true,
        onCommit,
        viewport: VIEWPORT,
        zoom: ZOOM,
      }),
    );
  }

  function panStart(handlers: {
    onStart?: (event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => void;
    onUpdate?: (event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => void;
    onEnd?: (
      event: GestureStateChangeEvent<PanGestureHandlerEventPayload>,
      success: boolean,
    ) => void;
    onFinalize?: (
      event: GestureStateChangeEvent<PanGestureHandlerEventPayload>,
      success: boolean,
    ) => void;
  }) {
    handlers.onStart?.({} as GestureStateChangeEvent<PanGestureHandlerEventPayload>);
    return handlers;
  }

  it('commits a pan once on gesture end, moving the center opposite the finger', async () => {
    const onCommit = jest.fn();
    const { result } = await renderGestures(onCommit);
    const pan = result.current.panGesture.handlers;

    panStart(pan);
    pan.onUpdate?.({
      translationX: 120,
      translationY: 60,
    } as GestureUpdateEvent<PanGestureHandlerEventPayload>);
    expect(onCommit).not.toHaveBeenCalled();
    pan.onEnd?.(
      {} as GestureStateChangeEvent<PanGestureHandlerEventPayload>,
      false,
    );

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(
      moveMapCenter(CENTER, ZOOM, -120, -60),
      ZOOM,
    );
  });

  it('does not commit on a tap (gesture never starts)', async () => {
    const onCommit = jest.fn();
    const { result } = await renderGestures(onCommit);
    const pan = result.current.panGesture.handlers;

    // A tap fails the pan gesture without it ever starting: only onFinalize
    // fires, with neutral transform values, so nothing commits.
    pan.onFinalize?.(
      {} as GestureStateChangeEvent<PanGestureHandlerEventPayload>,
      false,
    );
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('commits a pinch with clamped, integer zoom and focal-stable center', async () => {
    const onCommit = jest.fn();
    const { result } = await renderGestures(onCommit);
    const pan = result.current.panGesture.handlers;
    const pinch = result.current.pinchGesture.handlers;

    panStart(pan);
    pinch.onStart?.({} as GestureStateChangeEvent<PinchGestureHandlerEventPayload>);
    pinch.onUpdate?.({
      scale: 2,
      focalX: 195,
      focalY: 180,
    } as GestureUpdateEvent<PinchGestureHandlerEventPayload>);
    // Pinch ending first (finger lifted) must not commit while the pan is
    // still active.
    pinch.onEnd?.(
      {} as GestureStateChangeEvent<PinchGestureHandlerEventPayload>,
      false,
    );
    expect(onCommit).not.toHaveBeenCalled();
    pan.onEnd?.(
      {} as GestureStateChangeEvent<PanGestureHandlerEventPayload>,
      false,
    );

    const nextZoom = MAX_MANUAL_MAP_ZOOM;
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(
      moveMapCenter(
        zoomMapAtPoint(
          CENTER,
          ZOOM,
          nextZoom,
          195,
          180,
          VIEWPORT.width,
          VIEWPORT.height,
        ),
        nextZoom,
        0,
        0,
      ),
      nextZoom,
    );
  });

  it('clamps pinch zoom to the 11..18 range', async () => {
    const onCommit = jest.fn();
    const { result } = await renderGestures(onCommit);
    const pan = result.current.panGesture.handlers;
    const pinch = result.current.pinchGesture.handlers;

    panStart(pan);
    pinch.onStart?.({} as GestureStateChangeEvent<PinchGestureHandlerEventPayload>);
    pinch.onUpdate?.({
      scale: 100,
      focalX: 195,
      focalY: 180,
    } as GestureUpdateEvent<PinchGestureHandlerEventPayload>);
    pan.onEnd?.(
      {} as GestureStateChangeEvent<PanGestureHandlerEventPayload>,
      false,
    );
    expect(onCommit).not.toHaveBeenCalled();
    pinch.onEnd?.(
      {} as GestureStateChangeEvent<PinchGestureHandlerEventPayload>,
      false,
    );
    expect(onCommit.mock.calls[0][1]).toBe(MAX_MANUAL_MAP_ZOOM);

    const again = await renderGestures(onCommit);
    panStart(again.result.current.panGesture.handlers);
    again.result.current.pinchGesture.handlers.onStart?.(
      {} as GestureStateChangeEvent<PinchGestureHandlerEventPayload>,
    );
    again.result.current.pinchGesture.handlers.onUpdate?.({
      scale: 0.001,
      focalX: 195,
      focalY: 180,
    } as GestureUpdateEvent<PinchGestureHandlerEventPayload>);
    again.result.current.pinchGesture.handlers.onEnd?.(
      {} as GestureStateChangeEvent<PinchGestureHandlerEventPayload>,
      false,
    );
    again.result.current.panGesture.handlers.onEnd?.(
      {} as GestureStateChangeEvent<PanGestureHandlerEventPayload>,
      false,
    );
    expect(onCommit.mock.calls[1][1]).toBe(MIN_MANUAL_MAP_ZOOM);
  });

  it('combines pan translation and pinch in one commit at the end', async () => {
    const onCommit = jest.fn();
    const { result } = await renderGestures(onCommit);
    const pan = result.current.panGesture.handlers;
    const pinch = result.current.pinchGesture.handlers;

    panStart(pan);
    pinch.onStart?.({} as GestureStateChangeEvent<PinchGestureHandlerEventPayload>);
    pan.onUpdate?.({
      translationX: 50,
      translationY: 30,
    } as GestureUpdateEvent<PanGestureHandlerEventPayload>);
    pinch.onUpdate?.({
      scale: 1.5,
      focalX: 100,
      focalY: 80,
    } as GestureUpdateEvent<PinchGestureHandlerEventPayload>);
    // Pan cancelled (e.g. by the system) while the pinch is still running:
    // no commit yet, and the pinch keeps its accumulated values.
    pan.onFinalize?.(
      {} as GestureStateChangeEvent<PanGestureHandlerEventPayload>,
      false,
    );
    expect(onCommit).not.toHaveBeenCalled();
    pinch.onEnd?.(
      {} as GestureStateChangeEvent<PinchGestureHandlerEventPayload>,
      false,
    );

    const nextZoom = MAX_MANUAL_MAP_ZOOM; // round(15 * 1.5) = 23 -> clamp 18
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(
      moveMapCenter(
        zoomMapAtPoint(
          CENTER,
          ZOOM,
          nextZoom,
          100,
          80,
          VIEWPORT.width,
          VIEWPORT.height,
        ),
        nextZoom,
        -50,
        -30,
      ),
      nextZoom,
    );
  });

  it('starts with a neutral layer transform', async () => {
    const { result } = await renderGestures();
    expect(result.current.layerStyle).toEqual({
      transform: [
        { translateX: 0 },
        { translateY: 0 },
        { translateX: 0 },
        { translateY: 0 },
        { scale: 1 },
        { translateX: 0 },
        { translateY: 0 },
      ],
    });
  });

  it('disables the gestures when enabled is false', async () => {
    const { result } = await renderHook(() =>
      useManualMapGestures({
        center: CENTER,
        enabled: false,
        onCommit: jest.fn(),
        viewport: VIEWPORT,
        zoom: ZOOM,
      }),
    );
    expect(result.current.panGesture.config.enabled).toBe(false);
    expect(result.current.pinchGesture.config.enabled).toBe(false);
  });
});
