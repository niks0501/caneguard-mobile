import { render, screen } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';

import NotificationDetailsScreen from '@/app/notification-details';
import { useMobileNotifications } from '@/features/notifications/hooks/useMobileNotifications';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}));
jest.mock('@/features/notifications/hooks/useMobileNotifications', () => ({
  useMobileNotifications: jest.fn(),
}));
jest.mock('@/features/notifications/hooks/useNotificationDestinations', () => ({
  useNotificationDestinations: jest.fn(() => new Map()),
}));

const mockParams = jest.mocked(useLocalSearchParams);
const mockUseMobileNotifications = jest.mocked(useMobileNotifications);
const markRead = jest.fn(async () => undefined);

const NOTIFICATION = {
  id: '4e04321c-a879-423f-875d-4cdce5e028a6',
  ownerIdentity: 'owner-1',
  eventType: 'office_advisory_published',
  title: 'New advisory available',
  message: 'The office published new guidance for this case.',
  caseUuid: null,
  referenceCode: 'CG-2026-0001',
  assignmentUuid: null,
  content: 'Follow the office guidance during your next visit.',
  advisory: {
    uuid: '2eaf6f1b-1c44-4f9b-95f2-7c8c682c2b5f',
    code: 'CG-ADVISORY-001',
    title: 'Inspect affected leaves',
    content: 'Inspect the affected leaves and capture clear evidence during the visit.',
    status: 'validated' as const,
    selectedAt: '2026-08-13T11:55:00.000Z',
  },
  isRead: false,
  readAt: null,
  createdAt: '2026-08-13T12:00:00.000Z',
  cachedAt: '2026-08-13T12:05:00.000Z',
};

describe('NotificationDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams.mockReturnValue({ id: NOTIFICATION.id });
    mockUseMobileNotifications.mockReturnValue({
      capabilityUnavailable: false,
      errorMessage: null,
      lastSuccessfulAt: null,
      markAllRead: jest.fn(async () => undefined),
      markRead,
      notifications: [NOTIFICATION],
      readActionError: null,
      refreshing: false,
      refresh: jest.fn(async () => true),
      sessionKey: 'session-1',
      unreadCount: 1,
    });
  });

  it('renders the cached advisory title and body', async () => {
    await render(<NotificationDetailsScreen />);

    expect(screen.getByTestId('notification.details-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('notification.details.title')).toHaveTextContent(
      'Inspect affected leaves',
    );
    expect(screen.getByTestId('notification.details.body')).toHaveTextContent(
      'Inspect the affected leaves and capture clear evidence during the visit.',
    );
    expect(screen.getByText('Follow the office guidance during your next visit.')).toBeOnTheScreen();
  });
});
