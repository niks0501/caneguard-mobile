import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { ToastProvider } from '@/components/ui/Toast';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import { useMobileNotifications } from '@/features/notifications/hooks/useMobileNotifications';
import {
  OfficeUpdatesProvider,
  useOfficeUpdates,
} from '@/features/notifications/providers/OfficeUpdatesProvider';
import type { NotificationDestination } from '@/features/notifications/services/resolveNotificationDestination';

const mockPush = router.push as jest.Mock;
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
  partial: false,
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

function Consumer() {
  const { isOpen, open, unreadCount } = useOfficeUpdates();

  return (
    <>
      <Text testID="consumer.unread">{unreadCount}</Text>
      <Text testID="consumer.open">{isOpen ? 'open' : 'closed'}</Text>
      <Pressable accessibilityRole="button" onPress={open} testID="consumer.open-button">
        <Text>Open</Text>
      </Pressable>
    </>
  );
}

async function renderProvider() {
  return render(
    <ToastProvider>
      <OfficeUpdatesProvider>
        <Consumer />
      </OfficeUpdatesProvider>
    </ToastProvider>,
  );
}

describe('OfficeUpdatesProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDestinations = new Map();
    mockNotificationsState = {
      ...mockNotificationsState,
      notifications: [],
      unreadCount: 0,
    };
  });

  it('shares the unread count and keeps the panel closed until it is asked for', async () => {
    mockNotificationsState = {
      ...mockNotificationsState,
      notifications: [NOTIFICATION],
      unreadCount: 1,
    };

    await renderProvider();

    expect(screen.getByTestId('consumer.unread')).toHaveTextContent('1');
    expect(screen.getByTestId('consumer.open')).toHaveTextContent('closed');
    expect(screen.queryByTestId('office-updates.panel')).not.toBeOnTheScreen();
  });

  it('opens one floating panel over the screen and closes it on a scrim tap', async () => {
    mockNotificationsState = {
      ...mockNotificationsState,
      notifications: [NOTIFICATION],
      unreadCount: 1,
    };

    await renderProvider();
    await fireEvent.press(screen.getByTestId('consumer.open-button'));

    expect(screen.getByTestId('consumer.open')).toHaveTextContent('open');
    expect(screen.getByTestId('office-updates.panel')).toBeOnTheScreen();
    expect(screen.getByText('1 unread item from the office.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('office-updates.scrim'));

    expect(screen.getByTestId('consumer.open')).toHaveTextContent('closed');
    expect(screen.queryByTestId('office-updates.panel')).not.toBeOnTheScreen();
  });

  it('closes the floating panel from its header exit control', async () => {
    mockNotificationsState = {
      ...mockNotificationsState,
      notifications: [NOTIFICATION],
      unreadCount: 1,
    };

    await renderProvider();
    await fireEvent.press(screen.getByTestId('consumer.open-button'));
    expect(screen.getByTestId('office-updates.panel')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('office-updates.close'));

    expect(screen.getByTestId('consumer.open')).toHaveTextContent('closed');
    expect(screen.queryByTestId('office-updates.panel')).not.toBeOnTheScreen();
  });

  it('acknowledges a tapped update and opens its destination from the panel', async () => {
    mockNotificationsState = {
      ...mockNotificationsState,
      notifications: [NOTIFICATION],
      unreadCount: 1,
    };
    mockDestinations = new Map([
      [NOTIFICATION.id, { kind: 'field_report', scanRecordId: 'scan-1' }],
    ]);

    await renderProvider();
    await fireEvent.press(screen.getByTestId('consumer.open-button'));
    await fireEvent.press(screen.getByTestId(`activity.notification.${NOTIFICATION.id}`));

    expect(mockMarkRead).toHaveBeenCalledWith(NOTIFICATION.id);
    expect(screen.queryByTestId('office-updates.panel')).not.toBeOnTheScreen();
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/field-report',
      params: { scanRecordId: 'scan-1' },
    });
  });

  it('marks every update read and confirms it without leaving the panel open', async () => {
    mockNotificationsState = {
      ...mockNotificationsState,
      notifications: [NOTIFICATION],
      unreadCount: 1,
    };

    await renderProvider();
    await fireEvent.press(screen.getByTestId('consumer.open-button'));
    await fireEvent.press(screen.getByLabelText('Mark all office updates as read'));

    expect(mockMarkAllRead).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('app-toast')).toHaveTextContent('Updates marked as read');
  });

  it('reads the shared cache once on mount without taking over the focus refresh', async () => {
    await renderProvider();

    expect(useMobileNotifications).toHaveBeenCalledWith(true, false);
    expect(mockRefreshNotifications).toHaveBeenCalledWith({ force: false });
  });
});
