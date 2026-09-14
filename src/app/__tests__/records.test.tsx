import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import RecordsScreen from '@/app/records';
import type { ScanRecordListItem } from '@/features/records/domain/recordTypes';
import { usePaginatedScanRecords } from '@/features/records/hooks/useRecords';

const mockRefresh = jest.fn(async () => undefined);
const mockLoadMore = jest.fn(async () => undefined);
let mockRecordsState: ReturnType<typeof usePaginatedScanRecords> = {
  data: [],
  errorMessage: null,
  hasMore: false,
  loading: false,
  loadingMore: false,
  loadMore: mockLoadMore,
  refresh: mockRefresh,
};

jest.mock('@/features/records/hooks/useRecords', () => ({
  usePaginatedScanRecords: jest.fn(() => mockRecordsState),
}));
jest.mock('@/features/assignments/hooks/useFieldValidationAssignments', () => ({
  useFieldValidationAssignments: () => ({
    assignments: [],
    capabilityUnavailable: false,
    errorMessage: null,
    lastSuccessfulAt: null,
    refreshing: false,
    refresh: jest.fn(async () => undefined),
    sessionKey: 'test-session',
  }),
}));
jest.mock('@/features/notifications/hooks/useMobileNotifications', () => ({
  useMobileNotifications: () => ({
    capabilityUnavailable: false,
    errorMessage: null,
    lastSuccessfulAt: null,
    notifications: [],
    refreshing: false,
    refresh: jest.fn(async () => undefined),
    sessionKey: 'test-session',
    unreadCount: 0,
  }),
}));
jest.mock('@/features/reports/hooks/useAuthorityReviewStatus', () => ({
  useAuthorityReviewStatus: () => ({
    capabilityUnavailable: false,
    errorMessage: null,
    lastSuccessfulAt: null,
    refreshing: false,
    refresh: mockRefresh,
  }),
}));
jest.mock('@/features/sync/hooks/useSync', () => ({
  useSync: () => ({
    apiReachability: 'available',
    errorMessage: null,
    isOnline: true,
    isSyncing: false,
    lastSuccessfulSyncAt: null,
    pendingCount: 0,
    syncNow: jest.fn(async () => null),
  }),
}));

const mockUsePaginatedScanRecords = jest.mocked(usePaginatedScanRecords);
const mockRouterPush = router.push as jest.Mock;
const RECORD: ScanRecordListItem = {
  authorityReview: null,
  id: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
  managedImageUri: 'file:///documents/caneguard/scan-images/record.jpg',
  predictedLabel: 'rust',
  confidence: 0.82,
  barangay: null,
  syncStatus: 'pending',
  createdAt: '2026-07-25T05:30:00.000Z',
  hasFieldReport: false,
};

describe('legacy records route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRecordsState = {
      data: [],
      errorMessage: null,
      hasMore: false,
      loading: false,
      loadingMore: false,
      loadMore: mockLoadMore,
      refresh: mockRefresh,
    };
  });

  it('keeps old records links on Activity and retains scan discovery', async () => {
    mockRecordsState = { ...mockRecordsState, data: [RECORD] };
    await render(<RecordsScreen />);

    expect(screen.getByTestId('activity.screen')).toBeOnTheScreen();
    expect(screen.getByRole('header')).toHaveTextContent('Activity');
    expect(screen.getByLabelText('Scan activity')).toBeOnTheScreen();
    expect(screen.getByText('Waiting to sync')).toBeOnTheScreen();

    await fireEvent.press(
      screen.getByLabelText(/Open Possible Condition: Rust scan saved/),
    );
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/record-details',
      params: { id: RECORD.id },
    });
  });

  it('retains the Activity filter contract through the old route', async () => {
    await render(<RecordsScreen />);

    for (const label of ['All', 'Reports', 'Scans']) {
      expect(screen.getByText(label)).toBeOnTheScreen();
    }
    expect(screen.queryByText('Healthy')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('activity.filter.reports'));
    expect(mockUsePaginatedScanRecords).toHaveBeenLastCalledWith(
      { hasFieldReport: true, search: undefined },
      25,
    );
  });
});
