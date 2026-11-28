import {
  describeOutsidePlot,
  findAffectedAreasOutsidePlot,
  AFFECTED_AREA_CONTAINMENT_TOLERANCE_METERS,
  MAX_AFFECTED_AREA_WAYPOINTS,
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

  // Intent: no affected polygon means the affected ground was not measured; zero needs an explicit confirmation.
  it('reports no affected polygons as not measured, and zero only when confirmed', () => {
    const plot = { type: 'Polygon' as const, coordinates: [[[120, 14], [120.004, 14], [120.004, 14.004], [120, 14.004], [120, 14]]] };
    expect(measureAffectedAreas(plot, [])).toMatchObject({ valid: true, areaSqm: null, measurement: 'not_measured' });
    expect(measureAffectedAreas(plot, [], { confirmedZero: false })).toMatchObject({ areaSqm: null, measurement: 'not_measured' });
    expect(measureAffectedAreas(plot, [], { confirmedZero: true })).toMatchObject({ valid: true, areaSqm: 0, measurement: 'measured' });
    // A drawn area is measured whatever was confirmed before.
    const inside = { type: 'Polygon' as const, coordinates: [[[120, 14.0002], [120.0008, 14.0002], [120.0008, 14.0008], [120, 14.0008], [120, 14.0002]]] };
    const drawn = measureAffectedAreas(plot, [inside], { confirmedZero: true });
    expect(drawn).toMatchObject({ valid: true, measurement: 'measured' });
    expect(drawn.valid && drawn.areaSqm).toBeGreaterThan(0);
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

describe('describeOutsidePlot', () => {
  const at = (latitude: number, longitude: number) => ({ latitude, longitude, accuracyMeters: null, capturedAt: '2026-10-05T09:00:00.000Z', source: 'map' as const });
  const plot = validateSurveyWaypoints([at(14, 120), at(14, 120.001), at(14.001, 120.001), at(14.001, 120)]);

  it('reports how many points stick out and the farthest distance', () => {
    if (!plot.valid) throw new Error('plot');
    const result = describeOutsidePlot(plot.polygon, [at(14.0005, 120.0005), at(13.9999, 120.0005)]);
    expect(result?.count).toBe(1);
    expect(result?.maxMeters).toBeGreaterThan(10);
  });

  it('is null when every point is inside', () => {
    if (!plot.valid) throw new Error('plot');
    expect(describeOutsidePlot(plot.polygon, [at(14.0005, 120.0005)])).toBeNull();
  });

  it('accepts diagonal-edge snapped affected polygons and never reports snapped edge points as outside', () => {
    const diagonalPlot = validateSurveyWaypoints([
      at(10.700000, 122.950000),
      at(10.700412, 122.951347),
      at(10.701689, 122.950921),
      at(10.701204, 122.949613),
    ]);
    if (!diagonalPlot.valid) throw new Error('diagonal plot');
    const ring = diagonalPlot.polygon.coordinates[0];
    const inside1 = at(10.7008, 122.9505);
    const inside2 = at(10.7009, 122.9508);

    // Sweep points ~2.2 m outside all 4 diagonal edges (within the 5 m forgiveness zone).
    for (let edge = 0; edge < 4; edge += 1) {
      const a = ring[edge];
      const b = ring[edge + 1];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = Math.hypot(dx, dy);
      const nx = dy / len;
      const ny = -dx / len;
      for (let k = 1; k <= 12; k += 1) {
        const t1 = k / 16;
        const t2 = (k + 2) / 16;
        const raw = [
          at(a[1] + dy * t1 + ny * 0.00002, a[0] + dx * t1 + nx * 0.00002),
          at(a[1] + dy * t2 + ny * 0.00002, a[0] + dx * t2 + nx * 0.00002),
          inside2,
          inside1,
        ];
        const snapped = snapAffectedAreaWaypoints(diagonalPlot.polygon, raw);
        const candidate = validateSurveyWaypoints(snapped);
        if (!candidate.valid) continue;
        expect(measureAffectedAreas(diagonalPlot.polygon, [candidate.polygon]).valid).toBe(true);
        expect(findAffectedAreasOutsidePlot(diagonalPlot.polygon, [candidate.polygon])).toEqual([]);
        expect(describeOutsidePlot(diagonalPlot.polygon, snapped)).toBeNull();
      }
    }

    // A point 6 m outside the diagonal edge still stays outside and reports real distance.
    const a = ring[0];
    const b = ring[1];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    const outside6m = at(a[1] + dy * 0.5 + (-dx / len) * 0.000055, a[0] + dx * 0.5 + (dy / len) * 0.000055);
    const snappedOutside = snapAffectedAreaWaypoints(diagonalPlot.polygon, [outside6m, inside2, inside1]);
    const outsideCandidate = validateSurveyWaypoints(snappedOutside);
    if (!outsideCandidate.valid) throw new Error('outside candidate');
    expect(measureAffectedAreas(diagonalPlot.polygon, [outsideCandidate.polygon])).toMatchObject({
      valid: false,
      error: { code: 'OUTSIDE_PLOT' },
    });
    const detail = describeOutsidePlot(diagonalPlot.polygon, snappedOutside);
    expect(detail?.count).toBe(1);
    expect(detail?.maxMeters).toBeGreaterThan(5);
  });

  it('rejects affected-area waypoint sets exceeding the 1,500-waypoint server budget', () => {
    const circle = (count: number, offset: number): SurveyWaypoint[] =>
      Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2;
        return at(14.0005 + offset + Math.sin(angle) * 0.0001, 120.0005 + Math.cos(angle) * 0.0001);
      });
    const sets = [circle(600, 0), circle(600, 0.00005), circle(301, 0.0001)];
    expect(sets.reduce((sum, set) => sum + set.length, 0)).toBe(MAX_AFFECTED_AREA_WAYPOINTS + 1);
    const polygons = sets.map((set) => {
      const validated = validateSurveyWaypoints(set);
      if (!validated.valid) throw new Error('circle invalid');
      return validated.polygon;
    });
    expect(validateAffectedAreaWaypoints(polygons, sets)).toMatchObject({
      valid: false,
      error: { code: 'TOO_MANY_VERTICES' },
    });
  });
});
