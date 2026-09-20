import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import ActivityScreen from '@/app/activity';
import type { ScanRecordListItem } from '@/features/records/domain/recordTypes';
import { useFieldValidationAssignments } from '@/features/assignments/hooks/useFieldValidationAssignments';
import { useMobileNotifications } from '@/features/notifications/hooks/useMobileNotifications';
import { usePaginatedScanRecords } from '@/features/records/hooks/useRecords';
import type { NotificationDestination } from '@/features/notifications/services/resolveNotificationDestination';

const mockRefresh = jest.fn(async () => true);
const mockLoadMore = jest.fn(async () => true);
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
const mockRefreshAssignments = jest.fn(async () => true);
let mockAssignmentsState: ReturnType<typeof useFieldValidationAssignments> = {
  assignments: [],
  capabilityUnavailable: false,
  errorMessage: null,
  lastSuccessfulAt: null,
  refreshing: false,
  refresh: mockRefreshAssignments,
  sessionKey: 'session-1',
};
jest.mock('@/features/assignments/hooks/useFieldValidationAssignments', () => ({
  useFieldValidationAssignments: jest.fn(() => mockAssignmentsState),
}));
const mockRefreshNotifications = jest.fn(async () => true);
const mockMarkRead = jest.fn(async () => undefined);
const mockMarkAllRead = jest.fn(async () => undefined);
let mockNotificationsState: ReturnType<typeof useMobileNotifications> = {
  capabilityUnavailable: false,
  errorMessage: null,
  lastSuccessfulAt: null,
  markAllRead: mockMarkAllRead,
  markRead: mockMarkRead,
  notifications: [],
  readActionError: null,
  refreshing: false,
  refresh: mockRefreshNotifications,
  sessionKey: 'session-1',
  unreadCount: 0,
};
jest.mock('@/features/notifications/hooks/useMobileNotifications', () => ({
  useMobileNotifications: jest.fn(() => mockNotificationsState),
}));
let mockDestinations = new Map<string, NotificationDestination>();
jest.mock('@/features/notifications/hooks/useNotificationDestinations', () => ({
  useNotificationDestinations: jest.fn(() => mockDestinations),
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
    syncNow: jest.fn(async () => ({ failed: 0, authRequired: false } as never)),
  }),
}));

const mockUsePaginatedScanRecords = jest.mocked(usePaginatedScanRecords);
const mockRouterPush = router.push as jest.Mock;
const SCAN: ScanRecordListItem = {
  authorityReview: null,
  barangay: 'Wawa',
  confidence: 0.76,
  createdAt: '2026-07-25T05:30:00.000Z',
  hasFieldReport: false,
  id: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
  managedImageUri: 'file:///documents/caneguard/scan-images/scan.jpg',
  predictedLabel: 'mosaic',
  syncStatus: 'local_only',
};
const ASSIGNMENT = {
  id: '3fbd7f77-7d6b-4eb0-a1c7-b673f5a2f39f',
  ownerIdentity: 'owner-1',
  reportUuid: '7e8c2e48-a2d4-4aca-9a50-9ca460fd7a7f',
  reportClientUuid: 'cf9023da-e23c-43cb-a3ae-08ec6e0f302e',
  referenceCode: 'CG-2026-0001',
  submitter: { uuid: 'submitter-1', name: 'Ana Reporter' },
  assignee: { uuid: 'owner-1', name: 'Mara Reporter' },
  submitterIsAssignee: false,
  targetVisitDate: '2026-08-20',
  fieldValidationState: 'assigned' as const,
  assignedAt: '2026-08-13T12:00:00.000Z',
  updatedAt: '2026-08-13T12:00:00.000Z',
  cachedAt: '2026-08-13T12:05:00.000Z',
  case: {
    barangay: 'Mabini',
    province: 'Negros Occidental',
    municipality: 'Bago',
    farmerOrFarmOwnerName: 'Juan Dela Cruz',
    affectedAreaHectares: 12.5,
    affectedPortionPercent: 42.75,
    capturedAt: '2026-07-20T09:55:00.000Z',
    observedAt: '2026-07-20T09:58:00.000Z',
    submittedAt: '2026-07-20T10:00:00.000Z',
    predictedLabel: 'rust',
    confidence: 0.93,
  },
};
const REPORT: ScanRecordListItem = {
  ...SCAN,
  createdAt: '2026-07-26T05:30:00.000Z',
  hasFieldReport: true,
  id: '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e',
  predictedLabel: 'rust',
  syncStatus: 'synced',
};

const NOTIFICATION = {
  id: '4e04321c-a879-423f-875d-4cdce5e028a6',
  ownerIdentity: 'session-1',
  eventType: 'office_review_completed',
  title: 'Office review completed',
  message: 'CG-2026-0001 was reviewed by the office.',
  caseUuid: '7e8c2e48-a2d4-4aca-9a50-9ca460fd7a7f',
  referenceCode: 'CG-2026-0001',
  assignmentUuid: null,
  content: null,
  advisory: null,
  isRead: false,
  readAt: null,
  createdAt: '2026-08-13T12:00:00.000Z',
  cachedAt: '2026-08-13T12:05:00.000Z',
};

describe('ActivityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDestinations = new Map();
    mockAssignmentsState = {
      ...mockAssignmentsState,
      assignments: [ASSIGNMENT],
    };
    mockNotificationsState = {
      ...mockNotificationsState,
      notifications: [],
      unreadCount: 0,
    };
    mockRecordsState = {
      data: [SCAN, REPORT],
      errorMessage: null,
      hasMore: false,
      loading: false,
      loadingMore: false,
      loadMore: mockLoadMore,
      refresh: mockRefresh,
    };
  });

  it('shows one timeline with All, Reports, Assignments, and Scans filters', async () => {
    await render(<ActivityScreen />);

    expect(screen.getByTestId('activity.screen')).toBeOnTheScreen();
    expect(screen.getByRole('header')).toHaveTextContent('Activity');
    for (const label of ['All', 'Reports', 'Assignments', 'Scans']) {
      expect(screen.getByText(label)).toBeOnTheScreen();
    }
    expect(screen.getByTestId('activity.timeline')).toBeOnTheScreen();
    expect(screen.getByLabelText('Field Report activity')).toBeOnTheScreen();
    expect(screen.getByLabelText('Scan activity')).toBeOnTheScreen();
    expect(screen.getByTestId(`activity.assignment.${ASSIGNMENT.id}`)).toBeOnTheScreen();
    expect(mockUsePaginatedScanRecords).toHaveBeenLastCalledWith(
      { hasFieldReport: undefined, search: undefined },
      25,
    );
  });

  it('keeps office updates behind a dedicated toggle instead of inline on screen', async () => {
    mockNotificationsState = {
      ...mockNotificationsState,
      notifications: [NOTIFICATION],
      unreadCount: 1,
    };
    mockDestinations = new Map([
      [NOTIFICATION.id, { kind: 'assignment', assignmentId: ASSIGNMENT.id }],
    ]);
    await render(<ActivityScreen />);

    expect(screen.queryByTestId('activity.notifications')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('activity.needs-attention')).not.toBeOnTheScreen();
    expect(screen.getByTestId('activity.today-entry')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('activity.notifications-toggle'));

    expect(screen.getByTestId('activity.notifications')).toBeOnTheScreen();
    expect(screen.getByText('Office updates')).toBeOnTheScreen();
    expect(screen.getByText('1 unread item from the office.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Mark all office updates as read'));
    expect(mockMarkAllRead).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByTestId('activity.notifications-toggle'));
    expect(screen.queryByTestId('activity.notifications')).not.toBeOnTheScreen();
  });

  it('acknowledges an unread update without blocking its destination', async () => {
    mockNotificationsState = {
      ...mockNotificationsState,
      notifications: [NOTIFICATION],
      unreadCount: 1,
    };
    mockDestinations = new Map([
      [NOTIFICATION.id, { kind: 'field_report', scanRecordId: SCAN.id }],
    ]);
    await render(<ActivityScreen />);

    await fireEvent.press(screen.getByTestId('activity.notifications-toggle'));
    await fireEvent.press(screen.getByTestId(`activity.notification.${NOTIFICATION.id}`));

    expect(mockMarkRead).toHaveBeenCalledWith(NOTIFICATION.id);
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/field-report',
      params: { scanRecordId: SCAN.id },
    });
  });

  it('runs one Refresh all scope that covers every eligible subsystem once', async () => {
    await render(<ActivityScreen />);

    expect(screen.queryByLabelText('Refresh notifications')).not.toBeOnTheScreen();
    expect(screen.queryByLabelText('Refresh office review updates')).not.toBeOnTheScreen();
    expect(screen.queryByLabelText('Refresh field assignments')).not.toBeOnTheScreen();
    expect(screen.queryByLabelText('Sync reports now')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('activity.refresh-all'));

    expect(mockRefreshNotifications).toHaveBeenCalledTimes(1);
    expect(mockRefreshAssignments).toHaveBeenCalledTimes(1);
    expect(mockRefresh).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Everything is up to date.')).toBeOnTheScreen();
  });

  it('surfaces cached refresh failures in the aggregate result', async () => {
    mockRefreshNotifications.mockResolvedValue(false);
    mockRefreshAssignments.mockResolvedValue(false);
    mockRefresh.mockResolvedValue(false);

    await render(<ActivityScreen />);
    await fireEvent.press(screen.getByTestId('activity.refresh-all'));

    expect(screen.getByText(/Couldn.t refresh/)).toBeOnTheScreen();
    expect(screen.getByText(/Saved content is still available/)).toBeOnTheScreen();
  });

  it('omits the Needs-you section from Activity and routes active visits to Today via activity.today-entry', async () => {
    mockAssignmentsState = {
      ...mockAssignmentsState,
      assignments: Array.from({ length: 5 }, (_, index) => ({
        ...ASSIGNMENT,
        id: `assignment-${index}`,
        referenceCode: `CG-2026-000${index}`,
      })),
    };
    await render(<ActivityScreen />);

    expect(screen.queryByTestId('activity.needs-attention')).not.toBeOnTheScreen();
    expect(screen.queryByLabelText(/attention items/)).not.toBeOnTheScreen();

    const todayEntry = screen.getByTestId('activity.today-entry');
    expect(todayEntry).toBeOnTheScreen();
    expect(screen.getByText("Today's visits")).toBeOnTheScreen();
    expect(screen.getByText('5 assigned visits in due-date order')).toBeOnTheScreen();

    await fireEvent.press(todayEntry);
    expect(mockRouterPush).toHaveBeenCalledWith('/today');
  });

  it('orders history timeline by reverse chronological timestamp', async () => {
    await render(<ActivityScreen />);

    const timeline = screen.getByTestId('activity.timeline');
    expect(timeline).toBeOnTheScreen();
    expect(screen.queryByTestId('activity.needs-attention')).not.toBeOnTheScreen();

    expect(screen.getByTestId(`activity.assignment.${ASSIGNMENT.id}`)).toBeOnTheScreen();
    expect(screen.getByTestId('activity.latest-record')).toBeOnTheScreen();
    expect(screen.getByTestId(`activity.item.${SCAN.id}`)).toBeOnTheScreen();

    const renderedNodes = timeline.props.children;
    expect(renderedNodes).toHaveLength(3);
    expect(renderedNodes[0].key).toBe(`assignment-${ASSIGNMENT.id}`);
    expect(renderedNodes[1].key).toBe(REPORT.id);
    expect(renderedNodes[2].key).toBe(SCAN.id);
  });

  it('opens a cached assignment in the field validation flow', async () => {
    await render(<ActivityScreen />);

    await fireEvent.press(screen.getByTestId(`activity.assignment.${ASSIGNMENT.id}`));

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/field-validation',
      params: { assignmentId: ASSIGNMENT.id },
    });
  });

  it('filters assignments independently from local report and scan activity', async () => {
    const view = await render(<ActivityScreen />);

    await fireEvent.press(screen.getByTestId('activity.filter.reports'));
    expect(mockUsePaginatedScanRecords).toHaveBeenLastCalledWith(
      { hasFieldReport: true, search: undefined },
      25,
    );

    mockRecordsState = { ...mockRecordsState, data: [REPORT] };
    await view.rerender(<ActivityScreen />);
    expect(screen.getByLabelText('Field Report activity')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Scan activity')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('activity.filter.assignments'));
    expect(screen.getByTestId(`activity.assignment.${ASSIGNMENT.id}`)).toBeOnTheScreen();
    expect(screen.queryByLabelText('Field Report activity')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('activity.filter.scans'));
    expect(mockUsePaginatedScanRecords).toHaveBeenLastCalledWith(
      { hasFieldReport: false, search: undefined },
      25,
    );
  });

  it('opens saved activity in the existing record detail flow', async () => {
    await render(<ActivityScreen />);

    await fireEvent.press(
      screen.getByLabelText(/Open Possible Condition: Rust report saved/),
    );

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/record-details',
      params: { id: REPORT.id },
    });
  });

  it('exposes the newest visible record as activity.latest-record', async () => {
    await render(<ActivityScreen />);

    const latest = screen.getByTestId('activity.latest-record');
    expect(latest).toBeOnTheScreen();
    expect(latest.props.accessibilityLabel).toMatch(
      /Open Possible Condition: Rust report saved/,
    );
    expect(screen.queryByTestId(`activity.item.${REPORT.id}`)).not.toBeOnTheScreen();
    expect(screen.getByTestId(`activity.item.${SCAN.id}`)).toBeOnTheScreen();
  });

  it('moves the latest-record target when the visible record set changes', async () => {
    const view = await render(<ActivityScreen />);

    mockRecordsState = { ...mockRecordsState, data: [SCAN] };
    await view.rerender(<ActivityScreen />);

    const latest = screen.getByTestId('activity.latest-record');
    expect(latest).toBeOnTheScreen();
    expect(latest.props.accessibilityLabel).toMatch(
      /Open Possible Condition: Mosaic scan saved/,
    );
    expect(screen.queryByTestId(`activity.item.${SCAN.id}`)).not.toBeOnTheScreen();
  });

  it('keeps search and empty states scoped to Activity', async () => {
    const view = await render(<ActivityScreen />);

    await fireEvent.changeText(screen.getByLabelText('Search activity'), 'Wawa');
    await fireEvent.press(screen.getByLabelText('Submit activity search'));
    expect(mockUsePaginatedScanRecords).toHaveBeenLastCalledWith(
      { hasFieldReport: undefined, search: 'Wawa' },
      25,
    );

    mockRecordsState = {
      ...mockRecordsState,
      data: [],
    };
    await view.rerender(<ActivityScreen />);
    expect(screen.getByText('No matching activity')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Clear Filters'));
    expect(mockUsePaginatedScanRecords).toHaveBeenLastCalledWith(
      { hasFieldReport: undefined, search: undefined },
      25,
    );
  });
});
