import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import ActivityScreen from '@/app/activity';
import type { ScanRecordListItem } from '@/features/records/domain/recordTypes';
import { useFieldValidationAssignments } from '@/features/assignments/hooks/useFieldValidationAssignments';
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
const mockRefreshAssignments = jest.fn(async () => undefined);
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

describe('ActivityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAssignmentsState = {
      ...mockAssignmentsState,
      assignments: [ASSIGNMENT],
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
      screen.getByLabelText(/Open Possible result: Rust report saved/),
    );

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/record-details',
      params: { id: REPORT.id },
    });
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
