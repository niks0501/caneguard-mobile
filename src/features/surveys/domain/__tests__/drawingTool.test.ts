// Intent: the phone drawing tool edits any point, undoes every edit, draws points by quality and says where a boundary is invalid.
import {
  MAX_UNDO_STEPS,
  assessValidity,
  boundaryBadge,
  drawingToolState,
  dropLastPoint,
  edgeCount,
  findCrossingEdges,
  insertPointOnEdge,
  movePoint,
  pointQuality,
  pushUndo,
  removeAffectedAreaAt,
  removePoint,
  type DrawingShape,
} from '@/features/surveys/domain/drawingTool';
import { validateSurveyWaypoints, type SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';

function gps(latitude: number, longitude: number, accuracyMeters: number | null = 4): SurveyWaypoint {
  return { latitude, longitude, accuracyMeters, source: 'gps', capturedAt: '2026-11-10T00:00:00.000Z' };
}
function map(latitude: number, longitude: number): SurveyWaypoint {
  return { latitude, longitude, accuracyMeters: null, source: 'map', capturedAt: '2026-11-10T00:00:00.000Z' };
}

const PLOT = [map(14.1, 121.1), map(14.1, 121.102), map(14.102, 121.102), map(14.102, 121.1)];
const INSIDE = [map(14.1005, 121.1005), map(14.1005, 121.1015), map(14.1015, 121.1015), map(14.1015, 121.1005)];

function shapeWithArea(): DrawingShape {
  const area = validateSurveyWaypoints(INSIDE);
  if (!area.valid) throw new Error('fixture invalid');
  return { waypoints: PLOT, affectedAreas: [area.polygon], affectedAreaWaypointSets: [INSIDE], affectedWaypoints: [] };
}

describe('point quality', () => {
  it('names a point placed on the map separately from every GPS reading', () => {
    expect(pointQuality(map(1, 1))).toBe('map');
    expect(pointQuality(gps(1, 1, 3))).toBe('good');
    expect(pointQuality(gps(1, 1, 8))).toBe('acceptable');
    expect(pointQuality(gps(1, 1, 25))).toBe('weak');
    expect(pointQuality(gps(1, 1, null))).toBe('unknown');
  });

  it('labels a boundary drawn only on the map as drawn on the map, not low accuracy', () => {
    expect(boundaryBadge(PLOT)).toBe('drawn_on_map');
  });

  it('judges a mixed boundary by its GPS readings only', () => {
    expect(boundaryBadge([map(1, 1), gps(1, 2, 3), map(2, 2)])).toBe('good');
    expect(boundaryBadge([map(1, 1), gps(1, 2, 30)])).toBe('low_accuracy');
  });
});

describe('drawing tool state', () => {
  it('names each state the tool can be in', () => {
    const base = { locked: false, drawingAffectedArea: false, hasSelection: false, activeAffectedCount: 0 };
    expect(drawingToolState({ ...base, locked: true })).toBe('idle');
    expect(drawingToolState(base)).toBe('plot.add');
    expect(drawingToolState({ ...base, hasSelection: true })).toBe('plot.move');
    expect(drawingToolState({ ...base, drawingAffectedArea: true, activeAffectedCount: 2 })).toBe('affected.add');
    expect(drawingToolState({ ...base, drawingAffectedArea: true, activeAffectedCount: 3 })).toBe('affected.closable');
  });
});

describe('editing points', () => {
  it('moves a dragged GPS point and records it as placed on the map', () => {
    const shape: DrawingShape = { ...shapeWithArea(), waypoints: [gps(14.1, 121.1), ...PLOT.slice(1)] };
    const result = movePoint(shape, { set: 'plot', index: 0 }, { latitude: 14.0999, longitude: 121.0999 });
    expect(result.ok && result.shape.waypoints[0]).toMatchObject({ latitude: 14.0999, source: 'map', accuracyMeters: null });
  });

  it('inserts a point halfway along an edge, including the closing edge', () => {
    const shape = shapeWithArea();
    const first = insertPointOnEdge(shape, { set: 'plot', index: 0 }, 0);
    expect(first.ok && first.shape.waypoints).toHaveLength(5);
    expect(first.ok && first.shape.waypoints[1].latitude).toBe(14.1);
    expect(first.ok && first.shape.waypoints[1].longitude).toBeCloseTo(121.101, 9);
    const closing = insertPointOnEdge(shape, { set: 'plot', index: 0 }, 3);
    expect(closing.ok && closing.shape.waypoints[4].latitude).toBeCloseTo(14.101, 9);
    expect(closing.ok && closing.shape.waypoints[4].longitude).toBe(121.1);
  });

  it('counts the edges of an open line and of a closed ring', () => {
    expect(edgeCount(2, true)).toBe(1);
    expect(edgeCount(3, true)).toBe(3);
    expect(edgeCount(3, false)).toBe(2);
    expect(edgeCount(1, false)).toBe(0);
  });

  it('moves a point of a finished affected area and keeps its polygon in step', () => {
    const result = movePoint(shapeWithArea(), { set: 'area', area: 0, index: 2 }, { latitude: 14.1018, longitude: 121.1018 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.shape.affectedAreaWaypointSets[0][2]).toMatchObject({ source: 'map' });
      expect(result.shape.affectedAreas[0].coordinates[0][2]).toEqual([121.1018, 14.1018]);
    }
  });

  it('refuses to drag a finished affected area outside the plot and leaves it untouched', () => {
    const shape = shapeWithArea();
    const result = movePoint(shape, { set: 'area', area: 0, index: 2 }, { latitude: 14.2, longitude: 121.5 });
    expect(result.ok).toBe(false);
  });

  it('refuses to leave an affected area with fewer than three points', () => {
    const triangle = { ...shapeWithArea() };
    const small = removePoint(triangle, { set: 'area', area: 0, index: 3 });
    expect(small.ok).toBe(true);
    if (small.ok) expect(removePoint(small.shape, { set: 'area', area: 0, index: 2 }).ok).toBe(false);
  });

  it('removes any one affected area, not only the last', () => {
    const base = shapeWithArea();
    const two: DrawingShape = {
      ...base,
      affectedAreas: [base.affectedAreas[0], base.affectedAreas[0]],
      affectedAreaWaypointSets: [INSIDE, INSIDE.slice().reverse()],
    };
    const result = removeAffectedAreaAt(two, 0);
    expect(result.affectedAreas).toHaveLength(1);
    expect(result.affectedAreaWaypointSets[0]).toEqual(INSIDE.slice().reverse());
  });

  it('keeps at most the newest undo steps', () => {
    let history: DrawingShape[] = [];
    for (let step = 0; step < MAX_UNDO_STEPS + 5; step += 1) {
      history = pushUndo(history, { ...shapeWithArea(), waypoints: [map(step, step)] });
    }
    expect(history).toHaveLength(MAX_UNDO_STEPS);
    expect(history.at(-1)?.waypoints[0].latitude).toBe(MAX_UNDO_STEPS + 4);
  });

  it('falls back to dropping the last point of the active tool when there is no history', () => {
    const shape: DrawingShape = { ...shapeWithArea(), affectedWaypoints: INSIDE.slice(0, 2) };
    expect(dropLastPoint(shape, true).affectedWaypoints).toHaveLength(1);
    expect(dropLastPoint(shape, false).waypoints).toHaveLength(3);
  });
});

describe('where a boundary is invalid', () => {
  const BOWTIE = [map(14.1, 121.1), map(14.102, 121.102), map(14.102, 121.1), map(14.1, 121.102)];

  it('marks the edges of a boundary that crosses itself', () => {
    expect(findCrossingEdges(BOWTIE)).toEqual([0, 2]);
    expect(assessValidity(BOWTIE, [])).toMatchObject({ issue: 'crosses_itself', crossingEdges: [0, 2] });
  });

  it('names too few points, a valid plot, and no area', () => {
    expect(assessValidity(PLOT.slice(0, 2), []).issue).toBe('too_few_points');
    expect(assessValidity(PLOT, []).issue).toBeNull();
    expect(assessValidity([map(14.1, 121.1), map(14.1, 121.101), map(14.1, 121.102)], []).issue).toBe('no_area');
  });

  it('marks an affected area that lies outside the plot', () => {
    const outside = validateSurveyWaypoints([map(14.2, 121.2), map(14.2, 121.201), map(14.201, 121.201)]);
    if (!outside.valid) throw new Error('fixture invalid');
    expect(assessValidity(PLOT, [shapeWithArea().affectedAreas[0], outside.polygon])).toMatchObject({ issue: 'affected_outside', outsideAreas: [1] });
  });
});
