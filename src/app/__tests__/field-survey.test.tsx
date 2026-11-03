import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
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
