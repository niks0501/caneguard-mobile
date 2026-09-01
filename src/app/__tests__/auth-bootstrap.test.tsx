import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthProvider } from '@/features/auth/providers/AuthProvider';

const fetchMock = jest.fn();

jest.mock('@/features/auth/services/tokenStore', () => ({
  clearLegacyMobileSession: jest.fn(async () => false),
  clearMobileSession: jest.fn(async () => undefined),
  hasCompletedMobileLogin: jest.fn(async () => false),
  isBiometricUnlockEnabled: jest.fn(async () => false),
  markMobileLoginCompleted: jest.fn(async () => undefined),
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

function wrapper({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('cached session bootstrap', () => {
  beforeEach(() => {
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('does not restore a cached password session on cold start', async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.session).toBeNull();
  });
});
