import GeographicLib from 'geographiclib-geodesic/geographiclib-geodesic.min.js';

import { ACCEPTABLE_GPS_ACCURACY_METERS } from '@/features/surveys/domain/boundaryQuality';
import { decideFinalFix, decideMarkCorner, decideWalkFix, distanceToStart, formatWalkDistance, isBackAtStart, metersToLongitudeDegrees, pickCornerFix, walkAccuracyBand } from '@/features/surveys/domain/walkMode';

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

describe('decideWalkFix jitter guard', () => {
  // Intent: a reading whose error radius exceeds the spacing cannot add a point inside its own uncertainty.
  it('skips a ±9.5 m fix 9 m out but accepts it 10 m out', () => {
    expect(decideWalkFix({ ...metersNorthOfStart(9), accuracy: 9.5, timestamp: T }, START))
      .toEqual({ action: 'skip', reason: 'too_close' });
    expect(decideWalkFix({ ...metersNorthOfStart(10), accuracy: 9.5, timestamp: T }, START).action).toBe('accept');
  });
});

describe('walk readout helpers', () => {
  it('formats distances in metres then kilometres', () => {
    expect(formatWalkDistance(0)).toBe('0 m');
    expect(formatWalkDistance(142.4)).toBe('142 m');
    expect(formatWalkDistance(999.6)).toBe('1000 m');
    expect(formatWalkDistance(1520)).toBe('1.5 km');
    expect(formatWalkDistance(Number.NaN)).toBe('–');
  });

  it('bands live accuracy by the saved-point thresholds', () => {
    expect(walkAccuracyBand(3)).toBe('good');
    expect(walkAccuracyBand(5)).toBe('good');
    expect(walkAccuracyBand(8)).toBe('acceptable');
    expect(walkAccuracyBand(10)).toBe('acceptable');
    expect(walkAccuracyBand(10.1)).toBe('weak');
    expect(walkAccuracyBand(null)).toBe('weak');
  });

  it('measures the way back to the first point, and nothing before there is one', () => {
    expect(distanceToStart({ latitude: 14.1, longitude: 121.1 }, null)).toBeNull();
    const back = distanceToStart({ latitude: 14.1, longitude: 121.1002 }, { latitude: 14.1, longitude: 121.1 });
    expect(back).toBeGreaterThan(20);
    expect(back).toBeLessThan(23);
  });

  it('converts an accuracy radius to degrees of longitude', () => {
    const degrees = metersToLongitudeDegrees(111_320, 0);
    expect(degrees).toBeCloseTo(1, 5);
    expect(metersToLongitudeDegrees(10, 60)).toBeGreaterThan(metersToLongitudeDegrees(10, 0));
  });
});

describe('corners, closing the loop and the final fix', () => {
  const NOW = T + 60_000;
  const gpsFix = (latitude: number, longitude: number, accuracy: number | null, ageMs: number) =>
    ({ latitude, longitude, accuracy, timestamp: NOW - ageMs });
  const gpsPoint = (latitude: number, longitude: number) =>
    ({ latitude, longitude, accuracyMeters: 4, capturedAt: new Date(T).toISOString(), source: 'gps' as const });

  describe('pickCornerFix / decideMarkCorner', () => {
    it('takes the most accurate usable reading from the last three seconds', () => {
      const recent = [gpsFix(14.1, 121.1, 8, 2500), gpsFix(14.10001, 121.1, 3, 1500), gpsFix(14.10002, 121.1, 6, 500)];
      expect(pickCornerFix(recent, NOW)).toMatchObject({ accuracy: 3 });
    });

    it('ignores readings that are too old, weak, unknown or invalid', () => {
      const recent = [gpsFix(14.1, 121.1, 2, 3500), gpsFix(14.1, 121.1, 40, 500), gpsFix(14.1, 121.1, null, 500), gpsFix(Number.NaN, 121.1, 3, 500)];
      expect(pickCornerFix(recent, NOW)).toBeNull();
      expect(decideMarkCorner(recent, null, NOW)).toEqual({ action: 'none', reason: 'no_fix' });
    });

    it('adds a flagged corner even when it is closer than the walking spacing', () => {
      const previous = gpsPoint(14.1, 121.1);
      const recent = [gpsFix(14.100036, 121.1, 3, 400)]; // ~4 m from the last point, inside the 8 m spacing
      const decision = decideMarkCorner(recent, previous, NOW);
      expect(decision.action).toBe('add');
      if (decision.action === 'add') expect(decision.waypoint).toMatchObject({ isCorner: true, source: 'gps', accuracyMeters: 3 });
    });

    it('flags the last point instead of duplicating it when the walker has not moved', () => {
      const previous = gpsPoint(14.1, 121.1);
      expect(decideMarkCorner([gpsFix(14.100005, 121.1, 3, 400)], previous, NOW)).toEqual({ action: 'mark_last' });
    });

    it('never marks a corner from a reading in the future', () => {
      expect(pickCornerFix([gpsFix(14.1, 121.1, 3, -5_000)], NOW)).toBeNull();
    });
  });

  describe('isBackAtStart', () => {
    const first = { latitude: 14.1, longitude: 121.1 };
    const near = gpsFix(14.10004, 121.1, 4, 0); // ~4.4 m

    it('is true after a real loop, within 10 m of the first point', () => {
      expect(isBackAtStart(near, first, 6, 120)).toBe(true);
    });

    it('needs enough points and enough ground walked', () => {
      expect(isBackAtStart(near, first, 2, 120)).toBe(false);
      expect(isBackAtStart(near, first, 6, 12)).toBe(false);
    });

    it('needs a good reading that is actually close', () => {
      expect(isBackAtStart(gpsFix(14.10004, 121.1, 40, 0), first, 6, 120)).toBe(false);
      expect(isBackAtStart(gpsFix(14.1002, 121.1, 4, 0), first, 6, 120)).toBe(false);
      expect(isBackAtStart(near, null, 6, 120)).toBe(false);
    });

    it('widens to the reading own error radius, never beyond the usable accuracy', () => {
      // 9 m away with ±9 m accuracy still counts as at the start; 11 m does not.
      expect(isBackAtStart(gpsFix(14.10008, 121.1, 9, 0), first, 6, 120)).toBe(true);
      expect(isBackAtStart(gpsFix(14.0999, 121.1, 9, 0), first, 6, 120)).toBe(false);
    });
  });

  describe('decideFinalFix', () => {
    const first = { latitude: 14.1, longitude: 121.1 };
    const last = { latitude: 14.1006, longitude: 121.1 };

    it('adds where the walker stopped', () => {
      const final = decideFinalFix(gpsFix(14.1011, 121.1, 4, 1_000), last, first, NOW);
      expect(final).toMatchObject({ latitude: 14.1011, source: 'gps', accuracyMeters: 4 });
      expect(final?.isCorner).toBeUndefined();
    });

    it('adds nothing when GPS is stale, weak or missing', () => {
      expect(decideFinalFix(null, last, first, NOW)).toBeNull();
      expect(decideFinalFix(gpsFix(14.1011, 121.1, 4, 11_000), last, first, NOW)).toBeNull();
      expect(decideFinalFix(gpsFix(14.1011, 121.1, 40, 1_000), last, first, NOW)).toBeNull();
    });

    it('does not duplicate the previous point or the start', () => {
      expect(decideFinalFix(gpsFix(14.100602, 121.1, 4, 1_000), last, first, NOW)).toBeNull();
      expect(decideFinalFix(gpsFix(14.100002, 121.1, 4, 1_000), last, first, NOW)).toBeNull();
    });
  });
});
