import { render, screen } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';

import NotificationDetailsScreen from '@/app/notification-details';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import { useMobileNotifications } from '@/features/notifications/hooks/useMobileNotifications';
import { useNotificationDestinations } from '@/features/notifications/hooks/useNotificationDestinations';

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
const mockUseNotificationDestinations = jest.mocked(useNotificationDestinations);
const markRead = jest.fn(async () => undefined);
let mockRole: 'farmer' | 'field_reporter' = 'field_reporter';
let mockLanguage: 'en' | 'tl' = 'en';
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: { role: mockRole } }),
}));
jest.mock('@/providers/LanguagePreferenceProvider', () => ({
  useLanguagePreference: () => ({ language: mockLanguage }),
}));

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

const LEGACY_NOTIFICATION: MobileNotification = {
  ...NOTIFICATION,
  advisory: null,
  content: null,
  title: 'Field validation assigned',
  message: 'A field validation assignment is ready.',
};

function notificationState(notifications: MobileNotification[]) {
  return {
    capabilityUnavailable: false,
    errorMessage: null,
    lastSuccessfulAt: null,
    markAllRead: jest.fn(async () => undefined),
    markRead,
    notifications,
    partial: false,
    readActionError: null,
    refreshing: false,
    refresh: jest.fn(async () => true),
    sessionKey: 'session-1',
    unreadCount: notifications.length,
  };
}

describe('NotificationDetailsScreen', () => {
  beforeEach(() => {
    mockRole = 'field_reporter';
    mockLanguage = 'en';
    jest.clearAllMocks();
    mockUseNotificationDestinations.mockReturnValue(new Map());
    mockParams.mockReturnValue({ id: NOTIFICATION.id });
    mockUseMobileNotifications.mockReturnValue(notificationState([NOTIFICATION]));
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

  it('localizes notification-detail chrome but preserves office-authored text', async () => {
    mockRole = 'farmer';
    mockLanguage = 'tl';
    await render(<NotificationDetailsScreen />);

    expect(screen.getByText('Update mula sa opisina')).toBeOnTheScreen();
    expect(screen.getByText('Payo')).toBeOnTheScreen();
    expect(screen.getByTestId('notification.details.title')).toHaveTextContent('Inspect affected leaves');
    expect(screen.getByTestId('notification.details.body')).toHaveTextContent(
      'Inspect the affected leaves and capture clear evidence during the visit.',
    );
    expect(screen.getByText('Mensahe ng opisina')).toBeOnTheScreen();
    expect(screen.queryByText('Office update')).toBeNull();
  });

  it('preserves a legacy office update exactly as authored', async () => {
    mockParams.mockReturnValue({ id: LEGACY_NOTIFICATION.id });
    mockUseMobileNotifications.mockReturnValue(notificationState([LEGACY_NOTIFICATION]));

    await render(<NotificationDetailsScreen />);

    expect(screen.getByTestId('notification.details.title')).toHaveTextContent(
      'Field validation assigned',
    );
    expect(screen.getByTestId('notification.details.body')).toHaveTextContent(
      'A field validation assignment is ready.',
    );
  });

  // Intent: a detail view for a case that is not on this phone still states why it cannot open.
  it('states the case is not on this phone when its destination is unavailable', async () => {
    mockUseNotificationDestinations.mockReturnValue(
      new Map([[NOTIFICATION.id, { kind: 'unavailable' }]]),
    );

    await render(<NotificationDetailsScreen />);

    expect(screen.getByTestId('notification.details.not-on-phone')).toHaveTextContent(
      'Not on this phone: open on the web',
    );
    expect(screen.queryByTestId('notification.details.open-related')).not.toBeOnTheScreen();
  });

  it('offers the related activity instead of the fallback when the case is on this phone', async () => {
    mockUseNotificationDestinations.mockReturnValue(
      new Map([[NOTIFICATION.id, { kind: 'field_report', scanRecordId: 'scan-1' }]]),
    );

    await render(<NotificationDetailsScreen />);

    expect(screen.getByTestId('notification.details.open-related')).toBeOnTheScreen();
    expect(screen.queryByTestId('notification.details.not-on-phone')).not.toBeOnTheScreen();
  });
});
