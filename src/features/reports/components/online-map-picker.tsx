import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useCallback, useMemo, useRef, useState } from 'react';
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
import { GestureDetector, type GestureType } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing, Typography } from '@/constants/theme';
import {
  DEFAULT_MANUAL_MAP_ZOOM,
  MAP_TILE_SIZE,
  MAX_MANUAL_MAP_ZOOM,
  MIN_MANUAL_MAP_ZOOM,
  coordinateAtViewportPoint,
  getConfiguredMapTileUrlTemplate,
  coordinateToViewportPoint,
  getMapTiles,
  moveMapCenter,
  type MapCoordinate,
} from '@/features/reports/domain/manualMap';
import { useManualMapGestures } from '@/features/reports/components/use-manual-map-gestures';
import { useTheme } from '@/hooks/use-theme';

const MAP_HEIGHT = 360;
const PAN_DISTANCE = 120;
// Request one extra tile around the viewport so a drag or pinch does not
// expose blank map edges before the gesture commits the new center/zoom.
const TILE_OVERSCAN = MAP_TILE_SIZE;
// Screen space reserved for the floating Confirm/Keep-Draft actions rendered
// below the map by manual-map.tsx while the map is fullscreen.
const FULLSCREEN_ACTIONS_OFFSET = 136;
// Fullscreen control rail: 6 buttons of 48 + 5 gaps of 8, vertically centered.
const FULLSCREEN_CONTROLS_OFFSET = 3 * 48 + 2.5 * 8;

function clampZoom(zoom: number): number {
  return Math.min(MAX_MANUAL_MAP_ZOOM, Math.max(MIN_MANUAL_MAP_ZOOM, zoom));
}

/**
 * Resolves a press event to a point relative to the map viewport.
 *
 * `locationX/locationY` are not reliably viewport-relative on all platforms
 * (they can be reported relative to a parent or the window), so when the
 * viewport's window origin has been measured we derive the point from the
 * window-relative `pageX/pageY` instead. Falls back to `locationX/locationY`
 * where measurement is unavailable (e.g. web, tests).
 */
export function viewportPointFromPressEvent(
  event: NativeSyntheticEvent<NativeTouchEvent>,
  viewportWindowOrigin: { x: number; y: number } | null,
): { x: number; y: number } {
  const { locationX, locationY, pageX, pageY } = event.nativeEvent;
  if (viewportWindowOrigin) {
    return {
      x: pageX - viewportWindowOrigin.x,
      y: pageY - viewportWindowOrigin.y,
    };
  }
  return { x: locationX, y: locationY };
}

export function OnlineMapPicker({
  authToken,
  blocksScrollGesture,
  fullscreen = false,
  initialCenter,
  isOnline,
  onSelectionChange,
  onToggleFullscreen,
}: {
  authToken?: string | null;
  blocksScrollGesture?: GestureType;
  fullscreen?: boolean;
  initialCenter: MapCoordinate;
  isOnline: boolean | null;
  onSelectionChange: (coordinate: MapCoordinate | null) => void;
  onToggleFullscreen?: () => void;
}) {
  const theme = useTheme();
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
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
  const viewportRef = useRef<View>(null);
  const mapTileUrlTemplate = getConfiguredMapTileUrlTemplate();
  const tiles = useMemo(
    () =>
      getMapTiles(
        center,
        zoom,
        viewport.width + TILE_OVERSCAN * 2,
        viewport.height + TILE_OVERSCAN * 2,
        mapTileUrlTemplate,
      ),
    [center, mapTileUrlTemplate, viewport.height, viewport.width, zoom],
  );
  const mapTileSourceConfigured = Boolean(mapTileUrlTemplate);
  const visibleTileKeys = new Set(tiles.map(({ key }) => key));
  const activeLoadState = {
    failed: tileLoadState.failed.filter((key) => visibleTileKeys.has(key)),
    loaded: tileLoadState.loaded.filter((key) => visibleTileKeys.has(key)),
  };
  const mapLoaded =
    tiles.length > 0 && activeLoadState.loaded.length === tiles.length;
  const mapFailed =
    mapTileSourceConfigured &&
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

  function selectAtEventLocation(
    event: NativeSyntheticEvent<NativeTouchEvent>,
  ) {
    const point = viewportPointFromPressEvent(event, null);
    updateSelection(
      coordinateAtViewportPoint(
        center,
        zoom,
        viewport.width,
        viewport.height,
        point.x,
        point.y,
      ),
    );
  }

  function onMapPress(event: NativeSyntheticEvent<NativeTouchEvent>) {
    if (isOnline !== true || !mapLoaded) return;
    const viewportNode = viewportRef.current;
    // The jest test renderer's measureInWindow is a no-op that never calls
    // back, so skip it in tests (same env check react-native-gesture-handler
    // uses) and use the deterministic locationX/locationY fallback.
    const canMeasure =
      process.env.NODE_ENV !== 'test' &&
      viewportNode &&
      typeof viewportNode.measureInWindow === 'function';
    if (canMeasure) {
      // Measure at press time: pageX/pageY are window-relative and the
      // viewport's window origin moves when the surrounding ScrollView
      // scrolls or when fullscreen resizes the map, so a cached origin could
      // go stale. The measured size also keeps the tap math in sync with the
      // actual map size right after a fullscreen toggle.
      viewportNode.measureInWindow((x, y, width, height) => {
        if (width <= 0 || height <= 0) {
          selectAtEventLocation(event);
          return;
        }
        setViewport((current) =>
          current.width === width && current.height === height
            ? current
            : { height, width },
        );
        const point = viewportPointFromPressEvent(event, { x, y });
        updateSelection(
          coordinateAtViewportPoint(
            center,
            zoom,
            width,
            height,
            point.x,
            point.y,
          ),
        );
      });
      return;
    }
    selectAtEventLocation(event);
  }

  function onLayout(event: LayoutChangeEvent) {
    const { height, width } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setViewport({ height, width });
  }

  function pan(deltaX: number, deltaY: number) {
    setCenter((current) => moveMapCenter(current, zoom, deltaX, deltaY));
  }

  const gesturesEnabled = mapTileSourceConfigured && isOnline === true && mapLoaded;
  const handleGestureCommit = useCallback(
    (nextCenter: MapCoordinate, nextZoom: number) => {
      setCenter(nextCenter);
      setZoom(nextZoom);
    },
    [],
  );
  const { gesture, layerStyle } = useManualMapGestures({
    blocksScrollGesture,
    center,
    enabled: gesturesEnabled,
    onCommit: handleGestureCommit,
    viewport,
    zoom,
  });

  return (
    <View style={[styles.wrapper, fullscreen && styles.wrapperFullscreen]}>
      <GestureDetector gesture={gesture}>
        <Pressable
          ref={viewportRef}
          testID="manual-map.viewport"
          accessibilityRole="imagebutton"
          accessibilityLabel="Privacy-preserving manual map. Tap to place the report location pin."
          disabled={!mapTileSourceConfigured || isOnline !== true || !mapLoaded}
          onLayout={onLayout}
          onPress={onMapPress}
          style={[
            fullscreen ? styles.mapFullscreen : styles.map,
            { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
          ]}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.mapLayer,
              {
                height: viewport.height + TILE_OVERSCAN * 2,
                width: viewport.width + TILE_OVERSCAN * 2,
              },
              layerStyle,
            ]}>
            {isOnline === true
              ? tiles.map((tile) => (
                  <ExpoImage
                    key={tile.key}
                    testID="manual-map.tile"
                    pointerEvents="none"
                    source={{
                      headers: {
                        'User-Agent': 'CaneGuard-Mobile/1.0',
                        ...(authToken
                          ? { Authorization: `Bearer ${authToken}` }
                          : {}),
                      },
                      uri: tile.url,
                    }}
                    cachePolicy="disk"
                    contentFit="fill"
                    onLoad={() =>
                      setTileLoadState((current) => {
                        return {
                          ...current,
                          failed: current.failed.filter(
                            (key) => key !== tile.key,
                          ),
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
                          : {
                              ...current,
                              failed: [...current.failed, tile.key],
                            };
                      })
                    }
                    style={[styles.tile, { left: tile.left, top: tile.top }]}
                  />
                ))
              : null}

            {pinPoint ? (
              <View
                testID="manual-map.pin"
                pointerEvents="none"
                style={[
                  styles.pin,
                  {
                    left: pinPoint.x - 16 + TILE_OVERSCAN,
                    top: pinPoint.y - 32 + TILE_OVERSCAN,
                  },
                ]}>
                <Feather name="map-pin" size={32} color={theme.danger} />
              </View>
            ) : null}
          </Animated.View>

          {onToggleFullscreen ? (
            <Pressable
              testID="manual-map.fullscreen-toggle"
              accessibilityRole="button"
              accessibilityLabel={
                fullscreen ? 'Exit fullscreen map' : 'Expand map to fullscreen'
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
                  top: fullscreen ? insets.top + Spacing.sm : Spacing.sm,
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

          {!mapTileSourceConfigured ? (
            <MapOverlay
              icon="shield"
              message="Manual map tiles are unavailable until the CaneGuard privacy proxy is configured. Your Draft is unchanged."
            />
          ) : isOnline !== true ? (
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
              <Text style={[styles.overlayText, { color: theme.text }]}>
                Loading online map…
              </Text>
            </View>
          ) : null}

          {mapTileSourceConfigured ? (
            <View
              pointerEvents="none"
              style={[
                styles.mapAttribution,
                fullscreen
                  ? styles.mapAttributionFullscreen
                  : styles.mapAttributionInline,
                {
                  top: fullscreen ? insets.top + Spacing.sm : undefined,
                  backgroundColor: theme.surfaceElevated,
                },
              ]}>
              <Text
                style={[styles.mapAttributionText, { color: theme.text }]}>
                © OpenStreetMap contributors via CaneGuard privacy proxy
              </Text>
            </View>
          ) : null}
        </Pressable>
      </GestureDetector>

      {!fullscreen ? (
        <View testID="manual-map.controls" style={styles.controls}>
          <MapControl
            label="Pan west"
            icon="arrow-left"
            onPress={() => pan(-PAN_DISTANCE, 0)}
            disabled={!mapLoaded}
          />
          <MapControl
            label="Pan north"
            icon="arrow-up"
            onPress={() => pan(0, -PAN_DISTANCE)}
            disabled={!mapLoaded}
          />
          <MapControl
            label="Pan south"
            icon="arrow-down"
            onPress={() => pan(0, PAN_DISTANCE)}
            disabled={!mapLoaded}
          />
          <MapControl
            label="Pan east"
            icon="arrow-right"
            onPress={() => pan(PAN_DISTANCE, 0)}
            disabled={!mapLoaded}
          />
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
      ) : null}

      {!fullscreen ? (
        <Text style={[styles.attribution, { color: theme.textSecondary }]}>
          Tiles load only for the visible online map. CaneGuard does not
          prefetch or offer offline map downloads.
        </Text>
      ) : null}
      <Text
        testID="manual-map.coordinates"
        selectable
        style={[
          styles.coordinates,
          fullscreen && styles.coordinatesFullscreen,
          fullscreen && {
            backgroundColor: theme.surfaceElevated,
            bottom: insets.bottom + FULLSCREEN_ACTIONS_OFFSET,
          },
          { color: theme.text },
        ]}>
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
    <View
      style={[
        styles.loadingOverlay,
        { backgroundColor: theme.surfaceElevated },
      ]}>
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
    ...StyleSheet.absoluteFill,
    borderRadius: 0,
    borderWidth: 0,
    overflow: 'hidden',
  },
  mapLayer: {
    position: 'absolute',
    left: -TILE_OVERSCAN,
    top: -TILE_OVERSCAN,
  },
  fullscreenToggle: {
    position: 'absolute',
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
    zIndex: 5,
    borderRadius: Radius.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    opacity: 0.88,
  },
  mapAttributionInline: {
    right: Spacing.xs,
    bottom: Spacing.xs,
  },
  mapAttributionFullscreen: {
    right: Spacing.xs,
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
  overlayText: {
    ...Typography.bodySmall,
    fontWeight: '700',
    textAlign: 'center',
  },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  controlsFullscreen: {
    position: 'absolute',
    right: Spacing.sm,
    top: '50%',
    marginTop: -FULLSCREEN_CONTROLS_OFFSET,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    zIndex: 6,
  },
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
  coordinatesFullscreen: {
    position: 'absolute',
    left: '7%',
    right: '7%',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    textAlign: 'center',
  },
});
