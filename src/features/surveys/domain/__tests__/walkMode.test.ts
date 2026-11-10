import { decideWalkFix, WALK_MAX_ACCURACY_METERS, WALK_MIN_SPACING_METERS, distanceMeters } from '@/features/surveys/domain/walkMode';

const T = Date.UTC(2026, 10, 11, 1, 0, 0);
const START = { latitude: 14.1, longitude: 121.1 };
// ~0.00009° of latitude is about 10 m.
const TEN_METERS_NORTH = { latitude: 14.10009, longitude: 121.1 };
const THREE_METERS_NORTH = { latitude: 14.100027, longitude: 121.1 };

describe('decideWalkFix', () => {
  // Intent: walking the edge adds a point automatically, with no button press per point.
  it('accepts the first accurate fix as a GPS point carrying its accuracy and time', () => {
    const decision = decideWalkFix({ ...START, accuracy: 4, timestamp: T }, null);
    expect(decision).toEqual({
      action: 'accept',
      waypoint: { ...START, accuracyMeters: 4, capturedAt: new Date(T).toISOString(), source: 'gps' },
    });
  });

  // Intent: a walker who has moved a few metres gets the next point.
  it('accepts a fix once the walker is past the minimum spacing', () => {
    expect(distanceMeters(START, TEN_METERS_NORTH)).toBeGreaterThan(WALK_MIN_SPACING_METERS);
    expect(decideWalkFix({ ...TEN_METERS_NORTH, accuracy: 5, timestamp: T }, START).action).toBe('accept');
  });

  // Intent: standing still or jittering does not bloat the boundary with points.
  it('skips a fix too close to the last point', () => {
    expect(decideWalkFix({ ...THREE_METERS_NORTH, accuracy: 5, timestamp: T }, START))
      .toEqual({ action: 'skip', reason: 'too_close' });
  });

  // Intent: poor GPS never becomes a boundary vertex while walking.
  it('skips weak or unknown accuracy', () => {
    expect(decideWalkFix({ ...TEN_METERS_NORTH, accuracy: WALK_MAX_ACCURACY_METERS + 1, timestamp: T }, START))
      .toEqual({ action: 'skip', reason: 'weak_accuracy' });
    expect(decideWalkFix({ ...TEN_METERS_NORTH, accuracy: null, timestamp: T }, START))
      .toEqual({ action: 'skip', reason: 'weak_accuracy' });
  });

  // Intent: a garbled reading cannot write a NaN vertex.
  it('skips non-finite coordinates', () => {
    expect(decideWalkFix({ latitude: NaN, longitude: 121.1, accuracy: 3, timestamp: T }, null))
      .toEqual({ action: 'skip', reason: 'invalid' });
  });
});
