import { canAuthorInspectorWork } from '@/features/auth/capabilities';
import { randomUUID } from 'expo-crypto';
import { Image as ExpoImage } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, AppState, type GestureResponderEvent, type HostInstance, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import Svg, { Circle, Line, Polygon, Polyline } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionDock, dockSecondaryButtonStyle } from '@/components/ui/ActionDock';
import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { EMPTY_DATABASE, useDatabaseState } from '@/database/DatabaseProvider';
import { useSync } from '@/features/sync/hooks/useSync';
import { useToast } from '@/components/ui/Toast';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { FIELD_SURVEY_COPY } from '@/constants/copy';
import { expoForegroundLocationClient } from '@/features/reports/services/expoForegroundLocationClient';
import { PREFERRED_GPS_ACCURACY_METERS } from '@/features/reports/services/captureGpsLocation';
import {
  DEFAULT_MANUAL_MAP_CENTER,
  MAP_TILE_SIZE,
  coordinateAtViewportPoint,
  coordinateToViewportPoint,
  fitMapToCoordinates,
  getConfiguredMapTileUrlTemplate,
  getMapTiles,
  type MapCoordinate,
} from '@/features/reports/domain/manualMap';
import { findOwnedFieldSurvey, listOwnedFieldSurveys, saveFieldSurveyDraft, markFieldSurveyPending } from '@/features/surveys/data/fieldSurveyRepository';
import { viewportPointFromPressEvent } from '@/features/reports/components/online-map-picker';
import { useManualMapGestures } from '@/features/reports/components/use-manual-map-gestures';
import { measureAffectedAreas, snapAffectedAreaWaypoints, validateSurveyPolygon, validateSurveyWaypoints, type SurveyPolygon, type SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';
import { LOADING_SCREEN, NEW_BOUNDARY_SCREEN, screenCanEdit, screenCanSubmit, screenIsStoredOrMissing, screenNeedsFreshIdentity, screenStateForRow, statusStripFor, type ScreenState } from '@/features/surveys/domain/screenMode';
import { FIELD_SURVEY_SYNC_COPY, SYNC_TONE_COLOR } from '@/features/sync/utils/syncStatusCopy';
import { assessBoundaryQuality } from '@/features/surveys/domain/boundaryQuality';
import {
  assessValidity,
  boundaryBadge,
  drawingToolState,
  dropLastPoint,
  edgeCount,
  insertPointOnEdge,
  movePoint,
  pointOf,
  pointQuality,
  pushUndo,
  removeAffectedAreaAt,
  removePoint,
  replacePoint,
  sameRef,
  type DrawingShape,
  type EditResult,
  type PointQuality,
  type PointRef,
} from '@/features/surveys/domain/drawingTool';
import { captureSurveyWaypoint } from '@/features/surveys/services/captureSurveyWaypoint';
import { decideWalkFix, type WalkFix } from '@/features/surveys/domain/walkMode';
import { expoWalkLocationClient } from '@/features/surveys/services/expoWalkLocationClient';
import { startWalk } from '@/features/surveys/services/walkSurveyBoundary';

const SURVEY_ZOOM = 17;
const SURVEY_MAP_OVERSCAN = MAP_TILE_SIZE;
const INITIAL_VIEWPORT = { width: 360, height: 380 };
const HANDLE_SIZE = 44;
const TAP_HIT_RADIUS = 20;
const EMPTY_SHAPE: DrawingShape = { waypoints: [], affectedAreas: [], affectedAreaWaypointSets: [], affectedWaypoints: [] };

// A GPS reading either appends a point to the active tool or replaces one named point (by identity).
interface WaypointCaptureTarget {
  affectedArea: boolean;
  areaCount: number;
  replace: SurveyWaypoint | null;
}

function findPointRef(shape: DrawingShape, point: SurveyWaypoint): PointRef | null {
  const plotIndex = shape.waypoints.indexOf(point);
  if (plotIndex >= 0) return { set: 'plot', index: plotIndex };
  const activeIndex = shape.affectedWaypoints.indexOf(point);
  if (activeIndex >= 0) return { set: 'active', index: activeIndex };
  for (let area = 0; area < shape.affectedAreaWaypointSets.length; area += 1) {
    const index = shape.affectedAreaWaypointSets[area].indexOf(point);
    if (index >= 0) return { set: 'area', area, index };
  }
  return null;
}

function qualityColor(quality: PointQuality, theme: ReturnType<typeof useTheme>): { fill: string; stroke: string } {
  if (quality === 'map') return { fill: 'white', stroke: theme.primary };
  if (quality === 'good') return { fill: theme.success, stroke: 'white' };
  if (quality === 'acceptable') return { fill: theme.warning, stroke: 'white' };
  if (quality === 'weak') return { fill: 'white', stroke: theme.danger };
  return { fill: theme.textSecondary, stroke: 'white' };
}

interface PointHandleProps {
  accessibilityLabel: string;
  left: number;
  top: number;
  selected: boolean;
  testID: string;
  onSelect: () => void;
  onDragBegin: () => void;
  onDragMove: (translationX: number, translationY: number) => void;
  onDragEnd: () => void;
}

// An invisible 44pt touch target over a drawn point: tap selects it, drag moves it.
function PointHandle(props: PointHandleProps) {
  const latest = useRef(props);
  useEffect(() => { latest.current = props; });
  // The gesture is built once so a re-render mid-drag cannot drop it; callbacks read the latest props at call time.
  /* eslint-disable react-hooks/refs */
  const gesture = useMemo(() => Gesture.Pan()
    .withTestId(`${props.testID}.drag`)
    .runOnJS(true)
    .minDistance(4)
    .onBegin(() => latest.current.onDragBegin())
    .onUpdate((event) => latest.current.onDragMove(event.translationX, event.translationY))
    .onFinalize(() => latest.current.onDragEnd()), [props.testID]);
  /* eslint-enable react-hooks/refs */
  return (
    <GestureDetector gesture={gesture}>
      <Pressable
        testID={props.testID}
        accessibilityRole="button"
        accessibilityLabel={props.accessibilityLabel}
        accessibilityState={{ selected: props.selected }}
        onPress={props.onSelect}
        style={{ position: 'absolute', left: props.left, top: props.top, width: HANDLE_SIZE, height: HANDLE_SIZE }}
      />
    </GestureDetector>
  );
}

type SaveState = 'saved' | 'unsaved' | 'saving' | 'failed';

function parseFieldErrors(json: string | null | undefined): Record<string, string[]> {
  if (!json) return {};
  try {
    return JSON.parse(json) as Record<string, string[]>;
  } catch {
    return {};
  }
}

type WalkSession = {
  affectedArea: boolean;
  areaCount: number;
  surveyId: string;
  added: number;
  last: MapCoordinate | null;
  stop: () => void;
};

// Drop null or non-finite vertices so a damaged draft recovers its valid points.
function finiteWaypoints(value: unknown): SurveyWaypoint[] {
  if (!Array.isArray(value)) return [];
  return value.filter((point): point is SurveyWaypoint => Boolean(point)
    && Number.isFinite((point as SurveyWaypoint).latitude)
    && Number.isFinite((point as SurveyWaypoint).longitude));
}

function captureFailureMessage(status: 'permission_denied' | 'services_disabled' | 'unavailable'): string {
  if (status === 'permission_denied') return FIELD_SURVEY_COPY.gpsPermissionDenied;
  if (status === 'services_disabled') return FIELD_SURVEY_COPY.gpsDisabled;
  return FIELD_SURVEY_COPY.gpsUnavailable;
}

function captureSuccessMessage(accuracyMeters: number | null): string | null {
  if (accuracyMeters === null) return FIELD_SURVEY_COPY.gpsAccuracyUnknown;
  return accuracyMeters > PREFERRED_GPS_ACCURACY_METERS ? FIELD_SURVEY_COPY.gpsAccuracyWeak(accuracyMeters) : null;
}

export default function FieldSurveyScreen() {
  const theme = useTheme();
  const { showToast } = useToast();
  const { database, ready } = useDatabaseState();
  const { session } = useAuth();
  const canAuthorSurvey = canAuthorInspectorWork(session?.user);
  const requestedSurveyId = useLocalSearchParams<{ surveyId?: string | string[] }>().surveyId;
  const surveyId = Array.isArray(requestedSurveyId) ? requestedSurveyId[0] : requestedSurveyId;
  const { isOnline, syncNow } = useSync();
  const [clientUuid, setClientUuid] = useState(() => randomUUID());
  const [districtCode, setDistrictCode] = useState('');
  const [shape, setShapeState] = useState<DrawingShape>(EMPTY_SHAPE);
  const shapeRef = useRef<DrawingShape>(EMPTY_SHAPE);
  const [history, setHistory] = useState<DrawingShape[]>([]);
  const { waypoints, affectedAreas, affectedAreaWaypointSets, affectedWaypoints } = shape;
  const [drawingAffectedArea, setDrawingAffectedArea] = useState(false);
  const [selected, setSelected] = useState<PointRef | null>(null);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [myLocation, setMyLocation] = useState<MapCoordinate | null>(null);
  const [locating, setLocating] = useState(false);
  const layoutRef = useRef<{ width: number; height: number } | null>(null);
  const fitRequested = useRef(false);
  const dragRef = useRef<{ ref: PointRef; grabbed: MapCoordinate; undoBase: DrawingShape; changed: boolean; refused: boolean } | null>(null);
  const [center, setCenter] = useState<MapCoordinate>(DEFAULT_MANUAL_MAP_CENTER);
  const [zoom, setZoom] = useState(SURVEY_ZOOM);
  const [viewport, setViewport] = useState(INITIAL_VIEWPORT);
  const scrollNativeGesture = useMemo(() => Gesture.Native(), []);
  const handleMapGestureCommit = useCallback((nextCenter: MapCoordinate, nextZoom: number) => {
    setCenter(nextCenter);
    setZoom(nextZoom);
  }, []);
  const { gesture: mapGesture, layerStyle } = useManualMapGestures({
    blocksScrollGesture: scrollNativeGesture,
    center,
    enabled: true,
    onCommit: handleMapGestureCommit,
    viewport,
    zoom,
  });
  const [pointsOpen, setPointsOpen] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [walking, setWalking] = useState(false);
  const walkRef = useRef<WalkSession | null>(null);
  const walkFixHandlerRef = useRef<(fix: WalkFix) => void>(() => undefined);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saveState, setSaveState] = useState<SaveState>('unsaved');
  const [saveAttempt, setSaveAttempt] = useState(0);
  const [tileFailures, setTileFailures] = useState<string[]>([]);
  // One value says what the screen is; the strip, the locks and the buttons all read it.
  const [screenState, setScreenState] = useState<ScreenState>(LOADING_SCREEN);
  const { mode } = screenState;
  const controlsLocked = !screenCanEdit(mode);
  const saving = mode === 'sending';
  const mapRef = useRef<HostInstance>(null);
  const liveFormRef = useRef({ controlsLocked, drawingAffectedArea, editable: !controlsLocked });
  useEffect(() => {
    liveFormRef.current = { controlsLocked, drawingAffectedArea, editable: !controlsLocked };
  }, [controlsLocked, drawingAffectedArea]);

  // Opens the map on the drawn shape (resumed boundary, or one opened from a report).
  const fitMapToShape = useCallback((target: DrawingShape, size: { width: number; height: number }) => {
    const everyPoint = [...target.waypoints, ...target.affectedWaypoints, ...target.affectedAreaWaypointSets.flat()];
    const fit = fitMapToCoordinates(everyPoint, size.width, size.height, { maxZoom: SURVEY_ZOOM + 1 });
    if (!fit) return;
    setCenter(fit.center);
    setZoom(fit.zoom);
  }, []);

  // Every write to the drawing goes through here so the ref the async GPS path reads is never stale.
  const setShape = useCallback((next: DrawingShape) => {
    shapeRef.current = next;
    setShapeState(next);
  }, []);
  // A user edit: remember the shape it replaced so Undo can step back through any kind of edit.
  const commitShape = useCallback((next: DrawingShape) => {
    const before = shapeRef.current;
    if (next === before) return;
    const drag = dragRef.current;
    const dragUndoBase = drag?.changed ? drag.undoBase : null;
    setHistory((current) => pushUndo(dragUndoBase ? pushUndo(current, dragUndoBase) : current, before));
    if (drag) {
      drag.undoBase = next;
      drag.changed = false;
    }
    setSaveState('unsaved');
    setShape(next);
  }, [setShape]);
  const stopWalk = useCallback((message?: string | null) => {
    const walk = walkRef.current;
    if (!walk) return;
    walkRef.current = null;
    walk.stop();
    setWalking(false);
    if (message !== null) setSyncMessage(message ?? FIELD_SURVEY_COPY.walkStopped(walk.added));
  }, []);
  // Walking ends when the screen locks, its boundary target or survey changes, an affected area is removed, the app leaves the foreground, or the screen closes.
  useLayoutEffect(() => {
    const walk = walkRef.current;
    if (!walk) return;
    if (controlsLocked || drawingAffectedArea !== walk.affectedArea || clientUuid !== walk.surveyId || affectedAreas.length !== walk.areaCount) stopWalk();
  }, [affectedAreas.length, clientUuid, controlsLocked, drawingAffectedArea, stopWalk, walking]);
  useLayoutEffect(() => {
    if (!walking) return;
    const subscription = AppState.addEventListener('change', (state) => { if (state !== 'active') stopWalk(); });
    return () => subscription.remove();
  }, [stopWalk, walking]);
  useEffect(() => () => stopWalk(null), [stopWalk]);
  const validation = useMemo(() => validateSurveyWaypoints(waypoints), [waypoints]);
  const validityMarks = useMemo(() => assessValidity(waypoints, affectedAreas), [waypoints, affectedAreas]);
  const affectedMeasurement = useMemo(() => validation.valid
    ? measureAffectedAreas(validation.polygon, affectedAreas)
    : null, [affectedAreas, validation]);
  // The affected-area rejection shown after a refused submit is stale once the areas are repaired.
  const submitRejectionRef = useRef<string | null>(null);
  useEffect(() => {
    const rejection = submitRejectionRef.current;
    if (!rejection || !affectedMeasurement?.valid) return;
    submitRejectionRef.current = null;
    setSyncMessage((current) => (current === rejection ? null : current));
  }, [affectedMeasurement]);
  const tileTemplate = getConfiguredMapTileUrlTemplate();
  const tiles = useMemo(() => getMapTiles(
    center,
    zoom,
    viewport.width + SURVEY_MAP_OVERSCAN * 2,
    viewport.height + SURVEY_MAP_OVERSCAN * 2,
    tileTemplate,
  ), [center, tileTemplate, viewport.height, viewport.width, zoom]);

  useEffect(() => {
    if (!ready || !database || !session?.user.uuid) return;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      // A report link opens that exact boundary; otherwise resume the open draft.
      const requested = surveyId
        ? findOwnedFieldSurvey(database, surveyId, session.user.uuid)
        : null;
      const previous = requested
        ?? (surveyId
          ? null
          : (listOwnedFieldSurveys(database, session.user.uuid).find((row) => row.status !== 'synced') ?? null));
      if (previous) {
        setClientUuid(previous.clientUuid);
        setDistrictCode(previous.districtCode === 'UNSPECIFIED' ? '' : previous.districtCode);
        try {
          const restoredPlot = finiteWaypoints(JSON.parse(previous.waypointsJson));
          const restoredAreas = JSON.parse(previous.affectedAreaPolygonsJson ?? '[]') as SurveyPolygon[];
          let restoredWaypoints: SurveyWaypoint[][] = [];
          try {
            restoredWaypoints = (JSON.parse(previous.affectedAreaWaypointsJson ?? '[]') as unknown[]).map(finiteWaypoints);
          } catch {
            restoredWaypoints = [];
          }
          let restoredActive: SurveyWaypoint[] = [];
          try {
            const parsedActive = JSON.parse(previous.activeAffectedWaypointsJson ?? '[]') as SurveyWaypoint[];
            if (Array.isArray(parsedActive)) restoredActive = finiteWaypoints(parsedActive);
          } catch {
            restoredActive = [];
          }
          const restored = { waypoints: restoredPlot, affectedAreas: restoredAreas, affectedAreaWaypointSets: restoredWaypoints, affectedWaypoints: restoredActive };
          setShape(restored);
          if (restoredActive.length > 0) setDrawingAffectedArea(true);
          // A resumed boundary opens with its shape on screen, not at the default map position.
          if (layoutRef.current) fitMapToShape(restored, layoutRef.current);
          else fitRequested.current = true;
        } catch {
          setShape(EMPTY_SHAPE);
        }
        setFieldErrors(parseFieldErrors(previous.fieldErrorsJson));
        setSaveState('saved');
        setScreenState(screenStateForRow(previous));
      } else {
        setScreenState(surveyId ? { mode: 'waiting_to_start', boundary: null } : NEW_BOUNDARY_SCREEN);
      }
    }).catch(() => {
      if (!cancelled) {
        setSyncMessage(FIELD_SURVEY_COPY.saveFailed);
        setScreenState(NEW_BOUNDARY_SCREEN);
      }
    });
    return () => { cancelled = true; };
  }, [database, fitMapToShape, ready, session?.user.uuid, setShape, surveyId]);

  // Autosave: an edit makes it unsaved, the write makes it saving, then saved or failed. Only an editable screen writes.
  const loaded = mode !== 'loading';
  useEffect(() => {
    if (!canAuthorSurvey || !loaded || !ready || !database || !session?.user.uuid || !liveFormRef.current.editable) return;
    let cancelled = false;
    setSaveState('saving');
    void saveFieldSurveyDraft(database, {
      clientUuid,
      ownerIdentity: session.user.uuid,
      authorRole: session.user.role,
      districtCode: districtCode.trim() || 'UNSPECIFIED',
      waypoints,
      affectedAreaPolygons: affectedAreas,
      affectedAreaWaypoints: affectedAreaWaypointSets,
      activeAffectedWaypoints: affectedWaypoints,
      capturedAt: new Date().toISOString(),
    }).then(() => {
      if (!cancelled) setSaveState('saved');
    }).catch(() => {
      if (!cancelled) setSaveState('failed');
    });
    return () => { cancelled = true; };
  }, [affectedAreas, affectedAreaWaypointSets, affectedWaypoints, canAuthorSurvey, clientUuid, database, districtCode, loaded, ready, saveAttempt, session?.user.role, session?.user.uuid, waypoints]);

  function captureTargetForNewPoint(): WaypointCaptureTarget {
    const replace = selected ? pointOf(shapeRef.current, selected) : null;
    return { affectedArea: drawingAffectedArea, areaCount: shapeRef.current.affectedAreas.length, replace };
  }

  function captureTargetStillApplies(target: WaypointCaptureTarget): boolean {
    const live = liveFormRef.current;
    if (live.controlsLocked) return false;
    const current = shapeRef.current;
    if (live.drawingAffectedArea === target.affectedArea
      && (target.replace
        ? findPointRef(current, target.replace) !== null
        : !target.affectedArea || current.affectedAreas.length === target.areaCount)) {
      return true;
    }
    setSyncMessage(FIELD_SURVEY_COPY.gpsCaptureCancelled);
    return false;
  }

  function applyCapturedWaypoint(target: WaypointCaptureTarget, waypoint: SurveyWaypoint): EditResult {
    const current = shapeRef.current;
    if (target.replace) {
      const ref = findPointRef(current, target.replace);
      if (!ref) return { ok: false, message: '' };
      const result = replacePoint(current, ref, waypoint);
      if (!result.ok) {
        setSyncMessage(result.message || FIELD_SURVEY_COPY.moveRefused);
        return result;
      }
      commitShape(result.shape);
      return result;
    }
    if (target.affectedArea) {
      const plot = validateSurveyWaypoints(current.waypoints);
      const snapped = plot.valid ? snapAffectedAreaWaypoints(plot.polygon, [waypoint])[0] : waypoint;
      const next = { ...current, affectedWaypoints: [...current.affectedWaypoints, snapped] };
      commitShape(next);
      return { ok: true, shape: next };
    }
    const next = { ...current, waypoints: [...current.waypoints, waypoint] };
    commitShape(next);
    return { ok: true, shape: next };
  }

  function addOrMovePoint(latitude: number, longitude: number, source: 'map' | 'gps', accuracyMeters: number | null, capturedAt = new Date().toISOString()) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    if (controlsLocked) return;
    const applied = applyCapturedWaypoint(captureTargetForNewPoint(), { latitude, longitude, source, accuracyMeters, capturedAt });
    if (!applied.ok) return;
    setSelected(null);
    setFieldErrors({});
  }

  // A tap that lands on an existing point of the active tool selects it; a tap elsewhere adds or moves.
  function pointRefNear(point: { x: number; y: number }): PointRef | null {
    const candidates: { ref: PointRef; at: SurveyWaypoint }[] = drawingAffectedArea
      ? affectedWaypoints.map((at, index) => ({ ref: { set: 'active', index } as PointRef, at }))
      : waypoints.map((at, index) => ({ ref: { set: 'plot', index } as PointRef, at }));
    let best: { ref: PointRef; distance: number } | null = null;
    for (const { ref, at } of candidates) {
      const projected = coordinateToViewportPoint(center, at, zoom, viewport.width, viewport.height);
      const distance = Math.hypot(projected.x - point.x, projected.y - point.y);
      if (distance <= TAP_HIT_RADIUS && (!best || distance < best.distance)) best = { ref, distance };
    }
    return best?.ref ?? null;
  }

  function addMapPointAt(point: { x: number; y: number }) {
    if (controlsLocked) return;
    const near = pointRefNear(point);
    if (near) {
      setSelected(sameRef(near, selected) ? null : near);
      return;
    }
    const coordinate = coordinateAtViewportPoint(center, zoom, viewport.width, viewport.height, point.x, point.y);
    if (selected) {
      const result = movePoint(shapeRef.current, selected, coordinate);
      if (result.ok) {
        commitShape(result.shape);
        setSelected(null);
        setFieldErrors({});
      } else {
        setSyncMessage(result.message || FIELD_SURVEY_COPY.moveRefused);
      }
      return;
    }
    addOrMovePoint(coordinate.latitude, coordinate.longitude, 'map', null);
  }

  function handleMapPress(event: GestureResponderEvent) {
    // Web press events carry no locationX/locationY; resolve the tap the same
    // way the online map picker does instead of writing NaN vertices.
    const native = event.nativeEvent as GestureResponderEvent['nativeEvent'] & { clientX?: number; clientY?: number; offsetX?: number; offsetY?: number };
    const { clientX, clientY, locationX, locationY, offsetX, offsetY, pageX, pageY } = native;
    if (Number.isFinite(locationX) && Number.isFinite(locationY)) {
      addMapPointAt({ x: locationX, y: locationY });
      return;
    }
    const fallback = () => {
      if (typeof offsetX === 'number' && typeof offsetY === 'number') addMapPointAt({ x: offsetX, y: offsetY });
    };
    const node = mapRef.current;
    if (process.env.NODE_ENV !== 'test' && node && typeof node.measureInWindow === 'function') {
      node.measureInWindow((x, y) => {
        // On web measureInWindow is viewport-relative, so pair it with clientX/Y (pageX/Y include page scroll).
        const point = viewportPointFromPressEvent({
          ...event,
          nativeEvent: { ...native, pageX: clientX ?? pageX, pageY: clientY ?? pageY },
        }, { x, y });
        if (Number.isFinite(point.x) && Number.isFinite(point.y)) addMapPointAt(point);
        else fallback();
      });
      return;
    }
    fallback();
  }

  function beginDrag(ref: PointRef) {
    if (controlsLocked) return;
    const point = pointOf(shapeRef.current, ref);
    if (!point) return;
    dragRef.current = { ref, grabbed: point, undoBase: shapeRef.current, changed: false, refused: false };
  }

  function dragTo(translationX: number, translationY: number) {
    const drag = dragRef.current;
    if (!drag) return;
    const live = shapeRef.current;
    const anchor = coordinateToViewportPoint(center, drag.grabbed, zoom, viewport.width, viewport.height);
    const coordinate = coordinateAtViewportPoint(center, zoom, viewport.width, viewport.height, anchor.x + translationX, anchor.y + translationY);
    const result = movePoint(live, drag.ref, coordinate);
    drag.refused = !result.ok;
    if (!result.ok) return;
    if (!drag.changed) drag.undoBase = live;
    drag.changed = true;
    setShape(result.shape);
  }

  function endDrag() {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    if (!drag.changed) {
      if (drag.refused) setSyncMessage(FIELD_SURVEY_COPY.moveRefused);
      return;
    }
    const undoBase = drag.undoBase;
    setHistory((current) => pushUndo(current, undoBase));
    setSaveState('unsaved');
    setSelected(drag.ref);
    setFieldErrors({});
    if (drag.refused) setSyncMessage(FIELD_SURVEY_COPY.moveRefused);
  }

  function insertAfter(ref: PointRef, edge: number) {
    if (controlsLocked) return;
    const result = insertPointOnEdge(shape, ref, edge);
    if (!result.ok) {
      if (result.message) setSyncMessage(result.message);
      return;
    }
    commitShape(result.shape);
    setSelected(ref.set === 'area' ? { set: 'area', area: ref.area, index: edge + 1 } : { set: ref.set, index: edge + 1 });
  }

  function undoLast() {
    if (controlsLocked) return;
    setSaveState('unsaved');
    setSelected(null);
    const previous = history.at(-1);
    if (previous) {
      setHistory((current) => current.slice(0, -1));
      setShape(previous);
      return;
    }
    // A restored draft has no history yet: step back one point of the active tool.
    setShape(dropLastPoint(shapeRef.current, drawingAffectedArea));
  }

  function removeAreaAt(area: number) {
    if (controlsLocked) return;
    stopWalk();
    commitShape(removeAffectedAreaAt(shapeRef.current, area));
    setSelected(null);
    setSelectedArea(null);
  }

  async function captureGpsWaypoint() {
    if (controlsLocked) return;
    const target = captureTargetForNewPoint();
    setGpsBusy(true);
    try {
      const result = await captureSurveyWaypoint(expoForegroundLocationClient);
      if (result.status !== 'captured') {
        setSyncMessage(captureFailureMessage(result.status));
        return;
      }
      if (!captureTargetStillApplies(target)) return;
      const applied = applyCapturedWaypoint(target, result.waypoint);
      if (!applied.ok) return;
      setSelected(null);
      if (!target.affectedArea) setFieldErrors({});
      setCenter({ latitude: result.waypoint.latitude, longitude: result.waypoint.longitude });
      setSyncMessage(captureSuccessMessage(result.waypoint.accuracyMeters));
    } catch {
      setSyncMessage(FIELD_SURVEY_COPY.gpsUnavailable);
    } finally {
      setGpsBusy(false);
    }
  }

  // Moves the map to the phone's position without adding a point.
  async function goToMyLocation() {
    if (locating) return;
    setLocating(true);
    try {
      const result = await captureSurveyWaypoint(expoForegroundLocationClient);
      if (result.status !== 'captured') {
        setSyncMessage(captureFailureMessage(result.status));
        return;
      }
      const here = { latitude: result.waypoint.latitude, longitude: result.waypoint.longitude };
      setMyLocation(here);
      setCenter(here);
    } catch {
      setSyncMessage(FIELD_SURVEY_COPY.gpsUnavailable);
    } finally {
      setLocating(false);
    }
  }

  function handleWalkFix(fix: WalkFix) {
    const walk = walkRef.current;
    if (!walk) return;
    const live = shapeRef.current;
    if (walk.surveyId !== clientUuid || walk.affectedArea !== liveFormRef.current.drawingAffectedArea || walk.areaCount !== live.affectedAreas.length) {
      stopWalk();
      return;
    }
    // Spacing is measured from the walked boundary's current last point, so undo, drag and removal never leave a stale anchor.
    walk.last = (walk.affectedArea ? live.affectedWaypoints : live.waypoints).at(-1) ?? null;
    const decision = decideWalkFix(fix, walk.last);
    if (decision.action !== 'accept') return;
    walk.last = decision.waypoint;
    walk.added += 1;
    applyCapturedWaypoint(walk.affectedArea ? { affectedArea: true, areaCount: walk.areaCount, replace: null } : { affectedArea: false, areaCount: walk.areaCount, replace: null }, decision.waypoint);
    if (!walk.affectedArea) setFieldErrors({});
    setCenter({ latitude: decision.waypoint.latitude, longitude: decision.waypoint.longitude });
  }
  useEffect(() => { walkFixHandlerRef.current = handleWalkFix; });

  async function toggleWalk() {
    if (walkRef.current) {
      stopWalk();
      return;
    }
    if (controlsLocked || gpsBusy) return;
    const affectedArea = drawingAffectedArea;
    const session: WalkSession = {
      affectedArea,
      areaCount: shapeRef.current.affectedAreas.length,
      surveyId: clientUuid,
      added: 0,
      last: (affectedArea ? shapeRef.current.affectedWaypoints : shapeRef.current.waypoints).at(-1) ?? null,
      stop: () => undefined,
    };
    walkRef.current = session;
    setSelected(null);
    setWalking(true);
    setGpsBusy(true);
    try {
      const result = await startWalk(
        expoWalkLocationClient,
        (fix) => walkFixHandlerRef.current(fix),
        () => stopWalk(FIELD_SURVEY_COPY.walkLost),
      );
      if (walkRef.current !== session) {
        if (result.status === 'started') result.stop();
        return;
      }
      if (result.status !== 'started') {
        stopWalk(null);
        setSyncMessage(captureFailureMessage(result.status));
        return;
      }
      session.stop = result.stop;
      setSyncMessage(FIELD_SURVEY_COPY.walkActive);
    } finally {
      setGpsBusy(false);
    }
  }

  async function recaptureWorstPoint(point: SurveyWaypoint) {
    if (controlsLocked) return;
    const target: WaypointCaptureTarget = { affectedArea: false, areaCount: shapeRef.current.affectedAreas.length, replace: point };
    setGpsBusy(true);
    try {
      const result = await captureSurveyWaypoint(expoForegroundLocationClient);
      if (result.status !== 'captured') {
        setSyncMessage(captureFailureMessage(result.status));
        return;
      }
      if (!captureTargetStillApplies(target)) return;
      // Replaces only the named point; every other point keeps its measurement.
      const applied = applyCapturedWaypoint(target, result.waypoint);
      if (!applied.ok) return;
      setSyncMessage(captureSuccessMessage(result.waypoint.accuracyMeters));
    } catch {
      setSyncMessage(FIELD_SURVEY_COPY.gpsUnavailable);
    } finally {
      setGpsBusy(false);
    }
  }

  async function saveAndSync() {
    if (!canAuthorSurvey || !session?.token || !session.user.uuid || !ready || !database || database === EMPTY_DATABASE) {
      setSyncMessage(FIELD_SURVEY_SYNC_COPY.signInRequired);
      return;
    }
    if (!validation.valid) {
      setSyncMessage(validation.error.message);
      return;
    }
    if (!districtCode.trim()) {
      setFieldErrors({ district_code: [FIELD_SURVEY_COPY.districtRequired] });
      return;
    }
    if (affectedWaypoints.length > 0) {
      setSyncMessage(FIELD_SURVEY_COPY.unfinishedAffectedArea);
      return;
    }
    stopWalk();
    if (!affectedMeasurement?.valid) {
      const rejection = affectedMeasurement?.error.message ?? FIELD_SURVEY_COPY.affectedOutsidePlot;
      submitRejectionRef.current = rejection;
      setSyncMessage(rejection);
      return;
    }
    try {
      markFieldSurveyPending(database, clientUuid, session.user.uuid, validation.polygon, validation.areaSqm, waypoints.at(-1)?.capturedAt ?? new Date().toISOString(), affectedAreas, affectedMeasurement.areaSqm, affectedAreaWaypointSets);
    } catch (error: unknown) {
      setSyncMessage(error instanceof Error ? error.message : FIELD_SURVEY_COPY.saveFailed);
      return;
    }
    setSyncMessage(null);
    setScreenState({ mode: 'sending', boundary: 'sending' });
    let result: Awaited<ReturnType<typeof syncNow>> = null;
    let failure: string | null = null;
    try {
      result = await syncNow('after-save');
    } catch (error: unknown) {
      failure = error instanceof Error ? error.message : FIELD_SURVEY_COPY.saveFailed;
    }
    // The stored row is the truth about what happened; the one mapper turns it into the mode.
    const row = findOwnedFieldSurvey(database, clientUuid, session.user.uuid);
    const next: ScreenState = row ? screenStateForRow(row) : { mode: 'waiting_to_send', boundary: 'waiting_to_send' };
    setScreenState(next);
    if (row) setFieldErrors(parseFieldErrors(row.fieldErrorsJson));
    if (next.mode === 'sent') showToast(FIELD_SURVEY_SYNC_COPY.synced, 'success');
    else if (failure) setSyncMessage(failure);
    else if (result?.authRequired) setSyncMessage(FIELD_SURVEY_SYNC_COPY.signInRequired);
    else if (isOnline === false && next.mode === 'waiting_to_send') setSyncMessage(FIELD_SURVEY_SYNC_COPY.offline);
  }

  function finishAffectedArea() {
    if (!validation.valid) {
      setSyncMessage(validation.error.message);
      return;
    }
    const snappedWaypoints = snapAffectedAreaWaypoints(validation.polygon, affectedWaypoints);
    const candidate = validateSurveyWaypoints(snappedWaypoints);
    if (!candidate.valid) {
      setSyncMessage(candidate.error.message);
      return;
    }
    const result = measureAffectedAreas(validation.polygon, [candidate.polygon]);
    if (!result.valid) {
      setSyncMessage(result.error.message);
      return;
    }
    stopWalk();
    const current = shapeRef.current;
    commitShape({
      ...current,
      affectedAreas: [...current.affectedAreas, candidate.polygon],
      affectedAreaWaypointSets: [...current.affectedAreaWaypointSets, snappedWaypoints],
      affectedWaypoints: [],
    });
    setSelected(null);
    setSyncMessage(null);
  }

  function removeSelected() {
    if (!selected) return;
    const result = removePoint(shapeRef.current, selected);
    if (!result.ok) {
      setSyncMessage(result.message || FIELD_SURVEY_COPY.moveRefused);
      return;
    }
    commitShape(result.shape);
    setSelected(null);
  }

  function startNewBoundary() {
    stopWalk();
    setClientUuid(randomUUID());
    setDistrictCode('');
    setShape(EMPTY_SHAPE);
    setHistory([]);
    setSelected(null);
    setSelectedArea(null);
    setFieldErrors({});
    setSyncMessage(null);
    setSaveState('unsaved');
    setSaveAttempt((count) => count + 1);
    setScreenState(NEW_BOUNDARY_SCREEN);
  }

  const screenValidation = validation.valid ? `${(validation.areaSqm / 10_000).toFixed(2)} ha · ${Math.round(validation.areaSqm).toLocaleString()} m²` : validation.error.message;
  const ringPoints = waypoints.map((point) => {
    const projected = coordinateToViewportPoint(center, point, zoom, viewport.width, viewport.height);
    return `${projected.x + SURVEY_MAP_OVERSCAN},${projected.y + SURVEY_MAP_OVERSCAN}`;
  }).join(' ');

  function areaSqm(index: number): number {
    const polygon = affectedAreas[index];
    if (!polygon) return 0;
    const measured = validateSurveyPolygon(polygon);
    return measured.valid ? measured.areaSqm : 0;
  }

  function layerPoint(point: MapCoordinate) {
    const projected = coordinateToViewportPoint(center, point, zoom, viewport.width, viewport.height);
    return { x: projected.x + SURVEY_MAP_OVERSCAN, y: projected.y + SURVEY_MAP_OVERSCAN };
  }

  // Touch targets live in the map layer so they follow the map while it is dragged.
  const editableSets: { ref: (index: number) => PointRef; points: SurveyWaypoint[]; closed: boolean; label: string }[] = [
    { ref: (index) => ({ set: 'plot', index }), points: waypoints, closed: true, label: 'plot' },
    { ref: (index) => ({ set: 'active', index }), points: affectedWaypoints, closed: false, label: 'active' },
    ...(selectedArea !== null && affectedAreaWaypointSets[selectedArea]
      ? [{ ref: (index: number): PointRef => ({ set: 'area', area: selectedArea, index }), points: affectedAreaWaypointSets[selectedArea], closed: true, label: `area-${selectedArea}` }]
      : []),
  ];
  // These callbacks only run from touch events; the lint rule cannot tell them apart from render-time reads.
  /* eslint-disable react-hooks/refs */
  const handles = editableSets.map(({ ref: pointRefAt, points, closed, label }) => (
    <View key={label} pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: edgeCount(points.length, closed) }, (_, edge) => {
        const from = layerPoint(points[edge]);
        const to = layerPoint(points[(edge + 1) % points.length]);
        return (
          <Pressable
            key={`insert-${edge}`}
            testID={`field-survey.insert.${label}.${edge}`}
            accessibilityRole="button"
            accessibilityLabel={FIELD_SURVEY_COPY.insertHandle(edge + 1)}
            onPress={() => insertAfter(pointRefAt(edge), edge)}
            style={[styles.insertHandle, { left: (from.x + to.x) / 2 - 12, top: (from.y + to.y) / 2 - 12, backgroundColor: theme.surfaceElevated, borderColor: theme.primary }]}
          >
            <Text style={[styles.insertGlyph, { color: theme.primary }]}>+</Text>
          </Pressable>
        );
      })}
      {points.map((point, index) => {
        const at = layerPoint(point);
        return (
          <PointHandle
            key={`point-${index}`}
            testID={`field-survey.point.${label}.${index}`}
            accessibilityLabel={FIELD_SURVEY_COPY.pointHandle(index + 1, FIELD_SURVEY_COPY.pointQuality[pointQuality(point)])}
            left={at.x - HANDLE_SIZE / 2}
            top={at.y - HANDLE_SIZE / 2}
            selected={sameRef(selected, pointRefAt(index))}
            onSelect={() => setSelected((current) => sameRef(current, pointRefAt(index)) ? null : pointRefAt(index))}
            onDragBegin={() => beginDrag(pointRefAt(index))}
            onDragMove={dragTo}
            onDragEnd={endDrag}
          />
        );
      })}
    </View>
  ));
  /* eslint-enable react-hooks/refs */
  const areaChips = affectedAreas.map((area, index) => {
    const centroid = area.coordinates[0].slice(0, -1).reduce((sum, [longitude, latitude]) => ({ longitude: sum.longitude + longitude, latitude: sum.latitude + latitude }), { longitude: 0, latitude: 0 });
    const count = Math.max(1, area.coordinates[0].length - 1);
    return { index, at: layerPoint({ longitude: centroid.longitude / count, latitude: centroid.latitude / count }) };
  });

  if (!ready) {
    return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.primary} /></SafeAreaView>;
  }

  const strip = statusStripFor(screenState);
  const saveLine = mode === 'waiting_to_start' || mode === 'loading' ? null : saveState === 'failed' ? (
    <Pressable testID="field-survey.save-failed" accessibilityRole="button" accessibilityLabel={`${FIELD_SURVEY_COPY.saveFailed} ${FIELD_SURVEY_COPY.saveRetry}`} onPress={() => setSaveAttempt((count) => count + 1)}>
      <Text style={[styles.help, { color: theme.danger }]}>{FIELD_SURVEY_COPY.saveFailed} <Text style={styles.retry}>{FIELD_SURVEY_COPY.saveRetry}</Text></Text>
    </Pressable>
  ) : saveState === 'saved' ? (
    <Text testID="field-survey.save-state" style={[styles.help, { color: theme.success }]}>{FIELD_SURVEY_SYNC_COPY.savedOffline}</Text>
  ) : (
    <Text testID="field-survey.save-state" style={[styles.help, { color: theme.warning }]}>{saveState === 'saving' ? FIELD_SURVEY_COPY.savingOffline : FIELD_SURVEY_COPY.unsavedChanges}</Text>
  );
  const pointCount = drawingAffectedArea ? affectedWaypoints.length : waypoints.length;
  const quality = assessBoundaryQuality(waypoints);
  const badge = boundaryBadge(waypoints);
  const toolState = drawingToolState({ locked: controlsLocked, drawingAffectedArea, hasSelection: selected !== null, activeAffectedCount: affectedWaypoints.length });
  const listedPoints = selectedArea !== null && affectedAreaWaypointSets[selectedArea] ? affectedAreaWaypointSets[selectedArea] : drawingAffectedArea ? affectedWaypoints : waypoints;
  const listedRef = (index: number): PointRef => selectedArea !== null && affectedAreaWaypointSets[selectedArea] ? { set: 'area', area: selectedArea, index } : drawingAffectedArea ? { set: 'active', index } : { set: 'plot', index };
  const areaReadout = `${screenValidation}${validation.valid && affectedMeasurement?.valid ? ` · ${affectedMeasurement.areaSqm.toFixed(0)} m² affected` : affectedMeasurement && !affectedMeasurement.valid ? ` · ${affectedMeasurement.error.message}` : ''}`;

  if (!canAuthorSurvey) {
    return (
      <SafeAreaView testID="field-survey.unavailable" accessibilityValue={{ text: 'state=unavailable' }} style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <BrandedScreenHeader title={FIELD_SURVEY_COPY.title} />
        <View style={styles.body}>
          <Text style={{ color: theme.text, padding: 16 }}>{FIELD_SURVEY_COPY.unavailable}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView testID="field-survey.screen" accessibilityValue={{ text: `mode=${mode};save=${saveState};valid=${validation.valid ? 'yes' : 'no'}` }} style={[styles.safe, { backgroundColor: theme.background}]} edges={['top', 'bottom']}>
      <BrandedScreenHeader title={FIELD_SURVEY_COPY.title} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'android' ? 'height' : 'padding'}
        style={styles.body}>
        <View style={styles.mapSection}>
          <GestureDetector gesture={mapGesture}>
            <Pressable
              disabled={controlsLocked}
              ref={mapRef}
              testID="field-survey.map"
              accessibilityRole="imagebutton"
              accessibilityLabel={FIELD_SURVEY_COPY.mapAccessibility}
              onPress={handleMapPress}
              onLayout={(event) => {
                const size = { width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height };
                layoutRef.current = size;
                setViewport(size);
                if (fitRequested.current) {
                  fitRequested.current = false;
                  fitMapToShape(shapeRef.current, size);
                }
              }}
              style={[styles.map, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
            >
          <Animated.View pointerEvents="box-none" style={[styles.mapLayer, { width: viewport.width + SURVEY_MAP_OVERSCAN * 2, height: viewport.height + SURVEY_MAP_OVERSCAN * 2 }, layerStyle]}>
          {isOnline === true ? tiles.map((tile) => (
            <ExpoImage
              key={tile.key}
              pointerEvents="none"
              source={{ uri: tile.url, headers: { 'User-Agent': 'CaneGuard-Mobile/1.0', ...(session?.token && !tile.url.includes('tile.openstreetmap.org') ? { Authorization: `Bearer ${session.token}` } : {}) } }}
              cachePolicy="disk"
              contentFit="fill"
              onLoad={() => setTileFailures((current) => current.filter((key) => key !== tile.key))}
              onError={() => setTileFailures((current) => current.includes(tile.key) ? current : [...current, tile.key])}
              style={{ position: 'absolute', left: tile.left, top: tile.top, width: MAP_TILE_SIZE, height: MAP_TILE_SIZE }}
            />
          )) : null}
          <Svg pointerEvents="none" width={viewport.width + SURVEY_MAP_OVERSCAN * 2} height={viewport.height + SURVEY_MAP_OVERSCAN * 2}>
            {waypoints.length >= 3 ? <Polygon points={ringPoints} fill="rgba(32, 128, 86, 0.22)" stroke={theme.primary} strokeWidth={3} /> : waypoints.length >= 2 ? <Polyline points={ringPoints} fill="none" stroke={theme.primary} strokeWidth={3} /> : null}
            {affectedAreas.map((area, areaIndex) => {
              const points = area.coordinates[0].map(([longitude, latitude]) => layerPoint({ longitude, latitude })).map((point) => `${point.x},${point.y}`).join(' ');
              const outside = validityMarks.outsideAreas.includes(areaIndex);
              return <Polygon key={`affected-${areaIndex}`} points={points} fill={outside ? 'rgba(155, 47, 47, 0.30)' : 'rgba(205, 112, 36, 0.28)'} stroke={outside ? theme.danger : theme.warning} strokeWidth={selectedArea === areaIndex ? 5 : 3} />;
            })}
            {validityMarks.crossingEdges.map((edge) => {
              const from = layerPoint(waypoints[edge]);
              const to = layerPoint(waypoints[(edge + 1) % waypoints.length]);
              return <Line key={`crossing-${edge}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={theme.danger} strokeWidth={5} />;
            })}
            {affectedWaypoints.length >= 2 ? <Polyline points={affectedWaypoints.map((point) => { const at = layerPoint(point); return `${at.x},${at.y}`; }).join(' ')} fill="none" stroke={theme.warning} strokeWidth={3} /> : null}
            {affectedAreaWaypointSets.map((set, areaIndex) => set.map((point, index) => {
              const at = layerPoint(point);
              const quality = pointQuality(point);
              const colors = qualityColor(quality, theme);
              const isSelected = sameRef(selected, { set: 'area', area: areaIndex, index });
              return <Circle testID={`field-survey.area-point.${areaIndex}.${index}`} key={`area-${areaIndex}-${index}`} cx={at.x} cy={at.y} r={isSelected ? 9 : 4} fill={isSelected ? theme.warning : colors.fill} stroke={colors.stroke} strokeWidth={quality === 'map' || quality === 'weak' ? 2 : 1.5} />;
            }))}
            {affectedWaypoints.map((point, index) => {
              const at = layerPoint(point);
              const colors = qualityColor(pointQuality(point), theme);
              const isSelected = sameRef(selected, { set: 'active', index });
              return <Circle key={`active-${index}`} cx={at.x} cy={at.y} r={isSelected ? 9 : 7} fill={isSelected ? theme.warning : colors.fill} stroke={pointQuality(point) === 'map' ? theme.warning : colors.stroke} strokeWidth={2} />;
            })}
            {waypoints.map((point, index) => {
              const at = layerPoint(point);
              const quality = pointQuality(point);
              const colors = qualityColor(quality, theme);
              const isSelected = sameRef(selected, { set: 'plot', index });
              return <Circle key={`${point.latitude}:${point.longitude}:${index}`} cx={at.x} cy={at.y} r={isSelected ? 9 : 7} fill={isSelected ? theme.warning : colors.fill} stroke={colors.stroke} strokeWidth={quality === 'map' || quality === 'weak' ? 3 : 2} />;
            })}
            {myLocation ? (() => {
              const at = layerPoint(myLocation);
              return <Circle cx={at.x} cy={at.y} r={8} fill={theme.info} stroke="white" strokeWidth={3} />;
            })() : null}
          </Svg>
          {controlsLocked ? null : handles}
          {controlsLocked ? null : areaChips.map(({ index, at }) => (
            <Pressable key={`area-chip-${index}`} testID={`field-survey.area-chip.${index}`} accessibilityRole="button" accessibilityState={{ selected: selectedArea === index }} accessibilityLabel={FIELD_SURVEY_COPY.affectedAreaChip(index + 1, areaSqm(index))} onPress={() => { setSelectedArea((current) => current === index ? null : index); setSelected(null); }} style={[styles.areaChip, { left: at.x - 16, top: at.y - 12, backgroundColor: selectedArea === index ? theme.warning : theme.surfaceElevated, borderColor: validityMarks.outsideAreas.includes(index) ? theme.danger : theme.warning }]}>
              <Text style={[styles.areaChipText, { color: selectedArea === index ? 'white' : theme.text }]}>A{index + 1}</Text>
            </Pressable>
          ))}
          </Animated.View>
          {tiles.length > 0 && isOnline === true ? <Text pointerEvents="none" style={[styles.attribution, { color: theme.text, backgroundColor: theme.surfaceElevated }]}>{FIELD_SURVEY_COPY.mapAttribution}</Text> : null}
            </Pressable>
          </GestureDetector>
          <View pointerEvents="box-none" style={styles.floatingControls}>
            <AppButton leadingIcon="map-pin" variant="secondary" selected={!drawingAffectedArea} style={[styles.floatingButton, !drawingAffectedArea && { backgroundColor: theme.backgroundSelected, borderColor: theme.primary, borderWidth: 2 }]} disabled={controlsLocked} onPress={() => { if (drawingAffectedArea) stopWalk(); setDrawingAffectedArea(false); setSelected(null); setSyncMessage(null); }}>{FIELD_SURVEY_COPY.plotBoundary}</AppButton>
            <AppButton leadingIcon="map-pin" variant="secondary" selected={drawingAffectedArea} style={[styles.floatingButton, drawingAffectedArea && { backgroundColor: theme.backgroundSelected, borderColor: theme.primary, borderWidth: 2 }]} disabled={controlsLocked} onPress={() => { if (!drawingAffectedArea) stopWalk(); setDrawingAffectedArea(true); setSelected(null); setSyncMessage(null); }}>{FIELD_SURVEY_COPY.affectedAreaBoundary}</AppButton>
            <AppButton testID="field-survey.walk" leadingIcon={walking ? 'square' : 'navigation'} variant="secondary" selected={walking} style={styles.floatingButton} onPress={() => void toggleWalk()} disabled={(gpsBusy && !walking) || controlsLocked}>{walking ? FIELD_SURVEY_COPY.walkStop : FIELD_SURVEY_COPY.walkStart}</AppButton>
            <AppButton leadingIcon="crosshair" variant="secondary" style={styles.floatingButton} onPress={() => void captureGpsWaypoint()} busy={gpsBusy} disabled={gpsBusy || walking || controlsLocked}>{gpsBusy ? FIELD_SURVEY_COPY.capturingGps : FIELD_SURVEY_COPY.addGpsPoint}</AppButton>
          </View>
          <View pointerEvents="box-none" style={styles.floatingControlsRight}>
            <AppButton testID="field-survey.my-location" leadingIcon="navigation" variant="secondary" accessibilityLabel={FIELD_SURVEY_COPY.myLocation} style={styles.floatingButton} onPress={() => void goToMyLocation()} busy={locating} disabled={locating}>{locating ? FIELD_SURVEY_COPY.myLocationBusy : FIELD_SURVEY_COPY.myLocation}</AppButton>
          </View>
        </View>
        {isOnline !== true ? <Text style={[styles.mapNote, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.offlineMap}</Text> : tileFailures.some((key) => tiles.some((tile) => tile.key === key)) ? <Text style={[styles.mapNote, { color: theme.warning }]}>{FIELD_SURVEY_COPY.mapTileError}</Text> : null}
        <Text testID="field-survey.status-strip" accessibilityLiveRegion="polite" accessibilityValue={{ text: `mode=${mode}` }} style={[styles.statusStrip, { color: theme[SYNC_TONE_COLOR[strip.tone]], backgroundColor: theme.surfaceElevated, borderColor: theme[SYNC_TONE_COLOR[strip.tone]] }]}>{strip.text}</Text>
        <Text testID="field-survey.tool-state" accessibilityLiveRegion="polite" accessibilityValue={{ text: `tool=${toolState}` }} style={[styles.toolChip, { color: theme.text, backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>{gpsBusy ? FIELD_SURVEY_COPY.capturingGps : FIELD_SURVEY_COPY.toolState[toolState]}</Text>
        <View style={styles.row}>
          <AppButton variant="secondary" leadingIcon="corner-up-left" style={styles.toolButton} disabled={(!pointCount && history.length === 0) || controlsLocked} onPress={undoLast}>{FIELD_SURVEY_COPY.undo}</AppButton>
          <AppButton variant="secondary" leadingIcon="trash-2" style={styles.toolButton} disabled={selected === null || controlsLocked} onPress={removeSelected}>{FIELD_SURVEY_COPY.removeSelected}</AppButton>
        </View>
        {drawingAffectedArea ? <AppButton variant="secondary" style={styles.toolButton} disabled={affectedWaypoints.length < 3 || controlsLocked} onPress={finishAffectedArea}>{FIELD_SURVEY_COPY.finishAffectedArea}</AppButton> : null}
        <ScrollView style={styles.details} contentContainerStyle={styles.detailsContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.intro, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.intro}</Text>
        {screenIsStoredOrMissing(mode) && mode !== 'sending' ? <AppButton variant="secondary" onPress={startNewBoundary}>{screenNeedsFreshIdentity(mode) ? FIELD_SURVEY_COPY.startNewBoundaryAfterRejection : FIELD_SURVEY_COPY.newSurvey}</AppButton> : null}
          <Text style={[styles.label, { color: theme.text }]}>{FIELD_SURVEY_COPY.districtLabel}</Text>
          <TextInput
            accessibilityLabel={FIELD_SURVEY_COPY.districtLabel}
            testID="field-survey.district-code"
            value={districtCode}
            editable={!controlsLocked}
            onChangeText={(value) => { setSaveState('unsaved'); setFieldErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== 'district_code'))); setDistrictCode(value); }}
            autoCapitalize="characters"
            placeholder={FIELD_SURVEY_COPY.districtPlaceholder}
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: fieldErrors.district_code ? theme.danger : theme.border, backgroundColor: theme.surfaceElevated }]}
          />
          {fieldErrors.district_code?.map((message) => <Text key={message} style={[styles.error, { color: theme.danger }]}>{message}</Text>)}
          <Text style={[styles.help, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.mapHelp}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: pointsOpen }}
            onPress={() => setPointsOpen((value) => !value)}
            style={styles.pointsToggle}>
            <Text style={[styles.label, styles.pointsToggleLabel, { color: theme.text }]}>{drawingAffectedArea ? FIELD_SURVEY_COPY.affectedAreaBoundary : FIELD_SURVEY_COPY.pointsHeading} ({pointCount})</Text>
            <Feather name={pointsOpen ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textSecondary} />
          </Pressable>
          {pointsOpen ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.points}>
              {listedPoints.map((point, index) => <Pressable key={`${point.capturedAt}:${index}`} accessibilityRole="button" accessibilityLabel={FIELD_SURVEY_COPY.selectPoint(index + 1)} onPress={() => setSelected(listedRef(index))} style={[styles.point, { borderColor: sameRef(selected, listedRef(index)) ? theme.primary : theme.border, backgroundColor: theme.surfaceElevated }]}>
                <Text style={[styles.pointTitle, { color: theme.text }]}>{index + 1} · {point.source === 'gps' ? FIELD_SURVEY_COPY.gps : FIELD_SURVEY_COPY.map}</Text>
                <Text style={[styles.pointCoord, { color: theme.textSecondary }]}>{point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}</Text>
                <Text style={[styles.pointCoord, { color: point.source === 'gps' && point.accuracyMeters === null ? theme.warning : theme.textSecondary }]}>{point.source !== 'gps' ? FIELD_SURVEY_COPY.pointQuality.map : point.accuracyMeters === null ? FIELD_SURVEY_COPY.accuracyUnknown : `${FIELD_SURVEY_COPY.accuracy} ±${point.accuracyMeters.toFixed(1)} m`}</Text>
              </Pressable>)}
            </ScrollView>
          ) : null}
          {validation.valid && !drawingAffectedArea ? (
            <View testID="field-survey.quality" style={[styles.point, { borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}>
              <Text style={[styles.label, { color: theme.text }]}>{FIELD_SURVEY_COPY.boundaryQualityTitle}</Text>
              <Text style={[styles.help, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.qualityPlotArea}: {Math.round(validation.areaSqm).toLocaleString()} m² · {FIELD_SURVEY_COPY.qualityPoints}: {quality.pointCount}</Text>
              <Text style={[styles.help, { color: badge === 'good' || badge === 'drawn_on_map' ? theme.success : theme.warning }]}>{FIELD_SURVEY_COPY.qualityState[badge]}</Text>
              {quality.worst ? <Text style={[styles.help, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.qualityWorst(quality.worst.index + 1, quality.worst.accuracyMeters)}</Text> : null}
              {affectedMeasurement?.valid ? <Text style={[styles.help, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.qualityAffected(affectedMeasurement.areaSqm, (affectedMeasurement.areaSqm / validation.areaSqm) * 100)}</Text> : null}
              {badge === 'low_accuracy' && quality.worst ? <AppButton variant="secondary" leadingIcon="crosshair" disabled={gpsBusy || controlsLocked} busy={gpsBusy} onPress={() => { const worst = quality.worst; if (worst) void recaptureWorstPoint(waypoints[worst.index]); }}>{FIELD_SURVEY_COPY.recapturePoint(quality.worst.index + 1)}</AppButton> : null}
            </View>
          ) : null}
          <Text style={[styles.label, { color: theme.text }]}>{FIELD_SURVEY_COPY.affectedAreas} ({affectedAreas.length})</Text>
          {affectedAreas.map((_, index) => (
            <View key={`area-row-${index}`} style={styles.areaRow}>
              <Pressable accessibilityRole="button" accessibilityState={{ selected: selectedArea === index }} onPress={() => { setSelectedArea((current) => current === index ? null : index); setSelected(null); }} style={[styles.point, styles.areaRowLabel, { borderColor: selectedArea === index ? theme.primary : validityMarks.outsideAreas.includes(index) ? theme.danger : theme.border, backgroundColor: theme.surfaceElevated }]}>
                <Text style={[styles.pointTitle, { color: theme.text }]}>{FIELD_SURVEY_COPY.affectedAreaChip(index + 1, areaSqm(index))}</Text>
              </Pressable>
              <AppButton variant="secondary" leadingIcon="trash-2" disabled={controlsLocked} onPress={() => removeAreaAt(index)}>{FIELD_SURVEY_COPY.removeAffectedAreaNumber(index + 1)}</AppButton>
            </View>
          ))}
        </ScrollView>
        <ActionDock
          note={
            <>
              <Text accessibilityLiveRegion="polite" testID="field-survey.area" style={[styles.area, { color: validation.valid ? theme.primaryDark : theme.textSecondary }]}>{areaReadout}</Text>
              {validityMarks.issue && validityMarks.issue !== 'too_few_points' ? <Text testID="field-survey.validity" accessibilityLiveRegion="polite" style={[styles.help, { color: theme.danger }]}>{FIELD_SURVEY_COPY.validity[validityMarks.issue]}</Text> : null}
              {saveLine}
              {syncMessage ? <Text accessibilityLiveRegion="assertive" testID="field-survey.sync-status" style={[styles.help, { color: theme.info }]}>{syncMessage}</Text> : null}
              {Object.entries(fieldErrors).filter(([key]) => key !== 'district_code').map(([field, messages]) => <Text key={field} style={[styles.error, { color: theme.danger }]}>{field}: {messages.join(' ')}</Text>)}
            </>
          }
          primary={<AppButton testID="field-survey.submit" leadingIcon="upload-cloud" busy={saving} disabled={!screenCanSubmit(screenState) || !validation.valid || saveState !== 'saved' || saving || affectedWaypoints.length > 0} onPress={() => void saveAndSync()}>{saving ? FIELD_SURVEY_SYNC_COPY.submitting : FIELD_SURVEY_SYNC_COPY.submit}</AppButton>}
          secondary={<AppButton variant="secondary" style={dockSecondaryButtonStyle} onPress={() => router.back()}>{FIELD_SURVEY_COPY.close}</AppButton>}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1 },
  mapSection: { flex: 1, minHeight: 240 },
  details: { flexGrow: 0, flexShrink: 1, maxHeight: 190 },
  detailsContent: { padding: Spacing.lg, gap: Spacing.sm },
  intro: { ...Typography.bodySmall },
  label: { ...Typography.label, marginTop: Spacing.xs },
  help: { ...Typography.bodySmall },
  mapNote: { ...Typography.bodySmall, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs },
  error: { ...Typography.bodySmall, fontWeight: '500' },
  input: { ...Typography.body, minHeight: 48, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md },
  map: { flex: 1, borderWidth: 1, borderRadius: Radius.lg, overflow: 'hidden', marginHorizontal: Spacing.lg, marginTop: Spacing.sm },
  mapLayer: { position: 'absolute', left: -SURVEY_MAP_OVERSCAN, top: -SURVEY_MAP_OVERSCAN },
  attribution: { position: 'absolute', right: Spacing.xs, bottom: Spacing.xs, paddingHorizontal: Spacing.xs, paddingVertical: Spacing.xs, borderRadius: Radius.sm, ...Typography.caption },
  floatingControls: { position: 'absolute', top: Spacing.md + Spacing.sm, left: Spacing.lg + Spacing.sm, gap: Spacing.xs, alignItems: 'flex-start' },
  statusStrip: { ...Typography.label, marginHorizontal: Spacing.lg, marginTop: Spacing.xs, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderWidth: 1, borderRadius: Radius.sm, overflow: 'hidden' },
  retry: { fontWeight: '700', textDecorationLine: 'underline' },
  toolChip: { ...Typography.caption, marginHorizontal: Spacing.lg, marginTop: Spacing.xs, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderWidth: 1, borderRadius: Radius.sm, overflow: 'hidden' },
  insertHandle: { position: 'absolute', width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  insertGlyph: { ...Typography.label, lineHeight: 18 },
  areaChip: { position: 'absolute', minWidth: 32, height: 24, paddingHorizontal: Spacing.xs, borderRadius: Radius.sm, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  areaChipText: { ...Typography.caption, fontWeight: '700' },
  areaRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  areaRowLabel: { flex: 1 },
  floatingControlsRight: { position: 'absolute', top: Spacing.md + Spacing.sm, right: Spacing.lg + Spacing.sm, alignItems: 'flex-end' },
  floatingButton: { minHeight: 44, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md },
  toolButton: { flex: 1, minHeight: 44, paddingVertical: Spacing.xs },
  row: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  pointsToggle: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pointsToggleLabel: { marginTop: 0, flex: 1 },
  points: { gap: Spacing.sm },
  point: { padding: Spacing.sm, borderWidth: 1, borderRadius: Radius.sm, minWidth: 145 },
  pointTitle: { ...Typography.label },
  pointCoord: { ...Typography.caption },
  area: { ...Typography.subheading, textAlign: 'center' },
});
