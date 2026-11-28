import {
  deriveReportMeasurementsFromSurvey,
  formatPercentAffected,
  hasOpenAffectedArea,
  isConfirmedZeroSurvey,
  measuredBoundaryArea,
  planAttachedBoundarySend,
  sqmToHectares,
  UNMEASURED_REPORT_MEASUREMENTS,
  type AttachedBoundaryInput, percentAffected } from '@/features/surveys/domain/attachedBoundary';
import type { SurveyPolygon, SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';

const point = (latitude: number, longitude: number): SurveyWaypoint => ({
  accuracyMeters: null,
  capturedAt: '2026-10-05T09:00:00.000Z',
  latitude,
  longitude,
  source: 'map',
});

const plot = [
  point(14, 120),
  point(14, 120.001),
  point(14.001, 120.001),
  point(14.001, 120),
];

const row = (overrides: Partial<AttachedBoundaryInput> = {}): AttachedBoundaryInput => ({
  activeAffectedWaypointsJson: '[]',
  affectedAreaPolygonsJson: '[]',
  affectedAreaWaypointsJson: '[]',
  capturedAt: '2026-10-05T09:00:00.000Z',
  lastSyncErrorCode: null,
  remoteId: null,
  status: 'draft',
  waypointsJson: JSON.stringify(plot),
  ...overrides,
});

const affectedPlot: SurveyWaypoint[] = [
  point(14, 120),
  point(14, 120.0005),
  point(14.0005, 120.0005),
  point(14.0005, 120),
];
const affectedShape: SurveyPolygon = {
  type: 'Polygon',
  coordinates: [[[120, 14], [120.0005, 14], [120.0005, 14.0005], [120, 14.0005], [120, 14]]],
};
const outsideShape: SurveyPolygon = {
  type: 'Polygon',
  coordinates: [[[121, 15], [121.001, 15], [121.001, 15.001], [121, 15.001], [121, 15]]],
};

describe('planAttachedBoundarySend', () => {
  // Intent (send-together): a boundary the office can still receive travels with its
  // report, so the report queues it with its measured values.
  it('queues an editable boundary that measures cleanly', () => {
    const plan = planAttachedBoundarySend(row(), 'D-01');

    expect(plan.status).toBe('queue');
    if (plan.status !== 'queue') throw new Error('expected a queued boundary');
    // Independent oracle: 0.001° latitude (111.13 m) by 0.001° longitude at
    // latitude 14 (108.01 m) is ~12 003 m².
    expect(plan.send.areaSqm).toBeGreaterThan(11_900);
    expect(plan.send.areaSqm).toBeLessThan(12_100);
    // Only the plot was measured: the affected ground is unmeasured, never 0.
    expect(plan.send.affectedAreaSqm).toBeNull();
  });

  // Intent: a confirmed "no affected area found" is the only way a plot-only boundary sends 0.
  it('sends 0 only when the inspector explicitly confirmed no affected area', () => {
    const plan = planAttachedBoundarySend(row({ affectedAreaMeasurement: 'measured', affectedAreaSqm: 0 }), 'D-01');
    if (plan.status !== 'queue') throw new Error('expected a queued boundary');
    expect(plan.send.affectedAreaSqm).toBe(0);
    // A legacy row that merely stored 0 with no measurement state stays unmeasured.
    const legacy = planAttachedBoundarySend(row({ affectedAreaSqm: 0 }), 'D-01');
    if (legacy.status !== 'queue') throw new Error('expected a queued boundary');
    expect(legacy.send.affectedAreaSqm).toBeNull();
  });

  it('queues a boundary the office asked to fix, using its current measurement', () => {
    expect(
      planAttachedBoundarySend(
        row({ status: 'failed', lastSyncErrorCode: 'API_VALIDATION_FAILED' }),
        'D-01',
      ).status,
    ).toBe('queue');
  });

  // Intent (send-together): nothing is left behind, because these states either already
  // reached the office or send themselves without anyone pressing a button.
  const onItsWay: [string, AttachedBoundaryInput][] = [
    ['waiting to send', row({ status: 'pending' })],
    ['sending', row({ status: 'syncing' })],
    ['sent', row({ status: 'synced', remoteId: 'remote-1' })],
    ['will retry', row({ status: 'failed', lastSyncErrorCode: 'NETWORK_REQUEST_FAILED' })],
    ['already known remotely', row({ status: 'draft', remoteId: 'remote-1' })],
  ];
  it.each(onItsWay)('leaves a boundary that is on its way alone: %s', (_label, input) => {
    expect(planAttachedBoundarySend(input, 'D-01').status).toBe('on_its_way');
  });

  it('queues a legacy boundary whose affected-area columns were never written', () => {
    const plan = planAttachedBoundarySend(
      row({
        activeAffectedWaypointsJson: null,
        affectedAreaPolygonsJson: null,
        affectedAreaWaypointsJson: null,
      }),
      'D-01',
    );

    expect(plan.status).toBe('queue');
  });

  // Intent (item 8): the district comes from the account, so a boundary saved before the
  // account had one is still queued, and one the account has no district for is blocked.
  it('blocks a boundary the account has no district for', () => {
    expect(planAttachedBoundarySend(row(), '').status).toBe('blocked');
    expect(planAttachedBoundarySend(row(), '   ').status).toBe('blocked');
  });

  // Intent (item 8): an attachment the office has not received yet cannot travel without the
  // account district, while a completed upload keeps its report ready.
  it('blocks an unsent attachment the account has no district for', () => {
    expect(planAttachedBoundarySend(row({ status: 'pending' }), '').status).toBe('blocked');
    expect(planAttachedBoundarySend(row({ status: 'failed', lastSyncErrorCode: 'NETWORK_REQUEST_FAILED' }), '').status).toBe('blocked');
    expect(planAttachedBoundarySend(row({ status: 'synced', remoteId: 'remote-1' }), '').status).toBe('on_its_way');
  });

  // Intent (send-together): the office must receive the boundary the inspector drew,
  // so damaged saved fields block the report instead of being replaced with nothing.
  const blocked: [string, AttachedBoundaryInput][] = [
    ['too few points', row({ waypointsJson: JSON.stringify(plot.slice(0, 2)) })],
    ['broken storage', row({ waypointsJson: 'not json' })],
    ['damaged affected areas', row({ affectedAreaPolygonsJson: '{"areas":[]}' })],
    ['damaged affected-area capture points', row({
      affectedAreaPolygonsJson: JSON.stringify([affectedShape]),
      affectedAreaWaypointsJson: 'not json',
    })],
    ['damaged unfinished affected area', row({ activeAffectedWaypointsJson: '{"active":true}' })],
    ['unfinished affected area', row({ activeAffectedWaypointsJson: JSON.stringify([point(14, 120)]) })],
    ['affected area outside the plot', row({ affectedAreaPolygonsJson: JSON.stringify([outsideShape]) })],
    ['identity rejected', row({ status: 'failed', lastSyncErrorCode: 'CLIENT_UUID_CONFLICT' })],
    ['damaged on this phone', row({ status: 'failed', lastSyncErrorCode: 'INVALID_LOCAL_RECORD' })],
    ['refused by the office', row({ status: 'failed', lastSyncErrorCode: 'API_FORBIDDEN' })],
  ];
  it.each(blocked)('blocks a boundary the office cannot receive: %s', (_label, input) => {
    expect(planAttachedBoundarySend(input, 'D-01').status).toBe('blocked');
  });

  it('carries the affected areas and their capture points with the plot', () => {
    const plan = planAttachedBoundarySend(
      row({
        affectedAreaPolygonsJson: JSON.stringify([affectedShape]),
        affectedAreaWaypointsJson: JSON.stringify([affectedPlot]),
      }),
      'D-01',
    );

    expect(plan.status).toBe('queue');
    if (plan.status !== 'queue') throw new Error('expected a queued boundary');
    expect(plan.send.affectedAreas).toEqual([affectedShape]);
    expect(plan.send.affectedAreaWaypoints).toEqual([affectedPlot]);
    expect(plan.send.affectedAreaSqm).toBeGreaterThan(0);
  });
});

const withAffected = (overrides: Partial<AttachedBoundaryInput> = {}) => row({
  affectedAreaPolygonsJson: JSON.stringify([affectedShape]),
  affectedAreaWaypointsJson: JSON.stringify([affectedPlot]),
  ...overrides,
});

describe('deriveReportMeasurementsFromSurvey', () => {
  // AC-1 intent: a 1.20 ha plot with a 0.30 ha affected patch keeps three separate figures.
  // Independent oracle (see above): the plot is ~12 003 m² and the affected square is a quarter of it.
  it('keeps plot area, affected ground and affected share apart', () => {
    const measurements = deriveReportMeasurementsFromSurvey(withAffected());
    if (!measurements) throw new Error('expected measurements');
    expect(measurements.plotAreaHectares).toBeCloseTo(1.2, 1);
    expect(measurements.plotAreaMeasurement).toBe('measured');
    expect(measurements.affectedAreaHectares).toBeCloseTo(0.3, 1);
    expect(measurements.affectedAreaMeasurement).toBe('measured');
    expect(measurements.affectedPortionPercent).toBe(25);
    expect(measurements.affectedPortionMeasurement).toBe('measured');
    // The bug this replaces reported the plot area (~1.2 ha) as the affected ground.
    expect(measurements.affectedAreaHectares).not.toBeCloseTo(measurements.plotAreaHectares ?? 0, 1);
  });

  // AC-2 intent: a plot-only survey never turns the plot into affected ground.
  it('leaves the affected figures not measured for a plot-only boundary', () => {
    const measurements = deriveReportMeasurementsFromSurvey(row());
    if (!measurements) throw new Error('expected measurements');
    expect(measurements.plotAreaHectares).toBeCloseTo(1.2, 1);
    expect(measurements.plotAreaMeasurement).toBe('measured');
    expect(measurements).toMatchObject({
      affectedAreaHectares: null,
      affectedAreaMeasurement: 'not_measured',
      affectedPortionPercent: null,
      affectedPortionMeasurement: 'not_measured',
    });
  });

  // AC-4(a): older rows stored a forced 0 for a plot-only survey; that is not a confirmed zero.
  it('reads a legacy stored 0 with no measurement state as not measured', () => {
    expect(deriveReportMeasurementsFromSurvey(row({ affectedAreaSqm: 0 }))).toMatchObject({
      affectedAreaHectares: null,
      affectedAreaMeasurement: 'not_measured',
      affectedPortionPercent: null,
    });
  });

  // AC-4(b): an explicit "no affected area found" is a measured 0 ha and 0%.
  it('reads a confirmed zero as measured 0 ha and 0%', () => {
    const confirmed = row({ affectedAreaMeasurement: 'measured', affectedAreaSqm: 0 });
    expect(isConfirmedZeroSurvey(confirmed)).toBe(true);
    expect(deriveReportMeasurementsFromSurvey(confirmed)).toMatchObject({
      affectedAreaHectares: 0,
      affectedAreaMeasurement: 'measured',
      affectedPortionPercent: 0,
      affectedPortionMeasurement: 'measured',
    });
  });

  // Intent: drawn affected areas always win over a stale zero confirmation.
  it('ignores a zero confirmation once an affected area is drawn', () => {
    const measurements = deriveReportMeasurementsFromSurvey(withAffected({ affectedAreaMeasurement: 'measured', affectedAreaSqm: 0 }));
    expect(measurements?.affectedAreaHectares).toBeGreaterThan(0.29);
  });

  // AC-4(c): a 40 m² patch is 0.004 ha, never rounded to 0.
  it('keeps four decimals so a 40 m² patch stays 0.004 ha', () => {
    expect(sqmToHectares(40)).toBe(0.004);
    expect(sqmToHectares(18_336)).toBe(1.8336);
    expect(sqmToHectares(0.2)).toBe(0.0001);
    expect(sqmToHectares(0)).toBe(0);
  });

  // Intent: an unfinished or damaged map clears survey-derived figures instead of keeping old ones.
  it('gives nothing for too few points, an open affected area or damaged storage', () => {
    expect(deriveReportMeasurementsFromSurvey(row({ waypointsJson: JSON.stringify(plot.slice(0, 2)) }))).toBeNull();
    expect(deriveReportMeasurementsFromSurvey(row({ activeAffectedWaypointsJson: JSON.stringify([point(14, 120)]) }))).toBeNull();
    expect(deriveReportMeasurementsFromSurvey(row({ waypointsJson: 'not json' }))).toBeNull();
    expect(deriveReportMeasurementsFromSurvey(row({ affectedAreaPolygonsJson: JSON.stringify([outsideShape]) }))).toBeNull();
  });

  it('exposes an all-unmeasured value for callers that must clear', () => {
    expect(UNMEASURED_REPORT_MEASUREMENTS).toEqual({
      plotAreaHectares: null,
      plotAreaMeasurement: 'not_measured',
      affectedAreaHectares: null,
      affectedAreaMeasurement: 'not_measured',
      affectedPortionPercent: null,
      affectedPortionMeasurement: 'not_measured',
    });
  });
});

describe('measuredBoundaryArea', () => {
  it('measures the plot and the affected union', () => {
    const measured = measuredBoundaryArea(withAffected());
    if (!measured) throw new Error('expected a measurement');
    expect(measured.affectedAreaCount).toBe(1);
    expect(measured.affectedAreaSqm).toBeCloseTo(measured.areaSqm / 4, -1);
  });

  it('leaves the affected area null for a plot-only boundary', () => {
    expect(measuredBoundaryArea(row())).toMatchObject({ affectedAreaCount: 0, affectedAreaSqm: null });
  });

  // Intent: an unfinished map never fills the report.
  it('gives nothing for too few points or an open affected area', () => {
    expect(measuredBoundaryArea(row({ waypointsJson: JSON.stringify(plot.slice(0, 2)) }))).toBeNull();
    expect(measuredBoundaryArea(row({ activeAffectedWaypointsJson: JSON.stringify([point(14, 120)]) }))).toBeNull();
    expect(measuredBoundaryArea(row({ waypointsJson: 'not json' }))).toBeNull();
  });
});

describe('hasOpenAffectedArea', () => {
  it('is true only while affected points are drawn but not closed', () => {
    expect(hasOpenAffectedArea(row())).toBe(false);
    expect(hasOpenAffectedArea(row({ activeAffectedWaypointsJson: JSON.stringify([point(14.0002, 120.0002)]) }))).toBe(true);
  });
});

describe('percentAffected', () => {
  // Intent: the phone and the office show the same share, keeping two decimals so small patches never collapse to 0%.
  it('rounds the affected share of the plot to two decimals and keeps tiny patches strictly positive', () => {
    expect(percentAffected({ areaSqm: 10_000, affectedAreaSqm: 2_600 })).toBe(26);
    expect(percentAffected({ areaSqm: 6_075.12, affectedAreaSqm: 412.5 })).toBe(6.79);
    // 40 m² in 10 ha (100,000 m²) is 0.04%, never rounded to 0%.
    expect(percentAffected({ areaSqm: 100_000, affectedAreaSqm: 40 })).toBe(0.04);
    // 1 m² in 10 ha is 0.001% — kept positive so display renders "<0.01%".
    expect(percentAffected({ areaSqm: 100_000, affectedAreaSqm: 1 })).toBe(0.001);
    expect(percentAffected({ areaSqm: 100, affectedAreaSqm: 150 })).toBe(100);
  });

  it('gives nothing while the affected area is unmeasured or the plot has no area, and 0 for a confirmed zero', () => {
    expect(percentAffected({ areaSqm: 10_000, affectedAreaSqm: null })).toBeNull();
    expect(percentAffected({ areaSqm: 0, affectedAreaSqm: 5 })).toBeNull();
    expect(percentAffected({ areaSqm: 10_000, affectedAreaSqm: 0 })).toBe(0);
  });

  it('formats confirmed zero, below-threshold positive shares, 0.04%, and 100% distinctly', () => {
    expect(formatPercentAffected(0)).toBe('0%');
    expect(formatPercentAffected(0, { positiveArea: true })).toBe('<0.01%');
    expect(formatPercentAffected(0.001)).toBe('<0.01%');
    expect(formatPercentAffected(0.04)).toBe('0.04%');
    expect(formatPercentAffected(25)).toBe('25%');
    expect(formatPercentAffected(100)).toBe('100%');
  });
});
