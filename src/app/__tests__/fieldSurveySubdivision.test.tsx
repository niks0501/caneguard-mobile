import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { createGestureController, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { renderWithGestures } from '../../../test/render-with-gestures';

import FieldSurveyScreen from '@/app/field-survey';
import { FIELD_SURVEY_COPY } from '@/constants/copy';
import {
  listOwnedFieldSurveys,
  markFieldSurveyPending,
  saveFieldSurveyDraft,
} from '@/features/surveys/data/fieldSurveyRepository';
import type { FieldSurveyRow } from '@/database/schema';
import * as plotSubdivision from '@/features/surveys/domain/plotSubdivision';
import type { SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';

let mockUuidCounter = 0;
jest.mock('expo-crypto', () => ({
  randomUUID: () => {
    mockUuidCounter += 1;
    return `3f1de2d8-2ca9-4c26-9e37-2f4c5f6f7a${String(mockUuidCounter).padStart(2, '0')}`;
  },
}));
jest.mock('@/database/DatabaseProvider', () => {
  const database = {};
  return {
    EMPTY_DATABASE: null,
    useDatabaseState: () => ({ database, ready: true }),
  };
});
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    session: {
      token: 'test-session-token',
      user: { capabilities: ['report:submit'], districtCode: 'D9', role: 'field_reporter', uuid: 'owner-1' },
    },
  }),
}));
jest.mock('@/features/sync/hooks/useSync', () => ({
  useSync: () => ({ isOnline: true, syncNow: jest.fn(async () => ({ results: [] })) }),
}));
jest.mock('@/features/surveys/services/captureSurveyWaypoint', () => ({
  captureSurveyWaypoint: jest.fn(),
}));
jest.mock('@/features/surveys/data/fieldSurveyRepository', () => ({
  FIELD_NAME_MAX_LENGTH: 80,
  findOwnedFieldSurvey: jest.fn(),
  listEarlierMapRows: jest.fn(() => []),
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

function surveyRow(overrides: Partial<FieldSurveyRow> = {}): FieldSurveyRow {
  return {
    clientUuid: '3f1de2d8-2ca9-4c26-9e37-2f4c5f6f7a01',
    ownerIdentity: 'owner-1',
    districtCode: 'D9',
    label: 'North Block',
    outlineFromRemoteId: null,
    waypointsJson: JSON.stringify(PLOT_WAYPOINTS),
    polygonJson: null,
    areaSqm: null,
    affectedAreaPolygonsJson: JSON.stringify([]),
    affectedAreaSqm: null,
    affectedAreaMeasurement: 'not_measured',
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

async function drawSquarePlot() {
  await pressMap(100, 100);
  await pressMap(260, 100);
  await pressMap(260, 240);
  await pressMap(100, 240);
  await waitFor(() => expect(areaText()).toMatch(/ha ·/));
}

function areaText(): string {
  const children = screen.getByTestId('field-survey.area').props.children;
  return Array.isArray(children) ? children.join('') : String(children);
}

function affectedSqmFromReadout(): number {
  const text = areaText();
  const match = text.match(/·\s*(\d+)\s*m² affected/);
  if (!match) throw new Error(`No affected-area readout in: ${text}`);
  return Number(match[1]);
}

function submitDisabled(): boolean {
  return screen.getByTestId('field-survey.submit').props.accessibilityState.disabled as boolean;
}

beforeEach(() => {
  mockUuidCounter = 0;
  mockListSurveys.mockReturnValue([]);
  mockSaveDraft.mockResolvedValue(surveyRow());
  mockMarkPending.mockReturnValue(undefined);
});

describe('FieldSurveyScreen plot subdivision and whole-plot shortcut', () => {
  it('shows Divide plot and Whole plot (100%) quick tools only in Affected area mode', async () => {
    await renderWithGestures(<FieldSurveyScreen />);
    await waitFor(() => expect(mockListSurveys).toHaveBeenCalled());

    expect(screen.queryByTestId('field-survey.divide-plot')).toBeNull();
    expect(screen.queryByTestId('field-survey.whole-plot-affected')).toBeNull();

    await fireEvent.press(screen.getByTestId('field-survey.target-affected'));
    expect(screen.getByTestId('field-survey.divide-plot')).toBeTruthy();
    expect(screen.getByTestId('field-survey.whole-plot-affected')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('field-survey.target-plot'));
    expect(screen.queryByTestId('field-survey.divide-plot')).toBeNull();
    expect(screen.queryByTestId('field-survey.whole-plot-affected')).toBeNull();
  });

  it('subdivides a measured plot with a 2-tap cut, previews live area and %, applies into affectedAreas, and supports 1-tap Undo', async () => {
    await renderWithGestures(<FieldSurveyScreen />);
    await waitFor(() => expect(mockListSurveys).toHaveBeenCalled());
    await drawSquarePlot();

    await fireEvent.press(screen.getByTestId('field-survey.target-affected'));
    await fireEvent.press(screen.getByTestId('field-survey.divide-plot'));

    // Entering Divide plot switches tool state, disables Walk & Submit, hides plot handles, and labels crosshair CTA as Cut at +.
    expect(screen.getByTestId('field-survey.tool-state').props.accessibilityValue.text).toBe('tool=divide.draw');
    expect(screen.getByTestId('field-survey.walk')).toBeDisabled();
    expect(submitDisabled()).toBe(true);
    expect(screen.queryByTestId('field-survey.point.plot.0')).toBeNull();
    expect(screen.getByTestId('field-survey.add-center')).toHaveTextContent(FIELD_SURVEY_COPY.divideAddAtCenter);
    expect(screen.getByTestId('field-survey.divide-apply')).toBeDisabled();

    // Place vertical cut across center of the square plot (x=180 from y=80 to y=260).
    await pressMap(180, 80);
    expect(screen.getByTestId('field-survey.feedback')).toHaveTextContent(FIELD_SURVEY_COPY.divideSecondPoint);
    await pressMap(180, 260);

    await waitFor(() => expect(screen.getByTestId('field-survey.divide-piece.P1')).toBeTruthy());
    expect(screen.getByTestId('field-survey.divide-piece.P2')).toBeTruthy();
    expect(screen.getByTestId('field-survey.tool-state').props.accessibilityValue.text).toBe('tool=divide.select');
    expect(screen.getByTestId('field-survey.feedback')).toHaveTextContent(FIELD_SURVEY_COPY.dividePiecesReady(2));
    // Cut at + hides once pieces are ready to tap.
    expect(screen.queryByTestId('field-survey.add-center')).toBeNull();

    // Tap chip P1: live area & ~50.0% readout updates and Apply becomes Apply (1).
    await fireEvent.press(screen.getByTestId('field-survey.divide-piece.P1'));
    expect(screen.getByTestId('field-survey.divide-apply')).toBeEnabled();
    expect(screen.getByTestId('field-survey.divide-apply')).toHaveTextContent('Apply (1)');
    expect(areaText()).toMatch(/m² selected \(50\.0%\)/);

    // Tapping directly on the map inside the right half toggles P2 as well (~100.0%).
    await pressMap(220, 170);
    expect(screen.getByTestId('field-survey.divide-apply')).toHaveTextContent('Apply (2)');
    expect(areaText()).toMatch(/m² selected \(100\.0%\)/);

    // Deselect P2 so only P1 (~50%) is applied.
    await fireEvent.press(screen.getByTestId('field-survey.divide-piece.P2'));
    expect(screen.getByTestId('field-survey.divide-apply')).toHaveTextContent('Apply (1)');

    await fireEvent.press(screen.getByTestId('field-survey.divide-apply'));

    await waitFor(() => expect(screen.getByTestId('field-survey.feedback')).toHaveTextContent(FIELD_SURVEY_COPY.divideApplied(1)));
    expect(screen.getByTestId('field-survey.feedback').props.accessibilityValue).toEqual({ text: 'tone=success' });
    expect(areaText()).toMatch(/m² affected \(50\.0%\)/);
    expect(screen.getByTestId('field-survey.area-chip.0')).toBeTruthy();
    await waitFor(() => expect(submitDisabled()).toBe(false));

    // Autosave persists 1 polygon + 1 waypoint set without altering the 4 whole-plot vertices.
    const saved = mockSaveDraft.mock.lastCall?.[1];
    expect(saved?.waypoints).toHaveLength(4);
    expect(saved?.affectedAreaPolygons).toHaveLength(1);
    expect(saved?.affectedAreaWaypoints).toHaveLength(1);

    // 1-tap Undo in Affected area mode removes the applied subdivision while keeping the plot untouched.
    await fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.undo));
    await waitFor(() => expect(screen.queryByTestId('field-survey.area-chip.0')).toBeNull());
    expect(areaText()).not.toContain('affected');
    const afterUndo = mockSaveDraft.mock.lastCall?.[1];
    expect(afterUndo?.waypoints).toHaveLength(4);
    expect(afterUndo?.affectedAreaPolygons).toEqual([]);
  });

  it('supports Add cut for 4 quadrants, midpoint bend handles, Clear, and Cancel without committing edits', async () => {
    await renderWithGestures(<FieldSurveyScreen />);
    await waitFor(() => expect(mockListSurveys).toHaveBeenCalled());
    await drawSquarePlot();

    await fireEvent.press(screen.getByTestId('field-survey.target-affected'));
    await fireEvent.press(screen.getByTestId('field-survey.divide-plot'));

    // Cut 1: vertical split using map tap + Cut at + (center is 180, 190).
    await pressMap(180, 80);
    await fireEvent.press(screen.getByTestId('field-survey.add-center'));
    await waitFor(() => expect(screen.getByTestId('field-survey.divide-piece.P2')).toBeTruthy());

    // Bend handle exists on segment 0 of cut 0; tapping it inserts a midpoint vertex (index 1) and pushes endpoint to index 2.
    expect(screen.queryByTestId('field-survey.divide-handle.0.2')).toBeNull();
    await fireEvent.press(screen.getByTestId('field-survey.divide-bend.0.0'));
    await waitFor(() => expect(screen.getByTestId('field-survey.divide-handle.0.2')).toBeTruthy());

    // Dragging the inserted bend handle sideways changes the live piece shares away from 50.0% / 50.0%.
    await fireEvent.press(screen.getByTestId('field-survey.divide-piece.P1'));
    expect(areaText()).toMatch(/m² selected \(50\.0%\)/);
    const bendDrag = createGestureController(getByGestureTestId('field-survey.divide-handle.0.1.drag'));
    await act(async () => {
      bendDrag.begin();
      bendDrag.activate();
      bendDrag.update({ translationX: 40, translationY: 0 });
      bendDrag.end();
    });
    expect(areaText()).not.toMatch(/m² selected \(50\.0%\)/);

    // Add cut 2 (horizontal across center) -> 4 quadrants (~25% each after straightening or 4 bent regions summing to 100%).
    await fireEvent.press(screen.getByTestId('field-survey.divide-add-cut'));
    expect(screen.getByTestId('field-survey.feedback')).toHaveTextContent(FIELD_SURVEY_COPY.divideAddCutPrompt);
    expect(screen.getByTestId('field-survey.add-center')).toHaveTextContent(FIELD_SURVEY_COPY.divideAddAtCenter);

    await pressMap(80, 170);
    await pressMap(280, 170);
    await waitFor(() => expect(screen.getByTestId('field-survey.divide-piece.P4')).toBeTruthy());
    expect(screen.getByTestId('field-survey.feedback')).toHaveTextContent(FIELD_SURVEY_COPY.dividePiecesReady(4));

    // Selecting all 4 pieces covers 100.0% of the plot.
    await fireEvent.press(screen.getByTestId('field-survey.divide-piece.P1'));
    await fireEvent.press(screen.getByTestId('field-survey.divide-piece.P2'));
    await fireEvent.press(screen.getByTestId('field-survey.divide-piece.P3'));
    await fireEvent.press(screen.getByTestId('field-survey.divide-piece.P4'));
    expect(areaText()).toMatch(/m² selected \(100\.0%\)/);

    // Clear resets all cuts and pieces.
    await fireEvent.press(screen.getByTestId('field-survey.divide-clear'));
    expect(screen.queryByTestId('field-survey.divide-piece.P1')).toBeNull();
    expect(screen.getByTestId('field-survey.tool-state').props.accessibilityValue.text).toBe('tool=divide.draw');

    // Cancel exits subdivision cleanly with zero affected areas committed.
    const savesBeforeCancel = mockSaveDraft.mock.calls.length;
    await fireEvent.press(screen.getByTestId('field-survey.divide-cancel'));
    expect(screen.queryByTestId('field-survey.divide-actions')).toBeNull();
    expect(screen.getByTestId('field-survey.divide-plot')).toBeTruthy();
    expect(mockSaveDraft.mock.calls.length).toBe(savesBeforeCancel);
  });

  it('guards against incomplete plots, open manual affected areas, and non-splitting cuts', async () => {
    await renderWithGestures(<FieldSurveyScreen />);
    await waitFor(() => expect(mockListSurveys).toHaveBeenCalled());

    // Empty plot: Divide plot and Whole plot (100%) warn cleanly.
    await fireEvent.press(screen.getByTestId('field-survey.target-affected'));
    await fireEvent.press(screen.getByTestId('field-survey.divide-plot'));
    expect(screen.getByTestId('field-survey.feedback')).toHaveTextContent(FIELD_SURVEY_COPY.plotRequiredForAffected);
    expect(screen.queryByTestId('field-survey.divide-actions')).toBeNull();

    await fireEvent.press(screen.getByTestId('field-survey.whole-plot-affected'));
    expect(screen.getByTestId('field-survey.feedback')).toHaveTextContent(FIELD_SURVEY_COPY.plotRequiredForAffected);

    // Draw a valid plot, then start an open manual affected area.
    await fireEvent.press(screen.getByTestId('field-survey.target-plot'));
    await drawSquarePlot();
    await fireEvent.press(screen.getByTestId('field-survey.target-affected'));
    await pressMap(140, 140);
    await pressMap(180, 140);

    // Divide plot refuses while open affected waypoints exist.
    await fireEvent.press(screen.getByTestId('field-survey.divide-plot'));
    expect(screen.getByTestId('field-survey.feedback')).toHaveTextContent(FIELD_SURVEY_COPY.divideCloseOpenFirst);
    expect(screen.queryByTestId('field-survey.divide-actions')).toBeNull();

    // Undo the 2 open points, enter Divide plot, and place a cut completely outside the plot.
    await fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.undo));
    await fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.undo));
    await fireEvent.press(screen.getByTestId('field-survey.divide-plot'));
    await pressMap(15, 15);
    await pressMap(60, 15);

    expect(screen.getByTestId('field-survey.feedback').props.accessibilityValue).toEqual({ text: 'tone=warning' });
    expect(screen.getByTestId('field-survey.feedback')).toHaveTextContent(/did not split/);
    expect(screen.getByTestId('field-survey.divide-apply')).toBeDisabled();

    // Tapping 2 valid points across the plot recovers immediately without needing Clear.
    await pressMap(180, 80);
    await pressMap(180, 260);
    await waitFor(() => expect(screen.getByTestId('field-survey.divide-piece.P1')).toBeTruthy());
  });

  it('coexists with manual Tap drawing and deduplicates overlapping affected areas', async () => {
    await renderWithGestures(<FieldSurveyScreen />);
    await waitFor(() => expect(mockListSurveys).toHaveBeenCalled());
    await drawSquarePlot();

    // Manually draw an affected area inside the left half of the plot.
    await fireEvent.press(screen.getByTestId('field-survey.target-affected'));
    await pressMap(110, 120);
    await pressMap(170, 120);
    await pressMap(170, 220);
    await pressMap(110, 220);
    await fireEvent.press(screen.getByTestId('field-survey.finish-area'));
    await waitFor(() => expect(affectedSqmFromReadout()).toBeGreaterThan(0));
    const manualArea = affectedSqmFromReadout();

    // Now use Divide plot to select the entire left half (which fully covers the manual area).
    await fireEvent.press(screen.getByTestId('field-survey.divide-plot'));
    await pressMap(180, 80);
    await pressMap(180, 260);
    await waitFor(() => expect(screen.getByTestId('field-survey.divide-piece.P1')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('field-survey.divide-piece.P1'));
    await fireEvent.press(screen.getByTestId('field-survey.divide-apply'));

    await waitFor(() => expect(screen.getByTestId('field-survey.area-chip.1')).toBeTruthy());
    // Union of the left half (~50%) and the smaller manual polygon inside it must equal ~50%, never double-counted.
    expect(areaText()).toMatch(/m² affected \(50\.0%\)/);
    expect(affectedSqmFromReadout()).toBeGreaterThan(manualArea);
  });

  it('marks Whole plot (100%) in 1 tap, replaces prior areas atomically with 1-tap Undo, and stays idempotent', async () => {
    mockListSurveys.mockReturnValue([surveyRow()]);
    await renderWithGestures(<FieldSurveyScreen />);
    await waitFor(() => expect(screen.getByTestId('field-survey.point.plot.0')).toBeTruthy());

    // First confirm zero affected area on Whole plot tab, then switch to Affected area and tap Whole plot (100%).
    await fireEvent.press(screen.getByTestId('field-survey.no-affected.action'));
    await waitFor(() => expect(areaText()).toContain(FIELD_SURVEY_COPY.noAffectedFoundReadout));

    await fireEvent.press(screen.getByTestId('field-survey.target-affected'));
    await fireEvent.press(screen.getByTestId('field-survey.whole-plot-affected'));

    await waitFor(() => expect(screen.getByTestId('field-survey.feedback')).toHaveTextContent(FIELD_SURVEY_COPY.wholePlotMarked));
    expect(areaText()).toMatch(/m² affected \(100\.0%\)/);
    expect(screen.getByTestId('field-survey.whole-plot-affected').props.accessibilityState.selected).toBe(true);

    // Preserves plot GPS provenance and clears affectedZeroConfirmed.
    const savedWhole = mockSaveDraft.mock.lastCall?.[1];
    expect(savedWhole?.affectedZeroConfirmed).toBe(false);
    expect(savedWhole?.affectedAreaPolygons).toHaveLength(1);
    expect(savedWhole?.affectedAreaWaypoints?.[0]?.every((pt) => pt.source === 'gps')).toBe(true);

    // Tapping Whole plot (100%) a second time is idempotent.
    await fireEvent.press(screen.getByTestId('field-survey.whole-plot-affected'));
    expect(screen.getByTestId('field-survey.feedback')).toHaveTextContent(FIELD_SURVEY_COPY.wholePlotAlreadyMarked);
    expect(screen.getByTestId('field-survey.feedback').props.accessibilityValue).toEqual({ text: 'tone=info' });

    // Undo restores empty affected areas, then add an open affected point and tap Whole plot (100%) to verify D2-A replace + Undo.
    await fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.undo));
    await waitFor(() => expect(screen.queryByTestId('field-survey.area-chip.0')).toBeNull());

    await pressMap(180, 180);
    await waitFor(() => expect(screen.getByTestId('field-survey.point.active.0')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('field-survey.whole-plot-affected'));
    await waitFor(() => expect(screen.getByTestId('field-survey.feedback')).toHaveTextContent(FIELD_SURVEY_COPY.wholePlotReplaced));
    expect(screen.queryByTestId('field-survey.point.active.0')).toBeNull();
    expect(areaText()).toMatch(/m² affected \(100\.0%\)/);

    // 1-tap Undo restores the open affected point cleanly.
    await fireEvent.press(screen.getByText(FIELD_SURVEY_COPY.undo));
    await waitFor(() => expect(screen.getByTestId('field-survey.point.active.0')).toBeTruthy());
  });

  it('surfaces Whole plot (100%) domain errors (e.g. 1,500-point budget) and exits subdivision when tapping Tap', async () => {
    mockListSurveys.mockReturnValue([surveyRow()]);
    await renderWithGestures(<FieldSurveyScreen />);
    await waitFor(() => expect(areaText()).toMatch(/ha ·/));

    const spy = jest.spyOn(plotSubdivision, 'applyWholePlotAffected').mockReturnValueOnce({
      ok: false,
      message: 'This plot has 1,501 points, which exceeds the 1,500-point limit for affected areas.',
    });
    try {
      await fireEvent.press(screen.getByTestId('field-survey.target-affected'));
      await fireEvent.press(screen.getByTestId('field-survey.whole-plot-affected'));

      const dangerPill = await screen.findByTestId('field-survey.feedback');
      expect(dangerPill.props.accessibilityValue).toEqual({ text: 'tone=danger' });
      expect(dangerPill).toHaveTextContent(/1,500-point limit/);
    } finally {
      spy.mockRestore();
    }

    // Entering Divide plot and tapping the Tap button on the map exits subdivision cleanly.
    await fireEvent.press(screen.getByTestId('field-survey.divide-plot'));
    expect(screen.getByTestId('field-survey.divide-actions')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('field-survey.tap'));
    expect(screen.queryByTestId('field-survey.divide-actions')).toBeNull();
    expect(screen.getByTestId('field-survey.divide-plot')).toBeTruthy();
  });

  it('allows subdividing or marking Whole plot (100%) immediately after cloning a completed plot', async () => {
    mockListSurveys.mockReturnValue([
      surveyRow({
        status: 'pending',
        remoteId: 'remote-77',
      }),
    ]);

    await renderWithGestures(<FieldSurveyScreen />);
    await waitFor(() => expect(screen.getByTestId('field-survey.measure-affected-from-plot.action')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('field-survey.measure-affected-from-plot.action'));
    await waitFor(() => expect(screen.getByTestId('field-survey.whole-plot-affected')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('field-survey.whole-plot-affected'));
    await waitFor(() => expect(areaText()).toMatch(/m² affected \(100\.0%\)/));

    const savedClone = mockSaveDraft.mock.lastCall?.[1];
    expect(savedClone?.clientUuid).not.toBe('3f1de2d8-2ca9-4c26-9e37-2f4c5f6f7a01');
    expect(savedClone?.outlineFromRemoteId).toBe('remote-77');
    expect(savedClone?.affectedAreaPolygons).toHaveLength(1);
  });

  it('works identically in expanded full-screen map mode', async () => {
    await renderWithGestures(<FieldSurveyScreen />);
    await waitFor(() => expect(mockListSurveys).toHaveBeenCalled());
    await drawSquarePlot();

    // Expand full-screen map (ActionDock hidden).
    await fireEvent.press(screen.getByTestId('field-survey.expand'));
    expect(screen.getByTestId('field-survey.map-section').props.accessibilityValue).toEqual({ text: 'expanded=yes' });
    expect(screen.queryByTestId('action-dock')).toBeNull();

    await fireEvent.press(screen.getByTestId('field-survey.target-affected'));
    await fireEvent.press(screen.getByTestId('field-survey.divide-plot'));
    await pressMap(180, 80);
    await pressMap(180, 260);
    await waitFor(() => expect(screen.getByTestId('field-survey.divide-piece.P1')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('field-survey.divide-piece.P1'));
    expect(areaText()).toMatch(/m² selected \(50\.0%\)/);

    await fireEvent.press(screen.getByTestId('field-survey.divide-apply'));
    await waitFor(() => expect(areaText()).toMatch(/m² affected \(50\.0%\)/));
    expect(screen.getByTestId('field-survey.feedback')).toHaveTextContent(FIELD_SURVEY_COPY.divideApplied(1));
  });
});
