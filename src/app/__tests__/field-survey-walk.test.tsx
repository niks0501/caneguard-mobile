import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';

import FieldSurveyScreen from '@/app/field-survey';
import { FIELD_SURVEY_COPY } from '@/constants/copy';
import { saveFieldSurveyDraft } from '@/features/surveys/data/fieldSurveyRepository';
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

function lastDraftWaypoints() {
  return (save.mock.calls.at(-1)?.[1].waypoints ?? []) as { latitude: number; longitude: number; source: string }[];
}

it('adds boundary points while walking, without a button press per point, and stops on request', async () => {
  // Intent: walking the edge produces a boundary without a button press per point.
  jest.mocked(useLocalSearchParams).mockReturnValue({});
  const remove = jest.fn();
  let emit: (fix: WalkFix) => void = () => undefined;
  watch.mockImplementation(async (onFix) => { emit = onFix; return { remove }; });
  const fix = (latitude: number, longitude: number, accuracy: number | null = 4): WalkFix => ({ latitude, longitude, accuracy, timestamp: Date.now() });

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
