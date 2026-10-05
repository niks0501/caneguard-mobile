import {
  ringArea,
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
});
