import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppState, Button, Text } from 'react-native';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  markAllMobileNotificationsRead,
  markMobileNotificationRead,
  MobileNotificationsApiError,
} from '@/features/notifications/api/mobileNotificationsApi';
import {
  listCachedMobileNotifications,
  markAllCachedMobileNotificationsRead,
  markCachedMobileNotificationRead,
} from '@/features/notifications/data/notificationCacheRepository';
import { refreshMobileNotifications } from '@/features/notifications/services/refreshMobileNotifications';
import { useMobileNotifications } from '@/features/notifications/hooks/useMobileNotifications';

jest.mock('@/database/DatabaseProvider', () => ({
  useCaneGuardDatabase: jest.fn(),
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@/features/notifications/api/mobileNotificationsApi', () => ({
  MobileNotificationsApiError: class MobileNotificationsApiError extends Error {
    readonly code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
  markAllMobileNotificationsRead: jest.fn(),
  markMobileNotificationRead: jest.fn(),
}));
jest.mock('@/features/notifications/data/notificationCacheRepository', () => ({
  listCachedMobileNotifications: jest.fn(),
  markAllCachedMobileNotificationsRead: jest.fn(),
  markCachedMobileNotificationRead: jest.fn(),
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
const refreshService = jest.mocked(refreshMobileNotifications);
const listCache = jest.mocked(listCachedMobileNotifications);
const markSessionExpired = jest.fn(async () => undefined);
const markReadApi = jest.mocked(markMobileNotificationRead);
const markAllReadApi = jest.mocked(markAllMobileNotificationsRead);
const markCached = jest.mocked(markCachedMobileNotificationRead);
const markAllCached = jest.mocked(markAllCachedMobileNotificationsRead);
let appStateListener: ((state: string) => void) | undefined;
const CACHED = [{
  id: '4e04321c-a879-423f-875d-4cdce5e028a6',
  ownerIdentity: 'owner-1',
  eventType: 'field_validation_assigned',
  title: 'Assignment',
  message: 'Assignment ready.',
  caseUuid: null,
  referenceCode: null,
  assignmentUuid: null,
  isRead: false,
  readAt: null,
  createdAt: '2026-08-13T12:00:00.000Z',
  cachedAt: '2026-08-13T12:01:00.000Z',
}];

function Probe() {
  const state = useMobileNotifications();
  return (
    <>
      <Text testID="count">{state.notifications.length}</Text>
      <Text testID="unread">{state.unreadCount}</Text>
      <Text testID="error">{state.errorMessage ?? 'none'}</Text>
      <Text testID="read-error">{state.readActionError ?? 'none'}</Text>
      <Button title="Manual refresh" onPress={() => void state.refresh()} />
      <Button
        title="Mark one read"
        onPress={() => void state.markRead('4e04321c-a879-423f-875d-4cdce5e028a6')}
      />
      <Button title="Mark all read" onPress={() => void state.markAllRead()} />
    </>
  );
}

describe('useMobileNotifications lifecycle behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    appStateListener = undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
      appStateListener = listener as (state: string) => void;
      return { remove: jest.fn() };
    });
    jest.mocked(useCaneGuardDatabase).mockReturnValue(database);
    jest.mocked(useAuth).mockReturnValue({
      status: 'authenticated',
      session: { token: 'token-1', user: { uuid: 'owner-1' } },
      markSessionExpired,
    } as never);
    listCache.mockResolvedValue(CACHED);
    refreshService.mockResolvedValue({
      notifications: CACHED,
      fetchedAt: '2026-08-13T12:01:00.000Z',
      syncBefore: '2026-08-13T12:05:00.000Z',
    });
  });

  it('refreshes on initial focus, manual refresh, and app resume', async () => {
    await render(<Probe />);
    await waitFor(() => expect(refreshService).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('unread')).toHaveTextContent('1');

    await act(async () => {
      fireEvent.press(screen.getByText('Manual refresh'));
      await Promise.resolve();
    });
    expect(refreshService).toHaveBeenCalledTimes(2);

    await act(async () => {
      appStateListener?.('background');
      appStateListener?.('active');
      await Promise.resolve();
    });
    await waitFor(() => expect(refreshService).toHaveBeenCalledTimes(3));
  });

  it('keeps cached attention items visible when the server refresh fails', async () => {
    refreshService.mockRejectedValueOnce(
      new MobileNotificationsApiError('NETWORK', 'offline'),
    );
    await render(<Probe />);

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    expect(screen.getByTestId('error')).toHaveTextContent(
      "Couldn't refresh - showing saved attention items.",
    );
    expect(markSessionExpired).not.toHaveBeenCalled();
  });
  it('applies a confirmed acknowledgment to the cache and the visible list', async () => {
    markReadApi.mockResolvedValue({
      notification: { ...CACHED[0], isRead: true, readAt: '2026-08-13T12:10:00.000Z' },
      unreadCount: 0,
    });
    markCached.mockResolvedValue(true);
    await render(<Probe />);
    await waitFor(() => expect(screen.getByTestId('unread')).toHaveTextContent('1'));

    await act(async () => {
      fireEvent.press(screen.getByText('Mark one read'));
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByTestId('unread')).toHaveTextContent('0'));
    expect(markCached).toHaveBeenCalledWith(
      database,
      'owner-1',
      CACHED[0].id,
      '2026-08-13T12:10:00.000Z',
    );
    expect(screen.getByTestId('read-error')).toHaveTextContent('none');
  });

  it('keeps an item unread and reports a recoverable error when acknowledgment fails', async () => {
    markReadApi.mockRejectedValue(
      new MobileNotificationsApiError('NETWORK', 'offline'),
    );
    await render(<Probe />);
    await waitFor(() => expect(screen.getByTestId('unread')).toHaveTextContent('1'));

    await act(async () => {
      fireEvent.press(screen.getByText('Mark one read'));
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(screen.getByTestId('read-error')).toHaveTextContent(
        "Couldn't mark this update as read. It is still unread.",
      ),
    );
    expect(screen.getByTestId('unread')).toHaveTextContent('1');
    expect(markCached).not.toHaveBeenCalled();
  });

  it('clears every unread count only after the server confirms mark-all', async () => {
    markAllReadApi.mockResolvedValue({ markedCount: 1, unreadCount: 0 });
    markAllCached.mockResolvedValue(1);
    await render(<Probe />);
    await waitFor(() => expect(screen.getByTestId('unread')).toHaveTextContent('1'));

    await act(async () => {
      fireEvent.press(screen.getByText('Mark all read'));
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByTestId('unread')).toHaveTextContent('0'));
    expect(markAllCached).toHaveBeenCalledWith(
      database,
      'owner-1',
      expect.any(String),
    );
  });

  it('expires the session when an acknowledgment is rejected as unauthorized', async () => {
    markAllReadApi.mockRejectedValue(
      new MobileNotificationsApiError('AUTH_REQUIRED', 'expired'),
    );
    await render(<Probe />);
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));

    await act(async () => {
      fireEvent.press(screen.getByText('Mark all read'));
      await Promise.resolve();
    });

    await waitFor(() => expect(markSessionExpired).toHaveBeenCalledTimes(1));
  });
});
