import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import AnalysisResultScreen from '@/app/analysis-result';
import { ToastProvider } from '@/components/ui/Toast';
import { FARMER_COPY } from '@/constants/copy';
import {
  ScanDraftContext,
  ScanSessionContext,
} from '@/features/detection/context/ScanSessionProvider';
import { initialScanSessionState } from '@/features/detection/context/scanSessionReducer';
import type { ScanSessionAction, ScanSessionState } from '@/features/detection/types';

const ORIGINAL_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const mockDispatch = jest.fn<void, [ScanSessionAction]>();
const mockSave = jest.fn(async () => ({ id: 'new-record' }));
let mockSaveState: Record<string, unknown>;

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: { role: 'farmer', uuid: 'user-1' } }),
}));
jest.mock('@/features/records/hooks/useSaveCompletedScan', () => ({
  useSaveCompletedScan: () => mockSaveState,
}));
jest.mock('@/features/records/hooks/useRecords', () => ({
  useScanRecordDetails: () => ({
    data: {
      id: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
      managedImageUri: 'file:///original.jpg',
      predictedLabel: 'rust',
      createdAt: '2026-10-01T02:00:00.000Z',
    },
    errorMessage: null,
    loading: false,
    refresh: jest.fn(),
  }),
}));
jest.mock('@/providers/LanguagePreferenceProvider', () => ({
  useFarmerCopy: () => jest.requireActual('@/constants/copy').FARMER_COPY.en,
}));

const COPY = FARMER_COPY.en.checkAgain;
const DRAFT = {
  discardSavedDraft: jest.fn(async () => true),
  draftSavedAt: null,
  draftStatus: 'idle' as const,
  finalizeSavedDraft: jest.fn(),
  flushSavedDraft: jest.fn(async () => true),
  isOwnerCurrent: jest.fn(() => true),
  ownerIdentity: null,
};

function followUpState(overrides: Partial<ScanSessionState> = {}): ScanSessionState {
  return {
    ...initialScanSessionState,
    sourceUri: 'file:///new.jpg',
    sourceType: 'camera',
    status: 'completed',
    followUpOf: ORIGINAL_ID,
    result: {
      predictedLabel: 'healthy',
      confidence: 0.9,
      scores: [
        { label: 'healthy', score: 0.9 },
        { label: 'mosaic', score: 0.05 },
        { label: 'rust', score: 0.03 },
        { label: 'smut', score: 0.02 },
      ],
      timings: { preprocessMs: 1, inferenceMs: 1, totalMs: 2 },
      modelVersion: 'v1.0-mobilenetv2',
    },
    ...overrides,
  };
}

async function renderResult(state: ScanSessionState) {
  return render(
    <ToastProvider>
      <ScanSessionContext.Provider value={{ state, dispatch: mockDispatch }}>
        <ScanDraftContext.Provider value={DRAFT}>
          <AnalysisResultScreen />
        </ScanDraftContext.Provider>
      </ScanSessionContext.Provider>
    </ToastProvider>,
  );
}

describe('AnalysisResultScreen Check Again', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockSave.mockClear();
    mockSaveState = {
      status: 'ready',
      error: null,
      errorMessage: null,
      getLastError: () => null,
      recordId: null,
      save: mockSave,
    };
  });

  it('shows both photos with their own dates and Possible Condition lines, and no verdict', async () => {
    await renderResult(followUpState());

    expect(screen.getByTestId('scan.follow-up.original-image')).toBeTruthy();
    expect(screen.getByTestId('scan.follow-up.new-image')).toBeTruthy();
    expect(screen.getByText(`${COPY.possibleCondition}: Rust`)).toBeTruthy();
    expect(
      screen.getAllByText(`${COPY.possibleCondition}: No supported disease detected`).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Oct 1, 2026/)).toBeTruthy();
    expect(screen.getByText(COPY.noteLabel)).toBeTruthy();
    expect(screen.getByText(COPY.saveFollowUp)).toBeTruthy();

    // No percentage, score comparison, or better/worse claim anywhere.
    expect(screen.queryByText(/%/)).toBeNull();
    expect(screen.queryByText(/\b(better|worse|improved|worsened)\b/i)).toBeNull();
  });

  it('keeps what the farmer writes and saves the follow-up through the normal save path', async () => {
    await renderResult(followUpState());

    await fireEvent.changeText(screen.getByTestId('scan.follow-up.note'), 'Edges look drier.');
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_PERSONAL_NOTE',
      payload: 'Edges look drier.',
    });

    await fireEvent.press(screen.getByTestId('scan.save-follow-up'));
    await waitFor(() =>
      expect(screen.getByTestId('app-toast')).toHaveTextContent('Scan saved'),
    );
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it('shows the ordinary result screen when the scan is not a follow-up', async () => {
    await renderResult(followUpState({ followUpOf: null }));
    expect(screen.queryByTestId('scan.follow-up')).toBeNull();
    expect(screen.queryByTestId('scan.save-follow-up')).toBeNull();
  });
});

describe('AnalysisResultScreen What now? card', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockSave.mockClear();
    mockSaveState = {
      status: 'ready',
      error: null,
      errorMessage: null,
      getLastError: () => null,
      recordId: null,
      save: mockSave,
    };
  });

  // Proves: the farmer result screen shows the What now? card with Save Scan, and Save Scan uses the normal save path.
  it('shows the card to a farmer and saves through it', async () => {
    await renderResult(followUpState({ followUpOf: null }));
    expect(screen.getByTestId('scan.what-now')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('scan.what-now.save'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
  });

  // Proves: once saved, the card offers Check again, linked to the first check of this plant.
  it('starts a follow-up from the card after saving', async () => {
    mockSaveState = { ...mockSaveState, status: 'saved', recordId: 'new-record' };
    await renderResult(followUpState({ followUpOf: null }));
    await fireEvent.press(screen.getByTestId('records.check-again'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'START_FOLLOW_UP',
      payload: { scanId: 'new-record' },
    });
  });
});
