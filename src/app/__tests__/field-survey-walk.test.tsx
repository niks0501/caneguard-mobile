import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';

import FieldSurveyScreen from '@/app/field-survey';
import { FIELD_SURVEY_COPY } from '@/constants/copy';
import type { FieldSurveyRow } from '@/database/schema';
import { findOwnedFieldSurvey, listOwnedFieldSurveys, saveFieldSurveyDraft } from '@/features/surveys/data/fieldSurveyRepository';
import type { SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';
import type { WalkFix } from '@/features/surveys/domain/walkMode';
import { expoWalkLocationClient } from '@/features/surveys/services/expoWalkLocationClient';
import { renderWithGestures } from '../../../test/render-with-gestures';

jest.mock('expo-crypto', () => ({ randomUUID: () => '3f1de2d8-2ca9-4c26-9e37-2f4c5f6f7a10' }));
jest.mock('@/database/DatabaseProvider', () => {
  const database = {};
  return { EMPTY_DATABASE: null, useDatabaseState: () => ({ database, ready: true }) };
});
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ session: { token: 't', user: { capabilities: ['report:submit'], role: 'field_reporter', uuid: 'owner-1' } } }),
}));
jest.mock('@/features/sync/hooks/useSync', () => ({
  useSync: () => ({ isOnline: true, syncNow: jest.fn(async () => ({ results: [] })) }),
}));
jest.mock('@/features/surveys/services/captureSurveyWaypoint', () => ({ captureSurveyWaypoint: jest.fn() }));
jest.mock('@/features/surveys/services/expoWalkLocationClient', () => ({
  expoWalkLocationClient: {
    hasServicesEnabled: jest.fn(async () => true),
    requestForegroundPermission: jest.fn(async () => ({ canAskAgain: true, status: 'granted' })),
    watchPosition: jest.fn(),
  },
}));
jest.mock('@/features/surveys/data/fieldSurveyRepository', () => ({
  findOwnedFieldSurvey: jest.fn(() => null),
  listOwnedFieldSurveys: jest.fn(() => []),
  saveFieldSurveyDraft: jest.fn(async () => ({})),
  markFieldSurveyPending: jest.fn(),
}));

const watch = jest.mocked(expoWalkLocationClient.watchPosition);
const save = jest.mocked(saveFieldSurveyDraft);
const listSurveys = jest.mocked(listOwnedFieldSurveys);

const T = '2026-11-10T01:00:00.000Z';
const waypoint = (latitude: number, longitude: number): SurveyWaypoint =>
  ({ latitude, longitude, source: 'gps', accuracyMeters: 4, capturedAt: T });
const PLOT_WAYPOINTS: SurveyWaypoint[] = [
  waypoint(14.1, 121.1),
  waypoint(14.1, 121.102),
  waypoint(14.102, 121.102),
  waypoint(14.102, 121.1),
];
const AFFECTED_WAYPOINTS: SurveyWaypoint[] = [
  waypoint(14.1005, 121.1005),
  waypoint(14.1005, 121.1007),
  waypoint(14.1007, 121.1007),
];

function draftRow(overrides: Partial<FieldSurveyRow> = {}): FieldSurveyRow {
  return {
    clientUuid: 'draft-1',
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
    capturedAt: T,
    status: 'draft',
    fieldErrorsJson: null,
    lastSyncErrorCode: null,
    remoteId: null,
    lastSyncedAt: null,
    syncAttemptCount: 0,
    createdAt: T,
    updatedAt: T,
    ...overrides,
  } as unknown as FieldSurveyRow;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

const fix = (latitude: number, longitude: number, accuracy = 4): WalkFix => ({ latitude, longitude, accuracy, timestamp: Date.now() });

function lastDraft() {
  return save.mock.calls.at(-1)?.[1];
}

function lastDraftWaypoints() {
  return lastDraft()?.waypoints ?? [];
}

function lastDraftAffectedWaypoints() {
  return lastDraft()?.affectedAreaWaypoints ?? [];
}

function lastDraftActiveAffectedWaypoints() {
  return lastDraft()?.activeAffectedWaypoints ?? [];
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useLocalSearchParams).mockReturnValue({});
  jest.mocked(findOwnedFieldSurvey).mockReturnValue(null);
  listSurveys.mockReturnValue([]);
});

it('adds boundary points while walking, without a button press per point, and stops on request', async () => {
  // Intent: walking the edge produces a boundary without a button press per point.
  const remove = jest.fn();
  let emit: (fix: WalkFix) => void = () => undefined;
  watch.mockImplementation(async (onFix) => { emit = onFix; return { remove }; });

  await renderWithGestures(<FieldSurveyScreen />);
  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy());

  await act(async () => {
    emit(fix(14.1, 121.1));
    emit(fix(14.10001, 121.1)); // ~1 m: too close
    emit(fix(14.1002, 121.1, 40)); // weak accuracy
    emit(fix(14.1002, 121.1)); // accepted
    emit(fix(14.1002, 121.1002)); // accepted
  });
  await waitFor(() => expect(lastDraftWaypoints()).toHaveLength(3));
  expect(lastDraftWaypoints().every((point) => point.source === 'gps')).toBe(true);

  await act(async () => { fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.walkStop)); });
  expect(remove).toHaveBeenCalledTimes(1);
  expect(screen.getByText(FIELD_SURVEY_COPY.walkStopped(3))).toBeTruthy();
});

it('removes a subscription that arrives after the walk was stopped while still starting', async () => {
  // Invariant: a walk that stops before its GPS subscription exists never leaves that subscription running.
  const remove = jest.fn();
  const starting = deferred<{ remove(): void }>();
  watch.mockImplementation(() => starting.promise);

  await renderWithGestures(<FieldSurveyScreen />);
  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
  await act(async () => { fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.walkStop)); });
  await act(async () => { starting.resolve({ remove }); });

  expect(remove).toHaveBeenCalledTimes(1);
  expect(screen.getByText(FIELD_SURVEY_COPY.walkStart)).toBeTruthy();
  expect(lastDraftWaypoints()).toHaveLength(0);
});

it('removes a subscription that arrives after the screen closed while still starting', async () => {
  // Invariant: closing the screen while a walk is starting cannot leave a GPS subscription behind.
  const remove = jest.fn();
  const starting = deferred<{ remove(): void }>();
  watch.mockImplementation(() => starting.promise);

  const view = await renderWithGestures(<FieldSurveyScreen />);
  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
  view.unmount();
  await act(async () => { starting.resolve({ remove }); });

  expect(remove).toHaveBeenCalledTimes(1);
});

it('stops walking before a new boundary replaces the draft being walked', async () => {
  // Invariant: a walk only ever adds points to the survey it started on.
  listSurveys.mockReturnValue([draftRow()]);
  const remove = jest.fn();
  let emit: (fix: WalkFix) => void = () => undefined;
  watch.mockImplementation(async (onFix) => { emit = onFix; return { remove }; });

  await renderWithGestures(<FieldSurveyScreen />);
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.newSurvey)).toBeTruthy());
  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy());

  await act(async () => { fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.newSurvey)); });
  await act(async () => { emit(fix(14.2, 121.2)); });

  expect(screen.getByText(FIELD_SURVEY_COPY.walkStart)).toBeTruthy();
  expect(remove).toHaveBeenCalledTimes(1);
  expect(lastDraft()?.clientUuid).toBe('3f1de2d8-2ca9-4c26-9e37-2f4c5f6f7a10');
  expect(lastDraftWaypoints()).toHaveLength(0);
});

it('stops walking before finishing an affected area starts another one', async () => {
  // Invariant: a walk only ever adds points to the affected area it started on.
  listSurveys.mockReturnValue([draftRow({ activeAffectedWaypointsJson: JSON.stringify(AFFECTED_WAYPOINTS) })]);
  const remove = jest.fn();
  let emit: (fix: WalkFix) => void = () => undefined;
  watch.mockImplementation(async (onFix) => { emit = onFix; return { remove }; });

  await renderWithGestures(<FieldSurveyScreen />);
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.finishAffectedArea)).toBeTruthy());
  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy());

  await act(async () => { fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.finishAffectedArea)); });
  await act(async () => { emit(fix(14.1008, 121.1008)); });

  expect(screen.getByText(FIELD_SURVEY_COPY.walkStart)).toBeTruthy();
  expect(remove).toHaveBeenCalledTimes(1);
  expect(lastDraftAffectedWaypoints()).toHaveLength(1);
  expect(lastDraftActiveAffectedWaypoints()).toHaveLength(0);
});
