import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type NativeTouchEvent,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  type GestureType,
  type GestureUpdateEvent,
  type PanGestureHandlerEventPayload,
  type PinchGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { Radius, Spacing, Typography } from '@/constants/theme';
import {
  DEFAULT_MANUAL_MAP_ZOOM,
  MAP_TILE_SIZE,
  MAX_MANUAL_MAP_ZOOM,
  MIN_MANUAL_MAP_ZOOM,
  coordinateAtViewportPoint,
  coordinateToViewportPoint,
  getMapTiles,
  moveMapCenter,
  zoomMapAtPoint,
  type MapCoordinate,
} from '@/features/reports/domain/manualMap';
import { useTheme } from '@/hooks/use-theme';

const MAP_HEIGHT = 360;
const PAN_DISTANCE = 120;

function clampZoom(zoom: number): number {
  return Math.min(MAX_MANUAL_MAP_ZOOM, Math.max(MIN_MANUAL_MAP_ZOOM, zoom));
}

export function OnlineMapPicker({
  blocksScrollGesture,
  fullscreen = false,
  initialCenter,
  isOnline,
  onSelectionChange,
  onToggleFullscreen,
}: {
  blocksScrollGesture?: GestureType;
  fullscreen?: boolean;
  initialCenter: MapCoordinate;
  isOnline: boolean | null;
  onSelectionChange: (coordinate: MapCoordinate | null) => void;
  onToggleFullscreen?: () => void;
}) {
  const theme = useTheme();
  const window = useWindowDimensions();
  const [center, setCenter] = useState(initialCenter);
  const [selection, setSelection] = useState<MapCoordinate | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_MANUAL_MAP_ZOOM);
  const [viewport, setViewport] = useState({
    height: MAP_HEIGHT,
    width: Math.max(240, Math.min(window.width - Spacing.xl * 2, 390)),
  });
  const [tileLoadState, setTileLoadState] = useState<{
    failed: string[];
    loaded: string[];
  }>({ failed: [], loaded: [] });
  const tiles = useMemo(
    () => getMapTiles(center, zoom, viewport.width, viewport.height),
    [center, viewport.height, viewport.width, zoom],
  );
  const visibleTileKeys = new Set(tiles.map(({ key }) => key));
  const activeLoadState = {
    failed: tileLoadState.failed.filter((key) => visibleTileKeys.has(key)),
    loaded: tileLoadState.loaded.filter((key) => visibleTileKeys.has(key)),
  };
  const mapLoaded =
    tiles.length > 0 && activeLoadState.loaded.length === tiles.length;
  const mapFailed =
    isOnline === true &&
    tiles.length > 0 &&
    activeLoadState.failed.length > 0;
  const pinPoint = selection
    ? coordinateToViewportPoint(
        center,
        selection,
        zoom,
        viewport.width,
        viewport.height,
      )
    : null;

  function updateSelection(coordinate: MapCoordinate | null) {
    setSelection(coordinate);
    onSelectionChange(coordinate);
  }

  function onMapPress(event: NativeSyntheticEvent<NativeTouchEvent>) {
    if (isOnline !== true || !mapLoaded) return;
    updateSelection(
      coordinateAtViewportPoint(
        center,
        zoom,
        viewport.width,
        viewport.height,
        event.nativeEvent.locationX,
        event.nativeEvent.locationY,
      ),
    );
  }

  function onLayout(event: LayoutChangeEvent) {
    const { height, width } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setViewport({ height, width });
  }

  function pan(deltaX: number, deltaY: number) {
    setCenter((current) => moveMapCenter(current, zoom, deltaX, deltaY));
  }

  // Latest-value refs so gesture callbacks (worklets bridged with runOnJS)
  // always read the current center/zoom without being recreated per frame.
  const centerRef = useRef(center);
  const zoomRef = useRef(zoom);
  useEffect(() => {
    centerRef.current = center;
  }, [center]);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const panStart = useRef<{ center: MapCoordinate; zoom: number } | null>(null);
  const pinchStart = useRef<{
    center: MapCoordinate;
    height: number;
    width: number;
    zoom: number;
  } | null>(null);

  const capturePanStart = useCallback(() => {
    panStart.current = { center: centerRef.current, zoom: zoomRef.current };
  }, []);

  const applyPan = useCallback((translationX: number, translationY: number) => {
    const start = panStart.current;
    if (!start) return;
    setCenter(
      moveMapCenter(start.center, start.zoom, translationX, translationY),
    );
  }, []);

  const capturePinchStart = useCallback(() => {
    pinchStart.current = {
      center: centerRef.current,
      height: viewport.height,
      width: viewport.width,
      zoom: zoomRef.current,
    };
  }, [viewport.height, viewport.width]);

  const applyPinch = useCallback(
    (scale: number, focalX: number, focalY: number) => {
      const start = pinchStart.current;
      if (!start) return;
      const nextZoom = clampZoom(start.zoom * scale);
      if (nextZoom === start.zoom) return;
      setCenter(
        zoomMapAtPoint(
          start.center,
          start.zoom,
          nextZoom,
          focalX,
          focalY,
          start.width,
          start.height,
        ),
      );
      setZoom(nextZoom);
    },
    [],
  );

  const gesturesEnabled = isOnline === true && mapLoaded;

  // runOnJS invocations are hoisted out of the gesture factory (which runs
  // during render) into stable callbacks so the refs they touch are only
  // accessed inside event handlers, never during render.
  const handlePanStart = useCallback(() => {
    runOnJS(capturePanStart)();
  }, [capturePanStart]);
  const handlePanUpdate = useCallback(
    (event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      runOnJS(applyPan)(event.translationX, event.translationY);
    },
    [applyPan],
  );
  const handlePinchStart = useCallback(() => {
    runOnJS(capturePinchStart)();
  }, [capturePinchStart]);
  const handlePinchUpdate = useCallback(
    (event: GestureUpdateEvent<PinchGestureHandlerEventPayload>) => {
      runOnJS(applyPinch)(event.scale, event.focalX, event.focalY);
    },
    [applyPinch],
  );

  const mapGestures = useMemo(() => {
    // RNGH gesture builders only register these callbacks; they never invoke
    // them during render, so the refs they read are only touched on gesture
    // events. The react-hooks/refs rule cannot see through the builders.
    let panGesture = Gesture.Pan()
      .minPointers(1)
      .maxPointers(1)
      .enabled(gesturesEnabled)
      // eslint-disable-next-line react-hooks/refs
      .onStart(handlePanStart)
      // eslint-disable-next-line react-hooks/refs
      .onUpdate(handlePanUpdate);
    // Let the map win over the surrounding ScrollView while dragging on it.
    if (blocksScrollGesture) {
      panGesture = panGesture.blocksExternalGesture(blocksScrollGesture);
    }
    const pinchGesture = Gesture.Pinch()
      .enabled(gesturesEnabled)
      // eslint-disable-next-line react-hooks/refs
      .onStart(handlePinchStart)
      // eslint-disable-next-line react-hooks/refs
      .onUpdate(handlePinchUpdate);
    return Gesture.Simultaneous(panGesture, pinchGesture);
  }, [
    blocksScrollGesture,
    gesturesEnabled,
    handlePanStart,
    handlePanUpdate,
    handlePinchStart,
    handlePinchUpdate,
  ]);

  return (
    <View style={[styles.wrapper, fullscreen && styles.wrapperFullscreen]}>
      <GestureDetector gesture={mapGestures}>
        <Pressable
          testID="manual-map.viewport"
          accessibilityRole="imagebutton"
          accessibilityLabel="Online map. Tap to place the report location pin."
          disabled={isOnline !== true || !mapLoaded}
          onLayout={onLayout}
          onPress={onMapPress}
          style={[
            fullscreen ? styles.mapFullscreen : styles.map,
            { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
          ]}>
          {isOnline === true
            ? tiles.map((tile) => (
                <ExpoImage
                  key={tile.key}
                  testID="manual-map.tile"
                  pointerEvents="none"
                  source={{
                    headers: { 'User-Agent': 'CaneGuard-Mobile/1.0' },
                    uri: tile.url,
                  }}
                cachePolicy="disk"
                contentFit="fill"
                onLoad={() =>
                  setTileLoadState((current) => {
                    return {
                      ...current,
                      failed: current.failed.filter((key) => key !== tile.key),
                      loaded: current.loaded.includes(tile.key)
                        ? current.loaded
                        : [...current.loaded, tile.key],
                    };
                  })
                }
                onError={() =>
                  setTileLoadState((current) => {
                    return current.failed.includes(tile.key)
                      ? current
                      : { ...current, failed: [...current.failed, tile.key] };
                  })
                }
                style={[
                  styles.tile,
                  { left: tile.left, top: tile.top },
                ]}
              />
            ))
          : null}

        {pinPoint ? (
          <View
            testID="manual-map.pin"
            pointerEvents="none"
            style={[
              styles.pin,
              { left: pinPoint.x - 16, top: pinPoint.y - 32 },
            ]}>
            <Feather name="map-pin" size={32} color={theme.danger} />
          </View>
        ) : null}

        {onToggleFullscreen ? (
          <Pressable
            testID="manual-map.fullscreen-toggle"
            accessibilityRole="button"
            accessibilityLabel={
              fullscreen
                ? 'Exit fullscreen map'
                : 'Expand map to fullscreen'
            }
            accessibilityHint={
              fullscreen
                ? 'Returns to the inline map view.'
                : 'Fills the screen with the map.'
            }
            hitSlop={8}
            onPress={onToggleFullscreen}
            style={({ pressed }) => [
              styles.fullscreenToggle,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.border,
              },
              pressed && styles.pressed,
            ]}>
            <Feather
              name={fullscreen ? 'minimize' : 'maximize'}
              size={18}
              color={theme.primary}
            />
          </Pressable>
        ) : null}

        {isOnline !== true ? (
          <MapOverlay
            icon="wifi-off"
            message="Connect to the internet to load the manual map. Your Draft is unchanged."
          />
        ) : mapFailed ? (
          <MapOverlay
            icon="alert-triangle"
            message="The online map could not load. Keep this report as a Draft and try again later."
          />
        ) : !mapLoaded ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={theme.primary} />
            <Text style={[styles.overlayText, { color: theme.text }]}>Loading online map…</Text>
          </View>
        ) : null}

        <View
          pointerEvents="none"
          style={[
            styles.mapAttribution,
            { backgroundColor: theme.surfaceElevated },
          ]}>
          <Text style={[styles.mapAttributionText, { color: theme.text }]}>© OpenStreetMap contributors</Text>
        </View>
        </Pressable>
      </GestureDetector>

      <View style={styles.controls}>
        <MapControl label="Pan west" icon="arrow-left" onPress={() => pan(-PAN_DISTANCE, 0)} disabled={!mapLoaded} />
        <MapControl label="Pan north" icon="arrow-up" onPress={() => pan(0, -PAN_DISTANCE)} disabled={!mapLoaded} />
        <MapControl label="Pan south" icon="arrow-down" onPress={() => pan(0, PAN_DISTANCE)} disabled={!mapLoaded} />
        <MapControl label="Pan east" icon="arrow-right" onPress={() => pan(PAN_DISTANCE, 0)} disabled={!mapLoaded} />
        <MapControl
          label="Zoom out"
          icon="minus"
          onPress={() => setZoom((current) => clampZoom(current - 1))}
          disabled={!mapLoaded || zoom === MIN_MANUAL_MAP_ZOOM}
        />
        <MapControl
          label="Zoom in"
          icon="plus"
          onPress={() => setZoom((current) => clampZoom(current + 1))}
          disabled={!mapLoaded || zoom === MAX_MANUAL_MAP_ZOOM}
        />
      </View>

      <Text style={[styles.attribution, { color: theme.textSecondary }]}>
        Tiles load only for the visible online map. CaneGuard does not prefetch or offer offline map downloads.
      </Text>
      <Text
        testID="manual-map.coordinates"
        selectable
        style={[styles.coordinates, { color: theme.text }]}>
        {selection
          ? `${selection.latitude.toFixed(6)}, ${selection.longitude.toFixed(6)}`
          : 'Tap the loaded map to choose the final report coordinates.'}
      </Text>
    </View>
  );
}

function MapOverlay({
  icon,
  message,
}: {
  icon: keyof typeof Feather.glyphMap;
  message: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.loadingOverlay, { backgroundColor: theme.surfaceElevated }]}>
      <Feather name={icon} size={28} color={theme.warning} />
      <Text style={[styles.overlayText, { color: theme.text }]}>{message}</Text>
    </View>
  );
}

function MapControl({
  disabled,
  icon,
  label,
  onPress,
}: {
  disabled: boolean;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.control,
        { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Feather name={icon} size={20} color={theme.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.md },
  wrapperFullscreen: { flex: 1 },
  map: {
    width: '100%',
    height: MAP_HEIGHT,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mapFullscreen: {
    flex: 1,
    width: '100%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fullscreenToggle: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    zIndex: 6,
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: {
    position: 'absolute',
    height: MAP_TILE_SIZE,
    width: MAP_TILE_SIZE,
  },
  pin: { position: 'absolute', zIndex: 3 },
  mapAttribution: {
    position: 'absolute',
    right: Spacing.xs,
    bottom: Spacing.xs,
    zIndex: 5,
    borderRadius: Radius.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    opacity: 0.88,
  },
  mapAttributionText: { ...Typography.caption, fontSize: 10 },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 4,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  overlayText: { ...Typography.bodySmall, fontWeight: '700', textAlign: 'center' },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  control: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
  attribution: { ...Typography.caption },
  coordinates: { ...Typography.bodySmall, fontWeight: '800' },
});
