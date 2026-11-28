import GeoJSONReader from 'jsts/org/locationtech/jts/io/GeoJSONReader.js';
import GeometryFactory from 'jsts/org/locationtech/jts/geom/GeometryFactory.js';
import InteriorPointArea from 'jsts/org/locationtech/jts/algorithm/InteriorPointArea.js';
import IsSimpleOp from 'jsts/org/locationtech/jts/operation/IsSimpleOp.js';
import IsValidOp from 'jsts/org/locationtech/jts/operation/valid/IsValidOp.js';
import OverlayOp from 'jsts/org/locationtech/jts/operation/overlay/OverlayOp.js';
import Polygonizer from 'jsts/org/locationtech/jts/operation/polygonize/Polygonizer.js';
import RelateOp from 'jsts/org/locationtech/jts/operation/relate/RelateOp.js';
import UnaryUnionOp from 'jsts/org/locationtech/jts/operation/union/UnaryUnionOp.js';

import type { MapCoordinate } from '@/features/reports/domain/manualMap';
import { percentAffected } from '@/features/surveys/domain/attachedBoundary';
import type { DrawingShape } from '@/features/surveys/domain/drawingTool';
import {
  MAX_AFFECTED_AREA_WAYPOINTS,
  measureAffectedAreas,
  validateAffectedAreaWaypoints,
  validateSurveyWaypoints,
  type SurveyPolygon,
  type SurveyWaypoint,
} from '@/features/surveys/domain/fieldSurvey';

/** Filter degenerate sliver polygons below 1 m² created when a cut grazes a plot vertex. */
export const MIN_SUBDIVISION_AREA_SQM = 1;
/** Match a subdivided vertex back to its source plot corner within ~1 micrometre so GPS provenance is preserved. */
const PLOT_VERTEX_MATCH_EPSILON_DEG = 1e-11;
/** Fallback local overshoot (~11 m) if full bounding-box ray extension makes a hairpin bend cross itself. */
const LOCAL_RAY_OVERSHOOT_DEG = 1e-4;
/** Minimum bounding-box ray extension (~220 m) so tiny plots still extend past every diagonal edge. */
const MIN_FULL_RAY_EXTENSION_DEG = 0.002;
const MAX_CUT_POINTS_PER_LINE = 200;

const factory = new GeometryFactory();
const reader = new GeoJSONReader(factory);

export interface SubdivisionPiece {
  /** Deterministic display id (`P1`, `P2`, …), ordered north-to-south then west-to-east. */
  id: string;
  polygon: SurveyPolygon;
  waypoints: SurveyWaypoint[];
  areaSqm: number;
  /** Share of the measured plot keeping two decimals (matches office and report math). */
  percentOfPlot: number;
  /** Strictly interior coordinate via JSTS `InteriorPointArea`, so chips never fall outside concave faces. */
  labelPoint: MapCoordinate;
}

export type SubdivisionErrorCode = 'INVALID_PLOT' | 'INVALID_CUT' | 'SELF_INTERSECTING_CUT' | 'NO_SPLIT';

export type SubdivisionResult =
  | { ok: true; plotAreaSqm: number; pieces: SubdivisionPiece[] }
  | { ok: false; code: SubdivisionErrorCode; message: string };

export type WholePlotBuildResult =
  | { ok: true; piece: SubdivisionPiece }
  | { ok: false; code: 'INVALID_PLOT' | 'TOO_MANY_VERTICES'; message: string };

export type ApplySubdivisionResult =
  | { ok: true; shape: DrawingShape; addedCount: number }
  | { ok: false; message: string };

export type ApplyWholePlotResult =
  | { ok: true; shape: DrawingShape; alreadyWhole: boolean; replacedExisting: boolean }
  | { ok: false; message: string };

export interface SubdivisionSelectionSummary {
  selectedAreaSqm: number;
  selectedPercentOfPlot: number;
  combinedAreaSqm: number;
  combinedPercentOfPlot: number;
  overlapRemoved: boolean;
}

interface JstsCoordinate {
  x: number;
  y: number;
}

interface JstsPolygonLike {
  getExteriorRing(): { getCoordinates(): JstsCoordinate[] };
  getNumInteriorRing(): number;
  getArea(): number;
}

interface JstsCollectionLike<T> {
  size(): number;
  get(index: number): T;
}

function isValidCoordinate(point: MapCoordinate | null | undefined): point is MapCoordinate {
  return Boolean(point)
    && Number.isFinite(point!.latitude) && point!.latitude >= -90 && point!.latitude <= 90
    && Number.isFinite(point!.longitude) && point!.longitude >= -180 && point!.longitude <= 180;
}

function roundPercent(areaSqm: number, plotAreaSqm: number): number {
  if (!Number.isFinite(areaSqm) || !Number.isFinite(plotAreaSqm) || plotAreaSqm <= 0) return 0;
  return percentAffected({ areaSqm: plotAreaSqm, affectedAreaSqm: areaSqm }) ?? 0;
}

function clampLon(value: number): number {
  return Math.max(-180, Math.min(180, value));
}

function clampLat(value: number): number {
  return Math.max(-90, Math.min(90, value));
}

function dedupeConsecutiveCoords(coords: [number, number][]): [number, number][] {
  const result: [number, number][] = [];
  for (const coord of coords) {
    const previous = result.at(-1);
    if (previous && previous[0] === coord[0] && previous[1] === coord[1]) continue;
    result.push(coord);
  }
  return result;
}

function plotBoundingDiagonalDeg(ring: number[][]): number {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of ring) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return Math.hypot(maxLon - minLon, maxLat - minLat);
}

/**
 * Extends both terminal segments of a cut line outward along their unit vectors.
 * Prevents IEEE-754 ~1e-16° misses against diagonal rotated plot edges and lets
 * inspectors tap two points anywhere inside a plot to slice straight across it.
 */
function extendTerminalRays(coords: [number, number][], extensionDeg: number): [number, number][] {
  const extended: [number, number][] = coords.map(([lon, lat]) => [lon, lat]);
  const firstDx = extended[0][0] - extended[1][0];
  const firstDy = extended[0][1] - extended[1][1];
  const firstLen = Math.hypot(firstDx, firstDy);
  if (firstLen > 0) {
    extended[0] = [
      clampLon(extended[0][0] + (firstDx / firstLen) * extensionDeg),
      clampLat(extended[0][1] + (firstDy / firstLen) * extensionDeg),
    ];
  }
  const last = extended.length - 1;
  const lastDx = extended[last][0] - extended[last - 1][0];
  const lastDy = extended[last][1] - extended[last - 1][1];
  const lastLen = Math.hypot(lastDx, lastDy);
  if (lastLen > 0) {
    extended[last] = [
      clampLon(extended[last][0] + (lastDx / lastLen) * extensionDeg),
      clampLat(extended[last][1] + (lastDy / lastLen) * extensionDeg),
    ];
  }
  return extended;
}

function stripWalkCorner(waypoint: SurveyWaypoint, fallbackCapturedAt: string): SurveyWaypoint {
  return {
    latitude: waypoint.latitude,
    longitude: waypoint.longitude,
    source: waypoint.source === 'gps' ? 'gps' : 'map',
    accuracyMeters: waypoint.source === 'gps' ? waypoint.accuracyMeters : null,
    capturedAt: waypoint.capturedAt || fallbackCapturedAt,
  };
}

/**
 * Preserves truthful vertex provenance: corners inherited from the measured plot
 * keep their original GPS/map metadata, while cut-line intersections and bend
 * vertices are recorded as `source: 'map'` with `accuracyMeters: null`.
 */
function buildPieceWaypoints(
  ringCoords: [number, number][],
  plotWaypoints: SurveyWaypoint[],
  capturedAt: string,
): SurveyWaypoint[] {
  return ringCoords.map(([longitude, latitude]) => {
    const matched = plotWaypoints.find((candidate) =>
      Math.abs(candidate.longitude - longitude) <= PLOT_VERTEX_MATCH_EPSILON_DEG
      && Math.abs(candidate.latitude - latitude) <= PLOT_VERTEX_MATCH_EPSILON_DEG);
    if (matched) {
      return {
        latitude,
        longitude,
        source: matched.source === 'gps' ? 'gps' : 'map',
        accuracyMeters: matched.source === 'gps' ? matched.accuracyMeters : null,
        capturedAt: matched.capturedAt || capturedAt,
      };
    }
    return {
      latitude,
      longitude,
      source: 'map',
      accuracyMeters: null,
      capturedAt,
    };
  });
}

function interiorPointOf(geometry: unknown, fallback: MapCoordinate): MapCoordinate {
  try {
    const coord = new InteriorPointArea(geometry as never).getInteriorPoint() as JstsCoordinate | null | undefined;
    if (coord && Number.isFinite(coord.x) && Number.isFinite(coord.y)) {
      return { latitude: coord.y, longitude: coord.x };
    }
  } catch {
    // Fall back to the supplied coordinate when JSTS cannot compute an interior point.
  }
  return fallback;
}

/**
 * Splits a valid measured plot polygon by one or more cut lines using JSTS
 * `UnaryUnionOp` + `Polygonizer` and measures every resulting region on the
 * WGS84 ellipsoid. Guarantees hole-free, strictly contained GeoJSON polygons
 * whose waypoint lists match their coordinates 1:1.
 */
export function subdividePlot(
  plotWaypoints: SurveyWaypoint[],
  cutLines: MapCoordinate[][],
  capturedAt = new Date().toISOString(),
): SubdivisionResult {
  const plot = validateSurveyWaypoints(plotWaypoints);
  if (!plot.valid) {
    return { ok: false, code: 'INVALID_PLOT', message: plot.error.message };
  }
  if (!Array.isArray(cutLines) || cutLines.length === 0) {
    return { ok: false, code: 'INVALID_CUT', message: 'Place at least two points across the plot to divide it.' };
  }

  const plotGeometry = reader.read(plot.polygon) as unknown as JstsPolygonLike;
  const fullExtension = Math.max(plotBoundingDiagonalDeg(plot.polygon.coordinates[0]) * 1.5, MIN_FULL_RAY_EXTENSION_DEG);
  const lineGeometries: unknown[] = [];

  for (const rawLine of cutLines) {
    if (!Array.isArray(rawLine) || rawLine.length < 2 || rawLine.length > MAX_CUT_POINTS_PER_LINE) {
      return { ok: false, code: 'INVALID_CUT', message: 'Each divide line needs at least two valid points.' };
    }
    if (rawLine.some((point) => !isValidCoordinate(point))) {
      return { ok: false, code: 'INVALID_CUT', message: 'One or more divide points are outside valid coordinates.' };
    }
    const deduped = dedupeConsecutiveCoords(rawLine.map(({ longitude, latitude }) => [longitude, latitude]));
    if (deduped.length < 2) {
      return { ok: false, code: 'INVALID_CUT', message: 'Place two distinct points across the plot to divide it.' };
    }

    let rawGeom: unknown;
    try {
      rawGeom = reader.read({ type: 'LineString', coordinates: deduped });
      if (!new IsSimpleOp(rawGeom as never).isSimple()) {
        return { ok: false, code: 'SELF_INTERSECTING_CUT', message: 'The divide line crosses itself. Move a point or clear cuts.' };
      }
    } catch {
      return { ok: false, code: 'INVALID_CUT', message: 'The divide line could not be read. Check its points and try again.' };
    }

    const fullCoords = extendTerminalRays(deduped, fullExtension);
    let chosenGeom: unknown = null;
    try {
      const fullGeom = reader.read({ type: 'LineString', coordinates: fullCoords });
      if (new IsSimpleOp(fullGeom as never).isSimple()) {
        chosenGeom = fullGeom;
      } else {
        const localGeom = reader.read({ type: 'LineString', coordinates: extendTerminalRays(deduped, LOCAL_RAY_OVERSHOOT_DEG) });
        if (new IsSimpleOp(localGeom as never).isSimple()) {
          chosenGeom = localGeom;
        }
      }
    } catch {
      chosenGeom = null;
    }

    if (!chosenGeom) {
      return { ok: false, code: 'SELF_INTERSECTING_CUT', message: 'The divide line crosses itself. Move a point or clear cuts.' };
    }
    lineGeometries.push(chosenGeom);
  }

  let rawPolygons: JstsCollectionLike<JstsPolygonLike>;
  try {
    const boundary = plotGeometry.getExteriorRing();
    const collection = factory.createGeometryCollection([boundary as never, ...(lineGeometries as never[])]);
    const noded = UnaryUnionOp.union(collection);
    const polygonizer = new Polygonizer();
    polygonizer.add(noded);
    rawPolygons = polygonizer.getPolygons() as unknown as JstsCollectionLike<JstsPolygonLike>;
  } catch {
    return { ok: false, code: 'NO_SPLIT', message: 'Could not divide this plot with that line. Try moving a divide point.' };
  }

  const pieces: SubdivisionPiece[] = [];
  const count = rawPolygons.size();
  for (let index = 0; index < count; index += 1) {
    const candidate = rawPolygons.get(index);
    if (!candidate || candidate.getNumInteriorRing() !== 0) continue;
    try {
      if (!new IsValidOp(candidate as never).isValid()) continue;
      const interiorCoord = new InteriorPointArea(candidate as never).getInteriorPoint() as JstsCoordinate | null | undefined;
      if (!interiorCoord || !Number.isFinite(interiorCoord.x) || !Number.isFinite(interiorCoord.y)) continue;
      const interiorPoint = factory.createPoint(interiorCoord as never);
      if (!RelateOp.contains(plotGeometry as never, interiorPoint)) continue;

      const rawCoords = candidate.getExteriorRing().getCoordinates().map((coord): [number, number] => [coord.x, coord.y]);
      if (rawCoords.length < 4) continue;
      const openCoords = dedupeConsecutiveCoords(rawCoords.slice(0, -1));
      if (openCoords.length < 3) continue;

      const pieceWaypoints = buildPieceWaypoints(openCoords, plotWaypoints, capturedAt);
      const validated = validateSurveyWaypoints(pieceWaypoints);
      if (!validated.valid || validated.areaSqm < MIN_SUBDIVISION_AREA_SQM) continue;
      const containment = measureAffectedAreas(plot.polygon, [validated.polygon]);
      if (!containment.valid) continue;

      pieces.push({
        id: '',
        polygon: validated.polygon,
        waypoints: pieceWaypoints,
        areaSqm: validated.areaSqm,
        percentOfPlot: roundPercent(validated.areaSqm, plot.areaSqm),
        labelPoint: { latitude: interiorCoord.y, longitude: interiorCoord.x },
      });
    } catch {
      continue;
    }
  }

  if (pieces.length < 2) {
    return { ok: false, code: 'NO_SPLIT', message: 'Line did not split the plot. Place points across opposite edges.' };
  }

  pieces.sort((left, right) =>
    (right.labelPoint.latitude - left.labelPoint.latitude)
    || (left.labelPoint.longitude - right.labelPoint.longitude));
  const numbered = pieces.map((piece, index) => ({ ...piece, id: `P${index + 1}` }));
  return { ok: true, plotAreaSqm: plot.areaSqm, pieces: numbered };
}

/**
 * Builds a single 100%-affected polygon identical to the measured plot ring,
 * preserving every plot corner's GPS/map provenance and enforcing the 1,500-waypoint cap.
 */
export function buildWholePlotAffectedArea(
  plotWaypoints: SurveyWaypoint[],
  capturedAt = new Date().toISOString(),
): WholePlotBuildResult {
  const plot = validateSurveyWaypoints(plotWaypoints);
  if (!plot.valid) {
    return { ok: false, code: 'INVALID_PLOT', message: plot.error.message };
  }
  if (plotWaypoints.length > MAX_AFFECTED_AREA_WAYPOINTS) {
    return {
      ok: false,
      code: 'TOO_MANY_VERTICES',
      message: `This plot has ${plotWaypoints.length.toLocaleString()} points, which exceeds the ${MAX_AFFECTED_AREA_WAYPOINTS.toLocaleString()}-point limit for affected areas.`,
    };
  }
  const cleanWaypoints = plotWaypoints.map((point) => stripWalkCorner(point, capturedAt));
  const derived = validateSurveyWaypoints(cleanWaypoints);
  if (!derived.valid) {
    return { ok: false, code: 'INVALID_PLOT', message: derived.error.message };
  }
  const provenanceCheck = validateAffectedAreaWaypoints([derived.polygon], [cleanWaypoints]);
  if (!provenanceCheck.valid) {
    return {
      ok: false,
      code: provenanceCheck.error.code === 'TOO_MANY_VERTICES' ? 'TOO_MANY_VERTICES' : 'INVALID_PLOT',
      message: provenanceCheck.error.message,
    };
  }
  const containment = measureAffectedAreas(plot.polygon, [derived.polygon]);
  if (!containment.valid) {
    return { ok: false, code: 'INVALID_PLOT', message: containment.error.message };
  }
  const fallbackLabel: MapCoordinate = {
    latitude: cleanWaypoints[0].latitude,
    longitude: cleanWaypoints[0].longitude,
  };
  const labelPoint = interiorPointOf(reader.read(derived.polygon), fallbackLabel);
  return {
    ok: true,
    piece: {
      id: 'WHOLE',
      polygon: derived.polygon,
      waypoints: cleanWaypoints,
      areaSqm: derived.areaSqm,
      percentOfPlot: 100,
      labelPoint,
    },
  };
}

/** True when the current drawing already marks the exact whole plot as its sole affected area. */
export function isWholePlotAffected(shape: DrawingShape): boolean {
  if (shape.affectedAreas.length !== 1 || shape.affectedWaypoints.length > 0) return false;
  const plot = validateSurveyWaypoints(shape.waypoints);
  if (!plot.valid) return false;
  return JSON.stringify(shape.affectedAreas[0].coordinates) === JSON.stringify(plot.polygon.coordinates);
}

/**
 * Commits selected subdivided portions into `DrawingShape` without altering the
 * measured whole-plot boundary. Exact duplicate rings already present are skipped,
 * while partial overlaps with manual/walked areas remain deduplicated by `measureAffectedAreas`.
 */
export function applySubdivisionSelection(
  shape: DrawingShape,
  selectedPieces: SubdivisionPiece[],
): ApplySubdivisionResult {
  if (selectedPieces.length === 0) {
    return { ok: false, message: 'Select at least one plot portion before applying.' };
  }
  const plot = validateSurveyWaypoints(shape.waypoints);
  if (!plot.valid) {
    return { ok: false, message: plot.error.message };
  }

  const existingKeys = new Set(shape.affectedAreas.map((area) => JSON.stringify(area.coordinates)));
  const addedAreas: SurveyPolygon[] = [];
  const addedSets: SurveyWaypoint[][] = [];
  for (const piece of selectedPieces) {
    const key = JSON.stringify(piece.polygon.coordinates);
    if (existingKeys.has(key)) continue;
    existingKeys.add(key);
    addedAreas.push(piece.polygon);
    addedSets.push(piece.waypoints);
  }

  if (addedAreas.length === 0) {
    return { ok: true, shape, addedCount: 0 };
  }

  const nextAreas = [...shape.affectedAreas, ...addedAreas];
  const nextSets = [...shape.affectedAreaWaypointSets, ...addedSets];
  const provenanceCheck = validateAffectedAreaWaypoints(nextAreas, nextSets);
  if (!provenanceCheck.valid) {
    return { ok: false, message: provenanceCheck.error.message };
  }
  const combined = measureAffectedAreas(plot.polygon, nextAreas);
  if (!combined.valid) {
    return { ok: false, message: combined.error.message };
  }

  return {
    ok: true,
    addedCount: addedAreas.length,
    shape: {
      ...shape,
      affectedAreas: nextAreas,
      affectedAreaWaypointSets: nextSets,
    },
  };
}

/**
 * Whole-plot affected shortcut (locked decision D2-A): replaces existing affected
 * areas with one clean 100% polygon identical to the plot ring in a single undoable step.
 */
export function applyWholePlotAffected(
  shape: DrawingShape,
  capturedAt = new Date().toISOString(),
): ApplyWholePlotResult {
  const whole = buildWholePlotAffectedArea(shape.waypoints, capturedAt);
  if (!whole.ok) {
    return { ok: false, message: whole.message };
  }
  if (isWholePlotAffected(shape)) {
    return { ok: true, shape, alreadyWhole: true, replacedExisting: false };
  }
  const replacedExisting = shape.affectedAreas.length > 0 || shape.affectedWaypoints.length > 0;
  return {
    ok: true,
    alreadyWhole: false,
    replacedExisting,
    shape: {
      ...shape,
      affectedAreas: [whole.piece.polygon],
      affectedAreaWaypointSets: [whole.piece.waypoints],
      affectedWaypoints: [],
    },
  };
}

/**
 * Live geodesic area and percentage readout for the inspector's current subdivision
 * selection, both on its own and combined (overlap-deduplicated) with existing affected areas.
 */
export function measureSubdivisionSelection(
  plotPolygon: SurveyPolygon,
  plotAreaSqm: number,
  selectedPieces: SubdivisionPiece[],
  existingAffectedAreas: SurveyPolygon[] = [],
): SubdivisionSelectionSummary | null {
  if (selectedPieces.length === 0 || !Number.isFinite(plotAreaSqm) || plotAreaSqm <= 0) return null;
  const selectedPolygons = selectedPieces.map((piece) => piece.polygon);
  const selectedMeasure = measureAffectedAreas(plotPolygon, selectedPolygons);
  if (!selectedMeasure.valid || selectedMeasure.areaSqm === null) return null;
  const combinedMeasure = existingAffectedAreas.length > 0
    ? measureAffectedAreas(plotPolygon, [...existingAffectedAreas, ...selectedPolygons])
    : selectedMeasure;
  if (!combinedMeasure.valid || combinedMeasure.areaSqm === null) return null;
  return {
    selectedAreaSqm: selectedMeasure.areaSqm,
    selectedPercentOfPlot: roundPercent(selectedMeasure.areaSqm, plotAreaSqm),
    combinedAreaSqm: combinedMeasure.areaSqm,
    combinedPercentOfPlot: roundPercent(combinedMeasure.areaSqm, plotAreaSqm),
    overlapRemoved: combinedMeasure.provenance.overlapRemoved,
  };
}

/** Inserts a midpoint bend vertex along segment `segmentIndex` of a cut line (D1-A bendable polyline). */
export function insertBendPointOnCut(cut: MapCoordinate[], segmentIndex: number): MapCoordinate[] {
  if (segmentIndex < 0 || segmentIndex >= cut.length - 1 || cut.length >= MAX_CUT_POINTS_PER_LINE) return cut;
  const from = cut[segmentIndex];
  const to = cut[segmentIndex + 1];
  const midpoint: MapCoordinate = {
    latitude: (from.latitude + to.latitude) / 2,
    longitude: (from.longitude + to.longitude) / 2,
  };
  return [...cut.slice(0, segmentIndex + 1), midpoint, ...cut.slice(segmentIndex + 1)];
}

/** True when `point` falls inside or on the border of `piece`, using exact JSTS topology (handles concave pieces). */
export function pointInPiece(point: MapCoordinate, piece: SubdivisionPiece): boolean {
  if (!isValidCoordinate(point)) return false;
  try {
    const pieceGeometry = reader.read(piece.polygon);
    const pointGeometry = reader.read({ type: 'Point', coordinates: [point.longitude, point.latitude] });
    return RelateOp.covers(pieceGeometry, pointGeometry);
  } catch {
    return false;
  }
}

/** Minimum IoU required to carry a selected piece's identity across a cut edit. */
const REMAP_MIN_IOU = 0.5;

/**
 * Remaps previously selected subdivision pieces onto a newly computed set of
 * pieces by geometric overlap (IoU), so renumbering `P1`/`P2` after dragging or
 * bending a cut never silently switches the selected side. Returns `[]` if any
 * previously selected piece cannot be unambiguously matched, prompting a fresh selection.
 */
export function remapSelectedPieceIds(
  previousSelected: SubdivisionPiece[],
  nextPieces: SubdivisionPiece[],
): string[] {
  if (previousSelected.length === 0 || nextPieces.length === 0) return [];
  const nextGeoms: { id: string; geom: JstsPolygonLike; area: number }[] = [];
  for (const piece of nextPieces) {
    try {
      const geom = reader.read(piece.polygon) as unknown as JstsPolygonLike;
      const area = geom.getArea();
      if (Number.isFinite(area) && area > 0) {
        nextGeoms.push({ id: piece.id, geom, area });
      }
    } catch {
      return [];
    }
  }
  if (nextGeoms.length !== nextPieces.length) return [];

  const matched = new Set<string>();
  const result: string[] = [];
  for (const prev of previousSelected) {
    let prevGeom: JstsPolygonLike;
    let prevArea: number;
    try {
      prevGeom = reader.read(prev.polygon) as unknown as JstsPolygonLike;
      prevArea = prevGeom.getArea();
    } catch {
      return [];
    }
    if (!Number.isFinite(prevArea) || prevArea <= 0) return [];

    let bestId: string | null = null;
    let bestIou = 0;
    for (const candidate of nextGeoms) {
      try {
        const intersected = OverlayOp.intersection(prevGeom as never, candidate.geom as never) as unknown as JstsPolygonLike;
        const overlap = intersected.getArea();
        if (!Number.isFinite(overlap) || overlap <= 0) continue;
        const union = prevArea + candidate.area - overlap;
        const iou = union > 0 ? overlap / union : 0;
        if (iou > bestIou) {
          bestIou = iou;
          bestId = candidate.id;
        }
      } catch {
        continue;
      }
    }
    if (!bestId || bestIou < REMAP_MIN_IOU || matched.has(bestId)) {
      return [];
    }
    matched.add(bestId);
    result.push(bestId);
  }
  return result;
}
