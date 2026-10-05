import GeographicLib from 'geographiclib-geodesic/geographiclib-geodesic.min.js';
import GeoJSONReader from 'jsts/org/locationtech/jts/io/GeoJSONReader.js';
import GeometryFactory from 'jsts/org/locationtech/jts/geom/GeometryFactory.js';
import IsValidOp from 'jsts/org/locationtech/jts/operation/valid/IsValidOp.js';

import type { MapCoordinate } from '@/features/reports/domain/manualMap';

export interface SurveyPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface SurveyWaypoint extends MapCoordinate {
  accuracyMeters: number | null;
  capturedAt: string;
  source: 'map' | 'gps';
}

export interface SurveyValidationError {
  code: 'TOO_FEW_VERTICES' | 'TOO_MANY_VERTICES' | 'INVALID_COORDINATE' | 'RING_NOT_CLOSED' | 'INVALID_POLYGON';
  message: string;
}

export type SurveyValidation =
  | { valid: true; areaSqm: number; polygon: SurveyPolygon }
  | { valid: false; error: SurveyValidationError };

const MIN_DISTINCT_VERTICES = 3;
const MAX_SURVEY_VERTICES = 2_000;
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

export function ringArea(ring: number[][]): number {
  const polygon = GeographicLib.Geodesic.WGS84.Polygon(false);
  for (const [longitude, latitude] of ring.slice(0, -1)) {
    polygon.AddPoint(latitude, longitude);
  }
  return Math.abs(polygon.Compute(false, true).area ?? 0);
}

function invalid(code: SurveyValidationError['code'], message: string): SurveyValidation {
  return { valid: false, error: { code, message } };
}
