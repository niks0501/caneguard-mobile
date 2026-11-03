import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import FieldSurveyScreen from '@/app/field-survey';
import { FIELD_SURVEY_COPY } from '@/constants/copy';
import {
  listOwnedFieldSurveys,
  markFieldSurveyPending,
  saveFieldSurveyDraft,
} from '@/features/surveys/data/fieldSurveyRepository';
import type { FieldSurveyRow } from '@/database/schema';
import type { SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';
import { captureSurveyWaypoint } from '@/features/surveys/services/captureSurveyWaypoint';

jest.mock('expo-crypto', () => ({
  randomUUID: () => '3f1de2d8-2ca9-4c26-9e37-2f4c5f6f7a10',
}));
jest.mock('@/database/DatabaseProvider', () => {
  const database = {};
  return {
    EMPTY_DATABASE: null,
    useDatabaseState: () => ({ database, ready: true }),
  };
});
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ session: { token: 'test-session-token', user: { role: 'field_reporter', uuid: 'owner-1' } } }),
}));
jest.mock('@/features/sync/hooks/useSync', () => ({
  useSync: () => ({ isOnline: true, syncNow: jest.fn(async () => ({ results: [] })) }),
}));
jest.mock('@/features/surveys/services/captureSurveyWaypoint', () => ({
  captureSurveyWaypoint: jest.fn(),
}));
jest.mock('@/features/surveys/data/fieldSurveyRepository', () => ({
  listOwnedFieldSurveys: jest.fn(),
  saveFieldSurveyDraft: jest.fn(),
  markFieldSurveyPending: jest.fn(),
}));

const mockSaveDraft = jest.mocked(saveFieldSurveyDraft);
const mockListSurveys = jest.mocked(listOwnedFieldSurveys);
const mockMarkPending = jest.mocked(markFieldSurveyPending);
const mockCaptureWaypoint = jest.mocked(captureSurveyWaypoint);

const PLOT_WAYPOINTS: SurveyWaypoint[] = [
  { latitude: 14.1, longitude: 121.1, source: 'gps', accuracyMeters: 4, capturedAt: '2026-10-31T01:00:00.000Z' },
  { latitude: 14.1, longitude: 121.102, source: 'gps', accuracyMeters: 4, capturedAt: '2026-10-31T01:01:00.000Z' },
  { latitude: 14.102, longitude: 121.102, source: 'gps', accuracyMeters: 4, capturedAt: '2026-10-31T01:02:00.000Z' },
  { latitude: 14.102, longitude: 121.1, source: 'gps', accuracyMeters: 4, capturedAt: '2026-10-31T01:03:00.000Z' },
];

const ACTIVE_AFFECTED_WAYPOINTS: SurveyWaypoint[] = [
  { latitude: 14.1005, longitude: 121.1005, source: 'gps', accuracyMeters: 3.5, capturedAt: '2026-10-31T02:00:00.000Z' },
  { latitude: 14.1005, longitude: 121.1015, source: 'gps', accuracyMeters: 3.5, capturedAt: '2026-10-31T02:01:00.000Z' },
  { latitude: 14.1015, longitude: 121.1015, source: 'gps', accuracyMeters: 6, capturedAt: '2026-10-31T02:02:00.000Z' },
];

function draftRow(overrides: Partial<FieldSurveyRow> = {}): FieldSurveyRow {
  return {
    clientUuid: '3f1de2d8-2ca9-4c26-9e37-2f4c5f6f7a10',
    ownerIdentity: 'owner-1',
    districtCode: 'DISTRICT-1',
    waypointsJson: JSON.stringify(PLOT_WAYPOINTS),
    polygonJson: null,
    areaSqm: null,
    affectedAreaPolygonsJson: JSON.stringify([]),
    affectedAreaSqm: 0,
    affectedAreaWaypointsJson: JSON.stringify([]),
    activeAffectedWaypointsJson: JSON.stringify([]),
    measurementProvenanceJson: null,
    capturedAt: '2026-10-31T01:03:00.000Z',
    status: 'draft',
    fieldErrorsJson: null,
    lastSyncErrorCode: null,
    remoteId: null,
    lastSyncedAt: null,
    syncAttemptCount: 0,
    createdAt: '2026-10-31T01:00:00.000Z',
    updatedAt: '2026-10-31T01:03:00.000Z',
    ...overrides,
  } as unknown as FieldSurveyRow;
}

async function pressMap(locationX: number, locationY: number) {
  await fireEvent.press(screen.getByTestId('field-survey.map'), {
    nativeEvent: { locationX, locationY },
  });
}

function submitButton() {
  return screen.getByTestId('field-survey.submit');
}

function submitDisabled() {
  return submitButton().props.accessibilityState.disabled as boolean;
}

type RenderedNode = {
  type: string;
  props: Record<string, unknown>;
  children: (RenderedNode | string)[];
};

function collectTestIds(node: unknown, collected: string[] = []): string[] {
  if (Array.isArray(node)) {
    node.forEach((child) => collectTestIds(child, collected));
    return collected;
  }
  if (!node || typeof node !== 'object') return collected;
  const element = node as RenderedNode;
  if (typeof element.props?.testID === 'string') collected.push(element.props.testID);
  element.children?.forEach((child) => collectTestIds(child, collected));
  return collected;
}

function findRenderedNode(
  node: RenderedNode | string | null | undefined,
  predicate: (node: RenderedNode) => boolean,
): RenderedNode | null {
  if (!node || typeof node === 'string') return null;
  if (predicate(node)) return node;
  for (const child of node.children) {
    const match = findRenderedNode(child, predicate);
    if (match) return match;
  }
  return null;
}

function findRenderedParent(
  root: RenderedNode,
  target: RenderedNode,
): RenderedNode | null {
  for (const child of root.children) {
    if (typeof child === 'string') continue;
    if (child === target) return root;
    const match = findRenderedParent(child, target);
    if (match) return match;
  }
  return null;
}

beforeEach(() => {
  mockListSurveys.mockReturnValue([]);
  mockSaveDraft.mockResolvedValue(draftRow());
  mockMarkPending.mockReturnValue(undefined);
  mockCaptureWaypoint.mockReset();
  mockCaptureWaypoint.mockResolvedValue({ status: 'unavailable' });
});

it('recaptures the named point even when a point ahead of it is removed while sampling', async () => {
  const boundary: SurveyWaypoint[] = [
    PLOT_WAYPOINTS[0],
    { ...PLOT_WAYPOINTS[1], accuracyMeters: 22 },
    PLOT_WAYPOINTS[2],
    PLOT_WAYPOINTS[3],
  ];
  mockListSurveys.mockReturnValue([draftRow({ waypointsJson: JSON.stringify(boundary) })]);

  await render(<FieldSurveyScreen />);
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.recapturePoint(2))).toBeTruthy());

  let resolveCapture!: (value: Awaited<ReturnType<typeof captureSurveyWaypoint>>) => void;
  mockCaptureWaypoint.mockImplementation(() => new Promise((resolve) => { resolveCapture = resolve; }));
  await act(async () => {
    fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.recapturePoint(2)));
  });

  await act(async () => {
    fireEvent.press(screen.getByText(`${FIELD_SURVEY_COPY.pointsHeading} (4)`));
  });
  await act(async () => {
    fireEvent.press(screen.getByLabelText(FIELD_SURVEY_COPY.selectPoint(1)));
  });
  await act(async () => {
    fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.removeSelected));
  });
  await waitFor(() => expect(screen.getByText(`${FIELD_SURVEY_COPY.pointsHeading} (3)`)).toBeTruthy());

  await act(async () => {
    resolveCapture({
      status: 'captured',
      waypoint: { latitude: 14.1004, longitude: 121.1004, accuracyMeters: 3, capturedAt: '2026-10-31T03:00:00.000Z', source: 'gps' },
    });
  });

  await waitFor(() => {
    const saved = mockSaveDraft.mock.lastCall?.[1];
    expect(saved?.waypoints.map((point) => [point.latitude, point.longitude, point.accuracyMeters])).toEqual([
      [14.1004, 121.1004, 3],
      [PLOT_WAYPOINTS[2].latitude, PLOT_WAYPOINTS[2].longitude, 4],
      [PLOT_WAYPOINTS[3].latitude, PLOT_WAYPOINTS[3].longitude, 4],
    ]);
  });
});

it('drops a boundary capture when the affected-area mode is opened while sampling', async () => {
  mockListSurveys.mockReturnValue([draftRow()]);

  await render(<FieldSurveyScreen />);
  await waitFor(() => expect(screen.getByText(`${FIELD_SURVEY_COPY.pointsHeading} (4)`)).toBeTruthy());

  let resolveCapture!: (value: Awaited<ReturnType<typeof captureSurveyWaypoint>>) => void;
  mockCaptureWaypoint.mockImplementation(() => new Promise((resolve) => { resolveCapture = resolve; }));
  await act(async () => {
    fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.addGpsPoint));
  });
  await act(async () => {
    fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.affectedAreaBoundary));
  });

  await act(async () => {
    resolveCapture({
      status: 'captured',
      waypoint: { latitude: 14.0995, longitude: 121.0995, accuracyMeters: 3, capturedAt: '2026-10-31T04:00:00.000Z', source: 'gps' },
    });
  });

  expect(await screen.findByText(FIELD_SURVEY_COPY.gpsCaptureCancelled)).toBeTruthy();
  await waitFor(() => {
    const saved = mockSaveDraft.mock.lastCall?.[1];
    expect(saved?.waypoints.map((point) => [point.latitude, point.longitude])).toEqual(
      PLOT_WAYPOINTS.map((point) => [point.latitude, point.longitude]),
    );
    expect(saved?.activeAffectedWaypoints).toEqual([]);
  });
});

it('reports a cancelled recapture when the named point is removed while sampling', async () => {
  const boundary: SurveyWaypoint[] = [
    PLOT_WAYPOINTS[0],
    { ...PLOT_WAYPOINTS[1], accuracyMeters: 22 },
    PLOT_WAYPOINTS[2],
    PLOT_WAYPOINTS[3],
  ];
  mockListSurveys.mockReturnValue([draftRow({ waypointsJson: JSON.stringify(boundary) })]);

  await render(<FieldSurveyScreen />);
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.recapturePoint(2))).toBeTruthy());

  let resolveCapture!: (value: Awaited<ReturnType<typeof captureSurveyWaypoint>>) => void;
  mockCaptureWaypoint.mockImplementation(() => new Promise((resolve) => { resolveCapture = resolve; }));
  await act(async () => {
    fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.recapturePoint(2)));
  });
  await act(async () => {
    fireEvent.press(screen.getByText(`${FIELD_SURVEY_COPY.pointsHeading} (4)`));
  });
  await act(async () => {
    fireEvent.press(screen.getByLabelText(FIELD_SURVEY_COPY.selectPoint(2)));
  });
  await act(async () => {
    fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.removeSelected));
  });
  await waitFor(() => expect(screen.getByText(`${FIELD_SURVEY_COPY.pointsHeading} (3)`)).toBeTruthy());

  await act(async () => {
    resolveCapture({
      status: 'captured',
      waypoint: { latitude: 14.1009, longitude: 121.1009, accuracyMeters: 25, capturedAt: '2026-10-31T05:00:00.000Z', source: 'gps' },
    });
  });

  expect(await screen.findByText(FIELD_SURVEY_COPY.gpsCaptureCancelled)).toBeTruthy();
  expect(screen.queryByText(FIELD_SURVEY_COPY.gpsAccuracyWeak(25))).toBeNull();
  const saved = mockSaveDraft.mock.lastCall?.[1];
  expect(saved?.waypoints.map((point) => [point.latitude, point.longitude, point.accuracyMeters])).toEqual([
    [PLOT_WAYPOINTS[0].latitude, PLOT_WAYPOINTS[0].longitude, 4],
    [PLOT_WAYPOINTS[2].latitude, PLOT_WAYPOINTS[2].longitude, 4],
    [PLOT_WAYPOINTS[3].latitude, PLOT_WAYPOINTS[3].longitude, 4],
  ]);
});

it('reports a boundary drawn only on the map as low accuracy without offering recapture', async () => {
  const mapped = PLOT_WAYPOINTS.map((point) => ({ ...point, accuracyMeters: null, source: 'map' as const }));
  mockListSurveys.mockReturnValue([draftRow({ waypointsJson: JSON.stringify(mapped) })]);

  await render(<FieldSurveyScreen />);

  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.qualityState.low_accuracy)).toBeTruthy());
  expect(screen.queryByText(FIELD_SURVEY_COPY.recapturePoint(1))).toBeNull();
});

it('keeps captured affected-waypoint provenance when the affected mode button is tapped again', async () => {
  await render(<FieldSurveyScreen />);
  await waitFor(() => expect(mockListSurveys).toHaveBeenCalled());

  await fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.affectedAreaBoundary));
  await pressMap(140, 130);
  await pressMap(170, 150);
  await pressMap(200, 130);

  await waitFor(() => expect(screen.getByText(`${FIELD_SURVEY_COPY.affectedAreaBoundary} (3)`)).toBeTruthy());

  await fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.affectedAreaBoundary));

  expect(screen.getByText(`${FIELD_SURVEY_COPY.affectedAreaBoundary} (3)`)).toBeTruthy();
  await waitFor(() => {
    const saved = mockSaveDraft.mock.lastCall?.[1];
    expect(saved?.activeAffectedWaypoints).toHaveLength(3);
    expect(saved?.activeAffectedWaypoints?.[0]).toMatchObject({
      accuracyMeters: null,
      capturedAt: expect.any(String),
      source: 'map',
    });
  });
  expect(submitDisabled()).toBe(true);
  expect(mockMarkPending).not.toHaveBeenCalled();
});

it('keeps restored unfinished affected waypoints and blocks submit until they are undone', async () => {
  mockListSurveys.mockReturnValue([
    draftRow({ activeAffectedWaypointsJson: JSON.stringify(ACTIVE_AFFECTED_WAYPOINTS) }),
  ]);

  await render(<FieldSurveyScreen />);

  await waitFor(() => expect(screen.getByText(`${FIELD_SURVEY_COPY.affectedAreaBoundary} (3)`)).toBeTruthy());
  expect(submitDisabled()).toBe(true);

  await fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.affectedAreaBoundary));

  expect(screen.getByText(`${FIELD_SURVEY_COPY.affectedAreaBoundary} (3)`)).toBeTruthy();
  expect(submitDisabled()).toBe(true);
  await waitFor(() => {
    const saved = mockSaveDraft.mock.lastCall?.[1];
    expect(saved?.activeAffectedWaypoints).toEqual(ACTIVE_AFFECTED_WAYPOINTS);
  });

  await fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.undo));
  await pressMap(210, 135);
  expect(screen.getByText(`${FIELD_SURVEY_COPY.affectedAreaBoundary} (3)`)).toBeTruthy();
  expect(submitDisabled()).toBe(true);

  await fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.undo));
  await fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.undo));
  await fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.undo));

  await waitFor(() => expect(screen.getByText(`${FIELD_SURVEY_COPY.affectedAreaBoundary} (0)`)).toBeTruthy());
  await waitFor(() => expect(submitDisabled()).toBe(false));
});

it('keeps the in-screen Close control available beside the docked submit', async () => {
  await render(<FieldSurveyScreen />);
  await waitFor(() => expect(mockListSurveys).toHaveBeenCalled());

  await fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.close));

  expect(router.back).toHaveBeenCalledTimes(1);
});

it('keeps the map first and the docked actions outside the details scroll', async () => {
  await render(<FieldSurveyScreen />);
  await waitFor(() => expect(mockListSurveys).toHaveBeenCalled());

  const tree = screen.toJSON() as unknown as RenderedNode;
  const order = collectTestIds(tree);
  expect(order).toContain('field-survey.map');

  // The map owns the top of the screen; district details and notes scroll
  // beneath it.
  expect(order.indexOf('field-survey.map')).toBeLessThan(
    order.indexOf('field-survey.district-code'),
  );

  const scroll = findRenderedNode(tree, (node) => node.type === 'RCTScrollView');
  const dock = findRenderedNode(tree, (node) => node.props.testID === 'action-dock');
  expect(scroll).not.toBeNull();
  expect(dock).not.toBeNull();

  // Submit stays on the thumb line: a sibling rendered after the scroll
  // content, never inside it.
  expect(findRenderedParent(tree, dock!)).toBe(findRenderedParent(tree, scroll!));
  const siblings = findRenderedParent(tree, dock!)!.children;
  expect(siblings.indexOf(dock!)).toBeGreaterThan(siblings.indexOf(scroll!));
  expect(collectTestIds(scroll)).toContain('field-survey.district-code');
  expect(collectTestIds(scroll!)).not.toContain('field-survey.submit');
  expect(collectTestIds(dock)).toContain('field-survey.submit');
});
