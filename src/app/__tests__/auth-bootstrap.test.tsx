import { act, render, screen } from '@testing-library/react-native';

import HomeScreen from '@/app/home';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthProvider } from '@/features/auth/providers/AuthProvider';
import { DEFAULT_API_TIMEOUT_MS } from '@/features/shared/api/apiClient';
import type { MobileSession } from '@/features/auth/types';

const fetchMock = jest.fn();

const mockSession: MobileSession = {
  deviceId: 'installation-uuid',
  token: 'test-session-value',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000).toISOString(),
  user: {
    uuid: 'user-uuid',
    name: 'Field Reporter',
    email: 'field@caneguard.test',
    role: 'field_reporter',
  },
};

jest.mock('@/features/auth/services/tokenStore', () => ({
  clearMobileSession: jest.fn(async () => undefined),
  readMobileSession: jest.fn(async () => mockSession),
  saveMobileSession: jest.fn(async () => undefined),
}));
jest.mock('@/features/sync/hooks/useSync', () => ({
  useSync: () => ({
    apiReachability: 'unknown',
    errorMessage: null,
    isOnline: true,
    isSyncing: false,
    lastSuccessfulSyncAt: null,
    pendingCount: 0,
    retryReport: jest.fn(async () => null),
    syncNow: jest.fn(async () => null),
  }),
}));

function AuthenticatedHomeRoute() {
  const { status } = useAuth();
  return status === 'authenticated' ? <HomeScreen /> : null;
}

describe('cached session bootstrap', () => {
  beforeEach(() => {
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders Home and then exposes server unavailability when verification times out', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementationOnce(
      () => new Promise<Response>(() => undefined),
    );

    await act(async () => {
      render(
        <AuthProvider>
          <AuthenticatedHomeRoute />
        </AuthProvider>,
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/v1/mobile/auth/me',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
    expect(screen.getByTestId('home.screen')).toBeOnTheScreen();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(DEFAULT_API_TIMEOUT_MS);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('home.connection-status')).toHaveProp(
      'accessibilityLabel',
      'Server unavailable',
    );
  });
});
