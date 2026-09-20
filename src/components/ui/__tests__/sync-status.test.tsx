import { fireEvent, render, screen } from '@testing-library/react-native';

import { SyncStatusPanel } from '@/components/ui/SyncStatusPanel';
import { SyncStatusRow } from '@/components/ui/SyncStatusRow';
import { ToastProvider } from '@/components/ui/Toast';
import type { ApiReachability } from '@/features/sync/providers/SyncProvider';

type MockSyncState = {
  apiReachability: ApiReachability;
  errorMessage: string | null;
  isOnline: boolean | null;
  isSyncing: boolean;
  lastSuccessfulSyncAt: string | null;
  pendingCount: number;
  retryReport: jest.Mock;
  syncNow: jest.Mock;
};

let mockSyncState: MockSyncState = {
  apiReachability: 'unavailable' as const,
  errorMessage: null,
  isOnline: true as boolean | null,
  isSyncing: false,
  lastSuccessfulSyncAt: null,
  pendingCount: 1,
  retryReport: jest.fn(),
  syncNow: jest.fn(),
};

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ sessionVerification: 'idle' }),
}));
jest.mock('@/features/sync/hooks/useSync', () => ({
  useSync: () => mockSyncState,
}));

describe('sync status UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSyncState = {
      apiReachability: 'unavailable',
      errorMessage: null,
      isOnline: true,
      isSyncing: false,
      lastSuccessfulSyncAt: null,
      pendingCount: 1,
      retryReport: jest.fn(),
      syncNow: jest.fn(),
    };
  });

  it('names server unavailability separately from available phone network', async () => {
    await render(
      <>
        <SyncStatusRow onPress={jest.fn()} />
        <SyncStatusPanel />
      </>,
    );

    expect(
      screen.getByText('1 report awaiting sync · CaneGuard server unavailable'),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('Network available · CaneGuard server unavailable · 1 awaiting upload'),
    ).toBeOnTheScreen();
  });

  it('does not claim that the server is available before a sync observation', async () => {
    mockSyncState = {
      ...mockSyncState,
      apiReachability: 'unknown',
      pendingCount: 0,
    };

    await render(<SyncStatusPanel />);

    expect(
      screen.getByText('Network available · CaneGuard status not checked · 0 awaiting upload'),
    ).toBeOnTheScreen();
  });

  it('displays confirmation toast on successful manual sync', async () => {
    mockSyncState = {
      ...mockSyncState,
      apiReachability: 'available',
      syncNow: jest.fn(async () => ({ authRequired: false, failed: 0, synced: 1 })),
    };

    await render(
      <ToastProvider>
        <SyncStatusPanel />
      </ToastProvider>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Sync reports now' }));
    expect(screen.getByTestId('app-toast')).toBeOnTheScreen();
    expect(screen.getByTestId('app-toast')).toHaveTextContent('Sync complete');
  });
});
