import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import HomeScreen from '@/app/(tabs)/home';

import type { NeedsAttentionItem } from '@/features/activity/domain/needsAttention';

let mockIsOnline: boolean | null = true;
let mockApiReachability: 'unknown' | 'available' | 'unavailable' = 'unknown';
let mockSessionVerification: 'idle' | 'pending' | 'verified' | 'unavailable' = 'idle';
let mockAttentionItems: NeedsAttentionItem[] = [];
const mockMarkRead = jest.fn(async () => undefined);

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
    errorMessage: null,
    get isOnline() {
      return mockIsOnline;
    },
    isSyncing: false,
    lastSuccessfulSyncAt: null,
    pendingCount: 1,
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
  });

  it('renders separate network and API connection states without a location line', async () => {
    const connectionStates: {
      apiReachability: 'unknown' | 'available' | 'unavailable';
      isOnline: boolean | null;
      label: string;
    }[] = [
      { apiReachability: 'available', isOnline: true, label: 'Online' },
      { apiReachability: 'unknown', isOnline: true, label: 'Network available' },
      { apiReachability: 'unavailable', isOnline: true, label: 'Office unreachable' },
      { apiReachability: 'unknown', isOnline: false, label: 'Offline' },
      { apiReachability: 'unknown', isOnline: null, label: 'Checking connection' },
    ];

    for (const state of connectionStates) {
      mockApiReachability = state.apiReachability;
      mockIsOnline = state.isOnline;
      const rendered = await render(<HomeScreen />);

      expect(screen.getByText('Ari Santos')).toBeOnTheScreen();
      expect(screen.queryByText('Nikko Selwyn')).not.toBeOnTheScreen();
      expect(screen.getAllByText(state.label).length).toBeGreaterThan(0);
      expect(screen.queryByText('Brgy. Cogunan, Nasugbu, Batangas')).not.toBeOnTheScreen();

      await rendered.unmount();
    }
  });

  it('exposes cached-session server unavailability as an accessible Home state', async () => {
    mockSessionVerification = 'unavailable';

    await render(<HomeScreen />);

    expect(screen.getByTestId('home.connection-status')).toHaveProp(
      'accessibilityLabel',
      'Office unreachable',
    );
    expect(screen.getByText('Office unreachable')).toBeOnTheScreen();
  });

  it('shows only the supported education reference classes and links to full guide', async () => {
    await render(<HomeScreen />);

    expect(screen.getByText('DISEASE REFERENCE')).toBeOnTheScreen();
    expect(screen.getByText('Healthy')).toBeOnTheScreen();
    expect(screen.getByText('Mosaic')).toBeOnTheScreen();
    expect(screen.getByText('Rust')).toBeOnTheScreen();
    expect(screen.getByText('Smut')).toBeOnTheScreen();
    expect(screen.queryByText(/Downy Mildew/i)).not.toBeOnTheScreen();
    expect(
      screen.getByText(
        /Observational references for the four sugarcane conditions CaneGuard can check/i,
      ),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('home.disease-reference'));
    expect(mockRouterPush).toHaveBeenCalledWith('/disease-reference');
  });

  it('keeps the live sync row linked to Activity without adding a sync shortcut', async () => {
    await render(<HomeScreen />);

    expect(screen.getByText('1 report waiting to send')).toBeOnTheScreen();
    expect(screen.queryByText('Sync Queue')).not.toBeOnTheScreen();
    expect(screen.queryByText('Help & FAQ')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('home.sync-status'));
    expect(mockRouterPush).toHaveBeenCalledWith('/activity');
  });

  it('shows CaneGuard server unavailability separately from phone network state', async () => {
    mockApiReachability = 'unavailable';
    mockIsOnline = true;

    await render(<HomeScreen />);

    expect(screen.getByText('Office unreachable')).toBeOnTheScreen();
    expect(
      screen.getByText('1 report waiting to send · Cannot reach the office'),
    ).toBeOnTheScreen();
    expect(screen.queryByText('Online')).not.toBeOnTheScreen();
  });

  it('omits the Needs attention card when there are no attention items', async () => {
    mockAttentionItems = [];
    await render(<HomeScreen />);

    expect(screen.queryByTestId('home.needs-attention')).not.toBeOnTheScreen();
  });

  it('renders capped attention items, total count, and navigates from card', async () => {
    mockAttentionItems = [
      {
        id: 'assignment-1',
        kind: 'assignment',
        title: 'Field visit: Juan Dela Cruz',
        message: 'Mabini, Nasugbu, Batangas',
        meta: 'Visit due today',
        destination: { kind: 'assignment', assignmentId: 'assign-123' },
      },
      {
        id: 'notification-456',
        kind: 'notification',
        title: 'Authority update: Case #456',
        message: 'Review completed by regional office',
        meta: '2 hours ago',
        destination: { kind: 'field_report', scanRecordId: 'scan-456' },
      },
      {
        id: 'assignment-3',
        kind: 'assignment',
        title: 'Field visit: Maria Santos',
        message: 'Balayan, Batangas',
        meta: 'Visit was due 2026-09-01',
        destination: { kind: 'assignment', assignmentId: 'assign-789' },
      },
    ];

    await render(<HomeScreen />);

    expect(screen.getByTestId('home.needs-attention')).toBeOnTheScreen();
    expect(screen.getByText('Needs attention')).toBeOnTheScreen();
    expect(screen.getByText('3')).toBeOnTheScreen();

    // Home is capped at HOME_ATTENTION_ROW_LIMIT (2 rows)
    expect(screen.getByText('Field visit: Juan Dela Cruz')).toBeOnTheScreen();
    expect(screen.getByText('Authority update: Case #456')).toBeOnTheScreen();
    expect(screen.queryByText('Field visit: Maria Santos')).not.toBeOnTheScreen();

    // "See all" button is rendered
    expect(screen.getByTestId('home.needs-attention.see-all')).toBeOnTheScreen();
    expect(screen.getByText('See all 3 in Activity')).toBeOnTheScreen();

    // Tapping assignment routes to field validation
    await fireEvent.press(screen.getByTestId('home.attention.assignment-1'));
    expect(mockRouterPush).toHaveBeenCalledWith({
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
});
