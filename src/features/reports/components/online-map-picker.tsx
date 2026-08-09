import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useMemo, useState } from 'react';
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
  type MapCoordinate,
} from '@/features/reports/domain/manualMap';
import { useTheme } from '@/hooks/use-theme';

const MAP_HEIGHT = 360;
const PAN_DISTANCE = 120;

export function OnlineMapPicker({
  initialCenter,
  isOnline,
  onSelectionChange,
}: {
  initialCenter: MapCoordinate;
  isOnline: boolean | null;
  onSelectionChange: (coordinate: MapCoordinate | null) => void;
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
    tileSetKey: string;
  }>({ failed: [], loaded: [], tileSetKey: '' });
  const tiles = useMemo(
    () => getMapTiles(center, zoom, viewport.width, viewport.height),
    [center, viewport.height, viewport.width, zoom],
  );
  const tileSetKey = tiles.map(({ key }) => key).join('|');

  const activeLoadState =
    tileLoadState.tileSetKey === tileSetKey
      ? tileLoadState
      : { failed: [], loaded: [], tileSetKey };
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

  return (
    <View style={styles.wrapper}>
      <Pressable
        testID="manual-map.viewport"
        accessibilityRole="imagebutton"
        accessibilityLabel="Online map. Tap to place the report location pin."
        disabled={isOnline !== true || !mapLoaded}
        onLayout={onLayout}
        onPress={onMapPress}
        style={[
          styles.map,
          { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
        ]}>
        {isOnline === true
          ? tiles.map((tile) => (
              <ExpoImage
                key={tile.key}
                testID="manual-map.tile"
                source={{
                  headers: { 'User-Agent': 'CaneGuard-Mobile/1.0' },
                  uri: tile.url,
                }}
                cachePolicy="disk"
                contentFit="fill"
                onLoad={() =>
                  setTileLoadState((current) => {
                    const next =
                      current.tileSetKey === tileSetKey
                        ? current
                        : { failed: [], loaded: [], tileSetKey };
                    return next.loaded.includes(tile.key)
                      ? next
                      : { ...next, loaded: [...next.loaded, tile.key] };
                  })
                }
                onError={() =>
                  setTileLoadState((current) => {
                    const next =
                      current.tileSetKey === tileSetKey
                        ? current
                        : { failed: [], loaded: [], tileSetKey };
                    return next.failed.includes(tile.key)
                      ? next
                      : { ...next, failed: [...next.failed, tile.key] };
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

      <View style={styles.controls}>
        <MapControl label="Pan west" icon="arrow-left" onPress={() => pan(-PAN_DISTANCE, 0)} disabled={!mapLoaded} />
        <MapControl label="Pan north" icon="arrow-up" onPress={() => pan(0, -PAN_DISTANCE)} disabled={!mapLoaded} />
        <MapControl label="Pan south" icon="arrow-down" onPress={() => pan(0, PAN_DISTANCE)} disabled={!mapLoaded} />
        <MapControl label="Pan east" icon="arrow-right" onPress={() => pan(PAN_DISTANCE, 0)} disabled={!mapLoaded} />
        <MapControl
          label="Zoom out"
          icon="minus"
          onPress={() => setZoom((current) => Math.max(MIN_MANUAL_MAP_ZOOM, current - 1))}
          disabled={!mapLoaded || zoom === MIN_MANUAL_MAP_ZOOM}
        />
        <MapControl
          label="Zoom in"
          icon="plus"
          onPress={() => setZoom((current) => Math.min(MAX_MANUAL_MAP_ZOOM, current + 1))}
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
  map: {
    width: '100%',
    height: MAP_HEIGHT,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
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
