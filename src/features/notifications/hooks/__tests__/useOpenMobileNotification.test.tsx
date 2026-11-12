import { act, renderHook } from '@testing-library/react-native';
import { router } from 'expo-router';

import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import { useOpenMobileNotification } from '@/features/notifications/hooks/useOpenMobileNotification';
import type { NotificationDestination } from '@/features/notifications/services/resolveNotificationDestination';

const mockShowToast = jest.fn();
jest.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

const mockPush = router.push as jest.Mock;

const NOTIFICATION: MobileNotification = {
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

async function renderOpenNotification({
  destinations = new Map<string, NotificationDestination>(),
  markRead = jest.fn(async () => undefined),
  resolveAgain,
}: {
  destinations?: Map<string, NotificationDestination>;
  markRead?: (notificationId: string) => Promise<void>;
  resolveAgain?: (notification: MobileNotification) => Promise<NotificationDestination>;
} = {}) {
  const onClose = jest.fn();
  const view = await renderHook(() =>
    useOpenMobileNotification({ destinations, markRead, onClose, resolveAgain }),
  );

  return { markRead, onClose, ...view };
}

describe('useOpenMobileNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Intent: a notification whose case is not on this phone states why instead of silently doing nothing.
  it('explains an unavailable destination with the web fallback', async () => {
    const { onClose, result } = await renderOpenNotification({
      destinations: new Map([[NOTIFICATION.id, { kind: 'unavailable' }]]),
    });

    await act(async () => {
      result.current(NOTIFICATION);
    });

    expect(mockShowToast).toHaveBeenCalledWith('Not on this phone: open on the web', 'info');
    expect(onClose).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('acknowledges the update, closes the surface, and opens its destination', async () => {
    const { markRead, onClose, result } = await renderOpenNotification({
      destinations: new Map([
        [NOTIFICATION.id, { kind: 'field_report', scanRecordId: 'scan-1' }],
      ]),
    });

    await act(async () => {
      result.current(NOTIFICATION);
    });

    expect(markRead).toHaveBeenCalledWith(NOTIFICATION.id);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/field-report',
      params: { scanRecordId: 'scan-1' },
    });
  });

  it('opens the in-app detail view when the update carries its own body', async () => {
    const { onClose, result } = await renderOpenNotification({
      destinations: new Map([[NOTIFICATION.id, { kind: 'unavailable' }]]),
    });

    await act(async () => {
      result.current({
        ...NOTIFICATION,
        content: 'Follow the office guidance during your next visit.',
      });
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/notification-details',
      params: { id: NOTIFICATION.id },
    });
  });

  it('marks a case with nowhere to go read once, without closing or navigating', async () => {
    const { markRead, onClose, result } = await renderOpenNotification({
      destinations: new Map([[NOTIFICATION.id, { kind: 'unavailable' }]]),
    });

    await act(async () => {
      result.current(NOTIFICATION);
    });

    expect(markRead).toHaveBeenCalledTimes(1);
    expect(markRead).toHaveBeenCalledWith(NOTIFICATION.id);
    expect(onClose).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  // Proves M-F12: a tap while the destination is still resolving must not consume the update.
  it('shows a toast and neither marks read, closes, nor navigates while still resolving', async () => {
    const { markRead, onClose, result } = await renderOpenNotification();

    await act(async () => {
      result.current(NOTIFICATION);
    });

    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'info');
    expect(markRead).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  // Intent: tapping an update for a visit not yet downloaded opens it once the one visits fetch finds it.
  it('opens the visit after the one visits fetch finds it', async () => {
    const resolveAgain = jest.fn(async () => ({
      kind: 'assignment' as const,
      assignmentId: 'assignment-7',
    }));
    const { onClose, result } = await renderOpenNotification({
      destinations: new Map([[NOTIFICATION.id, { kind: 'unavailable' }]]),
      resolveAgain,
    });

    await act(async () => {
      await result.current(NOTIFICATION);
    });

    expect(resolveAgain).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/field-validation',
      params: { assignmentId: 'assignment-7' },
    });
  });

  // Intent: when the fetch still finds nothing, keep the Not on this phone web fallback.
  it('keeps the web fallback when the fetch finds nothing', async () => {
    const resolveAgain = jest.fn(async () => ({ kind: 'unavailable' as const }));
    const { result } = await renderOpenNotification({
      destinations: new Map([[NOTIFICATION.id, { kind: 'unavailable' }]]),
      resolveAgain,
    });

    await act(async () => {
      await result.current(NOTIFICATION);
    });

    expect(mockShowToast).toHaveBeenCalledWith('Not on this phone: open on the web', 'info');
    expect(mockPush).not.toHaveBeenCalled();
  });
});
