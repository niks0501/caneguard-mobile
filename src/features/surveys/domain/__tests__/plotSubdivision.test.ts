import {
  applySubdivisionSelection,
  applyWholePlotAffected,
  buildWholePlotAffectedArea,
  insertBendPointOnCut,
  isWholePlotAffected,
  measureSubdivisionSelection,
  MIN_SUBDIVISION_AREA_SQM,
  pointInPiece,
  subdividePlot,
} from '@/features/surveys/domain/plotSubdivision';
import {
  canUndoForTarget,
  pushUndo,
  undoForTarget,
  type DrawingShape,
} from '@/features/surveys/domain/drawingTool';
import {
  findAffectedAreasOutsidePlot,
  MAX_AFFECTED_AREA_WAYPOINTS,
  measureAffectedAreas,
  validateAffectedAreaWaypoints,
  validateSurveyWaypoints,
  type SurveyWaypoint,
} from '@/features/surveys/domain/fieldSurvey';

function gps(latitude: number, longitude: number, accuracyMeters: number | null = 4.2, capturedAt = '2026-11-28T01:00:00.000Z'): SurveyWaypoint {
  return { latitude, longitude, accuracyMeters, source: 'gps', capturedAt };
}

function map(latitude: number, longitude: number, capturedAt = '2026-11-28T01:05:00.000Z'): SurveyWaypoint {
  return { latitude, longitude, accuracyMeters: null, source: 'map', capturedAt };
}

const SQUARE_PLOT: SurveyWaypoint[] = [
  gps(14.1, 121.1, 3.8, '2026-11-28T01:00:00.000Z'),
  gps(14.1, 121.102, 4.1, '2026-11-28T01:01:00.000Z'),
  gps(14.102, 121.102, 4.5, '2026-11-28T01:02:00.000Z'),
  map(14.102, 121.1, '2026-11-28T01:03:00.000Z'),
];

const ROTATED_PLOT: SurveyWaypoint[] = [
  gps(10.700000, 122.950000, 3.5),
  gps(10.700412, 122.951347, 4.0),
  gps(10.701689, 122.950921, 5.2),
  gps(10.701204, 122.949613, 3.9),
];

const U_SHAPED_PLOT: SurveyWaypoint[] = [
  gps(14.100, 121.100),
  gps(14.100, 121.103),
  gps(14.103, 121.103),
  gps(14.103, 121.102),
  gps(14.101, 121.102),
  gps(14.101, 121.101),
  gps(14.103, 121.101),
  gps(14.103, 121.100),
];

const SPLIT_AT = '2026-11-28T02:00:00.000Z';

function emptyShape(waypoints: SurveyWaypoint[] = SQUARE_PLOT): DrawingShape {
  return { waypoints, affectedAreas: [], affectedAreaWaypointSets: [], affectedWaypoints: [] };
}

describe('subdividePlot', () => {
  it('splits a convex plot into two equal halves with conserved geodesic area and exact containment', () => {
    const result = subdividePlot(
      SQUARE_PLOT,
      [[{ latitude: 14.1005, longitude: 121.101 }, { latitude: 14.1015, longitude: 121.101 }]],
      SPLIT_AT,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.pieces).toHaveLength(2);
    expect(result.pieces.map((p) => p.id)).toEqual(['P1', 'P2']);

    const sumArea = result.pieces.reduce((sum, piece) => sum + piece.areaSqm, 0);
    expect(Math.abs(sumArea - result.plotAreaSqm)).toBeLessThan(1);
    expect(result.pieces[0].percentOfPlot).toBeCloseTo(50, 0);
    expect(result.pieces[1].percentOfPlot).toBeCloseTo(50, 0);

    const plot = validateSurveyWaypoints(SQUARE_PLOT);
    if (!plot.valid) throw new Error('plot invalid');
    for (const piece of result.pieces) {
      expect(piece.polygon.coordinates).toHaveLength(1);
      expect(findAffectedAreasOutsidePlot(plot.polygon, [piece.polygon])).toEqual([]);
      expect(measureAffectedAreas(plot.polygon, [piece.polygon]).valid).toBe(true);
      expect(validateAffectedAreaWaypoints([piece.polygon], [piece.waypoints]).valid).toBe(true);
      expect(pointInPiece(piece.labelPoint, piece)).toBe(true);
    }
  });

  it('splits a diagonal rotated plot cleanly even when cut endpoints sit right on rotated edges', () => {
    // Midpoints of two opposite diagonal edges (without ray extension IEEE-754 misses noding).
    const edge1Mid = {
      latitude: (ROTATED_PLOT[0].latitude + ROTATED_PLOT[1].latitude) / 2,
      longitude: (ROTATED_PLOT[0].longitude + ROTATED_PLOT[1].longitude) / 2,
    };
    const edge3Mid = {
      latitude: (ROTATED_PLOT[2].latitude + ROTATED_PLOT[3].latitude) / 2,
      longitude: (ROTATED_PLOT[2].longitude + ROTATED_PLOT[3].longitude) / 2,
    };
    const result = subdividePlot(ROTATED_PLOT, [[edge1Mid, edge3Mid]], SPLIT_AT);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.pieces).toHaveLength(2);
    const sumArea = result.pieces.reduce((sum, piece) => sum + piece.areaSqm, 0);
    expect(Math.abs(sumArea - result.plotAreaSqm)).toBeLessThan(1);

    const plot = validateSurveyWaypoints(ROTATED_PLOT);
    if (!plot.valid) throw new Error('rotated plot invalid');
    for (const piece of result.pieces) {
      expect(measureAffectedAreas(plot.polygon, [piece.polygon]).valid).toBe(true);
      expect(validateAffectedAreaWaypoints([piece.polygon], [piece.waypoints]).valid).toBe(true);
    }
  });

  it('splits a concave U-shaped plot into three strictly contained pieces with interior label points', () => {
    const result = subdividePlot(
      U_SHAPED_PLOT,
      [[{ latitude: 14.102, longitude: 121.099 }, { latitude: 14.102, longitude: 121.104 }]],
      SPLIT_AT,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.pieces).toHaveLength(3);
    expect(result.pieces.map((p) => p.id)).toEqual(['P1', 'P2', 'P3']);
    const sumArea = result.pieces.reduce((sum, piece) => sum + piece.areaSqm, 0);
    expect(Math.abs(sumArea - result.plotAreaSqm)).toBeLessThan(1);

    const plot = validateSurveyWaypoints(U_SHAPED_PLOT);
    if (!plot.valid) throw new Error('u-plot invalid');
    for (const piece of result.pieces) {
      expect(pointInPiece(piece.labelPoint, piece)).toBe(true);
      expect(measureAffectedAreas(plot.polygon, [piece.polygon]).valid).toBe(true);
    }
  });

  it('supports bent multi-segment polylines and multi-cut subdivisions into four quadrants', () => {
    const bent = subdividePlot(
      SQUARE_PLOT,
      [[
        { latitude: 14.101, longitude: 121.099 },
        { latitude: 14.101, longitude: 121.101 },
        { latitude: 14.103, longitude: 121.101 },
      ]],
      SPLIT_AT,
    );
    expect(bent.ok).toBe(true);
    if (!bent.ok) return;
    expect(bent.pieces).toHaveLength(2);
    const bentPercents = bent.pieces.map((p) => p.percentOfPlot).sort((a, b) => a - b);
    expect(bentPercents[0]).toBeCloseTo(25, 0);
    expect(bentPercents[1]).toBeCloseTo(75, 0);

    const quarters = subdividePlot(
      SQUARE_PLOT,
      [
        [{ latitude: 14.1005, longitude: 121.101 }, { latitude: 14.1015, longitude: 121.101 }],
        [{ latitude: 14.101, longitude: 121.1005 }, { latitude: 14.101, longitude: 121.1015 }],
      ],
      SPLIT_AT,
    );
    expect(quarters.ok).toBe(true);
    if (!quarters.ok) return;
    expect(quarters.pieces).toHaveLength(4);
    quarters.pieces.forEach((piece) => expect(piece.percentOfPlot).toBeCloseTo(25, 0));
  });

  it('preserves GPS/map provenance on shared plot corners and marks cut intersections as map', () => {
    const result = subdividePlot(
      SQUARE_PLOT,
      [[{ latitude: 14.1005, longitude: 121.101 }, { latitude: 14.1015, longitude: 121.101 }]],
      SPLIT_AT,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const eastPiece = result.pieces.find((p) => p.labelPoint.longitude > 121.101);
    expect(eastPiece).toBeDefined();
    if (!eastPiece) return;

    const gpsCorners = eastPiece.waypoints.filter((wp) => wp.source === 'gps');
    const mapCutVertices = eastPiece.waypoints.filter((wp) => wp.source === 'map');
    expect(gpsCorners).toHaveLength(2);
    expect(gpsCorners.every((wp) => wp.accuracyMeters !== null && wp.capturedAt !== SPLIT_AT)).toBe(true);
    expect(mapCutVertices).toHaveLength(2);
    expect(mapCutVertices.every((wp) => wp.accuracyMeters === null && wp.capturedAt === SPLIT_AT)).toBe(true);
  });

  it('rejects self-intersecting cut lines, missing cuts, invalid plots, and non-crossing cuts', () => {
    expect(subdividePlot(SQUARE_PLOT.slice(0, 2), [[{ latitude: 14.1, longitude: 121.1 }, { latitude: 14.102, longitude: 121.102 }]]))
      .toMatchObject({ ok: false, code: 'INVALID_PLOT' });

    expect(subdividePlot(SQUARE_PLOT, [])).toMatchObject({ ok: false, code: 'INVALID_CUT' });

    expect(subdividePlot(SQUARE_PLOT, [[{ latitude: 14.101, longitude: 121.101 }, { latitude: 14.101, longitude: 121.101 }]]))
      .toMatchObject({ ok: false, code: 'INVALID_CUT' });

    const selfCrossing = [
      { latitude: 14.1, longitude: 121.099 },
      { latitude: 14.102, longitude: 121.103 },
      { latitude: 14.102, longitude: 121.099 },
      { latitude: 14.1, longitude: 121.103 },
    ];
    expect(subdividePlot(SQUARE_PLOT, [selfCrossing])).toMatchObject({ ok: false, code: 'SELF_INTERSECTING_CUT' });

    const missPlot = [
      { latitude: 14.105, longitude: 121.099 },
      { latitude: 14.105, longitude: 121.103 },
    ];
    expect(subdividePlot(SQUARE_PLOT, [missPlot])).toMatchObject({ ok: false, code: 'NO_SPLIT' });
  });

  it('filters degenerate micro-sliver faces below MIN_SUBDIVISION_AREA_SQM', () => {
    // Cut barely grazes the bottom-left corner (sliver < 0.05 m²).
    const grazingCut = [
      { latitude: 14.100001, longitude: 121.1 },
      { latitude: 14.1, longitude: 121.100001 },
    ];
    const result = subdividePlot(SQUARE_PLOT, [grazingCut], SPLIT_AT);
    expect(result).toMatchObject({ ok: false, code: 'NO_SPLIT' });
    expect(MIN_SUBDIVISION_AREA_SQM).toBe(1);
  });

  it('inserts midpoint bend vertices cleanly without mutating the original cut', () => {
    const cut = [{ latitude: 14.1, longitude: 121.1 }, { latitude: 14.102, longitude: 121.102 }];
    const bent = insertBendPointOnCut(cut, 0);
    expect(cut).toHaveLength(2);
    expect(bent).toHaveLength(3);
    expect(bent[1].latitude).toBeCloseTo(14.101, 9);
    expect(bent[1].longitude).toBeCloseTo(121.101, 9);
  });
});

describe('applySubdivisionSelection & overlap deduplication', () => {
  it('appends selected pieces, deduplicates overlaps with existing manual patches, and supports target-isolated Undo', () => {
    const split = subdividePlot(
      SQUARE_PLOT,
      [[{ latitude: 14.1005, longitude: 121.101 }, { latitude: 14.1015, longitude: 121.101 }]],
      SPLIT_AT,
    );
    if (!split.ok) throw new Error('split failed');

    // Existing manual patch spans the centre (overlapping both left and right halves).
    const centerPatchWps = [map(14.1005, 121.1005), map(14.1005, 121.1015), map(14.1015, 121.1015), map(14.1015, 121.1005)];
    const centerPatch = validateSurveyWaypoints(centerPatchWps);
    if (!centerPatch.valid) throw new Error('center patch invalid');

    const baseShape: DrawingShape = {
      waypoints: SQUARE_PLOT,
      affectedAreas: [centerPatch.polygon],
      affectedAreaWaypointSets: [centerPatchWps],
      affectedWaypoints: [],
    };
    const plot = validateSurveyWaypoints(SQUARE_PLOT);
    if (!plot.valid) throw new Error('plot invalid');

    const preview = measureSubdivisionSelection(plot.polygon, plot.areaSqm, [split.pieces[0]], baseShape.affectedAreas);
    expect(preview).not.toBeNull();
    expect(preview?.overlapRemoved).toBe(true);
    expect(preview!.combinedAreaSqm).toBeGreaterThan(split.pieces[0].areaSqm);
    expect(preview!.combinedAreaSqm).toBeLessThan(split.pieces[0].areaSqm + centerPatch.areaSqm);

    const applied = applySubdivisionSelection(baseShape, [split.pieces[0]]);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.addedCount).toBe(1);
    expect(applied.shape.affectedAreas).toHaveLength(2);
    expect(applied.shape.waypoints).toEqual(SQUARE_PLOT);

    const measured = measureAffectedAreas(plot.polygon, applied.shape.affectedAreas);
    expect(measured.valid).toBe(true);
    if (measured.valid) {
      expect(measured.provenance.overlapRemoved).toBe(true);
      expect(measured.areaSqm).toBeCloseTo(preview!.combinedAreaSqm, 1);
    }

    // Re-applying the exact same piece skips duplicating it.
    const duplicate = applySubdivisionSelection(applied.shape, [split.pieces[0]]);
    expect(duplicate).toMatchObject({ ok: true, addedCount: 0 });

    // One-tap Undo in Affected mode restores baseShape without modifying whole-plot waypoints.
    const history = pushUndo([], baseShape);
    expect(canUndoForTarget(applied.shape, history, true)).toBe(true);
    const undone = undoForTarget(applied.shape, history, true);
    expect(undone?.shape.affectedAreas).toHaveLength(1);
    expect(undone?.shape.waypoints).toEqual(SQUARE_PLOT);
  });
});

describe('Whole plot affected shortcut (D2-A)', () => {
  it('marks 100% of the measured plot, preserves corner provenance, strips walk isCorner, and is idempotent', () => {
    const plotWithCorner: SurveyWaypoint[] = SQUARE_PLOT.map((wp, index) => (index === 0 ? { ...wp, isCorner: true } : wp));
    const built = buildWholePlotAffectedArea(plotWithCorner, SPLIT_AT);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.piece.percentOfPlot).toBe(100);
    expect(built.piece.waypoints[0]).not.toHaveProperty('isCorner');
    expect(built.piece.waypoints[0].source).toBe('gps');
    expect(built.piece.waypoints[0].accuracyMeters).toBe(3.8);
    expect(built.piece.waypoints[3].source).toBe('map');

    const start = emptyShape(plotWithCorner);
    const first = applyWholePlotAffected(start, SPLIT_AT);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.alreadyWhole).toBe(false);
    expect(first.replacedExisting).toBe(false);
    expect(isWholePlotAffected(first.shape)).toBe(true);

    const second = applyWholePlotAffected(first.shape, SPLIT_AT);
    expect(second).toMatchObject({ ok: true, alreadyWhole: true, replacedExisting: false });
  });

  it('replaces existing affected areas and open affected points cleanly so Undo restores them in one step', () => {
    const patchWps = [map(14.1002, 121.1002), map(14.1002, 121.1008), map(14.1008, 121.1008)];
    const patch = validateSurveyWaypoints(patchWps);
    if (!patch.valid) throw new Error('patch invalid');
    const before: DrawingShape = {
      waypoints: SQUARE_PLOT,
      affectedAreas: [patch.polygon],
      affectedAreaWaypointSets: [patchWps],
      affectedWaypoints: [map(14.101, 121.101)],
    };

    const applied = applyWholePlotAffected(before, SPLIT_AT);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.replacedExisting).toBe(true);
    expect(applied.shape.affectedAreas).toHaveLength(1);
    expect(applied.shape.affectedWaypoints).toEqual([]);
    expect(isWholePlotAffected(applied.shape)).toBe(true);

    const history = pushUndo([], before);
    const undone = undoForTarget(applied.shape, history, true);
    expect(undone?.shape).toEqual(before);
  });

  it('rejects whole-plot shortcut cleanly when the plot exceeds the 1,500-waypoint server budget', () => {
    const oversizedPlot: SurveyWaypoint[] = Array.from({ length: MAX_AFFECTED_AREA_WAYPOINTS + 1 }, (_, index) => {
      const angle = (index / (MAX_AFFECTED_AREA_WAYPOINTS + 1)) * Math.PI * 2;
      return gps(14.1 + Math.sin(angle) * 0.002, 121.1 + Math.cos(angle) * 0.002);
    });
    expect(validateSurveyWaypoints(oversizedPlot).valid).toBe(true);
    expect(buildWholePlotAffectedArea(oversizedPlot, SPLIT_AT)).toMatchObject({
      ok: false,
      code: 'TOO_MANY_VERTICES',
    });
    expect(applyWholePlotAffected(emptyShape(oversizedPlot), SPLIT_AT)).toMatchObject({
      ok: false,
    });
  });
});
