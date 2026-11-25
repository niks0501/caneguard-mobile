import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { createGestureController, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { useLocalSearchParams } from 'expo-router';

import FieldSurveyScreen from '@/app/field-survey';
import { FIELD_SURVEY_COPY } from '@/constants/copy';
import type { FieldSurveyRow } from '@/database/schema';
import { findOwnedFieldSurvey, listOwnedFieldSurveys, saveFieldSurveyDraft } from '@/features/surveys/data/fieldSurveyRepository';
import { validateSurveyWaypoints, type SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';
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
  expect(screen.getByTestId('field-survey.walk-status')).toHaveTextContent(FIELD_SURVEY_COPY.walkStopped(3));
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

it('locks Finish area while walking, so a walk only ever adds to the affected area it started on', async () => {
  listSurveys.mockReturnValue([draftRow({ activeAffectedWaypointsJson: JSON.stringify(AFFECTED_WAYPOINTS) })]);
  const remove = jest.fn();
  let emit: (fix: WalkFix) => void = () => undefined;
  watch.mockImplementation(async (onFix) => { emit = onFix; return { remove }; });

  await renderOpen();
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.finishAffectedArea)).toBeTruthy());
  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy());

  expect(screen.getByText(FIELD_SURVEY_COPY.finishAffectedArea)).toBeDisabled();
  await act(async () => { fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.finishAffectedArea)); });
  await act(async () => { emit(fix(14.1008, 121.1008)); });

  expect(remove).not.toHaveBeenCalled();
  expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy();
  expect(lastDraftAffectedWaypoints()).toHaveLength(0);
  expect(lastDraftActiveAffectedWaypoints()).toHaveLength(AFFECTED_WAYPOINTS.length + 1);
});

it('locks affected-area selection on a stored survey', async () => {
  const area = validateSurveyWaypoints(AFFECTED_WAYPOINTS);
  if (!area.valid) throw new Error('fixture invalid');
  listSurveys.mockReturnValue([draftRow({
    status: 'pending',
    affectedAreaPolygonsJson: JSON.stringify([area.polygon]),
    affectedAreaWaypointsJson: JSON.stringify([AFFECTED_WAYPOINTS]),
  })]);

  await renderOpen();
  const areaRow = await screen.findByRole('button', { name: /^Area 1 ·/ });
  expect(areaRow).toBeDisabled();
  expect(areaRow.props.accessibilityState).toMatchObject({ disabled: true, selected: false });

  await act(async () => { fireEvent.press(areaRow); });
  expect(areaRow.props.accessibilityState.selected).toBe(false);
});

// Intent (item 8): Stop is the only way out of a walk; there is no Tap button to hit by accident.
it('stops walking on Stop and offers Resume for a few seconds', async () => {
  jest.useFakeTimers();
  try {
    const remove = jest.fn();
    watch.mockImplementation(async () => ({ remove }));

    await renderOpen();
    await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
    await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy());

    await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
    expect(remove).toHaveBeenCalledTimes(1);
    expect(screen.getByText(FIELD_SURVEY_COPY.walkResume)).toBeTruthy();

    await act(async () => { jest.advanceTimersByTime(5_000); });
    expect(screen.queryByText(FIELD_SURVEY_COPY.walkResume)).toBeNull();
    expect(screen.getByText(FIELD_SURVEY_COPY.walkStart)).toBeTruthy();
  } finally {
    jest.useRealTimers();
  }
});

it('resumes the walk from the same boundary when Resume is pressed', async () => {
  listSurveys.mockReturnValue([draftRow()]);
  const remove = jest.fn();
  let emit: (fix: WalkFix) => void = () => undefined;
  watch.mockImplementation(async (onFix) => { emit = onFix; return { remove }; });

  await renderOpen();
  await waitFor(() => expect(screen.getByText(`${FIELD_SURVEY_COPY.pointsHeading} (4)`)).toBeTruthy());
  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy());
  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
  await act(async () => { fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.walkResume)); });
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy());
  expect(watch).toHaveBeenCalledTimes(2);

  await act(async () => { emit(fix(14.101, 121.1001)); }); // ~110 m from the existing last and first points
  await waitFor(() => expect(lastDraftWaypoints()).toHaveLength(5));
});

it('has no Tap button while walking, so a stray press cannot end the walk', async () => {
  const remove = jest.fn();
  watch.mockImplementation(async () => ({ remove }));

  await renderOpen();
  expect(screen.getByTestId('field-survey.tap')).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy());

  expect(screen.queryByTestId('field-survey.tap')).toBeNull();
  expect(remove).not.toHaveBeenCalled();

  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
  expect(screen.getByTestId('field-survey.tap')).toBeTruthy();
});

it('locks the plot/affected-area switch while walking so it cannot silently end the walk', async () => {
  const remove = jest.fn();
  watch.mockImplementation(async () => ({ remove }));

  await renderOpen();
  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy());

  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.target-affected')); });
  expect(remove).not.toHaveBeenCalled();
  expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy();
  expect(screen.getByTestId('field-survey.target-affected')).toBeDisabled();
  expect(screen.getByTestId('field-survey.target-plot')).toBeDisabled();
});

it('locks the map press, point list, Remove and Recapture while walking', async () => {
  listSurveys.mockReturnValue([draftRow({ waypointsJson: JSON.stringify(PLOT_WAYPOINTS.map((point) => ({ ...point, accuracyMeters: 40 }))) })]);
  watch.mockImplementation(async () => ({ remove: jest.fn() }));

  await renderOpen();
  await waitFor(() => expect(screen.getByText(`${FIELD_SURVEY_COPY.pointsHeading} (4)`)).toBeTruthy());
  await act(async () => { fireEvent.press(screen.getByText(`${FIELD_SURVEY_COPY.pointsHeading} (4)`)); });
  expect(screen.getByLabelText(FIELD_SURVEY_COPY.selectPoint(1))).toBeEnabled();

  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy());

  expect(screen.getByTestId('field-survey.map')).toBeDisabled();
  expect(screen.getByLabelText(FIELD_SURVEY_COPY.selectPoint(1))).toBeDisabled();
  expect(screen.getByText(FIELD_SURVEY_COPY.removeSelected)).toBeDisabled();
  expect(screen.getByText(FIELD_SURVEY_COPY.recapturePoint(1))).toBeDisabled();
});

it('keeps Undo working while walking', async () => {
  listSurveys.mockReturnValue([draftRow()]);
  watch.mockImplementation(async () => ({ remove: jest.fn() }));

  await renderOpen();
  await waitFor(() => expect(screen.getByText(`${FIELD_SURVEY_COPY.pointsHeading} (4)`)).toBeTruthy());
  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy());

  await act(async () => { fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.undo)); });
  await waitFor(() => expect(lastDraftWaypoints()).toHaveLength(3));
  expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy();
});

// Intent (item 8): Walk excludes tap editing, so a stray tap during GPS capture cannot add or move points.
it('ignores map taps while walking and keeps them working after Stop', async () => {
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
  await act(async () => { emit(fix(14.101, 121.1001)); });

  await waitFor(() => expect(lastDraftWaypoints()).toHaveLength(5));
  expect(lastDraftWaypoints().filter((point) => point.source === 'map')).toHaveLength(0);

  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
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

  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
  expect(screen.getByTestId('field-survey.point.plot.0')).toBeTruthy();
  expect(screen.getByTestId('field-survey.insert.plot.0')).toBeTruthy();
});

it('shows walk status on the map, not only inside More details', async () => {
  // Root cause: walk feedback went to the collapsed More panel, so tapping Walk looked unresponsive.
  watch.mockImplementation(async () => ({ remove: jest.fn() }));

  await renderWithGestures(<FieldSurveyScreen />);
  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });

  await waitFor(() => expect(screen.getByTestId('field-survey.walk-status')).toHaveTextContent(FIELD_SURVEY_COPY.walkLocking));
});

it('tells the walker on the map when device location is off, and does not start walking', async () => {
  jest.mocked(expoWalkLocationClient.hasServicesEnabled).mockResolvedValueOnce(false);

  await renderWithGestures(<FieldSurveyScreen />);
  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });

  await waitFor(() => expect(screen.getByTestId('field-survey.walk-status')).toHaveTextContent(FIELD_SURVEY_COPY.walkServicesDisabled));
  expect(watch).not.toHaveBeenCalled();
});

it('tells the walker on the map when location permission is denied', async () => {
  jest.mocked(expoWalkLocationClient.requestForegroundPermission).mockResolvedValueOnce({ canAskAgain: false, status: 'denied' });

  await renderWithGestures(<FieldSurveyScreen />);
  await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });

  await waitFor(() => expect(screen.getByTestId('field-survey.walk-status')).toHaveTextContent(FIELD_SURVEY_COPY.walkPermissionDenied));
});

describe('live walk readout', () => {
  async function startWalking(emitRef: { emit: (fix: WalkFix) => void }) {
    listSurveys.mockReturnValue([draftRow()]);
    watch.mockImplementation(async (onFix) => { emitRef.emit = onFix; return { remove: jest.fn() }; });
    await renderOpen();
    await waitFor(() => expect(screen.getByText(`${FIELD_SURVEY_COPY.pointsHeading} (4)`)).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
    await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy());
  }

  it('shows accuracy, points, distance walked and distance to start as fixes arrive', async () => {
    const ref: { emit: (fix: WalkFix) => void } = { emit: () => undefined };
    await startWalking(ref);
    expect(screen.queryByTestId('field-survey.walk-hud')).toBeNull();

    await act(async () => { ref.emit(fix(14.0995, 121.1, 3)); }); // ~55 m from the last point: accepted
    await waitFor(() => expect(screen.getByTestId('field-survey.walk-hud.accuracy')).toHaveTextContent('±3 m'));
    expect(screen.getByTestId('field-survey.walk-hud.points')).toHaveTextContent('5');
    expect(screen.getByTestId('field-survey.walk-hud.walked')).toHaveTextContent(/^\d+ m$/);
    expect(screen.getByTestId('field-survey.walk-hud.to-start')).toHaveTextContent(/^\d+ m$/);
    expect(screen.getByTestId('field-survey.walk-dot')).toBeTruthy();
    expect(screen.getByTestId('field-survey.walk-segment')).toBeTruthy();
  });

  it('keeps reporting a weak reading without adding a point', async () => {
    const ref: { emit: (fix: WalkFix) => void } = { emit: () => undefined };
    await startWalking(ref);

    await act(async () => { ref.emit(fix(14.0995, 121.1, 40)); });
    await waitFor(() => expect(screen.getByTestId('field-survey.walk-hud.accuracy')).toHaveTextContent('±40 m'));
    expect(screen.getByTestId('field-survey.walk-hud.points')).toHaveTextContent('4');
    expect(screen.getByTestId('field-survey.walk-hud.walked')).toHaveTextContent('0 m');
  });

  it('stops following when the map is panned and follows again on Recenter', async () => {
    const ref: { emit: (fix: WalkFix) => void } = { emit: () => undefined };
    await startWalking(ref);
    await act(async () => { ref.emit(fix(14.0995, 121.1, 3)); });
    await waitFor(() => expect(screen.getByTestId('field-survey.walk-dot')).toBeTruthy());
    expect(screen.queryByTestId('field-survey.recenter')).toBeNull();

    const pan = createGestureController(getByGestureTestId('manual-map.pan'));
    await act(async () => { pan.begin(); pan.activate(); pan.update({ translationX: 40, translationY: 0 }); pan.end(); });
    await waitFor(() => expect(screen.getByTestId('field-survey.recenter')).toBeTruthy());

    await act(async () => { fireEvent.press(screen.getByTestId('field-survey.recenter')); });
    expect(screen.queryByTestId('field-survey.recenter')).toBeNull();
  });

  it('clears the readout when the walk stops', async () => {
    const ref: { emit: (fix: WalkFix) => void } = { emit: () => undefined };
    await startWalking(ref);
    await act(async () => { ref.emit(fix(14.0995, 121.1, 3)); });
    await waitFor(() => expect(screen.getByTestId('field-survey.walk-hud')).toBeTruthy());

    await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
    expect(screen.queryByTestId('field-survey.walk-hud')).toBeNull();
    expect(screen.queryByTestId('field-survey.walk-dot')).toBeNull();
  });
});


describe('GPS lock, corners and closing the loop', () => {
  async function startWalking(draft: Partial<FieldSurveyRow> | null = {}) {
    listSurveys.mockReturnValue(draft === null ? [] : [draftRow(draft)]);
    const ref: { emit: (fix: WalkFix) => void } = { emit: () => undefined };
    watch.mockImplementation(async (onFix) => { ref.emit = onFix; return { remove: jest.fn() }; });
    await renderOpen();
    if (draft !== null) await waitFor(() => expect(screen.getByText(`${FIELD_SURVEY_COPY.pointsHeading} (4)`)).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });
    await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.walkStop)).toBeTruthy());
    return ref;
  }

  it('tells the walker to wait at the start corner until a usable reading arrives', async () => {
    const ref = await startWalking(null);
    expect(screen.getByTestId('field-survey.walk-status')).toHaveTextContent(FIELD_SURVEY_COPY.walkLocking);

    await act(async () => { ref.emit(fix(14.1, 121.1, 40)); });
    expect(screen.getByTestId('field-survey.walk-status')).toHaveTextContent(FIELD_SURVEY_COPY.walkWeakSignal);

    await act(async () => { ref.emit(fix(14.1, 121.1, 4)); });
    await waitFor(() => expect(screen.getByTestId('field-survey.walk-status')).toHaveTextContent(FIELD_SURVEY_COPY.walkActive));
  });

  it('cannot mark a corner before any reading has arrived', async () => {
    await startWalking();
    expect(screen.getByTestId('field-survey.walk-corner')).toBeDisabled();
  });

  it('marks a corner closer than the walking spacing and keeps the flag on the point', async () => {
    const ref = await startWalking();
    await act(async () => { ref.emit(fix(14.1006, 121.1, 4)); }); // accepted, ~64 m from the last plot point
    await waitFor(() => expect(lastDraftWaypoints()).toHaveLength(5));

    await act(async () => { ref.emit(fix(14.100636, 121.1, 3)); }); // ~4 m on: too close to be added by walking
    await waitFor(() => expect(screen.getByTestId('field-survey.walk-corner')).toBeEnabled());
    expect(lastDraftWaypoints()).toHaveLength(5);

    await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk-corner')); });
    await waitFor(() => expect(lastDraftWaypoints()).toHaveLength(6));
    expect(lastDraftWaypoints().at(-1)).toMatchObject({ isCorner: true, accuracyMeters: 3, source: 'gps' });
    expect(screen.getByTestId('field-survey.walk-status')).toHaveTextContent(FIELD_SURVEY_COPY.walkCornerMarked);
  });

  it('flags the last point instead of duplicating it when the walker has not moved', async () => {
    const ref = await startWalking();
    await act(async () => { ref.emit(fix(14.1006, 121.1, 4)); });
    await waitFor(() => expect(lastDraftWaypoints()).toHaveLength(5));

    await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk-corner')); });
    await waitFor(() => expect(lastDraftWaypoints().at(-1)).toMatchObject({ isCorner: true }));
    expect(lastDraftWaypoints()).toHaveLength(5);
  });

  it('says so when there is no good reading to mark a corner with', async () => {
    const ref = await startWalking();
    await act(async () => { ref.emit({ ...fix(14.1006, 121.1, 4), timestamp: Date.now() - 10_000 }); }); // walking still keeps it; a corner needs a fresh one
    await waitFor(() => expect(lastDraftWaypoints()).toHaveLength(5));
    await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk-corner')); });
    expect(screen.getByTestId('field-survey.walk-status')).toHaveTextContent(FIELD_SURVEY_COPY.walkNoCornerFix);
    expect(lastDraftWaypoints()).toHaveLength(5);
    expect(lastDraftWaypoints().at(-1)?.isCorner).toBeUndefined();
  });

  it('adds where the walker stood when Stop is pressed', async () => {
    const ref = await startWalking();
    await act(async () => { ref.emit(fix(14.1006, 121.1, 4)); });
    await waitFor(() => expect(lastDraftWaypoints()).toHaveLength(5));
    await act(async () => { ref.emit(fix(14.10066, 121.1, 4)); }); // ~7 m on: too close for walking, far enough to be the stop spot
    await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk')); });

    await waitFor(() => expect(lastDraftWaypoints()).toHaveLength(6));
    expect(lastDraftWaypoints().at(-1)).toMatchObject({ latitude: 14.10066 });
  });

  it('offers Finish back at the start, then closes the walk without repeating the start point', async () => {
    const ref = await startWalking(null);
    // A real loop: four corners about 25 m apart, then back to the first point.
    for (const [lat, lon] of [[14.1, 121.1], [14.1, 121.10025], [14.10025, 121.10025], [14.10025, 121.1]] as const) {
      await act(async () => { ref.emit(fix(lat, lon, 4)); });
    }
    await waitFor(() => expect(lastDraftWaypoints()).toHaveLength(4));
    expect(screen.queryByTestId('field-survey.walk-finish')).toBeNull();
    expect(screen.getByTestId('field-survey.walk-corner')).toBeTruthy();

    await act(async () => { ref.emit(fix(14.10002, 121.1, 4)); }); // ~2 m from the first point
    await waitFor(() => expect(screen.getByTestId('field-survey.walk-finish')).toBeTruthy());
    expect(screen.queryByTestId('field-survey.walk-corner')).toBeNull();
    expect(screen.getByTestId('field-survey.walk-status')).toHaveTextContent(FIELD_SURVEY_COPY.walkBackAtStart);

    await act(async () => { fireEvent.press(screen.getByTestId('field-survey.walk-finish')); });
    expect(screen.queryByTestId('field-survey.walk-finish')).toBeNull();
    expect(lastDraftWaypoints()).toHaveLength(4);
    expect(screen.getByTestId('field-survey.walk-status')).toHaveTextContent(FIELD_SURVEY_COPY.walkFinished(4));
    expect(screen.getByText(FIELD_SURVEY_COPY.walkResume)).toBeTruthy();
  });
});
