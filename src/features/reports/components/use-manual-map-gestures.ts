import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { Gesture, type GestureType } from 'react-native-gesture-handler';
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import {
  MAX_MANUAL_MAP_ZOOM,
  MIN_MANUAL_MAP_ZOOM,
  moveMapCenter,
  zoomMapAtPoint,
  type MapCoordinate,
} from '@/features/reports/domain/manualMap';

export interface MapViewport {
  height: number;
  width: number;
}

interface UseManualMapGesturesParams {
  blocksScrollGesture?: GestureType;
  center: MapCoordinate;
  enabled: boolean;
  onCommit: (center: MapCoordinate, zoom: number) => void;
  /**
   * Called on the JS thread when a pan or pinch really starts (true) and when
   * the last of them ends (false), so a tap handler can ignore that touch.
   */
  onGestureActiveChange?: (active: boolean) => void;
  viewport: MapViewport;
  zoom: number;
}

interface BuildMapGesturesParams {
  blocksScrollGesture?: GestureType;
  commitGesture: (
    latitude: number,
    longitude: number,
    startZoom: number,
    translationX: number,
    translationY: number,
    scale: number,
    focalX: number,
    focalY: number,
    width: number,
    height: number,
  ) => void;
  committedCenterSV: SharedValue<MapCoordinate>;
  committedZoomSV: SharedValue<number>;
  effectiveScaleSV: SharedValue<number>;
  enabled: boolean;
  notifyGestureActive: (active: boolean) => void;
  focalXSV: SharedValue<number>;
  focalYSV: SharedValue<number>;
  panActiveSV: SharedValue<number>;
  pinchActiveSV: SharedValue<number>;
  scaleSV: SharedValue<number>;
  translationXSV: SharedValue<number>;
  translationYSV: SharedValue<number>;
  viewportSV: SharedValue<MapViewport>;
}

/** Whole tile zoom a pinch of `scale` lands on: each doubling is one level. */
export function pinchZoomLevel(startZoom: number, scale: number): number {
  'worklet';
  const level = Math.round(startZoom + Math.log2(Math.max(scale, 1e-6)));
  return Math.min(MAX_MANUAL_MAP_ZOOM, Math.max(MIN_MANUAL_MAP_ZOOM, level));
}

interface LayerTransformValues {
  effectiveScaleSV: SharedValue<number>;
  focalXSV: SharedValue<number>;
  focalYSV: SharedValue<number>;
  scaleSV: SharedValue<number>;
  translationXSV: SharedValue<number>;
  translationYSV: SharedValue<number>;
}

/** Puts the tile layer back to no transform; runs on either thread. */
function resetLayerTransform(values: LayerTransformValues) {
  'worklet';
  values.translationXSV.value = 0;
  values.translationYSV.value = 0;
  values.scaleSV.value = 1;
  values.effectiveScaleSV.value = 1;
  values.focalXSV.value = 0;
  values.focalYSV.value = 0;
}

// Short ease from the finger's free pinch scale to the whole tile level.
const PINCH_SETTLE_MS = 140;

/**
 * Builds the pan/pinch gestures. Module-level so the worklet bodies only
 * touch the shared values passed in as parameters (the react-hooks
 * immutability rule cannot model shared-value mutation inside a useMemo
 * factory, and gesture objects must stay stable across re-renders so a
 * mid-gesture re-render cannot drop an active handler).
 *
 * Gesture updates only touch shared values and a single `useAnimatedStyle`
 * transform, so dragging/pinching never round-trips to JS per frame. The
 * committed center/zoom in React state is only updated once when the gesture
 * finishes (runOnJS), which is exactly when the tile set needs to change.
 *
 * Transform composition: the tile layer is translated by the pan translation
 * and scaled by `2 ** (clampedZoom - startZoom)` about the pinch focal point
 * (RN applies transforms right-to-left, so the last entry applies first):
 *
 *   p -> (translationX, translationY) + focal + scale * (p - focal)
 *
 * The final center is the inverse of that same composition:
 *
 *   center' = moveMapCenter(zoomMapAtPoint(center, zoom, zoom', focal),
 *                           zoom', -translationX, -translationY)
 *
 * so the rendered result at commit exactly matches where the gesture left the
 * layer (zoomMapAtPoint keeps the world point under the focal fixed, and the
 * pan translation is undone on the center because the layer followed the
 * finger). The pinch follows the fingers freely, then eases to the nearest
 * whole zoom level (tile URLs need integer zooms) before committing, so the
 * committed view matches what is on screen.
 *
 * The layer keeps its transform after a commit until React has rendered the
 * new center (see `useManualMapGestures`), so a swipe never flashes back to
 * the old position for a frame before jumping.
 */
function buildMapGestures({
  blocksScrollGesture,
  commitGesture,
  committedCenterSV,
  committedZoomSV,
  effectiveScaleSV,
  enabled,
  notifyGestureActive,
  focalXSV,
  focalYSV,
  panActiveSV,
  pinchActiveSV,
  scaleSV,
  translationXSV,
  translationYSV,
  viewportSV,
}: BuildMapGesturesParams) {
  const resetTransform = () => {
    'worklet';
    resetLayerTransform({ effectiveScaleSV, focalXSV, focalYSV, scaleSV, translationXSV, translationYSV });
  };

  const commitWithScale = (scale: number) => {
    'worklet';
    runOnJS(commitGesture)(
      committedCenterSV.value.latitude,
      committedCenterSV.value.longitude,
      committedZoomSV.value,
      translationXSV.value,
      translationYSV.value,
      scale,
      focalXSV.value,
      focalYSV.value,
      viewportSV.value.width,
      viewportSV.value.height,
    );
  };

  // Called once the last active gesture ends: a tap resets at once; a real
  // gesture settles the pinch on a whole zoom level, then commits.
  const settle = () => {
    'worklet';
    runOnJS(notifyGestureActive)(false);
    if (
      translationXSV.value === 0 &&
      translationYSV.value === 0 &&
      scaleSV.value === 1
    ) {
      resetTransform();
      return;
    }
    const startZoom = committedZoomSV.value;
    const snappedScale = Math.pow(2, pinchZoomLevel(startZoom, scaleSV.value) - startZoom);
    if (effectiveScaleSV.value === snappedScale) {
      commitWithScale(snappedScale);
      return;
    }
    effectiveScaleSV.value = withTiming(
      snappedScale,
      { duration: PINCH_SETTLE_MS },
      (finished) => {
        'worklet';
        if (finished) commitWithScale(snappedScale);
        else resetTransform();
      },
    );
  };

  // A gesture may end (or be cancelled) before its sibling: only settle the
  // combined transform once the last active gesture finalizes (a cancelled
  // pan must not drop the pinch's scale while the pinch is still running).
  // onEnd and onFinalize both fire, so the active flag makes it run once.
  const finalizePan = () => {
    'worklet';
    if (panActiveSV.value === 0) return;
    panActiveSV.value = 0;
    if (pinchActiveSV.value === 0) settle();
  };

  const finalizePinch = () => {
    'worklet';
    if (pinchActiveSV.value === 0) return;
    pinchActiveSV.value = 0;
    if (panActiveSV.value === 0) settle();
  };

  let panGesture = Gesture.Pan()
    .minPointers(1)
    .enabled(enabled)
    .onStart(() => {
      'worklet';
      resetTransform();
      panActiveSV.value = 1;
      runOnJS(notifyGestureActive)(true);
    })
    .onUpdate((event) => {
      'worklet';
      translationXSV.value = event.translationX;
      translationYSV.value = event.translationY;
    })
    .onEnd(finalizePan)
    .onFinalize(finalizePan);
  // Let the map win over the surrounding ScrollView while dragging on it.
  if (blocksScrollGesture) {
    panGesture = panGesture.blocksExternalGesture(blocksScrollGesture);
  }
  const pinchGesture = Gesture.Pinch()
    .enabled(enabled)
    .onStart(() => {
      'worklet';
      scaleSV.value = 1;
      effectiveScaleSV.value = 1;
      pinchActiveSV.value = 1;
      runOnJS(notifyGestureActive)(true);
    })
    .onUpdate((event) => {
      'worklet';
      scaleSV.value = event.scale;
      focalXSV.value = event.focalX;
      focalYSV.value = event.focalY;
      // Follow the fingers continuously, held inside the zoom range.
      const baseZoom = committedZoomSV.value;
      effectiveScaleSV.value = Math.min(
        Math.pow(2, MAX_MANUAL_MAP_ZOOM - baseZoom),
        Math.max(Math.pow(2, MIN_MANUAL_MAP_ZOOM - baseZoom), event.scale),
      );
    })
    .onEnd(finalizePinch)
    .onFinalize(finalizePinch);

  return { panGesture, pinchGesture };
}

/**
 * UI-thread pan/pinch for the manual map. See `buildMapGestures` for the
 * transform math; this hook only owns the shared values, the animated layer
 * style, and the once-per-gesture commit.
 */
export function useManualMapGestures({
  blocksScrollGesture,
  center,
  enabled,
  onCommit,
  onGestureActiveChange,
  viewport,
  zoom,
}: UseManualMapGesturesParams) {
  // Mirrors of the committed (React state) map view, read on the UI thread.
  const committedCenterSV = useSharedValue(center);
  const committedZoomSV = useSharedValue(zoom);
  const viewportSV = useSharedValue(viewport);
  useEffect(() => {
    committedCenterSV.value = center;
  }, [center, committedCenterSV]);
  useEffect(() => {
    committedZoomSV.value = zoom;
  }, [zoom, committedZoomSV]);
  useEffect(() => {
    viewportSV.value = viewport;
  }, [viewport, viewportSV]);

  // Live gesture state driving the tile-layer transform.
  const translationXSV = useSharedValue(0);
  const translationYSV = useSharedValue(0);
  const scaleSV = useSharedValue(1);
  const effectiveScaleSV = useSharedValue(1);
  const focalXSV = useSharedValue(0);
  const focalYSV = useSharedValue(0);
  const panActiveSV = useSharedValue(0);
  const pinchActiveSV = useSharedValue(0);

  const layerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationXSV.value },
      { translateY: translationYSV.value },
      { translateX: focalXSV.value },
      { translateY: focalYSV.value },
      { scale: effectiveScaleSV.value },
      { translateX: 0 - focalXSV.value },
      { translateY: 0 - focalYSV.value },
    ],
  }));

  // Clears the layer transform from the JS thread.
  const clearTransform = useCallback(() => {
    resetLayerTransform({ effectiveScaleSV, focalXSV, focalYSV, scaleSV, translationXSV, translationYSV });
  }, [effectiveScaleSV, focalXSV, focalYSV, scaleSV, translationXSV, translationYSV]);

  // The committed view has rendered: the tiles now sit where the gesture left
  // them, so the gesture transform can go in the same frame. A view change
  // that arrives mid-gesture (a GPS fix recentring the map) leaves it alone.
  useLayoutEffect(() => {
    if (panActiveSV.value === 0 && pinchActiveSV.value === 0) clearTransform();
  }, [center, clearTransform, panActiveSV, pinchActiveSV, zoom]);

  // Runs once per finished gesture on the JS thread; the shared values are
  // snapshotted into plain numbers by the worklet that calls it.
  const commitGesture = useCallback(
    (
      latitude: number,
      longitude: number,
      startZoom: number,
      translationX: number,
      translationY: number,
      scale: number,
      focalX: number,
      focalY: number,
      width: number,
      height: number,
    ) => {
      const nextZoom = pinchZoomLevel(startZoom, scale);
      if (nextZoom === startZoom && translationX === 0 && translationY === 0) {
        // A pinch that settled back on its level: nothing to re-render, so
        // nothing else would clear the transform.
        clearTransform();
        return;
      }
      const zoomedCenter = zoomMapAtPoint(
        { latitude, longitude },
        startZoom,
        nextZoom,
        focalX,
        focalY,
        width,
        height,
      );
      onCommit(
        moveMapCenter(zoomedCenter, nextZoom, -translationX, -translationY),
        nextZoom,
      );
    },
    [clearTransform, onCommit],
  );

  const notifyGestureActive = useCallback(
    (active: boolean) => onGestureActiveChange?.(active),
    [onGestureActiveChange],
  );

  const { panGesture, pinchGesture } = useMemo(
    () =>
      buildMapGestures({
        blocksScrollGesture,
        commitGesture,
        notifyGestureActive,
        committedCenterSV,
        committedZoomSV,
        effectiveScaleSV,
        enabled,
        focalXSV,
        focalYSV,
        panActiveSV,
        pinchActiveSV,
        scaleSV,
        translationXSV,
        translationYSV,
        viewportSV,
      }),
    [
      blocksScrollGesture,
      commitGesture,
      committedCenterSV,
      committedZoomSV,
      effectiveScaleSV,
      enabled,
      notifyGestureActive,
      focalXSV,
      focalYSV,
      panActiveSV,
      pinchActiveSV,
      scaleSV,
      translationXSV,
      translationYSV,
      viewportSV,
    ],
  );

  const gesture = useMemo(
    () => Gesture.Simultaneous(panGesture, pinchGesture),
    [panGesture, pinchGesture],
  );

  return { gesture, layerStyle, panGesture, pinchGesture };
}
