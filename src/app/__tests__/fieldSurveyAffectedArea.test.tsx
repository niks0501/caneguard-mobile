import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithGestures } from '../../../test/render-with-gestures';

import FieldSurveyScreen from '@/app/field-survey';
import { FIELD_SURVEY_COPY } from '@/constants/copy';
import {
  listOwnedFieldSurveys,
  markFieldSurveyPending,
  saveFieldSurveyDraft,
} from '@/features/surveys/data/fieldSurveyRepository';
import type { FieldSurveyRow } from '@/database/schema';
import { captureSurveyWaypoint } from '@/features/surveys/services/captureSurveyWaypoint';
import type { SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';

// The map is full height; affected areas, GPS capture and the point lists sit behind More.
async function renderOpen() {
  const view = await renderWithGestures(<FieldSurveyScreen />);
  await fireEvent.press(screen.getByTestId('field-survey.more'));
  return view;
}

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
  useAuth: () => ({ session: { token: 'test-session-token', user: { capabilities: ['report:submit'], districtCode: 'D9', role: 'field_reporter', uuid: 'owner-1' } } }),
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
const mockCaptureGps = jest.mocked(captureSurveyWaypoint);

const PLOT_WAYPOINTS: SurveyWaypoint[] = [
  { latitude: 14.1, longitude: 121.1, source: 'gps', accuracyMeters: 4, capturedAt: '2026-10-31T01:00:00.000Z' },
  { latitude: 14.1, longitude: 121.102, source: 'gps', accuracyMeters: 4, capturedAt: '2026-10-31T01:01:00.000Z' },
  { latitude: 14.102, longitude: 121.102, source: 'gps', accuracyMeters: 4, capturedAt: '2026-10-31T01:02:00.000Z' },
  { latitude: 14.102, longitude: 121.1, source: 'gps', accuracyMeters: 4, capturedAt: '2026-10-31T01:03:00.000Z' },
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

function areaText(): string {
  const children = screen.getByTestId('field-survey.area').props.children;
  return (Array.isArray(children) ? children.join('') : String(children));
}

function submitDisabled(): boolean {
  return screen.getByTestId('field-survey.submit').props.accessibilityState.disabled as boolean;
}

function affectedSqmFromReadout(): number {
  const text = String(areaText());
  const match = text.match(/·\s*(\d+)\s*m² affected/);
  if (!match) throw new Error(`No affected-area readout in: ${text}`);
  return Number(match[1]);
}

beforeEach(() => {
  mockListSurveys.mockReturnValue([]);
  mockSaveDraft.mockResolvedValue(draftRow());
  mockMarkPending.mockReturnValue(undefined);
  mockCaptureGps.mockReset();
});

it('keeps only the Walk / Tap switch on the map and puts affected areas and GPS capture behind More', async () => {
  await renderWithGestures(<FieldSurveyScreen />);
  await waitFor(() => expect(mockListSurveys).toHaveBeenCalled());

  expect(screen.getByTestId('field-survey.walk')).toBeTruthy();
  expect(screen.getByTestId('field-survey.tap')).toBeTruthy();
  expect(screen.queryByText(FIELD_SURVEY_COPY.plotBoundary)).toBeNull();
  expect(screen.queryByText(FIELD_SURVEY_COPY.affectedAreaBoundary)).toBeNull();
  expect(screen.queryByText(FIELD_SURVEY_COPY.addGpsPoint)).toBeNull();

  await fireEvent.press(screen.getByTestId('field-survey.more'));
  expect(screen.getByText(FIELD_SURVEY_COPY.plotBoundary)).toBeTruthy();
  expect(screen.getByText(FIELD_SURVEY_COPY.affectedAreaBoundary)).toBeTruthy();
  expect(screen.getByText(FIELD_SURVEY_COPY.addGpsPoint)).toBeTruthy();

  mockCaptureGps.mockResolvedValue({
    status: 'captured',
    waypoint: {
      latitude: 14.1005,
      longitude: 121.1005,
      accuracyMeters: 3.2,
      capturedAt: '2026-10-31T03:00:00.000Z',
      source: 'gps',
    },
  });
  await fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.addGpsPoint));
  await waitFor(() => expect(mockCaptureGps).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(screen.getByText(`${FIELD_SURVEY_COPY.pointsHeading} (1)`)).toBeTruthy());
});

it('shows the union affected area on screen instead of the sum of overlapping boundaries', async () => {
  await renderOpen();
  await waitFor(() => expect(mockListSurveys).toHaveBeenCalled());

  await pressMap(100, 100);
  await pressMap(260, 100);
  await pressMap(260, 240);
  await pressMap(100, 240);
  await waitFor(() => expect(areaText()).toMatch(/ha ·/));

  await fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.affectedAreaBoundary));
  await pressMap(120, 120);
  await pressMap(180, 120);
  await pressMap(180, 160);
  await pressMap(120, 160);
  await fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.finishAffectedArea));
  await waitFor(() => expect(affectedSqmFromReadout()).toBeGreaterThan(0));
  const firstArea = affectedSqmFromReadout();

  await pressMap(150, 140);
  await pressMap(210, 140);
  await pressMap(210, 180);
  await pressMap(150, 180);
  await fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.finishAffectedArea));
  await waitFor(() => expect(screen.getByText(`${FIELD_SURVEY_COPY.affectedAreas} (2)`)).toBeTruthy());
  const unionArea = affectedSqmFromReadout();

  expect(unionArea).toBeGreaterThan(firstArea);
  expect(unionArea).toBeLessThan(firstArea * 2);
  expect(submitDisabled()).toBe(false);
});

it('reports too-few and self-crossing plot boundaries and keeps Submit disabled', async () => {
  await renderOpen();
  await waitFor(() => expect(mockListSurveys).toHaveBeenCalled());

  await pressMap(100, 100);
  await pressMap(260, 100);
  expect(String(areaText())).toContain('Add at least three boundary points.');
  expect(submitDisabled()).toBe(true);

  await pressMap(100, 240);
  await pressMap(260, 240);
  await waitFor(() => expect(String(areaText())).toContain('crosses itself'));
  expect(submitDisabled()).toBe(true);
});
