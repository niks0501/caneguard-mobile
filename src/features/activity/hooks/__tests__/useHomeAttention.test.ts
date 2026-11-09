import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { useHomeAttention } from '@/features/activity/hooks/useHomeAttention';
import { useFieldValidationAssignments } from '@/features/assignments/hooks/useFieldValidationAssignments';
import { getLocalDateKey } from '@/features/assignments/domain/todayVisits';
import { useMobileNotifications } from '@/features/notifications/hooks/useMobileNotifications';
import { useNotificationDestinations } from '@/features/notifications/hooks/useNotificationDestinations';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import type { NotificationDestination } from '@/features/notifications/services/resolveNotificationDestination';

jest.mock('@/features/assignments/hooks/useFieldValidationAssignments');
jest.mock('@/features/notifications/hooks/useMobileNotifications');
jest.mock('@/features/notifications/hooks/useNotificationDestinations');
jest.mock('@/features/assignments/domain/todayVisits', () => ({
  ...jest.requireActual('@/features/assignments/domain/todayVisits'),
  getLocalDateKey: jest.fn(() => '2026-09-20'),
}));

const mockUseAssignments = jest.mocked(useFieldValidationAssignments);
const mockUseNotifications = jest.mocked(useMobileNotifications);
const mockUseDestinations = jest.mocked(useNotificationDestinations);
const mockGetLocalDateKey = jest.mocked(getLocalDateKey);
const { getLocalDateKey: actualGetLocalDateKey } = jest.requireActual<
  typeof import('@/features/assignments/domain/todayVisits')
>('@/features/assignments/domain/todayVisits');

describe('useHomeAttention', () => {
  const mockMarkRead = jest.fn(async () => undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLocalDateKey.mockReturnValue('2026-09-20');
  });

  it('builds assignment and notification attention items and excludes uploads', async () => {
    const mockAssignment: FieldValidationAssignment = {
      id: 'assign-1',
      ownerIdentity: 'user-1',
      reportUuid: 'rep-1',
      reportClientUuid: 'rep-c-1',
      referenceCode: 'CG-2026-0001',
      submitter: { uuid: 'sub-1', name: 'Ana Reporter' },
      assignee: { uuid: 'user-1', name: 'Mara Reporter' },
      submitterIsAssignee: false,
      targetVisitDate: '2026-09-01',
      fieldValidationState: 'assigned',
      assignedAt: '2026-08-13T12:00:00.000Z',
      updatedAt: '2026-08-13T12:00:00.000Z',
      cachedAt: '2026-08-13T12:05:00.000Z',
      case: {
        barangay: 'Mabini',
        municipality: 'Nasugbu',
        province: 'Batangas',
        farmerOrFarmOwnerName: 'Juan Dela Cruz',
        affectedAreaHectares: 1,
        affectedPortionPercent: 20,
        capturedAt: '2026-07-20T09:55:00.000Z',
        observedAt: '2026-07-20T09:58:00.000Z',
        submittedAt: '2026-07-20T10:00:00.000Z',
        predictedLabel: 'rust',
        confidence: 0.93,
      },
    };

    const mockNotification: MobileNotification = {
      id: 'notif-1',
      ownerIdentity: 'user-1',
      eventType: 'authority_status',
      title: 'Review updated',
      message: 'Office confirmed finding',
      createdAt: '2026-09-19T10:00:00.000Z',
      cachedAt: '2026-09-19T10:05:00.000Z',
      isRead: false,
      readAt: null,
      advisory: null,
      content: null,
      caseUuid: 'case-1',
      referenceCode: 'CG-2026-0001',
      assignmentUuid: 'assign-1',
    };

    const destinationsMap = new Map<string, NotificationDestination>([
      ['notif-1', { kind: 'assignment', assignmentId: 'assign-1' }],
    ]);

    mockUseAssignments.mockReturnValue({
      assignments: [mockAssignment],
      capabilityUnavailable: false,
      errorMessage: null,
      lastSuccessfulAt: null,
      refreshing: false,
      skippedCount: 0,
      sessionKey: 'key',
      refresh: jest.fn(async () => true),
      refreshOutcome: jest.fn(async () => 'ok' as const),
    });

    mockUseNotifications.mockReturnValue({
      capabilityUnavailable: false,
      errorMessage: null,
      lastSuccessfulAt: null,
      markAllRead: jest.fn(async () => undefined),
      markRead: mockMarkRead,
      notifications: [mockNotification],
      partial: false,
      readActionError: null,
      refreshing: false,
      refresh: jest.fn(async () => true),
      sessionKey: 'key',
      unreadCount: 1,
    });

    mockUseDestinations.mockReturnValue(destinationsMap);

    const { result } = await renderHook(() => useHomeAttention());

    expect(result.current.total).toBe(2);
    expect(result.current.items).toHaveLength(2);

    // Kind should only be assignment or notification (never upload)
    const kinds = result.current.items.map((i) => i.kind);
    expect(kinds).toContain('assignment');
    expect(kinds).toContain('notification');
    expect(kinds).not.toContain('upload');

    // markRead delegates to notifications.markRead
    result.current.markRead('notif-1');
    expect(mockMarkRead).toHaveBeenCalledWith('notif-1');
  });

  it('returns empty items when there are no assignments or notifications', async () => {
    mockUseAssignments.mockReturnValue({
      assignments: [],
      capabilityUnavailable: false,
      errorMessage: null,
      lastSuccessfulAt: null,
      refreshing: false,
      skippedCount: 0,
      sessionKey: 'key',
      refresh: jest.fn(async () => true),
      refreshOutcome: jest.fn(async () => 'ok' as const),
    });

    mockUseNotifications.mockReturnValue({
      capabilityUnavailable: false,
      errorMessage: null,
      lastSuccessfulAt: null,
      markAllRead: jest.fn(async () => undefined),
      markRead: mockMarkRead,
      notifications: [],
      partial: false,
      readActionError: null,
      refreshing: false,
      refresh: jest.fn(async () => true),
      sessionKey: 'key',
      unreadCount: 0,
    });

    mockUseDestinations.mockReturnValue(new Map());

    const { result } = await renderHook(() => useHomeAttention());

    expect(result.current.total).toBe(0);
    expect(result.current.items).toHaveLength(0);
  });

  async function renderUpcomingVisitHook() {
    mockUseAssignments.mockReturnValue({
      assignments: [
        {
          id: 'assign-1',
          ownerIdentity: 'user-1',
          reportUuid: 'rep-1',
          reportClientUuid: 'rep-c-1',
          referenceCode: 'CG-2026-0001',
          submitter: { uuid: 'sub-1', name: 'Ana Reporter' },
          assignee: { uuid: 'user-1', name: 'Mara Reporter' },
          submitterIsAssignee: false,
          targetVisitDate: '2026-09-21',
          fieldValidationState: 'assigned',
          assignedAt: '2026-09-19T12:00:00.000Z',
          updatedAt: '2026-09-19T12:00:00.000Z',
          cachedAt: '2026-09-19T12:05:00.000Z',
          case: {
            barangay: 'Mabini',
            municipality: 'Nasugbu',
            province: 'Batangas',
            farmerOrFarmOwnerName: 'Juan Dela Cruz',
            affectedAreaHectares: 1,
            affectedPortionPercent: 20,
            capturedAt: '2026-09-19T09:55:00.000Z',
            observedAt: '2026-09-19T09:58:00.000Z',
            submittedAt: '2026-09-19T10:00:00.000Z',
            predictedLabel: 'rust',
            confidence: 0.93,
          },
        },
      ],
      capabilityUnavailable: false,
      errorMessage: null,
      lastSuccessfulAt: null,
      refreshing: false,
      skippedCount: 0,
      sessionKey: 'key',
      refresh: jest.fn(async () => true),
      refreshOutcome: jest.fn(async () => 'ok' as const),
    });
    mockUseNotifications.mockReturnValue({
      capabilityUnavailable: false,
      errorMessage: null,
      lastSuccessfulAt: null,
      markAllRead: jest.fn(async () => undefined),
      markRead: mockMarkRead,
      notifications: [],
      partial: false,
      readActionError: null,
      refreshing: false,
      refresh: jest.fn(async () => true),
      sessionKey: 'key',
      unreadCount: 0,
    });
    mockUseDestinations.mockReturnValue(new Map());
    return renderHook(() => useHomeAttention());
  }

  it('rolls the visit buckets over at local midnight while Home stays open', async () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(new Date(2026, 8, 20, 23, 59, 30));
      mockGetLocalDateKey.mockImplementation(actualGetLocalDateKey);

      const { result } = await renderUpcomingVisitHook();
      expect(result.current.items[0].bucket).toBe('upcoming');
      expect(result.current.items[0].meta).toBe('Visit due 2026-09-21');

      await act(async () => {
        jest.advanceTimersByTime(31_000);
      });

      expect(result.current.items[0].bucket).toBe('today');
      expect(result.current.items[0].meta).toBe('Visit due today');
    } finally {
      jest.useRealTimers();
    }
  });

  it('refreshes the day-dependent work when the app returns to the foreground', async () => {
    let onAppStateChange: ((status: AppStateStatus) => void) | null = null;
    const remove = jest.fn();
    const addEventListener = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, listener) => {
        onAppStateChange = listener;
        return { remove } as never;
      });

    try {
      const { result, unmount } = await renderUpcomingVisitHook();
      expect(result.current.items[0].bucket).toBe('upcoming');

      mockGetLocalDateKey.mockReturnValue('2026-09-21');
      await act(async () => {
        onAppStateChange?.('background');
        onAppStateChange?.('active');
      });

      expect(result.current.items[0].bucket).toBe('today');
      expect(result.current.items[0].meta).toBe('Visit due today');

      await unmount();
      expect(remove).toHaveBeenCalled();
    } finally {
      addEventListener.mockRestore();
    }
  });
});
