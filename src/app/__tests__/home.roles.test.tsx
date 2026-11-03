import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import HomeScreen from '@/app/(tabs)/home';

import type { NeedsAttentionItem } from '@/features/activity/domain/needsAttention';

let mockIsOnline: boolean | null = true;
let mockUserName: string | null = 'Ari Santos';
let mockApiReachability: 'unknown' | 'available' | 'unavailable' = 'unknown';
let mockSessionVerification: 'idle' | 'pending' | 'verified' | 'unavailable' = 'idle';
let mockAttentionItems: NeedsAttentionItem[] = [];
let mockPendingCount = 1;
let mockRole: 'field_reporter' | 'farmer' = 'field_reporter';
let mockScanStates = new Map<string, string>();
let mockInspectorWorkWaiting = false;
let mockLanguage: 'en' | 'tl' = 'en';
let mockSyncError: string | null = null;
let mockIsSyncing = false;
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
      get name() {
        return mockUserName;
      },
      get role() {
        return mockRole;
      },
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
    get inspectorWorkWaiting() {
      return mockInspectorWorkWaiting;
    },
    isSyncing: mockIsSyncing,
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

jest.mock('@/providers/LanguagePreferenceProvider', () => ({
  useLanguagePreference: () => ({ language: mockLanguage }),
}));

jest.mock('@/features/records/hooks/useScanStates', () => ({
  useFarmerScanStates: () => mockScanStates,
}));

const mockRouterPush = router.push as jest.Mock;

describe('HomeScreen by role (P1-5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRole = 'farmer';
    mockLanguage = 'en';
    mockPendingCount = 3;
    mockUnreadCount = 0;
    mockScanStates = new Map();
    mockAttentionItems = [
      {
        bucket: 'today',
        destination: { kind: 'assignment', assignmentId: 'a1' },
        id: 'assignment-a1',
        kind: 'assignment',
        message: 'Brgy · submitted by X',
        meta: 'Due today',
        title: 'Field visit for CG-1',
      },
    ];
  });

  // Proves: farmer Home hides Measure a plot and the visits/office glance.
  it('hides Measure a plot, visits glance and attention card for a farmer', async () => {
    await render(<HomeScreen />);
    expect(screen.queryByTestId('home.field-survey')).toBeNull();
    expect(screen.queryByText('Visits today')).toBeNull();
    expect(screen.queryByText('Waiting to send')).toBeNull();
    expect(screen.queryByText(/visit/i)).toBeNull();
  });

  // Proves: farmer Home leads with Start a scan, then My Scans, then Field guide.
  it('orders Start a scan, My Scans, Field guide for a farmer', async () => {
    await render(<HomeScreen />);
    const tree = JSON.stringify(screen.toJSON());
    const at = (id: string) => tree.indexOf(`"testID":"${id}"`);
    expect(at('home.primary-action')).toBeGreaterThan(-1);
    expect(at('home.primary-action')).toBeLessThan(at('home.my-scans'));
    expect(at('home.my-scans')).toBeLessThan(at('home.disease-reference'));
    expect(screen.getByText('Start a scan')).toBeTruthy();
  });

  // Proves: the My Scans entry shows the Needs-checking count from the shared state derivation.
  it('shows the Needs checking count and opens My Scans', async () => {
    mockScanStates = new Map([
      ['a', 'needs_checking'],
      ['b', 'needs_checking'],
      ['c', 'saved'],
      ['d', 'followed_up'],
    ]);
    await render(<HomeScreen />);
    expect(screen.getByTestId('home.my-scans.needs-checking')).toHaveTextContent('2 Needs checking');
    fireEvent.press(screen.getByTestId('home.my-scans'));
    expect(mockRouterPush).toHaveBeenCalledWith('/activity');
  });

  // Proves: with nothing to check the count is hidden rather than shown as zero.
  it('hides the count when nothing needs checking', async () => {
    mockScanStates = new Map([['c', 'saved']]);
    await render(<HomeScreen />);
    expect(screen.getByTestId('home.my-scans')).toBeTruthy();
    expect(screen.queryByTestId('home.my-scans.needs-checking')).toBeNull();
  });

  // Proves: inspector Home is unchanged (visits glance, Measure a plot, no My Scans card).
  it('keeps the inspector Home with visits, glance and Measure a plot', async () => {
    mockRole = 'field_reporter';
    await render(<HomeScreen />);
    expect(screen.getByTestId('home.field-survey')).toBeTruthy();
    expect(screen.getByText('Visits today')).toBeTruthy();
    expect(screen.queryByTestId('home.my-scans')).toBeNull();
  });
});
