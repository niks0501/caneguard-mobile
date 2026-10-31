import {
  AFFECTED_AREA_CONTAINMENT_TOLERANCE_METERS,
  measureAffectedAreas,
  ringArea,
  snapAffectedAreaWaypoints,
  validateAffectedAreaWaypoints,
  validateSurveyPolygon,
  validateSurveyWaypoints,
  type SurveyWaypoint,
} from '@/features/surveys/domain/fieldSurvey';

function waypoints(points: [number, number][]): SurveyWaypoint[] {
  return points.map(([longitude, latitude], index) => ({
    accuracyMeters: index === 0 ? null : 3.4,
    capturedAt: `2026-10-05T09:00:0${index}.000Z`,
    latitude,
    longitude,
    source: index === 0 ? 'map' : 'gps',
  }));
}

describe('field survey geometry', () => {
  it('closes a map-drawn boundary and measures WGS84 ellipsoid area in square metres', () => {
    const result = validateSurveyWaypoints(waypoints([
      [120, 14], [120.002, 14], [120.002, 14.002], [120, 14.002],
    ]));
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.polygon.coordinates[0][0]).toEqual(result.polygon.coordinates[0].at(-1));
    expect(result.areaSqm).toBeCloseTo(47_811.0145, 1);
  });

  it('rejects too few and duplicate points', () => {
    expect(validateSurveyWaypoints(waypoints([[120, 14], [120.001, 14]])).valid).toBe(false);
    expect(validateSurveyWaypoints(waypoints([[120, 14], [120, 14], [120, 14]])).valid).toBe(false);
  });

  it('rejects a self-intersecting bow-tie', () => {
    const result = validateSurveyWaypoints(waypoints([
      [120, 14], [120.002, 14.002], [120, 14.002], [120.002, 14],
    ]));
    expect(result).toMatchObject({ valid: false, error: { code: 'INVALID_POLYGON' } });
  });

  it('rejects invalid coordinate ranges and caps vertex count', () => {
    expect(validateSurveyWaypoints(waypoints([[181, 14], [120.001, 14], [120, 14.001]])).valid).toBe(false);
    const many = Array.from({ length: 2_001 }, (_, index) => ({
      accuracyMeters: null,
      capturedAt: '2026-10-05T09:00:00.000Z',
      latitude: 14 + Math.sin(index) * 0.001,
      longitude: 120 + Math.cos(index) * 0.001,
      source: 'map' as const,
    }));
    expect(validateSurveyWaypoints(many)).toMatchObject({ valid: false, error: { code: 'TOO_MANY_VERTICES' } });
  });

  it('calculates a closed ring without including the duplicate endpoint twice', () => {
    expect(ringArea([[120, 14], [120.002, 14], [120.002, 14.002], [120, 14.002], [120, 14]])).toBeGreaterThan(0);
  });

  it('rejects malformed and unclosed polygon rings without repairing their input', () => {
    expect(validateSurveyPolygon({ type: 'Polygon', coordinates: [[[120, 14], [120.001, 14], [120, 14.001]]] })).toMatchObject({
      valid: false,
      error: { code: 'INVALID_POLYGON' },
    });
  });

  it('rejects affected polygons outside the plot', () => {
    const plot = { type: 'Polygon' as const, coordinates: [[[120, 14], [120.002, 14], [120.002, 14.002], [120, 14.002], [120, 14]]] };
    const outside = { type: 'Polygon' as const, coordinates: [[[120.003, 14], [120.004, 14], [120.004, 14.001], [120.003, 14.001], [120.003, 14]]] };
    expect(measureAffectedAreas(plot, [outside])).toMatchObject({ valid: false, error: { code: 'OUTSIDE_PLOT' } });
  });

  it('rejects self-crossing affected boundaries', () => {
    const plot = { type: 'Polygon' as const, coordinates: [[[120, 14], [120.004, 14], [120.004, 14.004], [120, 14.004], [120, 14]]] };
    const invalid = { type: 'Polygon' as const, coordinates: [[[120, 14], [120.002, 14.002], [120, 14.002], [120.002, 14], [120, 14]]] };
    expect(measureAffectedAreas(plot, [invalid])).toMatchObject({ valid: false, error: { code: 'INVALID_POLYGON' } });
  });

  it('rejects an affected rectangle that fills the notch of a U-shaped plot', () => {
    const plot = {
      type: 'Polygon' as const,
      coordinates: [[[120, 14], [120.004, 14], [120.004, 14.004], [120.003, 14.004], [120.003, 14.001], [120.001, 14.001], [120.001, 14.004], [120, 14.004], [120, 14]]],
    };
    const notch = {
      type: 'Polygon' as const,
      coordinates: [[[120.001, 14.001], [120.003, 14.001], [120.003, 14.004], [120.001, 14.004], [120.001, 14.001]]],
    };
    expect(measureAffectedAreas(plot, [notch])).toMatchObject({ valid: false, error: { code: 'OUTSIDE_PLOT' } });
  });

  it('accepts an affected area fully inside the U-shaped plot arms', () => {
    const plot = {
      type: 'Polygon' as const,
      coordinates: [[[120, 14], [120.004, 14], [120.004, 14.004], [120.003, 14.004], [120.003, 14.001], [120.001, 14.001], [120.001, 14.004], [120, 14.004], [120, 14]]],
    };
    const inside = {
      type: 'Polygon' as const,
      coordinates: [[[120, 14.0002], [120.0008, 14.0002], [120.0008, 14.0008], [120, 14.0008], [120, 14.0002]]],
    };
    expect(measureAffectedAreas(plot, [inside]).valid).toBe(true);
  });

  it('keeps affected-area waypoint provenance aligned with its polygon', () => {
    const captured = waypoints([[120, 14], [120.001, 14], [120.001, 14.001]]);
    const derived = validateSurveyWaypoints(captured);
    expect(derived.valid).toBe(true);
    if (!derived.valid) return;
    expect(validateAffectedAreaWaypoints([derived.polygon], [captured])).toMatchObject({ valid: true });
    expect(validateAffectedAreaWaypoints([derived.polygon], [waypoints([[120.002, 14], [120.003, 14], [120.003, 14.001]])])).toMatchObject({ valid: false });
  });

  it('counts overlapping affected areas once and returns geodesic provenance', () => {
    const plot = { type: 'Polygon' as const, coordinates: [[[120, 14], [120.004, 14], [120.004, 14.004], [120, 14.004], [120, 14]]] };
    const areas = [
      { type: 'Polygon' as const, coordinates: [[[120, 14], [120.002, 14], [120.002, 14.002], [120, 14.002], [120, 14]]] },
      { type: 'Polygon' as const, coordinates: [[[120.001, 14], [120.003, 14], [120.003, 14.002], [120.001, 14.002], [120.001, 14]]] },
    ];
    const result = measureAffectedAreas(plot, areas);
    expect(result).toMatchObject({
      provenance: {
        method: 'wgs84-ellipsoid-geodesic',
        sourcePolygonCount: 2,
        overlapRemoved: true,
        containmentToleranceMeters: 5,
      },
    });
    expect('areaSqm' in result && result.areaSqm).toBeCloseTo(71_716.5218, 1);
  });

  it('snaps affected vertices within the 5 m forgiveness zone onto the plot ring', () => {
    const plot = { type: 'Polygon' as const, coordinates: [[[120, 14], [120.002, 14], [120.002, 14.002], [120, 14.002], [120, 14]]] };
    const nearEdge = waypoints([[119.99997, 14], [120.002, 14], [120.002, 14.002], [119.99997, 14.002]]);
    const snapped = snapAffectedAreaWaypoints(plot, nearEdge);
    expect(snapped[0].longitude).toBeCloseTo(120, 6);
    expect(snapped[3].longitude).toBeCloseTo(120, 6);
    const snappedBoundary = validateSurveyWaypoints(snapped);
    expect(snappedBoundary.valid).toBe(true);
    if (!snappedBoundary.valid) return;
    expect(measureAffectedAreas(plot, [snappedBoundary.polygon])).toMatchObject({
      valid: true,
      provenance: { containmentToleranceMeters: AFFECTED_AREA_CONTAINMENT_TOLERANCE_METERS },
    });

    const beyondZone = waypoints([[119.9999, 14], [120.002, 14], [120.002, 14.002], [119.9999, 14.002]]);
    const unsnapped = snapAffectedAreaWaypoints(plot, beyondZone);
    expect(unsnapped[0]).toEqual(beyondZone[0]);
    expect(unsnapped[3]).toEqual(beyondZone[3]);
    const outsideBoundary = validateSurveyWaypoints(unsnapped);
    expect(outsideBoundary.valid).toBe(true);
    if (!outsideBoundary.valid) return;
    expect(measureAffectedAreas(plot, [outsideBoundary.polygon])).toMatchObject({ valid: false, error: { code: 'OUTSIDE_PLOT' } });
  });

  it('leaves interior affected vertices untouched when snapping', () => {
    const plot = { type: 'Polygon' as const, coordinates: [[[120, 14], [120.002, 14], [120.002, 14.002], [120, 14.002], [120, 14]]] };
    const interior = waypoints([[120.0005, 14.0005], [120.0015, 14.0005], [120.0015, 14.0015], [120.0005, 14.0015]]);
    expect(snapAffectedAreaWaypoints(plot, interior)).toEqual(interior);
  });

  it('still rejects an affected rectangle filling the U-notch after snapping', () => {
    const plot = {
      type: 'Polygon' as const,
      coordinates: [[[120, 14], [120.004, 14], [120.004, 14.004], [120.003, 14.004], [120.003, 14.001], [120.001, 14.001], [120.001, 14.004], [120, 14.004], [120, 14]]],
    };
    const notch = waypoints([[120.001, 14.001], [120.003, 14.001], [120.003, 14.004], [120.001, 14.004]]);
    expect(snapAffectedAreaWaypoints(plot, notch)).toEqual(notch);
    const boundary = validateSurveyWaypoints(notch);
    expect(boundary.valid).toBe(true);
    if (!boundary.valid) return;
    expect(measureAffectedAreas(plot, [boundary.polygon])).toMatchObject({ valid: false, error: { code: 'OUTSIDE_PLOT' } });
  });
});
