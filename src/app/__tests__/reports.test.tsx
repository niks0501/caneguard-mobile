import { render, screen } from '@testing-library/react-native';

import ReportsScreen from '@/app/reports';

jest.mock('@/features/records/hooks/useRecords', () => ({
  usePaginatedScanRecords: jest.fn(() => ({
    data: [],
    errorMessage: null,
    hasMore: false,
    loading: false,
    loadingMore: false,
    loadMore: jest.fn(async () => undefined),
    refresh: jest.fn(async () => undefined),
  })),
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
jest.mock('@/features/notifications/hooks/useNotificationDestinations', () => ({
  useNotificationDestinations: () => new Map(),
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
    refresh: jest.fn(async () => undefined),
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

describe('legacy reports route', () => {
  it('keeps old reports links on Activity instead of local analytics', async () => {
    await render(<ReportsScreen />);

    expect(screen.getByTestId('activity.screen')).toBeOnTheScreen();
    expect(screen.getByRole('header')).toHaveTextContent('Activity');
    expect(screen.getByText('All')).toBeOnTheScreen();
    expect(screen.getByText('Reports')).toBeOnTheScreen();
    expect(screen.getByText('Scans')).toBeOnTheScreen();
    expect(screen.queryByText('LOCAL SUMMARY')).not.toBeOnTheScreen();
  });
});
