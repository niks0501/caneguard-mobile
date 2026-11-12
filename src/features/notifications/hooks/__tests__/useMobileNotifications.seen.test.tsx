import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppState, Button, Text } from 'react-native';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { markAllMobileNotificationsRead, markMobileNotificationRead } from '@/features/notifications/api/mobileNotificationsApi';
import {
  listCachedMobileNotifications,
  markAllCachedMobileNotificationsRead,
  markCachedMobileNotificationRead,
} from '@/features/notifications/data/notificationCacheRepository';
import { enqueueNotificationSeen } from '@/features/notifications/data/notificationSeenRepository';
import { useMobileNotifications } from '@/features/notifications/hooks/useMobileNotifications';
import { refreshMobileNotifications } from '@/features/notifications/services/refreshMobileNotifications';
import { sendQueuedNotificationSeen } from '@/features/notifications/services/sendNotificationSeen';

jest.mock('@/database/DatabaseProvider', () => ({ useCaneGuardDatabase: jest.fn() }));
jest.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/notifications/api/mobileNotificationsApi', () => ({
  MobileNotificationsApiError: class MobileNotificationsApiError extends Error {},
  markAllMobileNotificationsRead: jest.fn(),
  markMobileNotificationRead: jest.fn(),
}));
jest.mock('@/features/notifications/data/notificationCacheRepository', () => ({
  listCachedMobileNotifications: jest.fn(),
  markAllCachedMobileNotificationsRead: jest.fn(),
  markCachedMobileNotificationRead: jest.fn(),
}));
jest.mock('@/features/notifications/data/notificationSeenRepository', () => ({
  enqueueNotificationSeen: jest.fn(),
}));
jest.mock('@/features/notifications/services/sendNotificationSeen', () => ({
  sendQueuedNotificationSeen: jest.fn(),
}));
jest.mock('@/features/notifications/services/refreshMobileNotifications', () => ({
  refreshMobileNotifications: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require('react');
    React.useEffect(callback, [callback]);
  },
}));

const database = {} as never;
const ADVICE_ID = '4e04321c-a879-423f-875d-4cdce5e028a6';
const PLAIN_ID = '5f15432d-b98a-534f-986e-5dece6f139b7';
const base = {
  ownerIdentity: 'owner-1',
  eventType: 'field_validation_assigned',
  title: 'Update',
  message: 'Update.',
  caseUuid: null,
  referenceCode: null,
  assignmentUuid: null,
  content: null,
  isRead: false,
  readAt: null,
  createdAt: '2026-08-13T12:00:00.000Z',
  cachedAt: '2026-08-13T12:01:00.000Z',
};
const NOTIFICATIONS = [
  {
    ...base,
    id: ADVICE_ID,
    advisory: {
      uuid: '2eaf6f1b-1c44-4f9b-95f2-7c8c682c2b5f',
      code: 'CG-ADVISORY-001',
      title: 'Inspect',
      content: 'Inspect.',
      status: 'validated' as const,
      selectedAt: '2026-08-13T11:55:00.000Z',
    },
  },
  { ...base, id: PLAIN_ID, advisory: null },
];

function Probe() {
  const state = useMobileNotifications();
  return (
    <>
      <Text testID="unread">{state.unreadCount}</Text>
      <Button title="Open advice" onPress={() => void state.markRead(ADVICE_ID)} />
      <Button title="Open plain" onPress={() => void state.markRead(PLAIN_ID)} />
      <Button title="Mark all read" onPress={() => void state.markAllRead()} />
    </>
  );
}

describe('Seen receipts from the notifications hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
    jest.mocked(useCaneGuardDatabase).mockReturnValue(database);
    jest.mocked(useAuth).mockReturnValue({
      status: 'authenticated',
      session: { token: 'token-1', user: { uuid: 'owner-1' } },
      markSessionExpired: jest.fn(),
    } as never);
    jest.mocked(listCachedMobileNotifications).mockResolvedValue(NOTIFICATIONS as never);
    jest.mocked(refreshMobileNotifications).mockResolvedValue({
      notifications: NOTIFICATIONS,
      fetchedAt: '2026-08-13T12:01:00.000Z',
      syncBefore: '2026-08-13T12:05:00.000Z',
      partial: false,
    } as never);
    jest.mocked(enqueueNotificationSeen).mockResolvedValue(undefined);
    jest.mocked(markCachedMobileNotificationRead).mockResolvedValue(undefined as never);
    jest.mocked(sendQueuedNotificationSeen).mockResolvedValue({ sent: 0, waiting: [], authRequired: false });
  });

  it('queues a Seen when advice is opened, even though no network call succeeds', async () => {
    await render(<Probe />);
    await waitFor(() => expect(screen.getByTestId('unread')).toHaveTextContent('2'));

    await act(async () => {
      fireEvent.press(screen.getByText('Open advice'));
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(enqueueNotificationSeen).toHaveBeenCalledWith(database, 'owner-1', [ADVICE_ID], expect.any(String)),
    );
    expect(markMobileNotificationRead).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('unread')).toHaveTextContent('1'));
    expect(sendQueuedNotificationSeen).toHaveBeenCalled();
  });

  it('keeps today’s mark-read for an update that carries no advice', async () => {
    jest.mocked(markMobileNotificationRead).mockResolvedValue({
      notification: { ...NOTIFICATIONS[1], readAt: '2026-08-13T12:10:00.000Z', isRead: true },
      unreadCount: 1,
    } as never);
    await render(<Probe />);
    await waitFor(() => expect(screen.getByTestId('unread')).toHaveTextContent('2'));

    await act(async () => {
      fireEvent.press(screen.getByText('Open plain'));
      await Promise.resolve();
    });

    await waitFor(() => expect(markMobileNotificationRead).toHaveBeenCalledTimes(1));
    expect(enqueueNotificationSeen).not.toHaveBeenCalled();
  });

  it('counts mark-all-read as Seen for each unread advice update', async () => {
    jest.mocked(markAllMobileNotificationsRead).mockResolvedValue({ markedCount: 2, unreadCount: 0 });
    jest.mocked(markAllCachedMobileNotificationsRead).mockResolvedValue(2);
    await render(<Probe />);
    await waitFor(() => expect(screen.getByTestId('unread')).toHaveTextContent('2'));

    await act(async () => {
      fireEvent.press(screen.getByText('Mark all read'));
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(enqueueNotificationSeen).toHaveBeenCalledWith(database, 'owner-1', [ADVICE_ID], expect.any(String)),
    );
    await waitFor(() => expect(markAllMobileNotificationsRead).toHaveBeenCalled());
  });

  it('sends queued receipts before the updates feed refreshes', async () => {
    const order: string[] = [];
    jest.mocked(sendQueuedNotificationSeen).mockImplementation(async () => {
      order.push('seen');
      return { sent: 0, waiting: [], authRequired: false };
    });
    jest.mocked(refreshMobileNotifications).mockImplementation(async () => {
      order.push('refresh');
      return { notifications: NOTIFICATIONS, fetchedAt: '2026-08-13T12:01:00.000Z', syncBefore: 'x', partial: false } as never;
    });

    await render(<Probe />);
    await waitFor(() => expect(order).toContain('refresh'));

    expect(order.indexOf('seen')).toBeLessThan(order.indexOf('refresh'));
  });
});
