import { renderHook } from '@testing-library/react-native';

import { useHomeAttention } from '@/features/activity/hooks/useHomeAttention';
import { useFieldValidationAssignments } from '@/features/assignments/hooks/useFieldValidationAssignments';
import { useMobileNotifications } from '@/features/notifications/hooks/useMobileNotifications';
import { useNotificationDestinations } from '@/features/notifications/hooks/useNotificationDestinations';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import type { NotificationDestination } from '@/features/notifications/services/resolveNotificationDestination';

jest.mock('@/features/assignments/hooks/useFieldValidationAssignments');
jest.mock('@/features/notifications/hooks/useMobileNotifications');
jest.mock('@/features/notifications/hooks/useNotificationDestinations');

const mockUseAssignments = jest.mocked(useFieldValidationAssignments);
const mockUseNotifications = jest.mocked(useMobileNotifications);
const mockUseDestinations = jest.mocked(useNotificationDestinations);

describe('useHomeAttention', () => {
  const mockMarkRead = jest.fn(async () => undefined);

  beforeEach(() => {
    jest.clearAllMocks();
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
      sessionKey: 'key',
      refresh: jest.fn(async () => true),
    });

    mockUseNotifications.mockReturnValue({
      capabilityUnavailable: false,
      errorMessage: null,
      lastSuccessfulAt: null,
      markAllRead: jest.fn(async () => undefined),
      markRead: mockMarkRead,
      notifications: [mockNotification],
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
      sessionKey: 'key',
      refresh: jest.fn(async () => true),
    });

    mockUseNotifications.mockReturnValue({
      capabilityUnavailable: false,
      errorMessage: null,
      lastSuccessfulAt: null,
      markAllRead: jest.fn(async () => undefined),
      markRead: mockMarkRead,
      notifications: [],
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
});
