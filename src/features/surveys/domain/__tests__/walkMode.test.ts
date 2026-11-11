import GeographicLib from 'geographiclib-geodesic/geographiclib-geodesic.min.js';

import { ACCEPTABLE_GPS_ACCURACY_METERS } from '@/features/surveys/domain/boundaryQuality';
import { decideWalkFix } from '@/features/surveys/domain/walkMode';

const T = Date.UTC(2026, 10, 11, 1, 0, 0);
const START = { latitude: 14.1, longitude: 121.1 };
// Sampling targets for G5 walk mode. The cited spec (data/cg-polygon-audit-20261110/report.md) is not part
// of this repository, so these stay provisional until the field test the intent defers, or the spec, pins them.
const SPACING_METERS = 8;
// Accuracy is pinned to the boundary-quality contract that predates walk mode.
const ACCURACY_METERS = ACCEPTABLE_GPS_ACCURACY_METERS;
// WGS84 meridian degree length at this latitude; only used to place test fixes.
const METERS_PER_DEGREE_LATITUDE = 110_640;
const GOOD_ACCURACY_METERS = 4;

function metersNorthOfStart(distanceMeters: number) {
  return { latitude: START.latitude + distanceMeters / METERS_PER_DEGREE_LATITUDE, longitude: START.longitude };
}

// Independent geodesic oracle: measures a placed fix without going through the walk code.
function geodesicMetersFromStart(to: { latitude: number; longitude: number }) {
  return GeographicLib.Geodesic.WGS84.Inverse(START.latitude, START.longitude, to.latitude, to.longitude).s12;
}

describe('decideWalkFix', () => {
  // Intent: walking the edge adds a point automatically, with no button press per point.
  it('accepts the first accurate fix as a GPS point carrying its accuracy and time', () => {
    const decision = decideWalkFix({ ...START, accuracy: GOOD_ACCURACY_METERS, timestamp: T }, null);
    expect(decision).toEqual({
      action: 'accept',
      waypoint: { ...START, accuracyMeters: GOOD_ACCURACY_METERS, capturedAt: new Date(T).toISOString(), source: 'gps' },
    });
  });

  // Intent: a walker who has moved gets the next point, a jittering one does not.
  it('accepts a fix 8.1 m out and skips one 7.9 m out', () => {
    const justPast = metersNorthOfStart(SPACING_METERS + 0.1);
    const justUnder = metersNorthOfStart(SPACING_METERS - 0.1);
    expect(geodesicMetersFromStart(justPast)).toBeCloseTo(SPACING_METERS + 0.1, 1);
    expect(geodesicMetersFromStart(justUnder)).toBeCloseTo(SPACING_METERS - 0.1, 1);

    expect(decideWalkFix({ ...justPast, accuracy: GOOD_ACCURACY_METERS, timestamp: T }, START).action).toBe('accept');
    expect(decideWalkFix({ ...justUnder, accuracy: GOOD_ACCURACY_METERS, timestamp: T }, START))
      .toEqual({ action: 'skip', reason: 'too_close' });
  });

  // Intent: poor GPS never becomes a boundary vertex while walking.
  it('accepts a fix reporting ±9.9 m and skips one reporting ±10.1 m or nothing', () => {
    const onTheMove = metersNorthOfStart(SPACING_METERS + 5);
    expect(decideWalkFix({ ...onTheMove, accuracy: ACCURACY_METERS - 0.1, timestamp: T }, START).action).toBe('accept');
    expect(decideWalkFix({ ...onTheMove, accuracy: ACCURACY_METERS + 0.1, timestamp: T }, START))
      .toEqual({ action: 'skip', reason: 'weak_accuracy' });
    expect(decideWalkFix({ ...onTheMove, accuracy: null, timestamp: T }, START))
      .toEqual({ action: 'skip', reason: 'weak_accuracy' });
  });

  // Intent: a garbled reading cannot write a NaN vertex.
  it('skips non-finite coordinates', () => {
    expect(decideWalkFix({ latitude: NaN, longitude: 121.1, accuracy: GOOD_ACCURACY_METERS, timestamp: T }, null))
      .toEqual({ action: 'skip', reason: 'invalid' });
  });
});
