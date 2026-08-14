import { useCallback, useEffect, useMemo } from 'react';
import { Gesture, type GestureType } from 'react-native-gesture-handler';
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
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
  focalXSV: SharedValue<number>;
  focalYSV: SharedValue<number>;
  panActiveSV: SharedValue<number>;
  pinchActiveSV: SharedValue<number>;
  scaleSV: SharedValue<number>;
  translationXSV: SharedValue<number>;
  translationYSV: SharedValue<number>;
  viewportSV: SharedValue<MapViewport>;
}

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
 * finger). Pinch zoom snaps to integer levels so tile URLs stay valid and the
 * animated scale stays consistent with the committed zoom.
 */
function buildMapGestures({
  blocksScrollGesture,
  commitGesture,
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
}: BuildMapGesturesParams) {
  const resetTransform = () => {
    'worklet';
    translationXSV.value = 0;
    translationYSV.value = 0;
    scaleSV.value = 1;
    effectiveScaleSV.value = 1;
    focalXSV.value = 0;
    focalYSV.value = 0;
  };

  const commitIfIdle = () => {
    'worklet';
    if (
      translationXSV.value === 0 &&
      translationYSV.value === 0 &&
      scaleSV.value === 1
    ) {
      return;
    }
    runOnJS(commitGesture)(
      committedCenterSV.value.latitude,
      committedCenterSV.value.longitude,
      committedZoomSV.value,
      translationXSV.value,
      translationYSV.value,
      scaleSV.value,
      focalXSV.value,
      focalYSV.value,
      viewportSV.value.width,
      viewportSV.value.height,
    );
  };

  // A gesture may end (or be cancelled) before its sibling: only commit the
  // combined transform once the last active gesture finalizes, and only
  // reset the layer transform then too (a cancelled pan must not drop the
  // pinch's scale while the pinch is still running).
  const finalizePan = () => {
    'worklet';
    panActiveSV.value = 0;
    if (pinchActiveSV.value === 0) {
      commitIfIdle();
      resetTransform();
    }
  };

  const finalizePinch = () => {
    'worklet';
    pinchActiveSV.value = 0;
    if (panActiveSV.value === 0) {
      commitIfIdle();
      resetTransform();
    }
  };

  let panGesture = Gesture.Pan()
    .minPointers(1)
    .enabled(enabled)
    .onStart(() => {
      'worklet';
      resetTransform();
      panActiveSV.value = 1;
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
    })
    .onUpdate((event) => {
      'worklet';
      scaleSV.value = event.scale;
      focalXSV.value = event.focalX;
      focalYSV.value = event.focalY;
      const baseZoom = committedZoomSV.value;
      const nextZoom = Math.min(
        MAX_MANUAL_MAP_ZOOM,
        Math.max(MIN_MANUAL_MAP_ZOOM, Math.round(baseZoom * event.scale)),
      );
      effectiveScaleSV.value = Math.pow(2, nextZoom - baseZoom);
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
      const nextZoom = Math.min(
        MAX_MANUAL_MAP_ZOOM,
        Math.max(MIN_MANUAL_MAP_ZOOM, Math.round(startZoom * scale)),
      );
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
    [onCommit],
  );

  const { panGesture, pinchGesture } = useMemo(
    () =>
      buildMapGestures({
        blocksScrollGesture,
        commitGesture,
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
