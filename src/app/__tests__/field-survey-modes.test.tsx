import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';

import FieldSurveyScreen from '@/app/field-survey';
import { FIELD_SURVEY_COPY, FIELD_SURVEY_MODE_COPY } from '@/constants/copy';
import { findOwnedFieldSurvey, listOwnedFieldSurveys, markFieldSurveyPending, saveFieldSurveyDraft } from '@/features/surveys/data/fieldSurveyRepository';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';
import type { FieldSurveyRow } from '@/database/schema';
import { renderWithGestures } from '../../../test/render-with-gestures';

jest.mock('expo-crypto', () => ({ randomUUID: () => '3f1de2d8-2ca9-4c26-9e37-2f4c5f6f7a10' }));
jest.mock('@/database/DatabaseProvider', () => {
  const database = {};
  return { EMPTY_DATABASE: null, useDatabaseState: () => ({ database, ready: true }) };
});
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ session: { token: 't', user: { capabilities: ['report:submit'], role: 'field_reporter', uuid: 'owner-1' } } }),
}));
jest.mock('@/features/sync/hooks/useSync', () => ({ useSync: () => ({ isOnline: true, syncNow: jest.fn(async () => ({ results: [] })) }) }));
jest.mock('@/features/surveys/data/fieldSurveyRepository', () => ({
  findOwnedFieldSurvey: jest.fn(),
  listOwnedFieldSurveys: jest.fn(),
  saveFieldSurveyDraft: jest.fn(),
  markFieldSurveyPending: jest.fn(),
}));

const mockFind = jest.mocked(findOwnedFieldSurvey);
const mockSave = jest.mocked(saveFieldSurveyDraft);
const mockParams = jest.mocked(useLocalSearchParams);

function row(overrides: Partial<FieldSurveyRow> = {}): FieldSurveyRow {
  return {
    clientUuid: '3f1de2d8-2ca9-4c26-9e37-2f4c5f6f7a10', ownerIdentity: 'owner-1', districtCode: 'D1',
    waypointsJson: JSON.stringify([
      { latitude: 14.1, longitude: 121.1, source: 'map', accuracyMeters: null, capturedAt: 'x' },
      { latitude: 14.1, longitude: 121.102, source: 'map', accuracyMeters: null, capturedAt: 'x' },
      { latitude: 14.102, longitude: 121.102, source: 'map', accuracyMeters: null, capturedAt: 'x' },
    ]),
    affectedAreaPolygonsJson: '[]', affectedAreaWaypointsJson: '[]', activeAffectedWaypointsJson: '[]',
    status: 'draft', fieldErrorsJson: null, lastSyncErrorCode: null, remoteId: null,
    ...overrides,
  } as unknown as FieldSurveyRow;
}

const CASES: [string, Partial<FieldSurveyRow> | null, string, string][] = [
  ['drawing_new', row({ waypointsJson: '[]' }), '', FIELD_SURVEY_MODE_COPY.drawing_new],
  ['drawing_resumed', row(), '', FIELD_SURVEY_MODE_COPY.drawing_resumed],
  ['fixing', row({ status: 'failed', lastSyncErrorCode: 'API_VALIDATION_FAILED', fieldErrorsJson: '{"x":["Bad point."]}' }), '', FIELD_SURVEY_MODE_COPY.fixing],
  ['sending', row({ status: 'syncing' }), '', FIELD_SURVEY_MODE_COPY.sending],
  ['waiting_to_send', row({ status: 'pending' }), '', FIELD_SURVEY_MODE_COPY.waiting_to_send],
  ['sent', row({ status: 'synced', remoteId: 'r1' }), '', FIELD_SURVEY_MODE_COPY.sent],
  ['identity_rejected', row({ status: 'failed', lastSyncErrorCode: 'CLIENT_UUID_CONFLICT' }), '', FIELD_SURVEY_MODE_COPY.identity_rejected],
  ['waiting_to_start', null, 'gone', FIELD_SURVEY_MODE_COPY.waiting_to_start],
] as never;

beforeEach(() => {
  jest.mocked(listOwnedFieldSurveys).mockReturnValue([]);
  jest.mocked(markFieldSurveyPending).mockReturnValue(undefined);
  mockFind.mockReturnValue(null);
  mockSave.mockResolvedValue(row());
  mockParams.mockReturnValue({});
});

// Intent: each of the nine modes renders its own status strip text, with the mode on the strip.
it.each(CASES)('renders the %s mode distinctly', async (mode, stored, requested, text) => {
  mockFind.mockReturnValue(stored as FieldSurveyRow | null);
  mockParams.mockReturnValue({ surveyId: requested || (stored as FieldSurveyRow | null)?.clientUuid });
  if (mode === 'drawing_new') mockParams.mockReturnValue({ surveyId: (stored as FieldSurveyRow).clientUuid });
  await renderWithGestures(<FieldSurveyScreen />);
  await waitFor(() => expect(screen.getByTestId('field-survey.status-strip').props.accessibilityValue).toEqual({ text: `mode=${mode}` }));
  expect(screen.getByTestId('field-survey.status-strip')).toHaveTextContent(text);
});

// Intent: a failed save never reads as Saving; it shows the saveFailed copy and a retry.
it('shows the save-failed copy, not Saving, when the draft cannot be written', async () => {
  mockSave.mockRejectedValue(new Error('disk full'));
  await renderWithGestures(<FieldSurveyScreen />);
  await waitFor(() => expect(screen.getByTestId('field-survey.status-strip').props.accessibilityValue).toEqual({ text: 'mode=drawing_new' }));
  await fireEvent.changeText(screen.getByTestId('field-survey.district-code'), 'D9');
  await waitFor(() => expect(screen.getByText(FIELD_SURVEY_COPY.saveFailed, { exact: false })).toBeTruthy());
  expect(screen.queryByText(FIELD_SURVEY_COPY.savingOffline)).toBeNull();
  mockSave.mockResolvedValue(row());
  await fireEvent.press(screen.getByTestId('field-survey.save-failed'));
  await waitFor(() => expect(screen.queryByTestId('field-survey.save-failed')).toBeNull());
});

// Intent (D5): opening Measure a plot and closing it creates no draft row; the first edit does.
it('opens and closes a new boundary without writing an empty draft', async () => {
  await renderWithGestures(<FieldSurveyScreen />);
  await waitFor(() => expect(screen.getByTestId('field-survey.status-strip').props.accessibilityValue).toEqual({ text: 'mode=drawing_new' }));
  expect(mockSave).not.toHaveBeenCalled();

  await fireEvent.changeText(screen.getByTestId('field-survey.district-code'), 'D9');
  await waitFor(() => expect(mockSave).toHaveBeenCalled());
  expect(mockSave.mock.lastCall?.[1]).toMatchObject({ districtCode: 'D9', waypoints: [] });
});

// Intent (D3): a correction that arrives from a background attempt shows on the open screen, with its field messages.
it('adopts the stored row when a background attempt rejects the boundary', async () => {
  await renderWithGestures(<FieldSurveyScreen />);
  await waitFor(() => expect(screen.getByTestId('field-survey.status-strip').props.accessibilityValue).toEqual({ text: 'mode=drawing_new' }));

  mockFind.mockReturnValue(row({ status: 'failed', lastSyncErrorCode: 'API_VALIDATION_FAILED', fieldErrorsJson: '{"waypoints":["Move point 2."]}' }));
  await act(async () => { emitSyncRecordsChanged(); });

  await waitFor(() => expect(screen.getByTestId('field-survey.status-strip').props.accessibilityValue).toEqual({ text: 'mode=fixing' }));
  expect(screen.getByTestId('field-survey.status-strip')).toHaveTextContent(FIELD_SURVEY_MODE_COPY.fixing);
  expect(screen.getByText('waypoints: Move point 2.')).toBeTruthy();
});

// Intent: a background send that finishes while the screen is open leaves the screen on its stored mode.
it('follows the stored row from sending to sent without reopening', async () => {
  const syncing = row({ status: 'syncing' });
  mockFind.mockReturnValue(syncing);
  mockParams.mockReturnValue({ surveyId: syncing.clientUuid });
  await renderWithGestures(<FieldSurveyScreen />);
  await waitFor(() => expect(screen.getByTestId('field-survey.status-strip').props.accessibilityValue).toEqual({ text: 'mode=sending' }));

  mockFind.mockReturnValue(row({ status: 'synced', remoteId: 'r1' }));
  await act(async () => { emitSyncRecordsChanged(); });

  await waitFor(() => expect(screen.getByTestId('field-survey.status-strip').props.accessibilityValue).toEqual({ text: 'mode=sent' }));
  expect(screen.getByTestId('field-survey.submit').props.accessibilityState.disabled).toBe(true);
});
