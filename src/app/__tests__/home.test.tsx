import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import HomeScreen from '@/app/(tabs)/home';

import { Spacing } from '@/constants/theme';
import { OFFICE_UPDATES_PILL_CLEARANCE } from '@/features/notifications/components/OfficeUpdatesPill';
import type { NeedsAttentionItem } from '@/features/activity/domain/needsAttention';

let mockIsOnline: boolean | null = true;
let mockApiReachability: 'unknown' | 'available' | 'unavailable' = 'unknown';
let mockSessionVerification: 'idle' | 'pending' | 'verified' | 'unavailable' = 'idle';
let mockAttentionItems: NeedsAttentionItem[] = [];
let mockPendingCount = 1;
let mockSyncError: string | null = null;
const mockMarkRead = jest.fn(async () => undefined);
let mockUnreadCount = 0;
const mockOpenOfficeUpdates = jest.fn();

jest.mock('@/features/notifications/providers/OfficeUpdatesProvider', () => ({
  useOfficeUpdates: () => ({
    close: jest.fn(),
    isOpen: false,
    open: mockOpenOfficeUpdates,
    unreadCount: mockUnreadCount,
  }),
}));

jest.mock('@/features/activity/hooks/useHomeAttention', () => ({
  useHomeAttention: () => ({
    items: mockAttentionItems,
    markRead: mockMarkRead,
    total: mockAttentionItems.length,
  }),
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    sessionVerification: mockSessionVerification,
    user: {
      email: 'ari@example.test',
      name: 'Ari Santos',
      role: 'field_reporter',
      uuid: 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17',
    },
  }),
}));
jest.mock('@/features/sync/hooks/useSync', () => ({
  useSync: () => ({
    apiReachability: mockApiReachability,
    get errorMessage() {
      return mockSyncError;
    },
    get isOnline() {
      return mockIsOnline;
    },
    isSyncing: false,
    lastSuccessfulSyncAt: null,
    get pendingCount() {
      return mockPendingCount;
    },
    get pendingReportsCount() {
      return mockPendingCount;
    },
    pendingSurveysCount: 0,
    pendingCompletionsCount: 0,
    syncNow: jest.fn(async () => null),
  }),
}));

const mockRouterPush = router.push as jest.Mock;

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiReachability = 'unknown';
    mockIsOnline = true;
    mockSessionVerification = 'idle';
    mockAttentionItems = [];
    mockPendingCount = 1;
    mockSyncError = null;
    mockUnreadCount = 0;
  });

  it('leads with one sentence and one button, and drops the dashboard furniture', async () => {
    mockPendingCount = 0;
    await render(<HomeScreen />);

    expect(screen.getByTestId('home.note')).toHaveTextContent('All clear.');
    expect(screen.getByTestId('home.primary-action')).toHaveTextContent('Start a scan');
    expect(screen.queryByTestId('home.connection-status')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('home.today-visits')).not.toBeOnTheScreen();
    expect(screen.queryByText('QUICK ACTIONS')).not.toBeOnTheScreen();
    expect(screen.queryByText('My Activity')).not.toBeOnTheScreen();
    expect(screen.queryByText(/decision support/i)).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('home.primary-action'));
    expect(mockRouterPush).toHaveBeenCalledWith('/scan');
  });

  it('states the send state in the sentence, keeping unsent counts visible', async () => {
    mockPendingCount = 0;
    mockIsOnline = false;
    const view = await render(<HomeScreen />);
    expect(screen.getByTestId('home.note')).toHaveTextContent('Working offline.');

    mockPendingCount = 2;
    await view.rerender(<HomeScreen />);
    expect(screen.getByTestId('home.note')).toHaveTextContent(
      'Working offline. 2 reports waiting to send.',
    );

    mockIsOnline = true;
    mockApiReachability = 'unavailable';
    await view.rerender(<HomeScreen />);
    expect(screen.getByTestId('home.note')).toHaveTextContent(
      'Cannot reach the office. 2 reports waiting to send.',
    );

    mockApiReachability = 'available';
    mockSyncError = 'Upload failed';
    await view.rerender(<HomeScreen />);
    expect(screen.getByTestId('home.note')).toHaveTextContent('2 reports could not send.');
  });

  it('keeps the send state quiet under a work sentence and links it to Activity', async () => {
    mockAttentionItems = [visitItem('assignment-1', 'Mabini', 'today')];
    mockIsOnline = false;
    await render(<HomeScreen />);

    expect(screen.getByTestId('home.note')).toHaveTextContent('One visit today.');
    expect(screen.getByTestId('home.sync-status')).toHaveTextContent(
      'Working offline. 1 report waiting to send.',
    );

    await fireEvent.press(screen.getByTestId('home.sync-status'));
    expect(mockRouterPush).toHaveBeenCalledWith('/activity');
  });

  it('keeps Measure a plot and the Field guide as quiet links', async () => {
    await render(<HomeScreen />);

    expect(screen.getByText('Measure a plot')).toBeOnTheScreen();
    expect(screen.getByText('Field guide')).toBeOnTheScreen();
    expect(screen.queryByText('FIELD GUIDE')).not.toBeOnTheScreen();
    expect(screen.queryByText('Rust')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('home.field-survey'));
    expect(mockRouterPush).toHaveBeenCalledWith('/field-survey');

    await fireEvent.press(screen.getByTestId('home.disease-reference'));
    expect(mockRouterPush).toHaveBeenCalledWith('/field-guide');
  });

  it('omits the Up next list when there are no attention items', async () => {
    mockAttentionItems = [];
    await render(<HomeScreen />);

    expect(screen.queryByTestId('home.needs-attention')).not.toBeOnTheScreen();
  });

  it('opens the first item from the button and lists capped rows led by place', async () => {
    mockAttentionItems = [
      visitItem('assignment-1', 'Mabini', 'today', 'assign-123'),
      {
        id: 'notification-456',
        kind: 'notification',
        title: 'Authority update: Case #456',
        message: 'Review completed by regional office',
        meta: '2 hours ago',
        destination: { kind: 'field_report', scanRecordId: 'scan-456' },
      },
      visitItem('assignment-3', 'Balayan', 'overdue', 'assign-789'),
    ];

    await render(<HomeScreen />);

    expect(screen.getByTestId('home.note')).toHaveTextContent('One visit today. One is overdue.');
    expect(screen.getByTestId('home.primary-action')).toHaveTextContent('Open next visit');
    expect(screen.getByTestId('home.needs-attention')).toBeOnTheScreen();

    // Home is capped at HOME_ATTENTION_ROW_LIMIT (2 rows); a visit leads with its place.
    expect(screen.getByText('Mabini')).toBeOnTheScreen();
    expect(screen.queryByText('Field visit: Mabini')).not.toBeOnTheScreen();
    expect(screen.getByText('Authority update: Case #456')).toBeOnTheScreen();
    expect(screen.queryByText('Balayan')).not.toBeOnTheScreen();
    expect(screen.getByText('See all 3 in Activity')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('home.primary-action'));
    expect(mockRouterPush).toHaveBeenLastCalledWith({
      pathname: '/field-validation',
      params: { assignmentId: 'assign-123' },
    });

    // Tapping notification marks as read and routes to field report
    await fireEvent.press(screen.getByTestId('home.attention.notification-456'));
    expect(mockMarkRead).toHaveBeenCalledWith('456');
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/field-report',
      params: { scanRecordId: 'scan-456' },
    });

    // Tapping See all routes to Activity
    await fireEvent.press(screen.getByTestId('home.needs-attention.see-all'));
    expect(mockRouterPush).toHaveBeenCalledWith('/activity');
  });

  it('floats the office-updates pill over the list and opens the shared panel', async () => {
    mockUnreadCount = 3;
    await render(<HomeScreen />);

    const pill = screen.getByTestId('home.office-updates-pill');
    expect(pill).toBeOnTheScreen();
    expect(pill).toHaveProp(
      'accessibilityLabel',
      '3 office updates. Open office updates.',
    );
    expect(screen.getByText('3 office updates')).toBeOnTheScreen();

    await fireEvent.press(pill);

    expect(mockOpenOfficeUpdates).toHaveBeenCalledTimes(1);
  });

  it('hides the pill when every office update has been read and keeps the list clear', async () => {
    mockUnreadCount = 0;
    await render(<HomeScreen />);

    expect(screen.queryByTestId('home.office-updates-pill')).not.toBeOnTheScreen();
    expect(scrollBottomPadding()).toBe(Spacing.xl);
  });

  it('reserves room while the pill floats and dismisses it until a new update arrives', async () => {
    mockUnreadCount = 2;
    const view = await render(<HomeScreen />);

    // The last card must never sit behind the floating pill.
    expect(scrollBottomPadding()).toBe(OFFICE_UPDATES_PILL_CLEARANCE);

    await fireEvent.press(screen.getByTestId('home.office-updates-pill.dismiss'));

    expect(screen.queryByTestId('home.office-updates-pill')).not.toBeOnTheScreen();
    expect(scrollBottomPadding()).toBe(Spacing.xl);

    mockUnreadCount = 3;
    await view.rerender(<HomeScreen />);

    expect(screen.getByTestId('home.office-updates-pill')).toBeOnTheScreen();
    expect(screen.getByText('3 office updates')).toBeOnTheScreen();
  });
});

function scrollBottomPadding(): number {
  return StyleSheet.flatten(
    screen.getByTestId('home.scroll').props.contentContainerStyle,
  ).paddingBottom;
}

function visitItem(
  id: string,
  place: string,
  bucket: 'today' | 'overdue',
  assignmentId = `assign-${id}`,
): NeedsAttentionItem {
  return {
    bucket,
    id,
    kind: 'assignment',
    title: `Field visit: ${place}`,
    message: `${place} · submitted by Ana Reporter`,
    meta: bucket === 'today' ? 'Visit due today' : 'Visit was due 2026-09-01',
    place,
    destination: { kind: 'assignment', assignmentId },
  };
}
