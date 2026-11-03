import { fireEvent, render, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import RecordDetailsScreen from '@/app/record-details';
import { ToastProvider } from '@/components/ui/Toast';
import { FARMER_COPY } from '@/constants/copy';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type {
  ScanCheckHistoryItem,
  ScanRecordDetails,
} from '@/features/records/domain/recordTypes';

const ORIGINAL_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const FOLLOW_UP_ID = 'c863a5af-e9ad-44fe-a0dc-73f9d3436cac';
const mockDispatch = jest.fn();
let mockDetails: Partial<ScanRecordDetails>;
let mockHistory: ScanCheckHistoryItem[];

jest.mock('@/database/DatabaseProvider', () => ({ useCaneGuardDatabase: () => ({}) }));
jest.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/records/hooks/useRecords', () => ({
  useScanRecordDetails: () => ({
    data: mockDetails,
    errorMessage: null,
    loading: false,
    refresh: jest.fn(),
  }),
  useScanCheckHistory: () => mockHistory,
}));
jest.mock('@/features/reports/hooks/useFieldReportDraft', () => ({
  useFieldReportForScan: () => ({
    data: null,
    errorMessage: null,
    hasOtherOwnerReport: false,
    loading: false,
    refresh: jest.fn(),
  }),
}));
jest.mock('@/features/sync/hooks/useSync', () => ({
  useSync: () => ({ isOnline: true, isSyncing: false, retryReport: jest.fn() }),
}));
jest.mock('@/features/detection/context/useScanSession', () => ({
  useScanSession: () => ({ dispatch: mockDispatch, state: {} }),
}));
jest.mock('@/providers/LanguagePreferenceProvider', () => ({
  useFarmerCopy: () => jest.requireActual('@/constants/copy').FARMER_COPY.en,
}));

const COPY = FARMER_COPY.en.checkAgain;

function details(id: string, followsUpScanId: string | null): Partial<ScanRecordDetails> {
  return {
    id,
    followsUpScanId,
    authorityReview: null,
    hasLinkedFieldReport: false,
    ownerIdentity: 'user-1',
    managedImageUri: `file:///${id}.jpg`,
    predictedLabel: 'rust',
    confidence: 0.8,
    barangay: null,
    syncStatus: 'local_only',
    createdAt: '2026-10-01T02:00:00.000Z',
    checklistConsistency: 'consistent',
    reportedSeverity: null,
    decisionSupportWording: 'Possible result only.',
    symptoms: [],
    qualityWarnings: [],
    classScores: [],
    lastSyncErrorCode: null,
    lastSyncedAt: null,
  };
}

function historyItem(id: string, createdAt: string, isOriginal: boolean, note: string | null) {
  return {
    id,
    createdAt,
    isOriginal,
    managedImageUri: `file:///${id}.jpg`,
    personalNote: note,
    predictedLabel: 'rust',
  };
}

async function renderAs(role: 'farmer' | 'field_reporter') {
  jest.mocked(useAuth).mockReturnValue({ user: { uuid: 'user-1', role } } as never);
  return render(
    <ToastProvider>
      <RecordDetailsScreen />
    </ToastProvider>,
  );
}

describe('RecordDetailsScreen Check Again', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    (router.dismissTo as jest.Mock).mockClear();
    jest.mocked(useLocalSearchParams).mockReturnValue({ id: ORIGINAL_ID });
    mockDetails = details(ORIGINAL_ID, null);
    mockHistory = [historyItem(ORIGINAL_ID, '2026-10-01T02:00:00.000Z', true, null)];
  });

  it('offers Check Again to a farmer and starts a follow-up of the original', async () => {
    await renderAs('farmer');
    await fireEvent.press(screen.getByTestId('records.check-again'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'START_FOLLOW_UP',
      payload: { scanId: ORIGINAL_ID },
    });
    expect(router.dismissTo).toHaveBeenCalledWith('/scan');
  });

  it('starts from the first check even when a later follow-up is open', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ id: FOLLOW_UP_ID });
    mockDetails = details(FOLLOW_UP_ID, ORIGINAL_ID);
    await renderAs('farmer');
    await fireEvent.press(screen.getByTestId('records.check-again'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'START_FOLLOW_UP',
      payload: { scanId: ORIGINAL_ID },
    });
  });

  it('does not offer Check Again to an inspector', async () => {
    await renderAs('field_reporter');
    expect(screen.queryByTestId('records.check-again')).toBeNull();
    expect(screen.queryByTestId('records.check-history')).toBeNull();
  });

  it('keeps a note visible when deleting the first check left it alone in the history', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ id: FOLLOW_UP_ID });
    mockDetails = { ...details(FOLLOW_UP_ID, null), personalNote: 'Tips look yellow.' };
    mockHistory = [
      historyItem(FOLLOW_UP_ID, '2026-10-15T02:00:00.000Z', true, 'Tips look yellow.'),
    ];

    await renderAs('farmer');

    expect(screen.getByTestId('records.check-history')).toBeTruthy();
    expect(screen.getByText('Tips look yellow.')).toBeTruthy();
  });

  it('leaves a lone check without a note out of the history view', async () => {
    await renderAs('farmer');

    expect(screen.queryByTestId('records.check-history')).toBeNull();
  });

  it('lists the checks in the order given, with notes, and no trend or percentage text', async () => {
    mockHistory = [
      historyItem(ORIGINAL_ID, '2026-10-01T02:00:00.000Z', true, null),
      historyItem(FOLLOW_UP_ID, '2026-10-15T02:00:00.000Z', false, 'Tips look yellow.'),
    ];
    await renderAs('farmer');

    expect(screen.getByTestId('records.check-history')).toBeTruthy();
    expect(screen.getByText(COPY.firstCheck, { exact: false })).toBeTruthy();
    expect(screen.getByText('Tips look yellow.')).toBeTruthy();
    const dates = screen.getAllByText(/2026/).map((node) => node.props.children as string);
    expect(dates.findIndex((d) => d.includes('Oct 1,'))).toBeLessThan(
      dates.findIndex((d) => d.includes('Oct 15,')),
    );
    expect(screen.queryByText(/%/)).toBeNull();
    expect(screen.queryByText(/\b(better|worse|improved|worsened)\b/i)).toBeNull();
  });
});
