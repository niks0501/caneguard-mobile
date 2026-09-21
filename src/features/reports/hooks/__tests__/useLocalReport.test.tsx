import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { getLocalReportSummary } from '@/features/reports/data/reportRepository';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';
import { useLocalReport } from '@/features/reports/hooks/useLocalReport';
import type { LocalReportSummary } from '@/features/records/domain/recordTypes';

const DATABASE = {};
const SUBMITTER_A = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const SUBMITTER_B = '51214146-7439-48e0-aef4-d0e003f194b4';
let mockFocusCallback: (() => void) | null = null;
let mockUser: { uuid: string } | null = { uuid: SUBMITTER_A };

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    mockFocusCallback = callback;
  },
}));
jest.mock('@/database/DatabaseProvider', () => ({
  useCaneGuardDatabase: () => DATABASE,
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@/features/reports/data/reportRepository', () => ({
  getLocalReportSummary: jest.fn(),
}));

const mockGetLocalReportSummary = jest.mocked(getLocalReportSummary);

function summary(recordId: string): LocalReportSummary {
  return {
    healthyPredictions: 0,
    lowScorePredictions: 0,
    pendingSyncRecords: 0,
    possibleDiseasePredictions: 1,
    recordsByLabel: [{ label: 'rust', count: 1 }],
    recentRecords: [
      {
        authorityReview: null,
        id: recordId,
        managedImageUri: `file:///documents/${recordId}.jpg`,
        predictedLabel: 'rust',
        confidence: 0.8,
        barangay: null,
        syncStatus: 'local_only',
        createdAt: '2026-08-10T01:00:00.000Z',
      },
    ],
    totalSavedScans: 1,
  };
}

describe('useLocalReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFocusCallback = null;
    mockUser = { uuid: SUBMITTER_A };
    jest.mocked(useAuth).mockImplementation(() => ({ user: mockUser }) as never);
  });

  it('refreshes the summary after persisted records change', async () => {
    mockGetLocalReportSummary
      .mockResolvedValueOnce(summary('record-a'))
      .mockResolvedValueOnce(summary('record-b'));

    const { result } = await renderHook(() => useLocalReport());
    await act(async () => {
      mockFocusCallback?.();
    });
    await waitFor(() => expect(result.current.data?.recentRecords[0]?.id).toBe('record-a'));

    await act(async () => {
      emitSyncRecordsChanged();
    });
    await waitFor(() => expect(result.current.data?.recentRecords[0]?.id).toBe('record-b'));
    expect(mockGetLocalReportSummary).toHaveBeenCalledTimes(2);
  });

  it('does not apply a prior submitter summary after the session changes', async () => {
    let resolveA!: (value: LocalReportSummary) => void;
    mockGetLocalReportSummary.mockImplementation((_database, submitterIdentity) => {
      if (submitterIdentity === SUBMITTER_A) {
        return new Promise((resolve) => {
          resolveA = resolve;
        });
      }
      return Promise.resolve(summary('record-b'));
    });

    const { result, rerender } = await renderHook(() => useLocalReport());
    await act(async () => {
      mockFocusCallback?.();
    });
    await waitFor(() =>
      expect(mockGetLocalReportSummary).toHaveBeenCalledWith(
        DATABASE,
        SUBMITTER_A,
        { dateRange: undefined },
      ),
    );

    mockUser = { uuid: SUBMITTER_B };
    await rerender(undefined);
    await act(async () => {
      mockFocusCallback?.();
    });
    await waitFor(() =>
      expect(result.current.data?.recentRecords[0]?.id).toBe('record-b'),
    );

    await act(async () => {
      resolveA(summary('record-a'));
    });

    expect(result.current.data?.recentRecords[0]?.id).toBe('record-b');
    expect(result.current.loading).toBe(false);
  });
});
