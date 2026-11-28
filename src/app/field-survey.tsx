import { canAuthorInspectorWork } from '@/features/auth/capabilities';
import { randomUUID } from 'expo-crypto';
import { Image as ExpoImage } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, AppState, BackHandler, type GestureResponderEvent, type HostInstance, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import Svg, { Circle, Line, Polygon, Polyline } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionDock, dockSecondaryButtonStyle } from '@/components/ui/ActionDock';
import { AppButton } from '@/components/ui/AppButton';
import { TextField } from '@/components/ui/TextField';
import { fetchAssignmentFieldMap } from '@/features/surveys/api/fieldSurveysApi';
import { reusableOutlines, waypointsFromOutline, type ReusableOutline } from '@/features/surveys/domain/outlineReuse';
import { distanceToPlotMeters, isAtPlot } from '@/features/surveys/domain/plotLocation';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { EMPTY_DATABASE, useDatabaseState } from '@/database/DatabaseProvider';
import { useSync } from '@/features/sync/hooks/useSync';
import { useToast } from '@/components/ui/Toast';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { AUTHORING_WINDOW_COPY, FIELD_SURVEY_COPY } from '@/constants/copy';
import { readAuthoringBound } from '@/features/auth/domain/authoringBound';
import { subscribeSyncRecords } from '@/features/sync/services/syncEvents';
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
import { FIELD_NAME_MAX_LENGTH, findOwnedFieldSurvey, listEarlierMapRows, listOwnedFieldSurveys, saveFieldSurveyDraft, markFieldSurveyPending } from '@/features/surveys/data/fieldSurveyRepository';
import { viewportPointFromPressEvent } from '@/features/reports/components/online-map-picker';
import { useManualMapGestures } from '@/features/reports/components/use-manual-map-gestures';
import { useTileSources } from '@/features/reports/tiles/useTileSources';
import { isConfirmedZeroSurvey } from '@/features/surveys/domain/attachedBoundary';
import { describeOutsidePlot, measureAffectedAreas, snapAffectedAreaWaypoints, validateAffectedAreaWaypoints, validateSurveyPolygon, validateSurveyWaypoints, type SurveyPolygon, type SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';
import { SubdivisionSvgLayer, SubdivisionTouchLayer } from '@/features/surveys/components/SubdivisionOverlay';
import {
  applySubdivisionSelection,
  applyWholePlotAffected,
  insertBendPointOnCut,
  isWholePlotAffected,
  measureSubdivisionSelection,
  pointInPiece,
  remapSelectedPieceIds,
  subdividePlot,
  type SubdivisionPiece,
} from '@/features/surveys/domain/plotSubdivision';
import { LOADING_SCREEN, NEW_BOUNDARY_SCREEN, screenCanEdit, screenCanSubmit, screenIsStoredOrMissing, screenNeedsFreshIdentity, screenStateForRow, statusStripFor, WAITING_TO_SEND_SCREEN, type ScreenState } from '@/features/surveys/domain/screenMode';
import { FIELD_SURVEY_SYNC_COPY, SYNC_TONE_COLOR } from '@/features/sync/utils/syncStatusCopy';
import { assessBoundaryQuality } from '@/features/surveys/domain/boundaryQuality';
import {
  assessValidity,
  boundaryBadge,
  canUndoForTarget,
  drawingToolState,
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
  undoForTarget,
  type DrawingShape,
  type EditResult,
  type PointQuality,
  type PointRef,
} from '@/features/surveys/domain/drawingTool';
import { captureSurveyWaypoint } from '@/features/surveys/services/captureSurveyWaypoint';
import { decideFinalFix, decideMarkCorner, decideWalkFix, distanceMeters, distanceToStart, formatWalkDistance, isBackAtStart, metersToLongitudeDegrees, refineWalkPoint, simplifyWalkSegment, WALK_AFFECTED_NEAR_START_MIN_METERS, WALK_CORNER_WINDOW_MS, WALK_NEAR_START_MIN_METERS, walkAccuracyBand, type WalkFix, type WalkFixMark } from '@/features/surveys/domain/walkMode';
import { expoWalkLocationClient } from '@/features/surveys/services/expoWalkLocationClient';
import { recordReplacedReportSurvey } from '@/features/surveys/services/reportSurveyHandoff';
import { holdScreenAwake, releaseScreenAwake, walkHaptic } from '@/features/surveys/services/walkComfort';
import { markWalkGuideSeen, shouldShowWalkGuide } from '@/features/surveys/services/walkGuideStore';
import { startWalk } from '@/features/surveys/services/walkSurveyBoundary';

const SURVEY_ZOOM = 17;
const SURVEY_MAP_OVERSCAN = MAP_TILE_SIZE;
const INITIAL_VIEWPORT = { width: 360, height: 380 };
const HANDLE_SIZE = 44;
const MAP_BORDER_WIDTH = 1;
// A tap that lands this soon after a pan or pinch ended is the end of that drag, not a new point.
const GESTURE_TAP_GUARD_MS = 300;
/** How long after Stop the Walk button still says Resume. */
const WALK_RESUME_WINDOW_MS = 5_000;
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

function feedbackColors(tone: MapFeedback['tone'], theme: ReturnType<typeof useTheme>): { bg: string; border: string; text: string } {
  if (tone === 'danger') return { bg: theme.dangerBg, border: theme.danger, text: theme.danger };
  if (tone === 'warning') return { bg: theme.warningBg, border: theme.warning, text: theme.warning };
  if (tone === 'success') return { bg: theme.successBg, border: theme.success, text: theme.success };
  return { bg: theme.infoBg, border: theme.info, text: theme.info };
}

// A round 48pt map control: big enough for a gloved thumb, no text to crowd the map.
function MapIconButton({ busy = false, icon, label, onPress, testID }: { busy?: boolean; icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void; testID: string }) {
  const theme = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}>
      {busy ? <ActivityIndicator size="small" color={theme.primary} /> : <Feather name={icon} size={22} color={theme.primaryDark} />}
    </Pressable>
  );
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
type FeedbackTone = 'danger' | 'warning' | 'success' | 'info';
type MapFeedback = { tone: FeedbackTone; text: string };

type StoredSurveyRow = Parameters<typeof screenStateForRow>[0] & { fieldErrorsJson: string | null };

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
  /** Ground metres between the points this walk added, for the live readout. */
  walkedMeters: number;
  last: MapCoordinate | null;
  /** True once the GPS subscription exists; permission prompts before that must not end the walk. */
  started: boolean;
  weakSignal: boolean;
  /** False until the first usable reading: the walker is told to wait at the start corner. */
  locked: boolean;
  /** Last few readings, newest last: Mark corner picks the best of them. */
  recent: WalkFix[];
  latest: WalkFix | null;
  backAtStart: boolean;
  /** How many points the walked boundary already had; a tidy never touches those. */
  startCount: number;
  /** The last usable reading, and a reading just refused as a jump, for the jump check. */
  lastGood: WalkFixMark | null;
  jumpSeen: WalkFixMark | null;
  /** The point just added, which a clearly better reading of the same spot may still replace. */
  refine: { waypoint: SurveyWaypoint; readings: number } | null;
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

function walkFailureMessage(status: 'permission_denied' | 'services_disabled' | 'unavailable'): string {
  if (status === 'permission_denied') return FIELD_SURVEY_COPY.walkPermissionDenied;
  if (status === 'services_disabled') return FIELD_SURVEY_COPY.walkServicesDisabled;
  return FIELD_SURVEY_COPY.walkUnavailable;
}

function captureSuccessMessage(accuracyMeters: number | null): string | null {
  if (accuracyMeters === null) return FIELD_SURVEY_COPY.gpsAccuracyUnknown;
  return accuracyMeters > PREFERRED_GPS_ACCURACY_METERS ? FIELD_SURVEY_COPY.gpsAccuracyWeak(accuracyMeters) : null;
}

export default function FieldSurveyScreen() {
  const theme = useTheme();
  const { showToast } = useToast();
  const { database, ready } = useDatabaseState();
  const auth = useAuth();
  const { session } = auth;
  const canAuthorSurvey = canAuthorInspectorWork(session?.user);
  const params = useLocalSearchParams<{ forReport?: string | string[]; reportId?: string | string[]; surveyId?: string | string[]; outlineFrom?: string | string[] }>();
  // Opened from a visit: start from the outline of the map the office holds for that assigned case.
  const outlineFrom = Array.isArray(params.outlineFrom) ? params.outlineFrom[0] : params.outlineFrom;
  const surveyId = Array.isArray(params.surveyId) ? params.surveyId[0] : params.surveyId;
  const reportId = Array.isArray(params.reportId) ? params.reportId[0] : params.reportId;
  // Opened from a Field Report: the map sends with that report, so there is no separate send step here.
  const forReport = (Array.isArray(params.forReport) ? params.forReport[0] : params.forReport) === '1' && Boolean(surveyId);
  const [replacedReportSurveyUuid, setReplacedReportSurveyUuid] = useState<string | null>(null);
  const { isOnline, syncNow } = useSync();
  const [clientUuid, setClientUuid] = useState(() => randomUUID());
  // The district comes from the account; the server still checks membership on sync.
  const districtCode = session?.user.districtCode?.trim() ?? '';
  const [moreOpen, setMoreOpen] = useState(false);
  // Optional name the inspector gives this field; the office shows it instead of a number.
  const [label, setLabel] = useState('');
  // The earlier map this plot outline started from; sent as provenance only.
  const [outlineFromRemoteId, setOutlineFromRemoteId] = useState<string | null>(null);
  // The server id of the currently loaded map itself (when synced), carried as outline provenance if cloned.
  const [storedRemoteId, setStoredRemoteId] = useState<string | null>(null);
  // "Walk it again" was chosen for the location the inspector is standing at.
  const [measuredBeforeDismissed, setMeasuredBeforeDismissed] = useState(false);
  // Full-screen map: the header, details and dock step aside so the plot has the whole screen.
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!expanded) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setExpanded(false);
      return true;
    });
    return () => subscription.remove();
  }, [expanded]);
  const [shape, setShapeState] = useState<DrawingShape>(EMPTY_SHAPE);
  const shapeRef = useRef<DrawingShape>(EMPTY_SHAPE);
  const [history, setHistory] = useState<DrawingShape[]>([]);
  const { waypoints, affectedAreas, affectedAreaWaypointSets, affectedWaypoints } = shape;
  const [drawingAffectedArea, setDrawingAffectedArea] = useState(false);
  // The inspector checked the plot and found nothing affected. Only ever set by their explicit choice, never from empty polygons.
  const [affectedZeroConfirmed, setAffectedZeroConfirmed] = useState(false);
  // Ephemeral plot-subdivision state (cut lines & selected candidate pieces live here until Apply commits them).
  const [subdividing, setSubdividing] = useState(false);
  const [cutLines, setCutLines] = useState<MapCoordinate[][]>([]);
  const cutLinesRef = useRef<MapCoordinate[][]>([]);
  const [activeCut, setActiveCut] = useState<MapCoordinate[]>([]);
  const [selectedPieceIds, setSelectedPieceIds] = useState<string[]>([]);
  const selectedPieceIdsRef = useRef<string[]>([]);
  const subdivisionPiecesRef = useRef<SubdivisionPiece[]>([]);
  const [addingCut, setAddingCut] = useState(false);
  const cutDragRef = useRef<{ cutIndex: number; pointIndex: number; grabbed: MapCoordinate } | null>(null);
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
  const walkRef = useRef<WalkSession | null>(null);
  // The map follows the walker until they pan or pinch it; Recenter turns following back on.
  const [walkFollow, setWalkFollow] = useState(true);
  const walkFollowRef = useRef(true);
  // True when the walker has looped back to the first point: Finish replaces Mark corner.
  const [walkBackAtStart, setWalkBackAtStart] = useState(false);
  // A touch that turned into a pan or pinch must not also drop a point where the finger lifted.
  // The press can arrive just before or after the gesture's end, so allow a short window.
  const mapGestureRef = useRef({ active: false, endedAt: 0 });
  const handleMapGestureActiveChange = useCallback((active: boolean) => {
    mapGestureRef.current = { active, endedAt: active ? mapGestureRef.current.endedAt : Date.now() };
    if (active && walkRef.current && walkFollowRef.current) {
      walkFollowRef.current = false;
      setWalkFollow(false);
    }
  }, []);
  const { gesture: mapGesture, layerStyle } = useManualMapGestures({
    blocksScrollGesture: scrollNativeGesture,
    center,
    enabled: true,
    onCommit: handleMapGestureCommit,
    onGestureActiveChange: handleMapGestureActiveChange,
    viewport,
    zoom,
  });
  const [pointsOpen, setPointsOpen] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [walking, setWalking] = useState(false);
  const walkFixHandlerRef = useRef<(fix: WalkFix) => void>(() => undefined);
  // The latest reading, accepted or not, drives the you-are-here dot and the readout; the boundary only holds accepted points.
  const [walkLive, setWalkLive] = useState<{ fix: WalkFix; walkedMeters: number; toStartMeters: number | null } | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  // Severity-styled validation/action notice rendered on the map overlay in BOTH normal and expanded modes.
  const [mapFeedback, setMapFeedback] = useState<MapFeedback | null>(null);
  // Walk status shown on the map pill; syncMessage alone lives inside the collapsed More panel, so walk feedback was invisible.
  const [walkNotice, setWalkNotice] = useState<string | null>(null);
  // For a few seconds after the walker presses Stop, the Walk button offers to resume the same walk.
  // `lasting` offers (an interruption such as leaving the app) wait until used; a deliberate Stop's offer lapses after a few seconds.
  const [resumeOffer, setResumeOffer] = useState<{ affectedArea: boolean; areaCount: number; surveyId: string; lasting: boolean } | null>(null);
  // Shown once per install, on the very first walk, until the first point lands.
  const [walkGuideOpen, setWalkGuideOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saveState, setSaveState] = useState<SaveState>('unsaved');
  const [saveAttempt, setSaveAttempt] = useState(0);
  const [tileFailures, setTileFailures] = useState<string[]>([]);
  // One value says what the screen is; the strip, the locks and the buttons all read it.
  const [screenState, setScreenState] = useState<ScreenState>(LOADING_SCREEN);
  const { mode } = screenState;
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  const controlsLocked = !screenCanEdit(mode);
  // Walking owns the boundary: every control that edits or selects points is off until the walk stops.
  // Undo and map pan/zoom stay available.
  const editLocked = controlsLocked || walking;
  const saving = mode === 'sending';
  const mapRef = useRef<HostInstance>(null);
  const liveFormRef = useRef({ controlsLocked, drawingAffectedArea, editable: !controlsLocked });
  useEffect(() => {
    liveFormRef.current = { controlsLocked, drawingAffectedArea, editable: !controlsLocked };
  }, [controlsLocked, drawingAffectedArea]);

  const setCutLinesSync = useCallback((next: MapCoordinate[][]) => {
    cutLinesRef.current = next;
    setCutLines(next);
  }, []);
  const setSelectedPieceIdsSync = useCallback((next: string[]) => {
    selectedPieceIdsRef.current = next;
    setSelectedPieceIds(next);
  }, []);
  const exitSubdivision = useCallback(() => {
    cutDragRef.current = null;
    cutLinesRef.current = [];
    subdivisionPiecesRef.current = [];
    selectedPieceIdsRef.current = [];
    setSubdividing(false);
    setCutLines([]);
    setActiveCut([]);
    setSelectedPieceIds([]);
    setAddingCut(false);
  }, []);

  // The one place a stored row becomes the mode and the correction messages on screen.
  const showStoredRow = useCallback((row: StoredSurveyRow | null, next: ScreenState): ScreenState => {
    setScreenState(next);
    if (!screenCanEdit(next.mode)) exitSubdivision();
    setStoredRemoteId(row?.remoteId ?? null);
    setFieldErrors(row ? parseFieldErrors(row.fieldErrorsJson) : {});
    return next;
  }, [exitSubdivision]);

  // A background attempt writes this screen's row too; its transitions belong on screen without reopening.
  useEffect(() => {
    if (!database || !session?.user.uuid) return;
    return subscribeSyncRecords(() => {
      const row = findOwnedFieldSurvey(database, clientUuid, session.user.uuid);
      if (!row) return;
      const next = screenStateForRow(row);
      // Only this screen edits its own draft, and a row that maps to the mode already on screen changes nothing here.
      if (next.boundary === 'draft' || next.mode === modeRef.current) return;
      showStoredRow(row, next);
    });
  }, [clientUuid, database, session?.user.uuid, showStoredRow]);

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
    // Drawing an affected area supersedes a "none found" confirmation, so the two can never coexist.
    if (next.affectedAreas.length > 0 || next.affectedWaypoints.length > 0) setAffectedZeroConfirmed(false);
  }, []);
  // Opening a screen is not an edit: only a change to the draft makes it worth writing.
  const [hasEdited, setHasEdited] = useState(false);
  const markEdited = useCallback(() => {
    setHasEdited(true);
    setSaveState('unsaved');
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
    markEdited();
    setMapFeedback(null);
    setShape(next);
  }, [markEdited, setShape]);
  const stopWalk = useCallback((message?: string | null, resume?: 'brief' | 'lasting') => {
    const walk = walkRef.current;
    if (!walk) return;
    walkRef.current = null;
    walk.stop();
    releaseScreenAwake();
    setWalking(false);
    setWalkGuideOpen(false);
    // Only a walk that was really under way can be resumed, and never a silent teardown.
    if (resume && message !== null && walk.started) {
      setResumeOffer({ affectedArea: walk.affectedArea, areaCount: walk.areaCount, surveyId: walk.surveyId, lasting: resume === 'lasting' });
    }
    setWalkLive(null);
    setWalkBackAtStart(false);
    walkFollowRef.current = true;
    setWalkFollow(true);
    if (message !== null) {
      const text = message ?? (resume === 'lasting' ? FIELD_SURVEY_COPY.walkInterrupted(walk.added) : FIELD_SURVEY_COPY.walkStopped(walk.added));
      setSyncMessage(text);
      setWalkNotice(text);
    } else setWalkNotice(null);
  }, []);
  // Walking ends when the screen locks, its boundary target or survey changes, an affected area is removed, the app leaves the foreground, or the screen closes.
  useLayoutEffect(() => {
    const walk = walkRef.current;
    if (!walk) return;
    if (controlsLocked || drawingAffectedArea !== walk.affectedArea || clientUuid !== walk.surveyId || affectedAreas.length !== walk.areaCount) stopWalk();
  }, [affectedAreas.length, clientUuid, controlsLocked, drawingAffectedArea, stopWalk, walking]);
  useLayoutEffect(() => {
    if (!walking) return;
    // Only a real 'background' ends the walk. iOS reports 'inactive' for the permission prompt, Control Centre and
    // notification pull-downs, and Android pauses the activity for its permission dialog; none of those lose GPS.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' && walkRef.current?.started) stopWalk(undefined, 'lasting');
    });
    return () => subscription.remove();
  }, [stopWalk, walking]);
  useEffect(() => () => stopWalk(null), [stopWalk]);
  // Resume is only offered for the boundary that was being walked, and only briefly.
  const walkResumable = !walking && !controlsLocked && resumeOffer !== null
    && resumeOffer.surveyId === clientUuid && resumeOffer.affectedArea === drawingAffectedArea && resumeOffer.areaCount === affectedAreas.length;
  useEffect(() => {
    if (!resumeOffer || resumeOffer.lasting) return;
    const timer = setTimeout(() => setResumeOffer(null), WALK_RESUME_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [resumeOffer]);
  const validation = useMemo(() => validateSurveyWaypoints(waypoints), [waypoints]);
  const validityMarks = useMemo(() => assessValidity(waypoints, affectedAreas), [waypoints, affectedAreas]);
  const subdivisionResult = useMemo(() => {
    if (!subdividing || !validation.valid || cutLines.length === 0) return null;
    return subdividePlot(waypoints, cutLines);
  }, [cutLines, subdividing, validation.valid, waypoints]);
  const subdivisionPieces = useMemo(
    () => (subdivisionResult?.ok ? subdivisionResult.pieces : []),
    [subdivisionResult],
  );
  useEffect(() => {
    subdivisionPiecesRef.current = subdivisionPieces;
  }, [subdivisionPieces]);
  const selectedSubdivisionPieces = useMemo(
    () => subdivisionPieces.filter((piece) => selectedPieceIds.includes(piece.id)),
    [selectedPieceIds, subdivisionPieces],
  );
  const subdivisionSelectionSummary = useMemo(() => {
    if (!subdividing || !validation.valid || selectedSubdivisionPieces.length === 0) return null;
    return measureSubdivisionSelection(validation.polygon, validation.areaSqm, selectedSubdivisionPieces, affectedAreas);
  }, [affectedAreas, selectedSubdivisionPieces, subdividing, validation]);
  const wholePlotSelected = useMemo(() => isWholePlotAffected(shape), [shape]);
  const placingCut = subdividing && (addingCut || activeCut.length > 0 || subdivisionPieces.length < 2);
  // Drawing an affected area supersedes a "none found" confirmation, so it can never survive alongside one.
  const zeroConfirmedNow = affectedZeroConfirmed && affectedAreas.length === 0 && affectedWaypoints.length === 0;
  const affectedMeasurement = useMemo(() => validation.valid
    ? measureAffectedAreas(validation.polygon, affectedAreas, { confirmedZero: zeroConfirmedNow })
    : null, [affectedAreas, validation, zeroConfirmedNow]);
  // The affected-area rejection shown after a refused submit is stale once the areas are repaired.
  const submitRejectionRef = useRef<string | null>(null);
  useEffect(() => {
    const rejection = submitRejectionRef.current;
    if (!rejection || !affectedMeasurement?.valid) return;
    submitRejectionRef.current = null;
    setSyncMessage((current) => (current === rejection ? null : current));
  }, [affectedMeasurement]);
  // Clear the "complete whole plot first" warning as soon as the plot becomes valid (derived, no effect cascade).
  const activeMapFeedback = mapFeedback?.text === FIELD_SURVEY_COPY.plotRequiredForAffected && validation.valid
    ? null
    : mapFeedback;
  const tileTemplate = getConfiguredMapTileUrlTemplate();
  const tiles = useMemo(() => getMapTiles(
    center,
    zoom,
    viewport.width + SURVEY_MAP_OVERSCAN * 2,
    viewport.height + SURVEY_MAP_OVERSCAN * 2,
    tileTemplate,
  ), [center, tileTemplate, viewport.height, viewport.width, zoom]);
  // Cached tiles show offline or when expired; stale ones refresh in the background when online.
  const { diagnostic: tileDiagnostic, missing: missingTiles, reportTileError, sources: tileSources } = useTileSources(tiles, tileTemplate, {
    authToken: session?.token ?? null,
    isOnline,
  });

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
        setLabel(previous.label ?? '');
        setOutlineFromRemoteId(previous.outlineFromRemoteId ?? null);
        setAffectedZeroConfirmed(isConfirmedZeroSurvey(previous));
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
        setSaveState('saved');
        showStoredRow(previous, screenStateForRow(previous));
      } else if (surveyId && forReport) {
        // A report opened a new measurement under the identity it already links to.
        setClientUuid(surveyId);
        setScreenState(NEW_BOUNDARY_SCREEN);
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
  }, [database, fitMapToShape, forReport, ready, session?.user.uuid, setShape, showStoredRow, surveyId]);

  // Autosave: an edit makes it unsaved, the write makes it saving, then saved or failed. Only an edited, editable screen writes.
  const loaded = mode !== 'loading';
  const editable = !controlsLocked;
  useEffect(() => {
    if (!canAuthorSurvey || !loaded || !hasEdited || !ready || !database || !session?.user.uuid || !editable) return;
    let cancelled = false;
    let started = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      started = true;
      setSaveState('saving');
      return saveFieldSurveyDraft(database, {
        clientUuid,
        ownerIdentity: session.user.uuid,
        authorRole: session.user.role,
        districtCode: districtCode.trim() || 'UNSPECIFIED',
        label,
        outlineFromRemoteId,
        waypoints,
        affectedAreaPolygons: affectedAreas,
        affectedAreaWaypoints: affectedAreaWaypointSets,
        activeAffectedWaypoints: affectedWaypoints,
        affectedZeroConfirmed: zeroConfirmedNow,
        capturedAt: new Date().toISOString(),
        ...(replacedReportSurveyUuid
          ? { relinkReport: { reportId: reportId ?? null, replacedSurveyUuid: replacedReportSurveyUuid } }
          : {}),
      });
    }).then(() => {
      if (!cancelled && started) setSaveState('saved');
    }).catch(() => {
      if (!cancelled) setSaveState('failed');
    });
    return () => { cancelled = true; };
  }, [affectedAreas, affectedAreaWaypointSets, affectedWaypoints, canAuthorSurvey, clientUuid, database, districtCode, editable, hasEdited, label, loaded, outlineFromRemoteId, ready, replacedReportSurveyUuid, reportId, saveAttempt, session?.user.role, session?.user.uuid, waypoints, zeroConfirmedNow]);

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
        const rejection = result.message || FIELD_SURVEY_COPY.moveRefused;
        setSyncMessage(rejection);
        setMapFeedback({ tone: 'danger', text: rejection });
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

  function updateSubdivisionFeedback(lines: MapCoordinate[][]) {
    if (lines.length === 0) {
      setMapFeedback({ tone: 'info', text: FIELD_SURVEY_COPY.divideStarted });
      return;
    }
    const result = subdividePlot(shapeRef.current.waypoints, lines);
    if (result.ok) {
      setMapFeedback({ tone: 'info', text: FIELD_SURVEY_COPY.dividePiecesReady(result.pieces.length) });
    } else {
      setMapFeedback({
        tone: result.code === 'SELF_INTERSECTING_CUT' ? 'danger' : 'warning',
        text: result.message,
      });
    }
  }

  function updateSubdivisionCuts(
    nextLines: MapCoordinate[][],
    options: { clearSelection?: boolean; updateFeedback?: boolean } = {},
  ) {
    const previousSelected = subdivisionPiecesRef.current.filter((piece) =>
      selectedPieceIdsRef.current.includes(piece.id));
    setCutLinesSync(nextLines);
    if (nextLines.length === 0) {
      subdivisionPiecesRef.current = [];
      setSelectedPieceIdsSync([]);
      if (options.updateFeedback) {
        setMapFeedback({ tone: 'info', text: FIELD_SURVEY_COPY.divideStarted });
      }
      return;
    }
    const result = subdividePlot(shapeRef.current.waypoints, nextLines);
    if (result.ok) {
      subdivisionPiecesRef.current = result.pieces;
      if (options.clearSelection) {
        setSelectedPieceIdsSync([]);
      } else if (previousSelected.length > 0) {
        setSelectedPieceIdsSync(remapSelectedPieceIds(previousSelected, result.pieces));
      }
      if (options.updateFeedback) {
        setMapFeedback({ tone: 'info', text: FIELD_SURVEY_COPY.dividePiecesReady(result.pieces.length) });
      }
    } else {
      subdivisionPiecesRef.current = [];
      setSelectedPieceIdsSync([]);
      if (options.updateFeedback) {
        setMapFeedback({
          tone: result.code === 'SELF_INTERSECTING_CUT' ? 'danger' : 'warning',
          text: result.message,
        });
      }
    }
  }

  function addCutPoint(coordinate: MapCoordinate) {
    if (controlsLocked || walking || !subdividing) return;
    if (activeCut.length === 0) {
      setActiveCut([coordinate]);
      setMapFeedback({ tone: 'info', text: FIELD_SURVEY_COPY.divideSecondPoint });
      return;
    }
    const completedCut = [...activeCut, coordinate];
    const nextCuts = addingCut ? [...cutLinesRef.current, completedCut] : [completedCut];
    setActiveCut([]);
    setAddingCut(false);
    updateSubdivisionCuts(nextCuts, { clearSelection: true, updateFeedback: true });
  }

  function toggleSubdivisionPiece(pieceId: string) {
    if (controlsLocked || walking || !subdividing) return;
    const current = selectedPieceIdsRef.current;
    const next = current.includes(pieceId) ? current.filter((id) => id !== pieceId) : [...current, pieceId];
    setSelectedPieceIdsSync(next);
  }

  function insertCutBend(cutIndex: number, segmentIndex: number) {
    if (controlsLocked || walking || !subdividing) return;
    const current = cutLinesRef.current;
    const line = current[cutIndex];
    if (!line) return;
    const bent = insertBendPointOnCut(line, segmentIndex);
    if (bent === line) return;
    const next = current.map((entry, index) => (index === cutIndex ? bent : entry));
    setAddingCut(false);
    setActiveCut([]);
    updateSubdivisionCuts(next, { updateFeedback: true });
  }

  function beginCutDrag(cutIndex: number, pointIndex: number) {
    if (controlsLocked || walking || !subdividing) return;
    const point = cutLinesRef.current[cutIndex]?.[pointIndex];
    if (!point) return;
    cutDragRef.current = { cutIndex, pointIndex, grabbed: point };
  }

  function dragCutTo(translationX: number, translationY: number) {
    const drag = cutDragRef.current;
    if (!drag) return;
    const anchor = coordinateToViewportPoint(center, drag.grabbed, zoom, viewport.width, viewport.height);
    const coordinate = coordinateAtViewportPoint(center, zoom, viewport.width, viewport.height, anchor.x + translationX, anchor.y + translationY);
    const next = cutLinesRef.current.map((line, cutIndex) =>
      cutIndex === drag.cutIndex
        ? line.map((point, pointIndex) => (pointIndex === drag.pointIndex ? coordinate : point))
        : line);
    updateSubdivisionCuts(next, { updateFeedback: false });
  }

  function endCutDrag() {
    const drag = cutDragRef.current;
    cutDragRef.current = null;
    if (!drag) return;
    updateSubdivisionFeedback(cutLinesRef.current);
  }

  function startSubdivision() {
    if (controlsLocked || walking) return;
    if (!validation.valid) {
      setDrawingAffectedArea(true);
      setMapFeedback({ tone: 'warning', text: FIELD_SURVEY_COPY.plotRequiredForAffected });
      return;
    }
    if (shapeRef.current.affectedWaypoints.length > 0) {
      setMapFeedback({ tone: 'warning', text: FIELD_SURVEY_COPY.divideCloseOpenFirst });
      return;
    }
    stopWalk(null);
    setDrawingAffectedArea(true);
    setSelected(null);
    setSelectedArea(null);
    setSyncMessage(null);
    setWalkNotice(null);
    cutDragRef.current = null;
    subdivisionPiecesRef.current = [];
    setCutLinesSync([]);
    setActiveCut([]);
    setSelectedPieceIdsSync([]);
    setAddingCut(false);
    setSubdividing(true);
    setMapFeedback({ tone: 'info', text: FIELD_SURVEY_COPY.divideStarted });
  }

  function cancelSubdivision() {
    exitSubdivision();
    setMapFeedback(null);
  }

  function startAdditionalCut() {
    if (controlsLocked || walking || !subdividing) return;
    setAddingCut(true);
    setActiveCut([]);
    setMapFeedback({ tone: 'info', text: FIELD_SURVEY_COPY.divideAddCutPrompt });
  }

  function clearCutLines() {
    if (controlsLocked || walking || !subdividing) return;
    cutDragRef.current = null;
    subdivisionPiecesRef.current = [];
    setCutLinesSync([]);
    setActiveCut([]);
    setSelectedPieceIdsSync([]);
    setAddingCut(false);
    setMapFeedback({ tone: 'info', text: FIELD_SURVEY_COPY.divideStarted });
  }

  function applySubdivision() {
    if (controlsLocked || walking || !subdividing) return;
    const result = applySubdivisionSelection(shapeRef.current, selectedSubdivisionPieces);
    if (!result.ok) {
      setSyncMessage(result.message);
      setMapFeedback({ tone: 'danger', text: result.message });
      return;
    }
    exitSubdivision();
    setSelected(null);
    setSelectedArea(null);
    setSyncMessage(null);
    setWalkNotice(null);
    setResumeOffer(null);
    if (result.addedCount > 0) {
      commitShape(result.shape);
      setMapFeedback({ tone: 'success', text: FIELD_SURVEY_COPY.divideApplied(result.addedCount) });
    } else {
      setMapFeedback({ tone: 'info', text: FIELD_SURVEY_COPY.divideAlreadyApplied });
    }
  }

  function markWholePlotAffected() {
    if (controlsLocked || walking) return;
    if (!validation.valid) {
      setDrawingAffectedArea(true);
      setMapFeedback({ tone: 'warning', text: FIELD_SURVEY_COPY.plotRequiredForAffected });
      return;
    }
    stopWalk(null);
    exitSubdivision();
    setDrawingAffectedArea(true);
    setSelected(null);
    setSelectedArea(null);
    setSyncMessage(null);
    setWalkNotice(null);
    setResumeOffer(null);
    const result = applyWholePlotAffected(shapeRef.current);
    if (!result.ok) {
      setSyncMessage(result.message);
      setMapFeedback({ tone: 'danger', text: result.message });
      return;
    }
    if (result.alreadyWhole) {
      setMapFeedback({ tone: 'info', text: FIELD_SURVEY_COPY.wholePlotAlreadyMarked });
      return;
    }
    commitShape(result.shape);
    setMapFeedback({
      tone: 'success',
      text: result.replacedExisting ? FIELD_SURVEY_COPY.wholePlotReplaced : FIELD_SURVEY_COPY.wholePlotMarked,
    });
  }

  function addMapPointAt(point: { x: number; y: number }) {
    // walkRef is read live: a tap measured just before Walk started finishes after this render's `walking` is stale.
    if (controlsLocked || walking || walkRef.current) return;
    if (subdividing) {
      const coordinate = coordinateAtViewportPoint(center, zoom, viewport.width, viewport.height, point.x, point.y);
      if (!placingCut) {
        const hit = subdivisionPieces.find((piece) => pointInPiece(coordinate, piece));
        if (hit) toggleSubdivisionPiece(hit.id);
        return;
      }
      addCutPoint(coordinate);
      return;
    }
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
        const rejection = result.message || FIELD_SURVEY_COPY.moveRefused;
        setSyncMessage(rejection);
        setMapFeedback({ tone: 'danger', text: rejection });
      }
      return;
    }
    addOrMovePoint(coordinate.latitude, coordinate.longitude, 'map', null);
  }

  // Places a point exactly under the cross at the map centre: precise, and the finger never hides the spot.
  function addPointAtCenter() {
    if (controlsLocked || walking) return;
    if (subdividing) {
      if (placingCut) addCutPoint(center);
      return;
    }
    if (selected) {
      const result = movePoint(shapeRef.current, selected, center);
      if (result.ok) {
        commitShape(result.shape);
        setSelected(null);
        setFieldErrors({});
      } else {
        const rejection = result.message || FIELD_SURVEY_COPY.moveRefused;
        setSyncMessage(rejection);
        setMapFeedback({ tone: 'danger', text: rejection });
      }
      return;
    }
    addOrMovePoint(center.latitude, center.longitude, 'map', null);
  }

  function handleMapPress(event: GestureResponderEvent) {
    const gesture = mapGestureRef.current;
    if (gesture.active || Date.now() - gesture.endedAt < GESTURE_TAP_GUARD_MS) return;
    const native = event.nativeEvent as GestureResponderEvent['nativeEvent'] & { clientX?: number; clientY?: number; offsetX?: number; offsetY?: number };
    const { clientX, clientY, locationX, locationY, offsetX, offsetY, pageX, pageY } = native;
    const fallback = () => {
      if (Number.isFinite(locationX) && Number.isFinite(locationY)) addMapPointAt({ x: locationX, y: locationY });
      else if (typeof offsetX === 'number' && typeof offsetY === 'number') addMapPointAt({ x: offsetX, y: offsetY });
    };
    // locationX/Y can be relative to whichever child was touched, which put points off the finger.
    // Measure the map at tap time and use window coordinates instead, as the location picker does.
    const node = mapRef.current;
    if (process.env.NODE_ENV !== 'test' && node && typeof node.measureInWindow === 'function') {
      const border = expanded ? 0 : MAP_BORDER_WIDTH;
      node.measureInWindow((x, y) => {
        // On web measureInWindow is viewport-relative, so pair it with clientX/Y (pageX/Y include page scroll).
        const point = viewportPointFromPressEvent({
          ...event,
          nativeEvent: { ...native, pageX: clientX ?? pageX, pageY: clientY ?? pageY },
        }, { x: x + border, y: y + border });
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
      if (drag.refused) {
        setSyncMessage(FIELD_SURVEY_COPY.moveRefused);
        setMapFeedback({ tone: 'danger', text: FIELD_SURVEY_COPY.moveRefused });
      }
      return;
    }
    const undoBase = drag.undoBase;
    setHistory((current) => pushUndo(current, undoBase));
    markEdited();
    setSelected(drag.ref);
    setFieldErrors({});
    if (drag.refused) {
      setSyncMessage(FIELD_SURVEY_COPY.moveRefused);
      setMapFeedback({ tone: 'danger', text: FIELD_SURVEY_COPY.moveRefused });
    } else {
      setMapFeedback(null);
    }
  }

  function insertAfter(ref: PointRef, edge: number) {
    if (controlsLocked) return;
    const result = insertPointOnEdge(shape, ref, edge);
    if (!result.ok) {
      if (result.message) {
        setSyncMessage(result.message);
        setMapFeedback({ tone: 'danger', text: result.message });
      }
      return;
    }
    commitShape(result.shape);
    setSelected(ref.set === 'area' ? { set: 'area', area: ref.area, index: edge + 1 } : { set: ref.set, index: edge + 1 });
  }

  function undoLast() {
    if (controlsLocked) return;
    const undone = undoForTarget(shapeRef.current, history, drawingAffectedArea);
    if (!undone) return;
    markEdited();
    setSelected(null);
    setMapFeedback(null);
    setHistory(undone.history);
    setShape(undone.shape);
  }

  function removeAreaAt(area: number) {
    if (controlsLocked) return;
    stopWalk();
    commitShape(removeAffectedAreaAt(shapeRef.current, area));
    setSelected(null);
    setSelectedArea(null);
  }

  async function captureGpsWaypoint() {
    if (controlsLocked || subdividing) return;
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
    const target = walk.affectedArea ? live.affectedWaypoints : live.waypoints;
    walk.last = target.at(-1) ?? null;
    const decision = decideWalkFix(fix, walk.last, { lastGood: walk.lastGood, rejectedJump: walk.jumpSeen });
    const readable = Number.isFinite(fix.latitude) && Number.isFinite(fix.longitude);
    const mark = { latitude: fix.latitude, longitude: fix.longitude, timestamp: fix.timestamp };
    if (decision.action === 'skip' && decision.reason === 'jump') {
      // A reading that cannot be a walker is ignored everywhere: not a point, not a corner or final fix, not the dot.
      walk.jumpSeen = mark;
      return;
    }
    if (decision.action === 'accept' || (decision.action === 'skip' && decision.reason === 'too_close')) {
      walk.lastGood = mark;
      walk.jumpSeen = null;
    }
    if (readable) {
      walk.latest = fix;
      walk.recent = [...walk.recent.filter((earlier) => fix.timestamp - earlier.timestamp <= WALK_CORNER_WINDOW_MS * 2), fix];
    }
    const usable = decision.action === 'accept' || (decision.action === 'skip' && decision.reason === 'too_close');
    let pointCount = target.length;
    // Best of the window: a clearly better reading of the point just added replaces it instead of being dropped as too close.
    if (decision.action !== 'accept' && walk.refine) {
      walk.refine.readings += 1;
      const lastPoint = target.at(-1);
      if (decision.action === 'skip' && decision.reason === 'too_close' && lastPoint
        && lastPoint.latitude === walk.refine.waypoint.latitude && lastPoint.longitude === walk.refine.waypoint.longitude) {
        const better = refineWalkPoint(lastPoint, fix, walk.refine.readings);
        if (better) {
          const plot = walk.affectedArea ? validateSurveyWaypoints(live.waypoints) : null;
          const nextPoint = plot?.valid ? snapAffectedAreaWaypoints(plot.polygon, [better])[0] : better;
          const key = walk.affectedArea ? 'affectedWaypoints' : 'waypoints';
          setShape({ ...live, [key]: [...target.slice(0, -1), nextPoint] });
          markEdited();
          walk.last = nextPoint;
          walk.refine = { waypoint: nextPoint, readings: walk.refine.readings };
        }
      }
      if (walk.refine.readings >= 2) walk.refine = null;
    }
    const minLoopMeters = walk.affectedArea ? WALK_AFFECTED_NEAR_START_MIN_METERS : WALK_NEAR_START_MIN_METERS;
    // A reading back on the first point after a real loop completes the boundary; adding it would only stack a vertex on the start.
    const closesLoop = decision.action === 'accept' && walk.last !== null
      && isBackAtStart(fix, target[0] ?? null, target.length, walk.walkedMeters + distanceMeters(walk.last, decision.waypoint), minLoopMeters);
    if (decision.action === 'accept' && !closesLoop) {
      if (walk.last) walk.walkedMeters += distanceMeters(walk.last, decision.waypoint);
      walk.last = decision.waypoint;
      walk.added += 1;
      walk.refine = { waypoint: decision.waypoint, readings: 0 };
      pointCount += 1;
      walkHaptic('point');
      setWalkGuideOpen(false);
      applyCapturedWaypoint(walk.affectedArea ? { affectedArea: true, areaCount: walk.areaCount, replace: null } : { affectedArea: false, areaCount: walk.areaCount, replace: null }, decision.waypoint);
      if (!walk.affectedArea) setFieldErrors({});
    }
    // One place decides what the pill says: waiting for GPS, weak signal, back at the start, or the normal walking line.
    const weak = decision.action === 'skip' && decision.reason === 'weak_accuracy';
    const backAtStart = usable && isBackAtStart(fix, target[0] ?? (decision.action === 'accept' ? decision.waypoint : null), pointCount, walk.walkedMeters, minLoopMeters);
    let notice: string | null = null;
    if (weak) {
      if (!walk.weakSignal) {
        notice = FIELD_SURVEY_COPY.walkWeakSignal;
        walkHaptic('weak');
      }
      walk.weakSignal = true;
    } else if (usable) {
      if (walk.weakSignal || !walk.locked) notice = FIELD_SURVEY_COPY.walkActive;
      walk.weakSignal = false;
      walk.locked = true;
    }
    if (usable && backAtStart !== walk.backAtStart) {
      walk.backAtStart = backAtStart;
      setWalkBackAtStart(backAtStart);
      notice = backAtStart ? FIELD_SURVEY_COPY.walkBackAtStart : FIELD_SURVEY_COPY.walkActive;
      if (backAtStart) walkHaptic('backAtStart');
    }
    if (notice !== null) {
      setSyncMessage(notice);
      setWalkNotice(notice);
    }
    if (!readable) return;
    // The fix itself, not just an accepted point, moves the readout; the first point's distance is to the start of the boundary.
    setWalkLive({ fix, walkedMeters: walk.walkedMeters, toStartMeters: distanceToStart(fix, target[0] ?? (decision.action === 'accept' ? decision.waypoint : null)) });
    if (walkFollowRef.current) setCenter({ latitude: fix.latitude, longitude: fix.longitude });
  }
  useEffect(() => { walkFixHandlerRef.current = handleWalkFix; });

  // Where the walker stood when they stopped is part of the boundary, unless it would only repeat a point.
  function addFinalFix() {
    const walk = walkRef.current;
    if (!walk || !walk.started) return;
    const live = shapeRef.current;
    const target = walk.affectedArea ? live.affectedWaypoints : live.waypoints;
    const final = decideFinalFix(walk.latest, target.at(-1) ?? null, target[0] ?? null, Date.now());
    if (!final) return;
    walk.added += 1;
    applyCapturedWaypoint({ affectedArea: walk.affectedArea, areaCount: walk.areaCount, replace: null }, final);
    if (!walk.affectedArea) setFieldErrors({});
  }

  // The walked stretch loses the points that only restate a straight edge. One Undo brings the raw walk back.
  function tidyWalkedLine(walk: WalkSession, finished: boolean): number {
    const live = shapeRef.current;
    const key = walk.affectedArea ? 'affectedWaypoints' : 'waypoints';
    const set = live[key];
    // The point before the walk's first one stays as the stretch's anchor, so earlier points are never touched.
    const from = Math.max(0, walk.startCount - 1);
    const segment = set.slice(from);
    if (segment.length < 4) return 0;
    const minPoints = finished && set.length >= 3 ? Math.max(0, 3 - from) : undefined;
    const tidy = simplifyWalkSegment(segment, undefined, minPoints ? { minPoints } : undefined);
    if (tidy.length === segment.length) return 0;
    commitShape({ ...live, [key]: [...set.slice(0, from), ...tidy] });
    return segment.length - tidy.length;
  }

  // Stopping on purpose: add where the walker stood, tidy the straight edges, then say what was kept.
  function endWalkOnPurpose(finished: boolean) {
    const walk = walkRef.current;
    if (!walk) return;
    addFinalFix();
    const removed = walk.started ? tidyWalkedLine(walk, finished) : 0;
    const net = Math.max(0, walk.added - removed);
    const tidyNote = removed > 0 ? FIELD_SURVEY_COPY.walkTidied(removed) : '';
    const stoppedOpen = !finished && walk.affectedArea && shapeRef.current.affectedWaypoints.length >= 3;
    const message = `${finished ? FIELD_SURVEY_COPY.walkFinished(net) : FIELD_SURVEY_COPY.walkStopped(net)}${tidyNote}${stoppedOpen ? ` ${FIELD_SURVEY_COPY.affectedAreaStillOpen}` : ''}`;
    stopWalk(message, 'brief');
    // Finish on an affected area closes it, or the walked points would stay open and the report would read "not measured".
    if (finished && walk.affectedArea) {
      if (shapeRef.current.affectedWaypoints.length >= 3) {
        const failure = closeAffectedArea();
        const notice = failure ?? `${message}${FIELD_SURVEY_COPY.walkAreaClosed}`;
        setSyncMessage(notice);
        setWalkNotice(notice);
        setMapFeedback(failure ? { tone: 'danger', text: failure } : null);
        if (failure === null) setResumeOffer(null);
      } else {
        setSyncMessage(FIELD_SURVEY_COPY.affectedAreaTooFewToClose);
        setWalkNotice(FIELD_SURVEY_COPY.affectedAreaTooFewToClose);
        setMapFeedback({ tone: 'warning', text: FIELD_SURVEY_COPY.affectedAreaTooFewToClose });
      }
    }
  }

  function markCorner() {
    const walk = walkRef.current;
    if (!walk || !walk.started || controlsLocked) return;
    const live = shapeRef.current;
    const key = walk.affectedArea ? 'affectedWaypoints' : 'waypoints';
    const target = live[key];
    const decision = decideMarkCorner(walk.recent, target.at(-1) ?? null, Date.now());
    if (decision.action === 'none') {
      setSyncMessage(FIELD_SURVEY_COPY.walkNoCornerFix);
      setWalkNotice(FIELD_SURVEY_COPY.walkNoCornerFix);
      return;
    }
    if (decision.action === 'mark_last') {
      const last = target.at(-1);
      if (last && !last.isCorner) commitShape({ ...live, [key]: [...target.slice(0, -1), { ...last, isCorner: true }] });
    } else {
      if (walk.last) walk.walkedMeters += distanceMeters(walk.last, decision.waypoint);
      walk.last = decision.waypoint;
      walk.added += 1;
      applyCapturedWaypoint({ affectedArea: walk.affectedArea, areaCount: walk.areaCount, replace: null }, decision.waypoint);
      if (!walk.affectedArea) setFieldErrors({});
    }
    walkHaptic('corner');
    setSyncMessage(FIELD_SURVEY_COPY.walkCornerMarked);
    setWalkNotice(FIELD_SURVEY_COPY.walkCornerMarked);
  }

  function finishWalk() {
    endWalkOnPurpose(true);
  }

  async function toggleWalk() {
    if (walkRef.current) {
      endWalkOnPurpose(false);
      return;
    }
    if (controlsLocked || gpsBusy || subdividing) return;
    setResumeOffer(null);
    const affectedArea = drawingAffectedArea;
    const session: WalkSession = {
      affectedArea,
      areaCount: shapeRef.current.affectedAreas.length,
      surveyId: clientUuid,
      added: 0,
      walkedMeters: 0,
      started: false,
      weakSignal: false,
      locked: false,
      recent: [],
      latest: null,
      backAtStart: false,
      startCount: (affectedArea ? shapeRef.current.affectedWaypoints : shapeRef.current.waypoints).length,
      lastGood: null,
      jumpSeen: null,
      refine: null,
      last: (affectedArea ? shapeRef.current.affectedWaypoints : shapeRef.current.waypoints).at(-1) ?? null,
      stop: () => undefined,
    };
    walkRef.current = session;
    walkFollowRef.current = true;
    setWalkFollow(true);
    setWalkLive(null);
    setSelected(null);
    setWalking(true);
    setGpsBusy(true);
    setWalkNotice(FIELD_SURVEY_COPY.walkStarting);
    try {
      const result = await startWalk(
        expoWalkLocationClient,
        (fix) => walkFixHandlerRef.current(fix),
        () => stopWalk(FIELD_SURVEY_COPY.walkLost, 'lasting'),
      );
      if (walkRef.current !== session) {
        if (result.status === 'started') result.stop();
        return;
      }
      if (result.status !== 'started') {
        stopWalk(null);
        const failure = walkFailureMessage(result.status);
        setSyncMessage(failure);
        setWalkNotice(failure);
        return;
      }
      session.stop = result.stop;
      session.started = true;
      if (AppState.currentState === 'background') {
        stopWalk(undefined, 'lasting');
        return;
      }
      holdScreenAwake();
      // A first walk gets a five-step guide once; any later walk starts straight at the lock message.
      void shouldShowWalkGuide().then((show) => {
        if (!show) return;
        void markWalkGuideSeen();
        if (walkRef.current === session && session.added === 0) setWalkGuideOpen(true);
      });
      // Until the first usable reading the walker stands still at the starting corner.
      setSyncMessage(FIELD_SURVEY_COPY.walkLocking);
      setWalkNotice(FIELD_SURVEY_COPY.walkLocking);
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
      setFieldErrors({ district_code: [FIELD_SURVEY_COPY.districtMissing] });
      return;
    }
    if (subdividing || affectedWaypoints.length > 0) {
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
    // The authoring bound, checked at the moment of finishing.
    const provenance = readAuthoringBound(auth);
    if (provenance === null) {
      setSyncMessage(AUTHORING_WINDOW_COPY.ended);
      return;
    }
    try {
      markFieldSurveyPending(database, clientUuid, session.user.uuid, districtCode, validation.polygon, validation.areaSqm, waypoints.at(-1)?.capturedAt ?? new Date().toISOString(), affectedAreas, affectedMeasurement.areaSqm, affectedAreaWaypointSets, provenance ?? null);
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
    const next = showStoredRow(row, row ? screenStateForRow(row) : WAITING_TO_SEND_SCREEN);
    if (next.mode === 'sent') showToast(FIELD_SURVEY_SYNC_COPY.synced, 'success');
    else if (failure) setSyncMessage(failure);
    else if (result?.authRequired) setSyncMessage(FIELD_SURVEY_SYNC_COPY.signInRequired);
    else if (isOnline === false && next.mode === 'waiting_to_send') setSyncMessage(FIELD_SURVEY_SYNC_COPY.offline);
  }

  // Closes the open affected boundary into a measured area. Reads the live shape, not render state, so a walk that
  // has just added its last point can close in the same tick. Returns an error message, or null once closed.
  function closeAffectedArea(): string | null {
    const current = shapeRef.current;
    const plot = validateSurveyWaypoints(current.waypoints);
    if (!plot.valid) return plot.error.code === 'TOO_FEW_VERTICES' ? FIELD_SURVEY_COPY.plotRequiredForAffected : plot.error.message;
    const snappedWaypoints = snapAffectedAreaWaypoints(plot.polygon, current.affectedWaypoints);
    const candidate = validateSurveyWaypoints(snappedWaypoints);
    if (!candidate.valid) return candidate.error.message;
    const result = measureAffectedAreas(plot.polygon, [candidate.polygon]);
    if (!result.valid) {
      if (result.error.code === 'OUTSIDE_PLOT') {
        const outside = describeOutsidePlot(plot.polygon, snappedWaypoints);
        if (outside) return FIELD_SURVEY_COPY.affectedAreaOutsidePlot(outside.count, outside.maxMeters);
      }
      return result.error.message;
    }
    const nextAreas = [...current.affectedAreas, candidate.polygon];
    const nextSets = [...current.affectedAreaWaypointSets, snappedWaypoints];
    const provenanceCheck = validateAffectedAreaWaypoints(nextAreas, nextSets);
    if (!provenanceCheck.valid) return provenanceCheck.error.message;
    const combined = measureAffectedAreas(plot.polygon, nextAreas);
    if (!combined.valid) return combined.error.message;
    stopWalk();
    commitShape({
      ...current,
      affectedAreas: nextAreas,
      affectedAreaWaypointSets: nextSets,
      affectedWaypoints: [],
    });
    setSelected(null);
    return null;
  }

  function finishAffectedArea() {
    const failure = closeAffectedArea();
    if (failure) {
      setSyncMessage(failure);
      setMapFeedback({ tone: 'danger', text: failure });
      return;
    }
    setSyncMessage(null);
    setWalkNotice(null);
    setResumeOffer(null);
    setMapFeedback({ tone: 'success', text: FIELD_SURVEY_COPY.affectedAreaClosed });
  }

  function removeSelected() {
    if (!selected) return;
    const result = removePoint(shapeRef.current, selected);
    if (!result.ok) {
      const rejection = result.message || FIELD_SURVEY_COPY.moveRefused;
      setSyncMessage(rejection);
      setMapFeedback({ tone: 'danger', text: rejection });
      return;
    }
    commitShape(result.shape);
    setSelected(null);
  }

  // "No affected area found": an explicit measured zero. Tapping again returns to not measured.
  function toggleAffectedZero() {
    if (controlsLocked || !validation.valid || affectedAreas.length > 0 || affectedWaypoints.length > 0) return;
    stopWalk();
    setAffectedZeroConfirmed((current) => !current);
    markEdited();
  }

  // Starts a NEW map from an earlier plot edge: the outline is copied, the damage never is.
  function applyOutline(source: { name: string | null; remoteId: string | null; waypoints: SurveyWaypoint[] }) {
    stopWalk();
    exitSubdivision();
    const next: DrawingShape = { ...EMPTY_SHAPE, waypoints: source.waypoints };
    commitShape(next);
    setOutlineFromRemoteId(source.remoteId);
    if (source.name && !label.trim()) setLabel(source.name);
    setDrawingAffectedArea(false);
    setAffectedZeroConfirmed(false);
    setSelected(null);
    setSelectedArea(null);
    setSyncMessage(FIELD_SURVEY_COPY.outlineUsed);
    if (layoutRef.current) fitMapToShape(next, layoutRef.current);
    else fitRequested.current = true;
  }
  const applyOutlineRef = useRef(applyOutline);
  useEffect(() => { applyOutlineRef.current = applyOutline; });
  const screenAlive = useRef(true);
  useEffect(() => {
    screenAlive.current = true;
    return () => { screenAlive.current = false; };
  }, []);
  // A visit opened this screen: fetch that case's map once and start from its outline.
  const outlineSeeded = useRef(false);
  useEffect(() => {
    if (!outlineFrom || outlineSeeded.current || mode === 'loading' || !session?.token || !canAuthorSurvey) return;
    outlineSeeded.current = true;
    if (shapeRef.current.waypoints.length > 0) return;
    fetchAssignmentFieldMap(outlineFrom, session.token).then((map) => {
      if (!screenAlive.current) return;
      const seeded = map ? waypointsFromOutline(map.polygon, new Date().toISOString()) : null;
      if (!map || !seeded) {
        setSyncMessage(FIELD_SURVEY_COPY.outlineFetchFailed);
        return;
      }
      applyOutlineRef.current({ name: map.label, remoteId: String(map.fieldSurveyId), waypoints: seeded });
    }).catch(() => {
      if (screenAlive.current) setSyncMessage(FIELD_SURVEY_COPY.outlineFetchFailed);
    });
  }, [canAuthorSurvey, mode, outlineFrom, session?.token]);
  // The inspector's own earlier maps, offered while this plot is still empty.
  const earlierOutlines = useMemo<ReusableOutline[]>(() => {
    if (!database || !session?.user.uuid || waypoints.length > 0) return [];
    try {
      return reusableOutlines(listEarlierMapRows(database, session.user.uuid), clientUuid);
    } catch {
      return [];
    }
  }, [clientUuid, database, session?.user.uuid, waypoints.length]);

  // Standing at a field the inspector measured before: offer its plot edge, nearest map first.
  const measuredBefore = useMemo<ReusableOutline | null>(() => {
    if (!myLocation || measuredBeforeDismissed || waypoints.length > 0) return null;
    let best: { outline: ReusableOutline; distance: number } | null = null;
    for (const outline of earlierOutlines) {
      if (!isAtPlot(outline.waypoints, myLocation)) continue;
      const distance = distanceToPlotMeters(outline.waypoints, myLocation) ?? Infinity;
      if (!best || distance < best.distance) best = { outline, distance };
    }
    return best?.outline ?? null;
  }, [earlierOutlines, measuredBeforeDismissed, myLocation, waypoints.length]);

  function switchDrawingTarget(nextAffected: boolean) {
    exitSubdivision();
    setDrawingAffectedArea(nextAffected);
    setSelected(null);
    setSelectedArea(null);
    setSyncMessage(null);
    setWalkNotice(null);
    if (nextAffected && !validation.valid) {
      setMapFeedback({ tone: 'warning', text: FIELD_SURVEY_COPY.plotRequiredForAffected });
    } else {
      setMapFeedback(null);
    }
  }

  // Starts a new editable draft from a completed (sent/pending) whole-plot map while preserving
  // the immutable historical record, carrying the measured plot boundary straight into Affected area mode.
  function measureAffectedFromCompletedPlot() {
    if (!validation.valid) return;
    stopWalk(null);
    exitSubdivision();
    const carriedWaypoints = shapeRef.current.waypoints;
    const inheritedOutlineRemoteId = storedRemoteId ?? outlineFromRemoteId;
    const nextUuid = randomUUID();
    if (forReport && surveyId) {
      recordReplacedReportSurvey(surveyId, nextUuid);
      setReplacedReportSurveyUuid(surveyId);
    }
    const nextShape: DrawingShape = { ...EMPTY_SHAPE, waypoints: carriedWaypoints };
    setResumeOffer(null);
    setStoredRemoteId(null);
    setOutlineFromRemoteId(inheritedOutlineRemoteId);
    setMeasuredBeforeDismissed(true);
    setClientUuid(nextUuid);
    setShape(nextShape);
    setHistory([]);
    setAffectedZeroConfirmed(false);
    setDrawingAffectedArea(true);
    setSelected(null);
    setSelectedArea(null);
    setFieldErrors({});
    setSyncMessage(null);
    setWalkNotice(null);
    setMapFeedback({ tone: 'info', text: FIELD_SURVEY_COPY.completedPlotAffectedStarted });
    setScreenState(NEW_BOUNDARY_SCREEN);
    markEdited();
    if (layoutRef.current) fitMapToShape(nextShape, layoutRef.current);
    else fitRequested.current = true;
  }

  function startNewBoundary() {
    stopWalk(null);
    exitSubdivision();
    setHasEdited(false);
    setLabel('');
    setStoredRemoteId(null);
    setOutlineFromRemoteId(null);
    setMeasuredBeforeDismissed(false);
    setResumeOffer(null);
    setDrawingAffectedArea(false);
    setAffectedZeroConfirmed(false);
    setReplacedReportSurveyUuid(null);
    setClientUuid(randomUUID());
    setShape(EMPTY_SHAPE);
    setHistory([]);
    setSelected(null);
    setSelectedArea(null);
    setFieldErrors({});
    setSyncMessage(null);
    setWalkNotice(null);
    setMapFeedback(null);
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
  // Mount only the active drawing target's handles (plus any deliberately selected finished area)
  // so Whole plot vertices and "+" edge inserts cannot be dragged or inserted while drawing Affected areas.
  const editableSets: { ref: (index: number) => PointRef; points: SurveyWaypoint[]; closed: boolean; label: string }[] = [
    ...(drawingAffectedArea
      ? [{ ref: (index: number): PointRef => ({ set: 'active', index }), points: affectedWaypoints, closed: false, label: 'active' }]
      : [{ ref: (index: number): PointRef => ({ set: 'plot', index }), points: waypoints, closed: true, label: 'plot' }]),
    ...(selectedArea !== null && affectedAreaWaypointSets[selectedArea]
      ? [{ ref: (index: number): PointRef => ({ set: 'area', area: selectedArea, index }), points: affectedAreaWaypointSets[selectedArea], closed: true, label: `area-${selectedArea}` }]
      : []),
  ];
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
  const areaChips = affectedAreas.map((area, index) => {
    const centroid = area.coordinates[0].slice(0, -1).reduce((sum, [longitude, latitude]) => ({ longitude: sum.longitude + longitude, latitude: sum.latitude + latitude }), { longitude: 0, latitude: 0 });
    const count = Math.max(1, area.coordinates[0].length - 1);
    return { index, at: layerPoint({ longitude: centroid.longitude / count, latitude: centroid.latitude / count }) };
  });

  if (!ready) {
    return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.primary} /></SafeAreaView>;
  }

  const strip = statusStripFor(mode);
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
  const toolState = drawingToolState({
    locked: controlsLocked,
    drawingAffectedArea,
    hasSelection: selected !== null,
    selectedSet: selected?.set ?? null,
    activeAffectedCount: affectedWaypoints.length,
    subdividing,
    subdivisionPieceCount: subdivisionPieces.length,
  });
  const undoAvailable = !controlsLocked && canUndoForTarget(shape, history, drawingAffectedArea);
  const canStartAffectedFromCompletedPlot = validation.valid && (mode === 'sent' || mode === 'waiting_to_send');
  const listedPoints = selectedArea !== null && affectedAreaWaypointSets[selectedArea] ? affectedAreaWaypointSets[selectedArea] : drawingAffectedArea ? affectedWaypoints : waypoints;
  const listedRef = (index: number): PointRef => selectedArea !== null && affectedAreaWaypointSets[selectedArea] ? { set: 'area', area: selectedArea, index } : drawingAffectedArea ? { set: 'active', index } : { set: 'plot', index };
  // A report can use the map once the plot is measured, nothing is left open, and the draft is saved.
  const reportReady = !screenCanEdit(mode)
    || (validation.valid && !subdividing && affectedWaypoints.length === 0 && affectedMeasurement?.valid === true && saveState === 'saved');
  const measuredAffectedSqm = validation.valid && affectedMeasurement?.valid ? affectedMeasurement.areaSqm : null;
  const affectedPercentValue = validation.valid && measuredAffectedSqm !== null && measuredAffectedSqm > 0
    ? Math.min(100, (measuredAffectedSqm / validation.areaSqm) * 100)
    : null;
  const affectedPercent = affectedPercentValue !== null
    ? ` (${affectedPercentValue < 0.01 ? '<0.01%' : affectedPercentValue < 0.1 ? `${affectedPercentValue.toFixed(2)}%` : `${affectedPercentValue.toFixed(1)}%`})`
    : '';
  const liveSubdivisionReadout = subdividing && subdivisionSelectionSummary
    ? ` · ${Math.round(subdivisionSelectionSummary.combinedAreaSqm).toLocaleString()} m² selected (${subdivisionSelectionSummary.combinedPercentOfPlot.toFixed(1)}%)`
    : null;
  const affectedReadoutSuffix = liveSubdivisionReadout
    ?? (measuredAffectedSqm !== null && affectedAreas.length > 0
      ? ` · ${measuredAffectedSqm.toFixed(0)} m² affected${affectedPercent}`
      : measuredAffectedSqm === 0
        ? ` · ${FIELD_SURVEY_COPY.noAffectedFoundReadout}`
        : affectedMeasurement && !affectedMeasurement.valid
          ? ` · ${affectedMeasurement.error.message}`
          : '');
  const areaReadout = `${screenValidation}${affectedReadoutSuffix}`;
  // Offered once the plot is measured and nothing affected is drawn or being drawn.
  const canConfirmNoAffected = validation.valid && !expanded && !controlsLocked && affectedAreas.length === 0 && affectedWaypoints.length === 0 && !drawingAffectedArea;
  // One message on the map: what to tap next while drawing, otherwise what state the boundary is in.
  // Open affected points are never measured: say so after a Stop, a reopened draft or tapped points, until the area is closed.
  const openAreaNotice = !walking && drawingAffectedArea && affectedWaypoints.length >= 3 ? FIELD_SURVEY_COPY.affectedAreaStillOpen : null;
  const mapNotice = walkNotice ?? openAreaNotice;
  const showWalkNotice = mapNotice !== null && screenCanEdit(mode);
  // The boundary the walker is adding to: the live segment and the distance to start both read from it.
  const walkTarget = drawingAffectedArea ? affectedWaypoints : waypoints;
  const walkBand = walkLive ? walkAccuracyBand(walkLive.fix.accuracy) : null;
  const showToolHint = !showWalkNotice && (
    mode === 'drawing_new'
    || (mode === 'drawing_resumed' && (hasEdited || drawingAffectedArea || selected !== null || subdividing))
    || ((gpsBusy || subdividing) && screenCanEdit(mode))
  );
  const walkStatusMatchesFeedback = showWalkNotice && activeMapFeedback !== null && mapNotice === activeMapFeedback.text;
  const showFeedbackPill = activeMapFeedback !== null && !walkStatusMatchesFeedback;
  const feedbackPalette = activeMapFeedback ? feedbackColors(activeMapFeedback.tone, theme) : null;
  const statusStripStyle = walkStatusMatchesFeedback && feedbackPalette
    ? { backgroundColor: feedbackPalette.bg, borderColor: feedbackPalette.border }
    : { backgroundColor: theme.surfaceElevated, borderColor: showToolHint || showWalkNotice ? theme.border : theme[SYNC_TONE_COLOR[strip.tone]] };
  const walkStatusTextColor = walkStatusMatchesFeedback && feedbackPalette ? feedbackPalette.text : theme.text;
  const dockSyncNotice = syncMessage && syncMessage !== activeMapFeedback?.text ? syncMessage : null;
  const expandedSyncNotice = expanded && syncMessage
    && syncMessage !== activeMapFeedback?.text
    && (!showWalkNotice || syncMessage !== mapNotice)
    ? syncMessage
    : null;
  const mapNote = isOnline !== true
    ? tileSources.size > 0 ? FIELD_SURVEY_COPY.offlineMapSaved : FIELD_SURVEY_COPY.offlineMap
    : missingTiles.size > 0 || tileFailures.some((key) => tileSources.has(key)) ? `${FIELD_SURVEY_COPY.mapTileError}${tileDiagnostic ? ` [dev: ${tileDiagnostic}]` : ''}` : null;

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
      {expanded ? null : <BrandedScreenHeader title={FIELD_SURVEY_COPY.title} />}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'android' ? 'height' : 'padding'}
        style={styles.body}>
        <View testID="field-survey.map-section" accessibilityValue={{ text: `expanded=${expanded ? 'yes' : 'no'}` }} style={expanded ? styles.mapSectionExpanded : [styles.mapSection, moreOpen && styles.mapSectionWithDetails]}>
          <GestureDetector gesture={mapGesture}>
            <Pressable
              disabled={editLocked}
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
              style={[expanded ? styles.mapExpanded : styles.map, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
            >
          <Animated.View pointerEvents="box-none" style={[styles.mapLayer, { width: viewport.width + SURVEY_MAP_OVERSCAN * 2, height: viewport.height + SURVEY_MAP_OVERSCAN * 2 }, layerStyle]}>
          {tiles.map((tile) => tileSources.has(tile.key) ? (
            <ExpoImage
              key={tile.key}
              pointerEvents="none"
              source={tileSources.get(tile.key)}
              cachePolicy="memory"
              transition={0}
              contentFit="fill"
              onLoad={() => setTileFailures((current) => current.includes(tile.key) ? current.filter((key) => key !== tile.key) : current)}
              onError={() => {
                setTileFailures((current) => current.includes(tile.key) ? current : [...current, tile.key]);
                reportTileError(tile.key);
              }}
              style={{ position: 'absolute', left: tile.left, top: tile.top, width: MAP_TILE_SIZE, height: MAP_TILE_SIZE }}
            />
          ) : null)}
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
            {subdividing && !controlsLocked ? (
              <SubdivisionSvgLayer
                pieces={subdivisionPieces}
                selectedPieceIds={selectedPieceIds}
                cutLines={cutLines}
                activeCut={activeCut}
                layerPoint={layerPoint}
              />
            ) : null}
            {walking && walkLive && walkTarget.at(-1) ? (() => {
              const from = layerPoint(walkTarget.at(-1) as SurveyWaypoint);
              const to = layerPoint(walkLive.fix);
              return <Line testID="field-survey.walk-segment" x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={drawingAffectedArea ? theme.warning : theme.primary} strokeWidth={3} strokeDasharray="6 5" />;
            })() : null}
            {walking && walkLive ? (() => {
              const at = layerPoint(walkLive.fix);
              // The halo is the reading's own error radius at map scale, so a weak fix visibly blurs the dot.
              const edge = layerPoint({ latitude: walkLive.fix.latitude, longitude: walkLive.fix.longitude + metersToLongitudeDegrees(walkLive.fix.accuracy ?? 0, walkLive.fix.latitude) });
              const halo = Math.min(120, Math.abs(edge.x - at.x));
              return (
                <>
                  {halo > 9 ? <Circle cx={at.x} cy={at.y} r={halo} fill={theme.info} fillOpacity={0.18} /> : null}
                  <Circle testID="field-survey.walk-dot" cx={at.x} cy={at.y} r={8} fill={theme.info} stroke="white" strokeWidth={3} />
                </>
              );
            })() : myLocation ? (() => {
              const at = layerPoint(myLocation);
              return <Circle cx={at.x} cy={at.y} r={8} fill={theme.info} stroke="white" strokeWidth={3} />;
            })() : null}
          </Svg>
          {controlsLocked || walking || subdividing ? null : handles}
          {controlsLocked || subdividing ? null : areaChips.map(({ index, at }) => (
            <Pressable key={`area-chip-${index}`} testID={`field-survey.area-chip.${index}`} disabled={editLocked} accessibilityRole="button" accessibilityState={{ selected: selectedArea === index, disabled: editLocked }} accessibilityLabel={FIELD_SURVEY_COPY.affectedAreaChip(index + 1, areaSqm(index))} onPress={() => { setSelectedArea((current) => current === index ? null : index); setSelected(null); }} style={[styles.areaChip, { left: at.x - 16, top: at.y - 12, backgroundColor: selectedArea === index ? theme.warning : theme.surfaceElevated, borderColor: validityMarks.outsideAreas.includes(index) ? theme.danger : theme.warning }]}>
              <Text style={[styles.areaChipText, { color: selectedArea === index ? 'white' : theme.text }]}>A{index + 1}</Text>
            </Pressable>
          ))}
          {subdividing && !controlsLocked && !walking ? (
            <SubdivisionTouchLayer
              pieces={subdivisionPieces}
              selectedPieceIds={selectedPieceIds}
              cutLines={cutLines}
              layerPoint={layerPoint}
              disabled={editLocked}
              onTogglePiece={toggleSubdivisionPiece}
              onInsertBend={insertCutBend}
              onCutDragBegin={beginCutDrag}
              onCutDragMove={dragCutTo}
              onCutDragEnd={endCutDrag}
            />
          ) : null}
          </Animated.View>
          {controlsLocked || walking || (subdividing && !placingCut) ? null : (
            <View testID="field-survey.crosshair" pointerEvents="none" style={styles.crosshair}>
              <View style={[styles.crosshairBarH, { backgroundColor: theme.text }]} />
              <View style={[styles.crosshairBarV, { backgroundColor: theme.text }]} />
            </View>
          )}
          {tiles.length > 0 && tileSources.size > 0 ? <Text pointerEvents="none" style={[styles.attribution, { color: theme.text, backgroundColor: theme.surfaceElevated }]}>{FIELD_SURVEY_COPY.mapAttribution}</Text> : null}
            </Pressable>
          </GestureDetector>
          <View pointerEvents="box-none" style={styles.overlayTop}>
            <View pointerEvents="box-none" style={styles.overlayMessages}>
              <View pointerEvents="none" testID="field-survey.status-strip" accessibilityLiveRegion="polite" accessibilityValue={{ text: `mode=${mode}` }} style={[styles.pill, statusStripStyle]}>
                {showWalkNotice ? (
                  <View>
                    {walking && walkLive ? (
                      <View testID="field-survey.walk-hud" accessibilityLabel={`${FIELD_SURVEY_COPY.walkHudAccuracy} ${walkLive.fix.accuracy === null ? FIELD_SURVEY_COPY.accuracyUnknown : `±${walkLive.fix.accuracy.toFixed(0)} m`}, ${FIELD_SURVEY_COPY.walkHudPoints} ${walkTarget.length}, ${FIELD_SURVEY_COPY.walkHudWalked} ${formatWalkDistance(walkLive.walkedMeters)}`} style={styles.hud}>
                        <View style={styles.hudCell}>
                          <Text style={[styles.hudLabel, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.walkHudAccuracy}</Text>
                          <Text testID="field-survey.walk-hud.accuracy" style={[styles.hudValue, { color: walkBand === 'good' ? theme.success : walkBand === 'acceptable' ? theme.warning : theme.danger }]}>{walkLive.fix.accuracy === null ? '–' : `±${walkLive.fix.accuracy.toFixed(0)} m`}</Text>
                        </View>
                        <View style={styles.hudCell}>
                          <Text style={[styles.hudLabel, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.walkHudPoints}</Text>
                          <Text testID="field-survey.walk-hud.points" style={[styles.hudValue, { color: theme.text }]}>{walkTarget.length}</Text>
                        </View>
                        <View style={styles.hudCell}>
                          <Text style={[styles.hudLabel, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.walkHudWalked}</Text>
                          <Text testID="field-survey.walk-hud.walked" style={[styles.hudValue, { color: theme.text }]}>{formatWalkDistance(walkLive.walkedMeters)}</Text>
                        </View>
                        <View style={styles.hudCell}>
                          <Text style={[styles.hudLabel, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.walkHudToStart}</Text>
                          <Text testID="field-survey.walk-hud.to-start" style={[styles.hudValue, { color: theme.text }]}>{walkLive.toStartMeters === null ? '–' : formatWalkDistance(walkLive.toStartMeters)}</Text>
                        </View>
                      </View>
                    ) : null}
                    <Text testID="field-survey.walk-status" numberOfLines={4} style={[styles.pillText, { color: walkStatusTextColor }]}>{mapNotice}</Text>
                    {walking && walkGuideOpen ? (
                      <View testID="field-survey.walk-guide" style={styles.guide}>
                        <Text style={[styles.guideTitle, { color: theme.primaryDark }]}>{FIELD_SURVEY_COPY.walkGuideTitle}</Text>
                        {FIELD_SURVEY_COPY.walkGuideSteps.map((step, index) => (
                          <Text key={step} style={[styles.pillText, { color: theme.textSecondary }]}>{index + 1}. {step}</Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ) : showToolHint ? (
                  <Text testID="field-survey.tool-state" accessibilityValue={{ text: `tool=${toolState}` }} numberOfLines={2} style={[styles.pillText, { color: theme.text }]}>{gpsBusy ? FIELD_SURVEY_COPY.capturingGps : FIELD_SURVEY_COPY.toolState[toolState]}</Text>
                ) : (
                  <Text numberOfLines={3} style={[styles.pillText, { color: theme[SYNC_TONE_COLOR[strip.tone]] }]}>{strip.text}</Text>
                )}
              </View>
              {showFeedbackPill && activeMapFeedback && feedbackPalette ? (
                <View pointerEvents="none" testID="field-survey.feedback" accessibilityLiveRegion="assertive" accessibilityValue={{ text: `tone=${activeMapFeedback.tone}` }} style={[styles.pill, { backgroundColor: feedbackPalette.bg, borderColor: feedbackPalette.border }]}>
                  <Text numberOfLines={3} style={[styles.pillText, { color: feedbackPalette.text }]}>{activeMapFeedback.text}</Text>
                </View>
              ) : null}
              {expanded && validityMarks.issue && validityMarks.issue !== 'too_few_points' ? (
                <View pointerEvents="none" style={[styles.pill, { backgroundColor: theme.dangerBg, borderColor: theme.danger }]}>
                  <Text testID="field-survey.validity" accessibilityLiveRegion="polite" numberOfLines={3} style={[styles.pillText, { color: theme.danger }]}>{FIELD_SURVEY_COPY.validity[validityMarks.issue]}</Text>
                </View>
              ) : null}
              {expanded && saveState === 'failed' && saveLine ? (
                <View style={[styles.pill, { backgroundColor: theme.dangerBg, borderColor: theme.danger }]}>
                  {saveLine}
                </View>
              ) : null}
              {expandedSyncNotice ? (
                <View pointerEvents="none" style={[styles.pill, { backgroundColor: theme.infoBg, borderColor: theme.info }]}>
                  <Text testID="field-survey.expanded-notice" accessibilityLiveRegion="assertive" numberOfLines={3} style={[styles.pillText, { color: theme.info }]}>{expandedSyncNotice}</Text>
                </View>
              ) : null}
              {expanded && Object.keys(fieldErrors).length > 0 ? (
                <View pointerEvents="none" testID="field-survey.expanded-errors" style={[styles.pill, { backgroundColor: theme.dangerBg, borderColor: theme.danger }]}>
                  {Object.entries(fieldErrors).map(([field, messages]) => (
                    <Text key={field} style={[styles.pillText, { color: theme.danger }]}>{field === 'district_code' ? messages.join(' ') : `${field}: ${messages.join(' ')}`}</Text>
                  ))}
                </View>
              ) : null}
              {mapNote ? <Text pointerEvents="none" numberOfLines={2} style={[styles.pill, styles.pillText, { color: isOnline !== true ? theme.textSecondary : theme.warning, backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>{mapNote}</Text> : null}
            </View>
            <View pointerEvents="box-none" style={styles.overlayButtons}>
              <MapIconButton testID="field-survey.expand" icon={expanded ? 'minimize-2' : 'maximize-2'} label={expanded ? FIELD_SURVEY_COPY.collapseMap : FIELD_SURVEY_COPY.expandMap} onPress={() => setExpanded((value) => !value)} />
              <MapIconButton testID="field-survey.my-location" icon="navigation" label={locating ? FIELD_SURVEY_COPY.myLocationBusy : FIELD_SURVEY_COPY.myLocation} busy={locating} onPress={() => void goToMyLocation()} />
              {walking && walkLive && !walkFollow ? (
                <MapIconButton testID="field-survey.recenter" icon="crosshair" label={FIELD_SURVEY_COPY.walkRecenter} onPress={() => {
                  walkFollowRef.current = true;
                  setWalkFollow(true);
                  setCenter({ latitude: walkLive.fix.latitude, longitude: walkLive.fix.longitude });
                }} />
              ) : null}
            </View>
          </View>
          <View pointerEvents="box-none" style={styles.overlayBottom}>
            <View pointerEvents="box-none" style={styles.modeSwitch}>
              <AppButton testID="field-survey.walk" leadingIcon={walking ? 'square' : 'navigation'} variant="secondary" selected={walking} style={[styles.floatingButton, walking && { backgroundColor: theme.backgroundSelected, borderColor: theme.primary, borderWidth: 2 }]} onPress={() => void toggleWalk()} disabled={(gpsBusy && !walking) || controlsLocked || subdividing}>{walking ? FIELD_SURVEY_COPY.walkStop : walkResumable ? FIELD_SURVEY_COPY.walkResume : FIELD_SURVEY_COPY.modeWalk}</AppButton>
              {/* While walking there is no Tap button, so a stray thumb cannot end the walk by choosing it. */}
              {walking && walkBackAtStart ? (
                <AppButton testID="field-survey.walk-finish" leadingIcon="check" variant="secondary" style={[styles.floatingButton, { borderColor: theme.success, borderWidth: 2 }]} onPress={finishWalk}>{FIELD_SURVEY_COPY.walkFinish}</AppButton>
              ) : walking ? (
                <AppButton testID="field-survey.walk-corner" leadingIcon="corner-down-right" variant="secondary" style={styles.floatingButton} onPress={markCorner} disabled={!walkLive}>{FIELD_SURVEY_COPY.walkMarkCorner}</AppButton>
              ) : null}
              {walking ? null : (
                <AppButton testID="field-survey.tap" leadingIcon="map-pin" variant="secondary" selected={!subdividing} style={[styles.floatingButton, !subdividing && { backgroundColor: theme.backgroundSelected, borderColor: theme.primary, borderWidth: 2 }]} onPress={() => { if (subdividing) cancelSubdivision(); setWalkNotice(null); }} disabled={controlsLocked}>{FIELD_SURVEY_COPY.modeTap}</AppButton>
              )}
            </View>
            {controlsLocked || walking || (subdividing && !placingCut) ? null : (
              <AppButton testID="field-survey.add-center" leadingIcon="plus" accessibilityLabel={subdividing ? FIELD_SURVEY_COPY.divideAddAtCenterLabel : FIELD_SURVEY_COPY.addAtCenterLabel} style={styles.floatingButton} onPress={addPointAtCenter}>{subdividing ? FIELD_SURVEY_COPY.divideAddAtCenter : selected ? FIELD_SURVEY_COPY.moveToCenter : FIELD_SURVEY_COPY.addAtCenter}</AppButton>
            )}
          </View>
        </View>
        <View style={[styles.controls, expanded && { backgroundColor: theme.background }]}>
          {measuredBefore && !expanded && !controlsLocked ? (
            <View testID="field-survey.measured-before" style={[styles.offer, { backgroundColor: theme.surfaceElevated, borderColor: theme.primary }]}>
              <Text style={[styles.label, { color: theme.text }]}>{FIELD_SURVEY_COPY.measuredBeforeTitle}</Text>
              <Text style={[styles.help, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.measuredBeforeBody(measuredBefore.name, measuredBefore.hectares)}</Text>
              <View style={styles.toolRow}>
                <AppButton testID="field-survey.measured-before.use" leadingIcon="copy" style={styles.toolButton} onPress={() => applyOutline(measuredBefore)}>{FIELD_SURVEY_COPY.measuredBeforeUse}</AppButton>
                <AppButton testID="field-survey.measured-before.walk" variant="secondary" style={styles.toolButton} onPress={() => setMeasuredBeforeDismissed(true)}>{FIELD_SURVEY_COPY.measuredBeforeWalk}</AppButton>
              </View>
            </View>
          ) : null}
          {canStartAffectedFromCompletedPlot ? (
            <View testID="field-survey.measure-affected-from-plot" style={[styles.completedPlotCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.warning }]}>
              <Text style={[styles.label, styles.cardTitle, { color: theme.text }]}>{FIELD_SURVEY_COPY.completedPlotAffectedTitle}</Text>
              {expanded ? null : (
                <Text style={[styles.help, { color: theme.textSecondary }]}>
                  {FIELD_SURVEY_COPY.completedPlotAffectedBody((validation.areaSqm / 10_000).toFixed(2))}
                </Text>
              )}
              <AppButton testID="field-survey.measure-affected-from-plot.action" leadingIcon="alert-triangle" onPress={measureAffectedFromCompletedPlot}>
                {FIELD_SURVEY_COPY.completedPlotAffectedAction}
              </AppButton>
            </View>
          ) : null}
          {canConfirmNoAffected ? (
            <View testID="field-survey.no-affected" style={[styles.completedPlotCard, { backgroundColor: theme.surfaceElevated, borderColor: zeroConfirmedNow ? theme.success : theme.border }]}>
              <Text style={[styles.help, { color: theme.textSecondary }]}>{zeroConfirmedNow ? FIELD_SURVEY_COPY.noAffectedFoundConfirmed : FIELD_SURVEY_COPY.noAffectedFoundBody}</Text>
              <AppButton testID="field-survey.no-affected.action" variant={zeroConfirmedNow ? 'primary' : 'secondary'} selected={zeroConfirmedNow} leadingIcon={zeroConfirmedNow ? 'check-square' : 'square'} disabled={editLocked} onPress={toggleAffectedZero}>
                {FIELD_SURVEY_COPY.noAffectedFoundAction}
              </AppButton>
            </View>
          ) : null}
          <View accessibilityRole="radiogroup" style={styles.segmented}>
            <AppButton testID="field-survey.target-plot" leadingIcon="square" variant="secondary" selected={!drawingAffectedArea} style={[styles.toolButton, !drawingAffectedArea && { backgroundColor: theme.backgroundSelected, borderColor: theme.primary, borderWidth: 2 }]} disabled={editLocked} onPress={() => switchDrawingTarget(false)}>{FIELD_SURVEY_COPY.plotBoundary}</AppButton>
            <AppButton testID="field-survey.target-affected" leadingIcon="alert-triangle" variant="secondary" selected={drawingAffectedArea} style={[styles.toolButton, drawingAffectedArea && { backgroundColor: theme.backgroundSelected, borderColor: theme.warning, borderWidth: 2 }]} disabled={editLocked} onPress={() => switchDrawingTarget(true)}>{FIELD_SURVEY_COPY.affectedAreaBoundary}</AppButton>
          </View>
          {drawingAffectedArea && !controlsLocked && !walking ? (
            subdividing ? (
              <View testID="field-survey.divide-cut-tools" style={styles.toolRow}>
                <AppButton testID="field-survey.divide-add-cut" leadingIcon="plus" variant="secondary" style={styles.toolButton} disabled={subdivisionPieces.length < 2 || addingCut} onPress={startAdditionalCut}>{FIELD_SURVEY_COPY.divideAddCut}</AppButton>
                <AppButton testID="field-survey.divide-clear" leadingIcon="rotate-ccw" variant="secondary" style={styles.toolButton} disabled={cutLines.length === 0 && activeCut.length === 0} onPress={clearCutLines}>{FIELD_SURVEY_COPY.divideClearCuts}</AppButton>
              </View>
            ) : (
              <View testID="field-survey.affected-quick-tools" style={styles.toolRow}>
                <AppButton testID="field-survey.divide-plot" leadingIcon="scissors" variant="secondary" style={styles.toolButton} onPress={startSubdivision}>{FIELD_SURVEY_COPY.dividePlot}</AppButton>
                <AppButton testID="field-survey.whole-plot-affected" leadingIcon="maximize" variant="secondary" selected={wholePlotSelected} style={[styles.toolButton, wholePlotSelected && { backgroundColor: theme.backgroundSelected, borderColor: theme.warning, borderWidth: 2 }]} onPress={markWholePlotAffected}>{FIELD_SURVEY_COPY.wholePlotAffected}</AppButton>
              </View>
            )
          ) : null}
          {subdividing ? (
            <View testID="field-survey.divide-actions" style={styles.toolRow}>
              <AppButton testID="field-survey.divide-cancel" variant="secondary" style={styles.toolButton} onPress={cancelSubdivision}>{FIELD_SURVEY_COPY.divideCancel}</AppButton>
              <AppButton testID="field-survey.divide-apply" leadingIcon="check" style={styles.toolButton} disabled={selectedSubdivisionPieces.length === 0} onPress={applySubdivision}>{FIELD_SURVEY_COPY.divideApply(selectedSubdivisionPieces.length)}</AppButton>
            </View>
          ) : (
            <View style={styles.toolRow}>
              {/* Three buttons share the row while an affected area is open, so they drop their icons to keep one line each. */}
              <AppButton variant="secondary" leadingIcon={drawingAffectedArea ? undefined : 'corner-up-left'} style={styles.toolButton} disabled={!undoAvailable} onPress={undoLast}>{FIELD_SURVEY_COPY.undo}</AppButton>
              <AppButton variant="secondary" leadingIcon={drawingAffectedArea ? undefined : 'trash-2'} style={styles.toolButton} disabled={selected === null || editLocked} onPress={removeSelected}>{FIELD_SURVEY_COPY.removeSelected}</AppButton>
              {drawingAffectedArea ? <AppButton testID="field-survey.finish-area" variant="secondary" style={styles.toolButton} disabled={affectedWaypoints.length < 3 || editLocked} onPress={finishAffectedArea}>{FIELD_SURVEY_COPY.finishAffectedArea}</AppButton> : null}
            </View>
          )}
          {expanded ? (
            <View style={styles.expandedBar}>
              <Text accessibilityLiveRegion="polite" testID="field-survey.area" numberOfLines={2} style={[styles.areaCompact, { color: validation.valid ? theme.primaryDark : theme.textSecondary }]}>{areaReadout}</Text>
              <AppButton testID="field-survey.expanded-done" leadingIcon="minimize-2" variant="secondary" style={styles.floatingButton} onPress={() => setExpanded(false)}>{FIELD_SURVEY_COPY.expandedDone}</AppButton>
            </View>
          ) : (
            <Pressable testID="field-survey.more" accessibilityRole="button" accessibilityState={{ expanded: moreOpen }} accessibilityLabel={moreOpen ? FIELD_SURVEY_COPY.moreOpen : FIELD_SURVEY_COPY.more} onPress={() => setMoreOpen((open) => !open)} style={styles.moreToggle}>
              <Text style={[styles.label, styles.pointsToggleLabel, { color: theme.primaryDark }]}>{FIELD_SURVEY_COPY.moreDetails}</Text>
              <Feather name={moreOpen ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
        {moreOpen && !expanded ? (
        <ScrollView testID="field-survey.more-panel" style={styles.details} contentContainerStyle={styles.detailsContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.intro, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.intro}</Text>
          <TextField
            testID="field-survey.label"
            label={FIELD_SURVEY_COPY.fieldNameLabel}
            hint={FIELD_SURVEY_COPY.fieldNameHint}
            placeholder={FIELD_SURVEY_COPY.fieldNamePlaceholder}
            value={label}
            maxLength={FIELD_NAME_MAX_LENGTH}
            editable={!controlsLocked}
            autoCapitalize="words"
            onChangeText={(value) => {
              setLabel(value);
              markEdited();
            }}
          />
          {earlierOutlines.length > 0 && !controlsLocked ? (
            <View testID="field-survey.outlines" style={styles.outlines}>
              <Text style={[styles.label, { color: theme.text }]}>{FIELD_SURVEY_COPY.outlineTitle}</Text>
              <Text style={[styles.help, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.outlineHelp}</Text>
              {earlierOutlines.map((outline) => (
                <AppButton
                  key={outline.clientUuid}
                  testID={`field-survey.outline.${outline.clientUuid}`}
                  leadingIcon="copy"
                  variant="secondary"
                  onPress={() => applyOutline(outline)}>
                  {FIELD_SURVEY_COPY.outlineUse(outline.name, outline.hectares)}
                </AppButton>
              ))}
            </View>
          ) : null}
        {!forReport && screenIsStoredOrMissing(mode) && mode !== 'sending' ? <AppButton variant="secondary" onPress={startNewBoundary}>{screenNeedsFreshIdentity(mode) ? FIELD_SURVEY_COPY.startNewBoundaryAfterRejection : FIELD_SURVEY_COPY.newSurvey}</AppButton> : null}
          <AppButton leadingIcon="crosshair" variant="secondary" style={styles.toolButton} onPress={() => void captureGpsWaypoint()} busy={gpsBusy} disabled={gpsBusy || walking || controlsLocked || subdividing}>{gpsBusy ? FIELD_SURVEY_COPY.capturingGps : FIELD_SURVEY_COPY.addGpsPoint}</AppButton>
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
              {listedPoints.map((point, index) => <Pressable key={`${point.capturedAt}:${index}`} disabled={editLocked} accessibilityRole="button" accessibilityState={{ disabled: editLocked }} accessibilityLabel={FIELD_SURVEY_COPY.selectPoint(index + 1)} onPress={() => setSelected(listedRef(index))} style={[styles.point, { borderColor: sameRef(selected, listedRef(index)) ? theme.primary : theme.border, backgroundColor: theme.surfaceElevated }]}>
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
              {affectedMeasurement?.valid ? <Text testID="field-survey.quality-affected" style={[styles.help, { color: theme.textSecondary }]}>{measuredAffectedSqm === null ? FIELD_SURVEY_COPY.qualityAffectedNotMeasured : measuredAffectedSqm === 0 ? FIELD_SURVEY_COPY.noAffectedFoundReadout : FIELD_SURVEY_COPY.qualityAffected(measuredAffectedSqm, Math.min(100, (measuredAffectedSqm / validation.areaSqm) * 100))}</Text> : null}
              {badge === 'low_accuracy' && quality.worst ? <AppButton variant="secondary" leadingIcon="crosshair" disabled={gpsBusy || editLocked} busy={gpsBusy} onPress={() => { const worst = quality.worst; if (worst) void recaptureWorstPoint(waypoints[worst.index]); }}>{FIELD_SURVEY_COPY.recapturePoint(quality.worst.index + 1)}</AppButton> : null}
            </View>
          ) : null}
          <Text style={[styles.label, { color: theme.text }]}>{FIELD_SURVEY_COPY.affectedAreas} ({affectedAreas.length})</Text>
          {affectedAreas.map((_, index) => (
            <View key={`area-row-${index}`} style={styles.areaRow}>
              <Pressable disabled={editLocked} accessibilityRole="button" accessibilityState={{ selected: selectedArea === index, disabled: editLocked }} onPress={() => { setSelectedArea((current) => current === index ? null : index); setSelected(null); }} style={[styles.point, styles.areaRowLabel, { borderColor: selectedArea === index ? theme.primary : validityMarks.outsideAreas.includes(index) ? theme.danger : theme.border, backgroundColor: theme.surfaceElevated }]}>
                <Text style={[styles.pointTitle, { color: theme.text }]}>{FIELD_SURVEY_COPY.affectedAreaChip(index + 1, areaSqm(index))}</Text>
              </Pressable>
              <AppButton variant="secondary" leadingIcon="trash-2" disabled={editLocked} onPress={() => removeAreaAt(index)}>{FIELD_SURVEY_COPY.removeAffectedAreaNumber(index + 1)}</AppButton>
            </View>
          ))}
        </ScrollView>
        ) : null}
        {expanded ? null : <ActionDock
          note={
            <>
              <Text accessibilityLiveRegion="polite" testID="field-survey.area" style={[styles.area, { color: validation.valid ? theme.primaryDark : theme.textSecondary }]}>{areaReadout}</Text>
              {validityMarks.issue && validityMarks.issue !== 'too_few_points' ? <Text testID="field-survey.validity" accessibilityLiveRegion="polite" style={[styles.help, { color: theme.danger }]}>{FIELD_SURVEY_COPY.validity[validityMarks.issue]}</Text> : null}
              {/* One fixed-height slot, so the map above never jumps when this line changes. */}
              <View style={styles.statusSlot}>
                {saveState === 'failed' ? saveLine : forReport && !reportReady ? <Text testID="field-survey.report-unfinished" numberOfLines={2} style={[styles.help, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.reportUnfinished}</Text> : saveLine}
              </View>
              {dockSyncNotice ? <Text accessibilityLiveRegion="assertive" testID="field-survey.sync-status" style={[styles.help, { color: theme.info }]}>{dockSyncNotice}</Text> : null}
              {Object.entries(fieldErrors).map(([field, messages]) => <Text key={field} style={[styles.error, { color: theme.danger }]}>{field === 'district_code' ? messages.join(' ') : `${field}: ${messages.join(' ')}`}</Text>)}
            </>
          }
          primary={forReport ? <AppButton testID="field-survey.use-in-report" leadingIcon="check" disabled={!reportReady} onPress={() => router.back()}>{FIELD_SURVEY_COPY.reportDone}</AppButton> : <AppButton testID="field-survey.submit" leadingIcon="upload-cloud" busy={saving} disabled={!screenCanSubmit(screenState) || !validation.valid || saveState !== 'saved' || saving || subdividing || affectedWaypoints.length > 0} onPress={() => void saveAndSync()}>{saving ? FIELD_SURVEY_SYNC_COPY.submitting : FIELD_SURVEY_SYNC_COPY.submit}</AppButton>}
          secondary={<AppButton variant="secondary" style={dockSecondaryButtonStyle} onPress={() => router.back()}>{FIELD_SURVEY_COPY.close}</AppButton>}
        />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1 },
  mapSection: { flex: 1, minHeight: 320 },
  mapSectionWithDetails: { minHeight: 180 },
  mapSectionExpanded: { flex: 1 },
  mapExpanded: { flex: 1, overflow: 'hidden' },
  overlayTop: { position: 'absolute', top: Spacing.sm + Spacing.sm, left: Spacing.lg + Spacing.sm, right: Spacing.lg + Spacing.sm, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  overlayMessages: { flex: 1, gap: Spacing.xs },
  overlayButtons: { gap: Spacing.sm },
  overlayBottom: { position: 'absolute', bottom: Spacing.md + 20, left: Spacing.lg + Spacing.sm, right: Spacing.lg + Spacing.sm, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: Spacing.xs },
  pill: { alignSelf: 'flex-start', maxWidth: '100%', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderWidth: 1, borderRadius: Radius.md, overflow: 'hidden' },
  pillText: { ...Typography.caption, fontWeight: '600' },
  iconButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  crosshair: { position: 'absolute', top: '50%', left: '50%', width: 28, height: 28, marginLeft: -14, marginTop: -14, alignItems: 'center', justifyContent: 'center', opacity: 0.75 },
  crosshairBarH: { position: 'absolute', width: 28, height: 2 },
  crosshairBarV: { position: 'absolute', width: 2, height: 28 },
  controls: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.sm },
  segmented: { flexDirection: 'row', gap: Spacing.sm },
  toolRow: { flexDirection: 'row', gap: Spacing.sm },
  moreToggle: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  expandedBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingBottom: Spacing.sm },
  areaCompact: { ...Typography.label, flex: 1 },
  statusSlot: { minHeight: 40, justifyContent: 'center' },
  // Never squeezed below a few readable lines; the map gives up height instead.
  details: { flexGrow: 0, flexShrink: 1, minHeight: 128, maxHeight: 220 },
  detailsContent: { padding: Spacing.lg, gap: Spacing.sm },
  intro: { ...Typography.bodySmall },
  label: { ...Typography.label, marginTop: Spacing.xs },
  help: { ...Typography.bodySmall },
  outlines: { gap: Spacing.sm },
  offer: { borderWidth: 2, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm },
  completedPlotCard: { borderWidth: 1.5, borderRadius: Radius.md, padding: Spacing.sm, gap: Spacing.xs },
  cardTitle: { marginTop: 0 },
  error: { ...Typography.bodySmall, fontWeight: '500' },
  map: { flex: 1, borderWidth: MAP_BORDER_WIDTH, borderRadius: Radius.lg, overflow: 'hidden', marginHorizontal: Spacing.lg, marginTop: Spacing.sm },
  mapLayer: { position: 'absolute', left: -SURVEY_MAP_OVERSCAN, top: -SURVEY_MAP_OVERSCAN },
  attribution: { position: 'absolute', right: 0, bottom: 0, paddingHorizontal: Spacing.xs, borderTopLeftRadius: Radius.sm, fontSize: 10, lineHeight: 14 },
  retry: { fontWeight: '700', textDecorationLine: 'underline' },
  insertHandle: { position: 'absolute', width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  insertGlyph: { ...Typography.label, lineHeight: 18 },
  areaChip: { position: 'absolute', minWidth: 32, height: 24, paddingHorizontal: Spacing.xs, borderRadius: Radius.sm, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  areaChipText: { ...Typography.caption, fontWeight: '700' },
  areaRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  areaRowLabel: { flex: 1 },
  guide: { marginTop: Spacing.xs, gap: 2 },
  guideTitle: { fontSize: 12, fontWeight: '700' },
  hud: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xs },
  hudCell: { flex: 1, minWidth: 0 },
  hudLabel: { fontSize: 11 },
  hudValue: { fontSize: 15, fontWeight: '700' },
  modeSwitch: { flexDirection: 'row', gap: Spacing.xs },
  floatingButton: { minHeight: 44, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md },
  toolButton: { flex: 1, minHeight: 44, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  pointsToggle: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pointsToggleLabel: { marginTop: 0, flex: 1 },
  points: { gap: Spacing.sm },
  point: { padding: Spacing.sm, borderWidth: 1, borderRadius: Radius.sm, minWidth: 145 },
  pointTitle: { ...Typography.label },
  pointCoord: { ...Typography.caption },
  area: { ...Typography.subheading, textAlign: 'center' },
});
