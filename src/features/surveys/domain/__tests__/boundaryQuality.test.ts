import { assessBoundaryQuality } from '@/features/surveys/domain/boundaryQuality';
import type { SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';

const point = (accuracyMeters: number | null): SurveyWaypoint => ({ latitude: 14, longitude: 120, accuracyMeters, capturedAt: '2026-01-01T00:00:00.000Z', source: 'gps' });

describe('assessBoundaryQuality', () => {
  it('is good when every point is 5 m or better', () => {
    expect(assessBoundaryQuality([point(5), point(2), point(3)])).toEqual({ state: 'good', pointCount: 3, worst: null });
  });
  it('is acceptable when some points are 5 to 10 m', () => {
    expect(assessBoundaryQuality([point(3), point(10), point(6)])).toMatchObject({ state: 'acceptable', worst: { index: 1, accuracyMeters: 10 } });
  });
  it('is low accuracy past 10 m and names the worst point', () => {
    expect(assessBoundaryQuality([point(3), point(10.5), point(22)])).toMatchObject({ state: 'low_accuracy', worst: { index: 2, accuracyMeters: 22 } });
  });
  it('treats unknown accuracy as low accuracy and the worst point', () => {
    expect(assessBoundaryQuality([point(30), point(null), point(2)])).toMatchObject({ state: 'low_accuracy', worst: { index: 1, accuracyMeters: null } });
  });
});
