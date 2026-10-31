import { randomUUID } from 'expo-crypto';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import Svg, { Circle, Polygon, Polyline } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { EMPTY_DATABASE, useDatabaseState } from '@/database/DatabaseProvider';
import { useSync } from '@/features/sync/hooks/useSync';
import { useToast } from '@/components/ui/Toast';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { FIELD_SURVEY_COPY } from '@/constants/copy';
import { FIELD_SURVEY_SYNC_COPY } from '@/features/sync/utils/syncStatusCopy';
import { expoForegroundLocationClient } from '@/features/reports/services/expoForegroundLocationClient';
import { PREFERRED_GPS_ACCURACY_METERS } from '@/features/reports/services/captureGpsLocation';
import {
  DEFAULT_MANUAL_MAP_CENTER,
  MAP_TILE_SIZE,
  coordinateAtViewportPoint,
  coordinateToViewportPoint,
  getConfiguredMapTileUrlTemplate,
  getMapTiles,
  type MapCoordinate,
} from '@/features/reports/domain/manualMap';
import { listOwnedFieldSurveys, saveFieldSurveyDraft, markFieldSurveyPending } from '@/features/surveys/data/fieldSurveyRepository';
import { useManualMapGestures } from '@/features/reports/components/use-manual-map-gestures';
import { measureAffectedAreas, validateSurveyWaypoints, type SurveyPolygon, type SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';
import { captureSurveyWaypoint } from '@/features/surveys/services/captureSurveyWaypoint';

const SURVEY_ZOOM = 17;
const SURVEY_MAP_OVERSCAN = MAP_TILE_SIZE;
const INITIAL_VIEWPORT = { width: 360, height: 380 };

export default function FieldSurveyScreen() {
  const theme = useTheme();
  const { showToast } = useToast();
  const { database, ready } = useDatabaseState();
  const { session } = useAuth();
  const { isOnline, syncNow } = useSync();
  const [clientUuid, setClientUuid] = useState(() => randomUUID());
  const [districtCode, setDistrictCode] = useState('');
  const [waypoints, setWaypoints] = useState<SurveyWaypoint[]>([]);
  const [affectedAreas, setAffectedAreas] = useState<SurveyPolygon[]>([]);
  const [affectedAreaWaypointSets, setAffectedAreaWaypointSets] = useState<SurveyWaypoint[][]>([]);
  const [affectedWaypoints, setAffectedWaypoints] = useState<SurveyWaypoint[]>([]);
  const [drawingAffectedArea, setDrawingAffectedArea] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
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
  const [saving, setSaving] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saved, setSaved] = useState(false);
  const [tileFailures, setTileFailures] = useState<string[]>([]);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [readOnlyPending, setReadOnlyPending] = useState(false);
  const validation = useMemo(() => validateSurveyWaypoints(waypoints), [waypoints]);
  const affectedMeasurement = useMemo(() => validation.valid
    ? measureAffectedAreas(validation.polygon, affectedAreas)
    : null, [affectedAreas, validation]);
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
      const previous = listOwnedFieldSurveys(database, session.user.uuid)
        .find((row) => row.status !== 'synced');
      if (previous) {
        setClientUuid(previous.clientUuid);
        setDistrictCode(previous.districtCode === 'UNSPECIFIED' ? '' : previous.districtCode);
        try {
          setWaypoints(JSON.parse(previous.waypointsJson) as SurveyWaypoint[]);
          const restoredAreas = JSON.parse(previous.affectedAreaPolygonsJson ?? '[]') as SurveyPolygon[];
          let restoredWaypoints: SurveyWaypoint[][] = [];
          try {
            restoredWaypoints = JSON.parse(previous.affectedAreaWaypointsJson ?? '[]') as SurveyWaypoint[][];
          } catch {
            restoredWaypoints = [];
          }
          let restoredActive: SurveyWaypoint[] = [];
          try {
            const parsedActive = JSON.parse(previous.activeAffectedWaypointsJson ?? '[]') as SurveyWaypoint[];
            if (Array.isArray(parsedActive)) restoredActive = parsedActive;
          } catch {
            restoredActive = [];
          }
          setAffectedAreas(restoredAreas);
          setAffectedAreaWaypointSets(restoredWaypoints);
          setAffectedWaypoints(restoredActive);
          if (restoredActive.length > 0) setDrawingAffectedArea(true);
        } catch {
          setWaypoints([]);
          setAffectedAreas([]);
          setAffectedAreaWaypointSets([]);
          setAffectedWaypoints([]);
        }
        if (previous.fieldErrorsJson) {
          try {
            setFieldErrors(JSON.parse(previous.fieldErrorsJson) as Record<string, string[]>);
            setSyncMessage(FIELD_SURVEY_SYNC_COPY.serverCorrection);
          } catch {
            setFieldErrors({});
          }
        }
        setSaved(true);
        setResumed(true);
        const identityRejected = previous.lastSyncErrorCode === 'CLIENT_UUID_CONFLICT';
        const correctionNeeded = previous.lastSyncErrorCode === 'VALIDATION_FAILED' || previous.lastSyncErrorCode === 'API_VALIDATION_FAILED';
        setReadOnlyPending(previous.status === 'pending' || previous.status === 'syncing' || (previous.status === 'failed' && !correctionNeeded));
        if (identityRejected) setSyncMessage(FIELD_SURVEY_SYNC_COPY.identityRejected);
        else if (previous.status === 'pending' || previous.status === 'syncing') setSyncMessage(FIELD_SURVEY_SYNC_COPY.pendingLocked);
      }
      setBootstrapped(true);
    }).catch(() => {
      if (!cancelled) {
        setSyncMessage(FIELD_SURVEY_COPY.saveFailed);
        setBootstrapped(true);
      }
    });
    return () => { cancelled = true; };
  }, [database, ready, session?.user.uuid]);

  useEffect(() => {
    if (!bootstrapped || !ready || !database || !session?.user.uuid) return;
    let cancelled = false;
    void saveFieldSurveyDraft(database, {
      clientUuid,
      ownerIdentity: session.user.uuid,
      districtCode: districtCode.trim() || 'UNSPECIFIED',
      waypoints,
      affectedAreaPolygons: affectedAreas,
      affectedAreaWaypoints: affectedAreaWaypointSets,
      activeAffectedWaypoints: affectedWaypoints,
      capturedAt: new Date().toISOString(),
    }).then(() => {
      if (!cancelled) setSaved(true);
    }).catch(() => {
      if (!cancelled) setSaved(false);
    });
    return () => { cancelled = true; };
  }, [affectedAreas, affectedAreaWaypointSets, affectedWaypoints, bootstrapped, clientUuid, database, districtCode, ready, session?.user.uuid, waypoints]);

  function addOrMovePoint(latitude: number, longitude: number, source: 'map' | 'gps', accuracyMeters: number | null, capturedAt = new Date().toISOString()) {
    if (readOnlyPending || syncBusy) {
      setSyncMessage(FIELD_SURVEY_SYNC_COPY.pendingLocked);
      return;
    }
    const waypoint: SurveyWaypoint = { latitude, longitude, source, accuracyMeters, capturedAt };
    setSaved(false);
    if (drawingAffectedArea) {
      setAffectedWaypoints((current) => [...current, waypoint]);
      return;
    }
    setWaypoints((current) => {
      if (selectedIndex !== null && selectedIndex < current.length) {
        return current.map((point, index) => index === selectedIndex ? waypoint : point);
      }
      return [...current, waypoint];
    });
    setSelectedIndex(null);
    setFieldErrors({});
  }

  function handleMapPress(event: { nativeEvent: { locationX: number; locationY: number } }) {
    const { locationX, locationY } = event.nativeEvent;
    const coordinate = coordinateAtViewportPoint(center, zoom, viewport.width, viewport.height, locationX, locationY);
    addOrMovePoint(coordinate.latitude, coordinate.longitude, 'map', null);
  }

  async function captureGpsWaypoint() {
    setGpsBusy(true);
    try {
      const result = await captureSurveyWaypoint(expoForegroundLocationClient);
      if (result.status !== 'captured') {
        setSyncMessage(result.status === 'permission_denied'
          ? FIELD_SURVEY_COPY.gpsPermissionDenied
          : result.status === 'services_disabled'
            ? FIELD_SURVEY_COPY.gpsDisabled
            : FIELD_SURVEY_COPY.gpsUnavailable);
        return;
      }
      addOrMovePoint(result.waypoint.latitude, result.waypoint.longitude, 'gps', result.waypoint.accuracyMeters, result.waypoint.capturedAt);
      setCenter({ latitude: result.waypoint.latitude, longitude: result.waypoint.longitude });
      setSyncMessage(result.waypoint.accuracyMeters === null ? FIELD_SURVEY_COPY.gpsAccuracyUnknown : result.waypoint.accuracyMeters > PREFERRED_GPS_ACCURACY_METERS ? FIELD_SURVEY_COPY.gpsAccuracyWeak(result.waypoint.accuracyMeters) : null);
    } catch {
      setSyncMessage(FIELD_SURVEY_COPY.gpsUnavailable);
    } finally {
      setGpsBusy(false);
    }
  }

  async function saveAndSync() {
    if (!session?.token || !session.user.uuid || !ready || !database || database === EMPTY_DATABASE) {
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
    setSaving(true);
    try {
      if (!affectedMeasurement?.valid) {
        setSyncMessage(affectedMeasurement?.error.message ?? FIELD_SURVEY_COPY.affectedOutsidePlot);
        return;
      }
      markFieldSurveyPending(database, clientUuid, session.user.uuid, validation.polygon, validation.areaSqm, waypoints.at(-1)?.capturedAt ?? new Date().toISOString(), affectedAreas, affectedMeasurement.areaSqm, affectedAreaWaypointSets);
      setSyncBusy(true);
      const result = await syncNow('after-save');
      const surveyResult = result?.results.find((item) => item.reportId === clientUuid);
      if (isOnline === false) {
        setReadOnlyPending(true);
        setSyncMessage(FIELD_SURVEY_SYNC_COPY.offline);
      } else if (surveyResult?.status === 'synced' || surveyResult?.status === 'already-synced') {
        setReadOnlyPending(true);
        setSyncMessage(FIELD_SURVEY_SYNC_COPY.synced);
        showToast(FIELD_SURVEY_SYNC_COPY.synced, 'success');
      } else if (surveyResult?.status === 'failed') {
        if (surveyResult.error.code === 'CLIENT_UUID_CONFLICT') {
          setReadOnlyPending(true);
          setSyncMessage(FIELD_SURVEY_SYNC_COPY.identityRejected);
        } else if (surveyResult.error.code === 'API_VALIDATION_FAILED') {
          setReadOnlyPending(false);
          setSyncMessage(FIELD_SURVEY_SYNC_COPY.serverCorrection);
        } else {
          setReadOnlyPending(true);
          setSyncMessage(surveyResult.error.message);
        }
      } else if (result?.authRequired) {
        setSyncMessage(FIELD_SURVEY_SYNC_COPY.signInRequired);
      } else {
        setReadOnlyPending(true);
        setSyncMessage(FIELD_SURVEY_SYNC_COPY.pendingLocked);
      }
    } catch (error: unknown) {
      setSyncMessage(error instanceof Error ? error.message : FIELD_SURVEY_COPY.saveFailed);
    } finally {
      setSaving(false);
      setSyncBusy(false);
    }
  }

  function finishAffectedArea() {
    const candidate = validateSurveyWaypoints(affectedWaypoints);
    if (!candidate.valid) {
      setSyncMessage(candidate.error.message);
      return;
    }
    if (!validation.valid) {
      setSyncMessage(validation.error.message);
      return;
    }
    const result = measureAffectedAreas(validation.polygon, [...affectedAreas, candidate.polygon]);
    if (!result.valid) {
      setSyncMessage(result.error.message);
      return;
    }
    setAffectedAreas((current) => [...current, candidate.polygon]);
    setAffectedAreaWaypointSets((current) => [...current, [...affectedWaypoints]]);
    setAffectedWaypoints([]);
    setSaved(false);
    setSyncMessage(null);
  }

  function removeSelected() {
    if (selectedIndex === null) return;
    setSaved(false);
    setWaypoints((current) => current.filter((_, index) => index !== selectedIndex));
    setSelectedIndex(null);
  }

  const screenValidation = validation.valid ? `${(validation.areaSqm / 10_000).toFixed(2)} ha · ${Math.round(validation.areaSqm).toLocaleString()} m²` : validation.error.message;
  const ringPoints = waypoints.map((point) => {
    const projected = coordinateToViewportPoint(center, point, zoom, viewport.width, viewport.height);
    return `${projected.x + SURVEY_MAP_OVERSCAN},${projected.y + SURVEY_MAP_OVERSCAN}`;
  }).join(' ');

  if (!ready) {
    return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView testID="field-survey.screen" style={[styles.safe, { backgroundColor: theme.background}]} edges={['top', 'bottom']}>
      <BrandedScreenHeader title={FIELD_SURVEY_COPY.title} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.intro, { color: theme.textSecondary }]}>{resumed ? FIELD_SURVEY_COPY.resumedSurvey : FIELD_SURVEY_COPY.intro}</Text>
        {resumed ? <AppButton variant="secondary" onPress={() => {
          setClientUuid(randomUUID());
          setDistrictCode('');
          setWaypoints([]);
          setAffectedAreas([]);
          setAffectedAreaWaypointSets([]);
          setAffectedWaypoints([]);
          setSelectedIndex(null);
          setFieldErrors({});
          setSyncMessage(null);
          setSaved(false);
          setResumed(false);
          setReadOnlyPending(false);
        }}>{readOnlyPending ? FIELD_SURVEY_COPY.startNewBoundaryAfterRejection : FIELD_SURVEY_COPY.newSurvey}</AppButton> : null}
        <Text style={[styles.label, { color: theme.text }]}>{FIELD_SURVEY_COPY.districtLabel}</Text>
        <TextInput
          accessibilityLabel={FIELD_SURVEY_COPY.districtLabel}
          testID="field-survey.district-code"
          value={districtCode}
          editable={!readOnlyPending && !syncBusy}
          onChangeText={(value) => { setSaved(false); setFieldErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== 'district_code'))); setDistrictCode(value); }}
          autoCapitalize="characters"
          placeholder={FIELD_SURVEY_COPY.districtPlaceholder}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, borderColor: fieldErrors.district_code ? theme.danger : theme.border, backgroundColor: theme.surfaceElevated }]}
        />
        {fieldErrors.district_code?.map((message) => <Text key={message} style={[styles.error, { color: theme.danger }]}>{message}</Text>)}
        <Text style={[styles.label, { color: theme.text }]}>{FIELD_SURVEY_COPY.mapHeading}</Text>
        <Text style={[styles.help, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.mapHelp}</Text>
        <GestureDetector gesture={mapGesture}>
        <Pressable
          disabled={readOnlyPending || syncBusy}
          testID="field-survey.map"
          accessibilityRole="imagebutton"
          accessibilityLabel={FIELD_SURVEY_COPY.mapAccessibility}
          onPress={handleMapPress}
          onLayout={(event) => setViewport({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
          style={[styles.map, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
        >
          <Animated.View pointerEvents="none" style={[styles.mapLayer, { width: viewport.width + SURVEY_MAP_OVERSCAN * 2, height: viewport.height + SURVEY_MAP_OVERSCAN * 2 }, layerStyle]}>
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
              const points = area.coordinates[0].map(([longitude, latitude]) => {
                const projected = coordinateToViewportPoint(center, { longitude, latitude }, zoom, viewport.width, viewport.height);
                return `${projected.x + SURVEY_MAP_OVERSCAN},${projected.y + SURVEY_MAP_OVERSCAN}`;
              }).join(' ');
              return <Polygon key={`affected-${areaIndex}`} points={points} fill="rgba(205, 112, 36, 0.28)" stroke={theme.warning} strokeWidth={3} />;
            })}
            {affectedWaypoints.length >= 2 ? <Polyline points={affectedWaypoints.map((point) => {
              const projected = coordinateToViewportPoint(center, point, zoom, viewport.width, viewport.height);
              return `${projected.x + SURVEY_MAP_OVERSCAN},${projected.y + SURVEY_MAP_OVERSCAN}`;
            }).join(' ')} fill="none" stroke={theme.warning} strokeWidth={3} /> : null}
            {waypoints.map((point, index) => {
              const projected = coordinateToViewportPoint(center, point, zoom, viewport.width, viewport.height);
              return <Circle key={`${point.latitude}:${point.longitude}:${index}`} cx={projected.x + SURVEY_MAP_OVERSCAN} cy={projected.y + SURVEY_MAP_OVERSCAN} r={selectedIndex === index ? 9 : 7} fill={selectedIndex === index ? theme.warning : theme.primary} stroke="white" strokeWidth={2} />;
            })}
          </Svg>
          </Animated.View>
          {tiles.length > 0 && isOnline === true ? <Text pointerEvents="none" style={[styles.attribution, { color: theme.text, backgroundColor: theme.surfaceElevated }]}>{FIELD_SURVEY_COPY.mapAttribution}</Text> : null}
        </Pressable>
        </GestureDetector>
        {isOnline !== true ? <Text style={[styles.help, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.offlineMap}</Text> : tileFailures.some((key) => tiles.some((tile) => tile.key === key)) ? <Text style={[styles.help, { color: theme.warning }]}>{FIELD_SURVEY_COPY.mapTileError}</Text> : null}
        <View style={styles.row}>
          <AppButton leadingIcon="map-pin" variant={!drawingAffectedArea ? 'primary' : 'secondary'} disabled={readOnlyPending || syncBusy} onPress={() => { setDrawingAffectedArea(false); setSelectedIndex(null); setSyncMessage(FIELD_SURVEY_COPY.tapToDraw); }}>{FIELD_SURVEY_COPY.plotBoundary}</AppButton>
          <AppButton leadingIcon="map-pin" variant={drawingAffectedArea ? 'primary' : 'secondary'} disabled={readOnlyPending || syncBusy} onPress={() => { setDrawingAffectedArea(true); setSelectedIndex(null); setSyncMessage(FIELD_SURVEY_COPY.tapToDraw); }}>{FIELD_SURVEY_COPY.affectedAreaBoundary}</AppButton>
          <AppButton leadingIcon="crosshair" onPress={() => void captureGpsWaypoint()} disabled={gpsBusy || readOnlyPending || syncBusy}>{gpsBusy ? FIELD_SURVEY_COPY.capturingGps : FIELD_SURVEY_COPY.addGpsPoint}</AppButton>
        </View>
        <View style={styles.row}>
          <AppButton variant="secondary" leadingIcon="corner-up-left" disabled={!(drawingAffectedArea ? affectedWaypoints.length : waypoints.length) || readOnlyPending || syncBusy} onPress={() => { setSaved(false); if (drawingAffectedArea) setAffectedWaypoints((current) => current.slice(0, -1)); else setWaypoints((current) => current.slice(0, -1)); setSelectedIndex(null); }}>{FIELD_SURVEY_COPY.undo}</AppButton>
          <AppButton variant="secondary" leadingIcon="trash-2" disabled={drawingAffectedArea || selectedIndex === null || readOnlyPending || syncBusy} onPress={removeSelected}>{FIELD_SURVEY_COPY.removeSelected}</AppButton>
        </View>
        {drawingAffectedArea ? <AppButton variant="secondary" disabled={affectedWaypoints.length < 3 || readOnlyPending || syncBusy} onPress={finishAffectedArea}>{FIELD_SURVEY_COPY.finishAffectedArea}</AppButton> : null}
        <Text style={[styles.label, { color: theme.text }]}>{drawingAffectedArea ? FIELD_SURVEY_COPY.affectedAreaBoundary : FIELD_SURVEY_COPY.pointsHeading} ({drawingAffectedArea ? affectedWaypoints.length : waypoints.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.points}>
          {(drawingAffectedArea ? affectedWaypoints : waypoints).map((point, index) => <Pressable key={`${point.capturedAt}:${index}`} accessibilityRole="button" accessibilityLabel={FIELD_SURVEY_COPY.selectPoint(index + 1)} onPress={() => { if (!drawingAffectedArea) setSelectedIndex(index); }} style={[styles.point, { borderColor: !drawingAffectedArea && selectedIndex === index ? theme.primary : theme.border, backgroundColor: theme.surfaceElevated }]}>
            <Text style={[styles.pointTitle, { color: theme.text }]}>{index + 1} · {point.source === 'gps' ? FIELD_SURVEY_COPY.gps : FIELD_SURVEY_COPY.map}</Text>
            <Text style={[styles.pointCoord, { color: theme.textSecondary }]}>{point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}</Text>
            <Text style={[styles.pointCoord, { color: point.accuracyMeters === null ? theme.warning : theme.textSecondary }]}>{point.accuracyMeters === null ? FIELD_SURVEY_COPY.accuracyUnknown : `${FIELD_SURVEY_COPY.accuracy} ±${point.accuracyMeters.toFixed(1)} m`}</Text>
          </Pressable>)}
        </ScrollView>
        <Text style={[styles.label, { color: theme.text }]}>{FIELD_SURVEY_COPY.affectedAreas} ({affectedAreas.length})</Text>
        {affectedAreas.length ? <AppButton variant="secondary" disabled={readOnlyPending || syncBusy} onPress={() => { setAffectedAreas((current) => current.slice(0, -1)); setAffectedAreaWaypointSets((current) => current.slice(0, -1)); setSaved(false); }}>{FIELD_SURVEY_COPY.removeAffectedArea}</AppButton> : null}
        <Text accessibilityLiveRegion="polite" testID="field-survey.area" style={[styles.area, { color: validation.valid ? theme.primaryDark : theme.textSecondary }]}>{screenValidation}{validation.valid && affectedMeasurement?.valid ? ` · ${affectedMeasurement.areaSqm.toFixed(0)} m² affected` : affectedMeasurement && !affectedMeasurement.valid ? ` · ${affectedMeasurement.error.message}` : ''}</Text>
        {saved ? <Text style={[styles.help, { color: theme.success }]}>{FIELD_SURVEY_SYNC_COPY.savedOffline}</Text> : <Text style={[styles.help, { color: theme.warning }]}>{FIELD_SURVEY_COPY.savingOffline}</Text>}
        {syncMessage ? <Text accessibilityLiveRegion="assertive" testID="field-survey.sync-status" style={[styles.help, { color: theme.info }]}>{syncMessage}</Text> : null}
        {Object.entries(fieldErrors).filter(([key]) => key !== 'district_code').map(([field, messages]) => <Text key={field} style={[styles.error, { color: theme.danger }]}>{field}: {messages.join(' ')}</Text>)}
        <AppButton testID="field-survey.submit" leadingIcon="upload-cloud" disabled={!validation.valid || !saved || saving || syncBusy || affectedWaypoints.length > 0} onPress={() => void saveAndSync()}>{saving ? FIELD_SURVEY_SYNC_COPY.submitting : FIELD_SURVEY_SYNC_COPY.submit}</AppButton>
        <AppButton variant="secondary" onPress={() => router.back()}>{FIELD_SURVEY_COPY.close}</AppButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing['2xl'] },
  intro: { ...Typography.body },
  label: { ...Typography.label, marginTop: Spacing.sm },
  help: { ...Typography.bodySmall },
  error: { ...Typography.bodySmall, fontWeight: '700' },
  input: { ...Typography.body, minHeight: 48, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md },
  map: { width: '100%', height: 380, borderWidth: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  mapLayer: { position: 'absolute', left: -SURVEY_MAP_OVERSCAN, top: -SURVEY_MAP_OVERSCAN },
  attribution: { position: 'absolute', right: Spacing.xs, bottom: Spacing.xs, paddingHorizontal: Spacing.xs, paddingVertical: Spacing.xs, borderRadius: Radius.xs, ...Typography.caption },
  row: { flexDirection: 'row', gap: Spacing.sm },
  points: { gap: Spacing.sm },
  point: { padding: Spacing.sm, borderWidth: 1, borderRadius: Radius.sm, minWidth: 145 },
  pointTitle: { ...Typography.label },
  pointCoord: { ...Typography.caption },
  area: { ...Typography.heading, textAlign: 'center' },
});
