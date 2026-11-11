import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import MyBoundariesScreen from '@/app/my-boundaries';
import { FIELD_SURVEY_COPY } from '@/constants/copy';
import type { FieldSurveyRow } from '@/database/schema';
import { deleteOwnedFieldSurvey, listOwnedFieldSurveys } from '@/features/surveys/data/fieldSurveyRepository';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  useFocusEffect: (effect: () => void) => { require('react').useEffect(effect, [effect]); },
}));
jest.mock('@/database/DatabaseProvider', () => {
  const database = {};
  return { EMPTY_DATABASE: null, useDatabaseState: () => ({ database, ready: true }) };
});
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ session: { token: 't', user: { capabilities: ['report:submit'], role: 'field_reporter', uuid: 'owner-1' } } }),
}));
jest.mock('@/features/surveys/data/fieldSurveyRepository', () => ({
  listOwnedFieldSurveys: jest.fn(),
  deleteOwnedFieldSurvey: jest.fn(),
}));

const row = (overrides: Partial<FieldSurveyRow>): FieldSurveyRow => ({
  clientUuid: 'b1', ownerIdentity: 'owner-1', districtCode: 'D1', waypointsJson: '[]', polygonJson: null, areaSqm: null,
  affectedAreaPolygonsJson: null, affectedAreaSqm: null, affectedAreaWaypointsJson: null, activeAffectedWaypointsJson: null,
  measurementProvenanceJson: null, capturedAt: '2026-01-01T00:00:00.000Z', status: 'draft', authorRole: 'field_reporter',
  remoteId: null, fieldErrorsJson: null, syncAttemptCount: 0, lastSyncErrorCode: null, lastSyncedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', ...overrides,
});

describe('My boundaries', () => {
  beforeEach(() => jest.clearAllMocks());

  // Intent: older drafts can be reopened from a list, and each failure shows its honest label.
  it('lists boundaries with honest labels and opens one by id', async () => {
    jest.mocked(listOwnedFieldSurveys).mockReturnValue([
      row({ clientUuid: 'b1' }),
      row({ clientUuid: 'b2', status: 'failed', lastSyncErrorCode: 'CLIENT_UUID_CONFLICT' }),
      row({ clientUuid: 'b3', status: 'synced', remoteId: 'r' }),
    ]);
    await render(<MyBoundariesScreen />);
    expect(screen.getByText('Start again')).toBeTruthy();
    expect(screen.getByText('Sent')).toBeTruthy();
    expect(screen.queryByTestId('my-boundaries.delete.b3')).toBeNull();
    expect(screen.queryByTestId('my-boundaries.delete.b2')).toBeNull();
    fireEvent.press(screen.getByTestId('my-boundaries.open.b1'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/field-survey', params: { surveyId: 'b1' } });
  });

  // Intent: a background send that finishes while this list is open stops showing the old state.
  it('re-reads the stored rows when a state change is published', async () => {
    jest.mocked(listOwnedFieldSurveys).mockReturnValue([row({ clientUuid: 'b1', status: 'pending' })]);
    await render(<MyBoundariesScreen />);
    expect(screen.getByText('Waiting to send')).toBeTruthy();
    jest.mocked(listOwnedFieldSurveys).mockReturnValue([row({ clientUuid: 'b1', status: 'synced', remoteId: 'r1' })]);
    await act(async () => {
      emitSyncRecordsChanged();
    });
    expect(screen.getByText('Sent')).toBeTruthy();
    expect(screen.queryByText('Waiting to send')).toBeNull();
  });

  // Intent: a read that fails says so; it never claims the phone has no boundaries.
  it('reports a failed read instead of the empty state, then recovers', async () => {
    jest.mocked(listOwnedFieldSurveys).mockImplementation(() => {
      throw new Error('read failed');
    });
    await render(<MyBoundariesScreen />);
    expect(screen.getByText(FIELD_SURVEY_COPY.myBoundariesLoadFailed)).toBeTruthy();
    expect(screen.queryByTestId('my-boundaries.empty')).toBeNull();
    expect(screen.getByTestId('my-boundaries.screen').props.accessibilityValue).toEqual({ text: 'state=error;count=0' });
    jest.mocked(listOwnedFieldSurveys).mockReturnValue([]);
    await act(async () => {
      emitSyncRecordsChanged();
    });
    expect(screen.getByTestId('my-boundaries.empty')).toBeTruthy();
    expect(screen.queryByText(FIELD_SURVEY_COPY.myBoundariesLoadFailed)).toBeNull();
    expect(screen.getByTestId('my-boundaries.screen').props.accessibilityValue).toEqual({ text: 'state=empty;count=0' });
  });

  // Intent: a draft whose ring does not measure still has points, so it never claims "No points yet".
  it('does not claim a drawn but unmeasurable draft has no points', async () => {
    const bowTie = [
      { accuracyMeters: null, capturedAt: '2026-01-01T00:00:00.000Z', latitude: 14, longitude: 120, source: 'map' as const },
      { accuracyMeters: null, capturedAt: '2026-01-01T00:00:00.000Z', latitude: 14.002, longitude: 120.002, source: 'map' as const },
      { accuracyMeters: null, capturedAt: '2026-01-01T00:00:00.000Z', latitude: 14.002, longitude: 120, source: 'map' as const },
      { accuracyMeters: null, capturedAt: '2026-01-01T00:00:00.000Z', latitude: 14, longitude: 120.002, source: 'map' as const },
    ];
    jest.mocked(listOwnedFieldSurveys).mockReturnValue([
      row({ clientUuid: 'b-drawn', districtCode: 'TRI', waypointsJson: JSON.stringify(bowTie) }),
      row({ clientUuid: 'b-empty', districtCode: 'LIPA', waypointsJson: '[]' }),
    ]);
    await render(<MyBoundariesScreen />);
    expect(screen.queryByText(`TRI · ${FIELD_SURVEY_COPY.myBoundariesNoPoints}`)).toBeNull();
    expect(screen.getByLabelText(FIELD_SURVEY_COPY.myBoundariesRowOpenLabel('TRI · Needs a fix'))).toBeTruthy();
    expect(screen.getByLabelText(FIELD_SURVEY_COPY.myBoundariesRowOpenLabel(`LIPA · ${FIELD_SURVEY_COPY.myBoundariesNoPoints}`))).toBeTruthy();
  });

  // Intent: a boundary is deleted only after confirmation.
  it('deletes after confirmation', async () => {
    jest.mocked(listOwnedFieldSurveys).mockReturnValue([row({ clientUuid: 'b1' })]);
    jest.mocked(deleteOwnedFieldSurvey).mockReturnValue(true);
    await render(<MyBoundariesScreen />);
    await fireEvent.press(screen.getByTestId('my-boundaries.delete.b1'));
    expect(deleteOwnedFieldSurvey).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('my-boundaries.delete-confirm'));
    expect(deleteOwnedFieldSurvey).toHaveBeenCalledWith(expect.anything(), 'b1', 'owner-1');
  });
});
