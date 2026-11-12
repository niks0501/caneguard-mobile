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

// The map is full height; affected areas, GPS capture and the point lists sit behind More.
async function renderOpen() {
  const view = await renderWithGestures(<FieldSurveyScreen />);
  await fireEvent.press(screen.getByTestId('field-survey.more'));
  return view;
}

jest.mock('expo-crypto', () => ({ randomUUID: () => '3f1de2d8-2ca9-4c26-9e37-2f4c5f6f7a10' }));
jest.mock('@/database/DatabaseProvider', () => {
  const database = {};
  return { EMPTY_DATABASE: null, useDatabaseState: () => ({ database, ready: true }) };
});
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ session: { token: 't', user: { capabilities: ['report:submit'], districtCode: 'D9', role: 'field_reporter', uuid: 'owner-1' } } }),
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

  await renderOpen();
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

  await renderOpen();
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

  const view = await renderOpen();
  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
  view.unmount();
  // Resolve outside act(): the screen is already closed, so waiting for the late
  // subscription with waitFor keeps this case from corrupting later renders.
  starting.resolve({ remove });
  await waitFor(() => expect(remove).toHaveBeenCalledTimes(1));
});

it('stops walking before a new boundary replaces the draft being walked', async () => {
  // Invariant: a walk only ever adds points to the survey it started on.
  listSurveys.mockReturnValue([draftRow()]);
  const remove = jest.fn();
  let emit: (fix: WalkFix) => void = () => undefined;
  watch.mockImplementation(async (onFix) => { emit = onFix; return { remove }; });

  await renderOpen();
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.newSurvey)).toBeTruthy());
  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy());

  await act(async () => { fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.newSurvey)); });
  await act(async () => { emit(fix(14.2, 121.2)); });

  expect(screen.getByText(FIELD_SURVEY_COPY.walkStart)).toBeTruthy();
  expect(remove).toHaveBeenCalledTimes(1);
  expect(save).not.toHaveBeenCalled();
});

it('measures walk spacing from the boundary after undo removes the last point', async () => {
  // Invariant: the sampler always measures from the boundary's last point, not a removed one.
  listSurveys.mockReturnValue([draftRow()]);
  const remove = jest.fn();
  let emit: (fix: WalkFix) => void = () => undefined;
  watch.mockImplementation(async (onFix) => { emit = onFix; return { remove }; });

  await renderOpen();
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.newSurvey)).toBeTruthy());
  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy());

  await act(async () => { fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.undo)); });
  expect(lastDraftWaypoints()).toHaveLength(3);

  await act(async () => {
    emit(fix(14.102, 121.10198)); // ~2 m from the new last point, ~214 m from the undone one
    emit(fix(14.102, 121.1021)); // ~11 m from the new last point
  });

  await waitFor(() => expect(lastDraftWaypoints()).toHaveLength(4));
  expect(lastDraftWaypoints().at(-1)).toMatchObject({ latitude: 14.102, longitude: 121.1021 });
});

it('stops walking before finishing an affected area starts another one', async () => {
  // Invariant: a walk only ever adds points to the affected area it started on.
  listSurveys.mockReturnValue([draftRow({ activeAffectedWaypointsJson: JSON.stringify(AFFECTED_WAYPOINTS) })]);
  const remove = jest.fn();
  let emit: (fix: WalkFix) => void = () => undefined;
  watch.mockImplementation(async (onFix) => { emit = onFix; return { remove }; });

  await renderOpen();
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

// Intent (item 8): the Walk / Tap switch is one choice; picking Tap corners stops a walk in progress.
it('stops walking when Tap corners is chosen', async () => {
  const remove = jest.fn();
  watch.mockImplementation(async () => ({ remove }));

  await renderOpen();
  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy());

  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.tap')); });
  expect(remove).toHaveBeenCalledTimes(1);
  expect(screen.getByText(FIELD_SURVEY_COPY.walkStart)).toBeTruthy();
});

// Intent (item 8): Walk excludes tap editing, so a stray tap during GPS capture cannot add or move points.
it('ignores map taps while walking and keeps them working in Tap corners', async () => {
  listSurveys.mockReturnValue([draftRow()]);
  const remove = jest.fn();
  let emit: (fix: WalkFix) => void = () => undefined;
  watch.mockImplementation(async (onFix) => { emit = onFix; return { remove }; });

  await renderOpen();
  await waitFor(() => expect(screen.getByText(`${FIELD_SURVEY_COPY.pointsHeading} (4)`)).toBeTruthy());
  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy());

  await act(async () => {
    fireEvent.press(screen.getByTestId('field-survey.map'), { nativeEvent: { locationX: 12, locationY: 12 } });
  });
  await act(async () => { emit(fix(14.1, 121.1)); });

  await waitFor(() => expect(lastDraftWaypoints()).toHaveLength(5));
  expect(lastDraftWaypoints().filter((point) => point.source === 'map')).toHaveLength(0);

  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.tap')); });
  await act(async () => {
    fireEvent.press(screen.getByTestId('field-survey.map'), { nativeEvent: { locationX: 200, locationY: 200 } });
  });

  await waitFor(() => expect(lastDraftWaypoints()).toHaveLength(6));
});

// Intent (item 8): Walk excludes tap editing, including the edge "+" inserts and the point handles.
it('hides the map handles while walking so points cannot be inserted, selected or dragged', async () => {
  listSurveys.mockReturnValue([draftRow({ activeAffectedWaypointsJson: JSON.stringify(AFFECTED_WAYPOINTS) })]);
  const remove = jest.fn();
  watch.mockImplementation(async () => ({ remove }));

  await renderOpen();
  await waitFor(() => expect(screen.getByTestId('field-survey.point.active.0')).toBeTruthy());
  expect(screen.getByTestId('field-survey.point.plot.0')).toBeTruthy();
  expect(screen.getByTestId('field-survey.insert.plot.0')).toBeTruthy();

  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy());
  expect(screen.queryByTestId('field-survey.point.plot.0')).toBeNull();
  expect(screen.queryByTestId('field-survey.point.active.0')).toBeNull();
  expect(screen.queryByTestId('field-survey.insert.plot.0')).toBeNull();

  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.tap')); });
  expect(screen.getByTestId('field-survey.point.plot.0')).toBeTruthy();
  expect(screen.getByTestId('field-survey.insert.plot.0')).toBeTruthy();
});
