import GeographicLib from 'geographiclib-geodesic/geographiclib-geodesic.min.js';
import GeoJSONReader from 'jsts/org/locationtech/jts/io/GeoJSONReader.js';
import GeometryFactory from 'jsts/org/locationtech/jts/geom/GeometryFactory.js';
import IsValidOp from 'jsts/org/locationtech/jts/operation/valid/IsValidOp.js';
import OverlayOp from 'jsts/org/locationtech/jts/operation/overlay/OverlayOp.js';

import type { MapCoordinate } from '@/features/reports/domain/manualMap';

export interface SurveyPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface SurveyMeasurementProvenance {
  method: 'wgs84-ellipsoid-geodesic';
  plotAreaSqm: number;
  affectedAreaSqm: number;
  sourcePolygonCount: number;
  overlapRemoved: boolean;
}

export interface AffectedAreaMeasurement {
  valid: true;
  areaSqm: number;
  provenance: SurveyMeasurementProvenance;
}

export interface SurveyWaypoint extends MapCoordinate {
  accuracyMeters: number | null;
  capturedAt: string;
  source: 'map' | 'gps';
}

export interface SurveyValidationError {
  code: 'TOO_FEW_VERTICES' | 'TOO_MANY_VERTICES' | 'INVALID_COORDINATE' | 'RING_NOT_CLOSED' | 'INVALID_POLYGON' | 'OUTSIDE_PLOT';
  message: string;
}

export type SurveyValidation =
  | { valid: true; areaSqm: number; polygon: SurveyPolygon }
  | { valid: false; error: SurveyValidationError };

const MIN_DISTINCT_VERTICES = 3;
const MAX_SURVEY_VERTICES = 2_000;
const MAX_AFFECTED_AREAS = 100;
const MAX_TOTAL_AREA_VERTICES = 10_000;
const reader = new GeoJSONReader(new GeometryFactory());

export function validateSurveyWaypoints(waypoints: SurveyWaypoint[]): SurveyValidation {
  if (waypoints.length < MIN_DISTINCT_VERTICES) {
    return invalid('TOO_FEW_VERTICES', 'Add at least three boundary points.');
  }
  if (waypoints.length > MAX_SURVEY_VERTICES) {
    return invalid('TOO_MANY_VERTICES', 'This boundary has too many points to validate.');
  }
  if (waypoints.some(({ latitude, longitude }) =>
    !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    !Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
    return invalid('INVALID_COORDINATE', 'One or more boundary points are outside valid coordinates.');
  }

  const distinct = new Set(waypoints.map(({ latitude, longitude }) => `${latitude},${longitude}`));
  if (distinct.size < MIN_DISTINCT_VERTICES) {
    return invalid('TOO_FEW_VERTICES', 'Add at least three distinct boundary points.');
  }

  const ring = waypoints.map(({ longitude, latitude }) => [longitude, latitude]);
  const [firstLon, firstLat] = ring[0];
  const [lastLon, lastLat] = ring[ring.length - 1];
  if (firstLon !== lastLon || firstLat !== lastLat) ring.push([firstLon, firstLat]);
  const polygon: SurveyPolygon = { type: 'Polygon', coordinates: [ring] };

  try {
    const operation = new IsValidOp(reader.read(polygon));
    if (!operation.isValid()) {
      return invalid('INVALID_POLYGON', 'The boundary crosses itself or has no usable area. Move or remove a point.');
    }
  } catch {
    return invalid('INVALID_POLYGON', 'The boundary could not be validated. Check its points and try again.');
  }

  const areaSqm = ringArea(ring);
  if (!Number.isFinite(areaSqm) || areaSqm <= 0) {
    return invalid('INVALID_POLYGON', 'The boundary has no measurable area.');
  }
  return { valid: true, areaSqm, polygon };
}

export function validateSurveyPolygon(polygon: SurveyPolygon): SurveyValidation {
  const geometry = readValidPolygon(polygon);
  if (!geometry) return invalid('INVALID_POLYGON', 'The boundary is not a valid closed polygon. Check its points and try again.');
  const ring = polygon.coordinates[0];
  const distinct = new Set(ring.slice(0, -1).map(([longitude, latitude]) => `${longitude},${latitude}`));
  if (distinct.size < MIN_DISTINCT_VERTICES) {
    return invalid('TOO_FEW_VERTICES', 'Add at least three distinct boundary points.');
  }
  const areaSqm = ringArea(ring);
  if (!Number.isFinite(areaSqm) || areaSqm <= 0) return invalid('INVALID_POLYGON', 'The boundary has no measurable area.');
  return { valid: true, areaSqm, polygon };
}

export function ringArea(ring: number[][]): number {
  const polygon = GeographicLib.Geodesic.WGS84.Polygon(false);
  for (const [longitude, latitude] of ring.slice(0, -1)) {
    polygon.AddPoint(latitude, longitude);
  }
  return Math.abs(polygon.Compute(false, true).area ?? 0);
}

/**
 * Validates affected polygons against the plot and measures their geometric
 * union, so overlaps contribute area only once. The returned provenance
 * records the measurement method and the source polygon count.
 */
export function measureAffectedAreas(
  plot: SurveyPolygon,
  affectedAreas: SurveyPolygon[],
): AffectedAreaMeasurement | { valid: false; error: SurveyValidationError } {
  const plotGeometry = readValidPolygon(plot);
  if (!plotGeometry) return affectedInvalid('INVALID_POLYGON', 'The plot boundary is invalid.');
  if (!Array.isArray(affectedAreas) || affectedAreas.some((area) => !area || !Array.isArray(area.coordinates) || !Array.isArray(area.coordinates[0]))) {
    return affectedInvalid('INVALID_POLYGON', 'Affected-area boundaries are not valid polygons.');
  }
  if (affectedAreas.length > MAX_AFFECTED_AREAS ||
    affectedAreas.reduce((total, area) => total + area.coordinates[0].length, 0) > MAX_TOTAL_AREA_VERTICES) {
    return affectedInvalid('TOO_MANY_VERTICES', 'These affected-area boundaries contain too many points to validate.');
  }
  if (affectedAreas.length === 0) {
    return {
      valid: true,
      areaSqm: 0,
      provenance: {
        method: 'wgs84-ellipsoid-geodesic',
        plotAreaSqm: ringArea(plot.coordinates[0]),
        affectedAreaSqm: 0,
        sourcePolygonCount: 0,
        overlapRemoved: false,
      },
    };
  }

  const plotRing = plot.coordinates[0];
  const geometries = [];
  for (const affected of affectedAreas) {
    const geometry = readValidPolygon(affected);
    if (!geometry) return affectedInvalid('INVALID_POLYGON', 'An affected-area boundary is invalid.');
    if (!polygonCoversRing(plotRing, affected.coordinates[0])) {
      return affectedInvalid('OUTSIDE_PLOT', 'Every affected area must remain within the plot boundary.');
    }
    geometries.push(geometry);
  }

  try {
    let union = geometries[0];
    for (const geometry of geometries.slice(1)) union = OverlayOp.union(union, geometry);
    union = union as {
      getGeometryType(): string;
      getNumGeometries(): number;
      getGeometryN(index: number): unknown;
    };
    const unionAreaSqm = geodesicGeometryArea(union);
    if (!Number.isFinite(unionAreaSqm) || unionAreaSqm <= 0) {
      return affectedInvalid('INVALID_POLYGON', 'The affected areas have no measurable area.');
    }
    const sourceAreaSqm = geometries.reduce((sum, geometry) =>
      sum + geodesicGeometryArea(geometry), 0);
    return {
      valid: true,
      areaSqm: unionAreaSqm,
      provenance: {
        method: 'wgs84-ellipsoid-geodesic',
        plotAreaSqm: ringArea(plot.coordinates[0]),
        affectedAreaSqm: unionAreaSqm,
        sourcePolygonCount: geometries.length,
        overlapRemoved: unionAreaSqm < sourceAreaSqm - Math.max(0.01, sourceAreaSqm * 1e-10),
      },
    };
  } catch {
    return affectedInvalid('INVALID_POLYGON', 'Affected-area boundaries could not be combined. Check their points and try again.');
  }
}

function polygonCoversRing(plotRing: number[][], affectedRing: number[][]): boolean {
  const insideOrOnBoundary = (point: number[]) => {
    let inside = false;
    for (let index = 0, previous = plotRing.length - 2; index < plotRing.length - 1; previous = index, index += 1) {
      const [x1, y1] = plotRing[previous];
      const [x2, y2] = plotRing[index];
      const cross = (point[0] - x1) * (y2 - y1) - (point[1] - y1) * (x2 - x1);
      if (Math.abs(cross) < 1e-12 && point[0] >= Math.min(x1, x2) - 1e-12 && point[0] <= Math.max(x1, x2) + 1e-12 && point[1] >= Math.min(y1, y2) - 1e-12 && point[1] <= Math.max(y1, y2) + 1e-12) return true;
      if ((y1 > point[1]) !== (y2 > point[1]) && point[0] < (x2 - x1) * (point[1] - y1) / (y2 - y1) + x1) inside = !inside;
    }
    return inside;
  };
  if (affectedRing.slice(0, -1).some((point) => !insideOrOnBoundary(point))) return false;
  for (let affectedIndex = 0; affectedIndex < affectedRing.length - 1; affectedIndex += 1) {
    const a = affectedRing[affectedIndex];
    const b = affectedRing[affectedIndex + 1];
    for (let plotIndex = 0; plotIndex < plotRing.length - 1; plotIndex += 1) {
      const c = plotRing[plotIndex];
      const d = plotRing[plotIndex + 1];
      const orientation = (p: number[], q: number[], r: number[]) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
      const o1 = orientation(a, b, c);
      const o2 = orientation(a, b, d);
      const o3 = orientation(c, d, a);
      const o4 = orientation(c, d, b);
      if (((o1 > 1e-12 && o2 < -1e-12) || (o1 < -1e-12 && o2 > 1e-12)) &&
        ((o3 > 1e-12 && o4 < -1e-12) || (o3 < -1e-12 && o4 > 1e-12))) return false;
    }
  }
  return true;
}

function readValidPolygon(polygon: SurveyPolygon): any | null {
  try {
    if (polygon.type !== 'Polygon' || polygon.coordinates.length !== 1) return null;
    const ring = polygon.coordinates[0];
    if (ring.length < 4 || ring.length > MAX_SURVEY_VERTICES + 1 || !ring[0] || !ring.at(-1) ||
      ring[0][0] !== ring.at(-1)![0] || ring[0][1] !== ring.at(-1)![1]) return null;
    if (ring.some(([longitude, latitude]) =>
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
      !Number.isFinite(latitude) || latitude < -90 || latitude > 90)) return null;
    const geometry = reader.read(polygon);
    if (!(new IsValidOp(geometry)).isValid() || ringArea(ring) <= 0) return null;
    return geometry;
  } catch {
    return null;
  }
}

function geodesicGeometryArea(geometry: {
  getGeometryType(): string;
  getNumGeometries(): number;
  getGeometryN(index: number): unknown;
}): number {
  const geometryType = geometry.getGeometryType();
  if (geometryType === 'Polygon') {
    const polygon = geometry as unknown as {
      getExteriorRing(): { getCoordinates(): { x: number; y: number }[] };
      getNumInteriorRing(): number;
      getInteriorRingN(index: number): { getCoordinates(): { x: number; y: number }[] };
    };
    const geodesicRingArea = (coordinates: { x: number; y: number }[]) =>
      ringArea(coordinates.map(({ x, y }) => [x, y]));
    let area = geodesicRingArea(polygon.getExteriorRing().getCoordinates());
    for (let index = 0; index < polygon.getNumInteriorRing(); index += 1) {
      area -= geodesicRingArea(polygon.getInteriorRingN(index).getCoordinates());
    }
    return area;
  }
  let total = 0;
  for (let index = 0; index < geometry.getNumGeometries(); index += 1) {
    total += geodesicGeometryArea(geometry.getGeometryN(index) as typeof geometry);
  }
  return total;
}

function affectedInvalid(code: SurveyValidationError['code'], message: string): { valid: false; error: SurveyValidationError } {
  return { valid: false, error: { code, message } };
}

function invalid(code: SurveyValidationError['code'], message: string): SurveyValidation {
  return { valid: false, error: { code, message } };
}
