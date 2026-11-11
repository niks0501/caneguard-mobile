import {
  planAttachedBoundarySend,
  type AttachedBoundaryInput,
} from '@/features/surveys/domain/attachedBoundary';
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
    expect(plan.send.affectedAreaSqm).toBe(0);
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
