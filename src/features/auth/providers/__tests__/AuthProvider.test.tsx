import type { PropsWithChildren } from 'react';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react-native';

import {
  loginMobile,
  logoutMobile,
  MobileAuthError,
  verifyMobileSession,
} from '@/features/auth/api/mobileAuthApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthProvider } from '@/features/auth/providers/AuthProvider';
import HomeScreen from '@/app/home';
import {
  clearMobileSession,
  readMobileSession,
  saveMobileSession,
} from '@/features/auth/services/tokenStore';
import type { MobileSession } from '@/features/auth/types';

jest.mock('expo-device', () => ({
  deviceName: 'Test Android phone',
  modelName: 'Test model',
}));
jest.mock('@/features/auth/api/mobileAuthApi', () => {
  const actual = jest.requireActual('@/features/auth/api/mobileAuthApi');
  return {
    ...actual,
    loginMobile: jest.fn(),
    logoutMobile: jest.fn(),
    verifyMobileSession: jest.fn(),
  };
});
jest.mock('@/features/auth/services/tokenStore', () => ({
  clearMobileSession: jest.fn(async () => undefined),
  readMobileSession: jest.fn(async () => null),
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

const SESSION: MobileSession = {
  token: 'secure-token',
  expiresAt: null,
  user: {
    uuid: 'user-uuid',
    name: 'Field Reporter',
    email: 'field@caneguard.test',
    role: 'field_reporter',
  },
};

function wrapper({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>;
}

function AuthenticatedHomeRoute() {
  const { status } = useAuth();
  return status === 'authenticated' ? <HomeScreen /> : null;
}

describe('AuthProvider', () => {
  const mockLogin = jest.mocked(loginMobile);
  const mockLogout = jest.mocked(logoutMobile);
  const mockVerify = jest.mocked(verifyMobileSession);
  const mockRead = jest.mocked(readMobileSession);
  const mockSave = jest.mocked(saveMobileSession);
  const mockClear = jest.mocked(clearMobileSession);

  it('signs in and stores the verified session securely', async () => {
    mockLogin.mockResolvedValueOnce(SESSION);
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    await act(async () => {
      await expect(
        result.current.login('field@caneguard.test', 'password'),
      ).resolves.toBe(true);
    });

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'field@caneguard.test',
      password: 'password',
      deviceName: 'Test Android phone',
    });
    expect(mockSave).toHaveBeenCalledWith(SESSION);
    expect(result.current.status).toBe('authenticated');
  });

  it('hydrates Home before an unreachable session verification settles', async () => {
    mockRead.mockResolvedValueOnce(SESSION);
    let rejectVerification!: (error: unknown) => void;
    mockVerify.mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        rejectVerification = reject;
      }),
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

    expect(mockVerify).toHaveBeenCalledWith(SESSION.token);
    try {
      expect(screen.getByTestId('home.screen')).toBeOnTheScreen();
    } finally {
      await act(async () => {
        rejectVerification(
          new MobileAuthError(
            'SERVER_UNAVAILABLE',
            'CaneGuard could not reach the server.',
          ),
        );
        await Promise.resolve();
        await Promise.resolve();
      });
    }

    await waitFor(() =>
      expect(screen.getByText('Server unavailable')).toBeOnTheScreen(),
    );
  });

  it('clears a server-rejected restored session', async () => {
    mockRead.mockResolvedValueOnce(SESSION);
    mockVerify.mockRejectedValueOnce(
      new MobileAuthError('INVALID_CREDENTIALS', 'Expired'),
    );

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    expect(mockClear).toHaveBeenCalled();
    expect(result.current.session).toBeNull();
  });

  it('reconciles the cached identity after background verification succeeds', async () => {
    const cachedSession = {
      ...SESSION,
      user: { ...SESSION.user, name: 'Cached reporter' },
    };
    const verifiedUser = { ...SESSION.user, name: 'Current reporter' };
    mockRead.mockResolvedValueOnce(cachedSession);
    mockVerify.mockResolvedValueOnce(verifiedUser);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() =>
      expect(result.current.sessionVerification).toBe('verified'),
    );

    expect(result.current.status).toBe('authenticated');
    expect(result.current.user).toEqual(verifiedUser);
    expect(mockSave).toHaveBeenCalledWith({ ...cachedSession, user: verifiedUser });
  });

  it.each([
    'FORBIDDEN_ROLE',
    'SESSION_EXPIRED',
  ] as const)('clears a restored session for authoritative %s rejection', async (code) => {
    mockRead.mockResolvedValueOnce(SESSION);
    mockVerify.mockRejectedValueOnce(new MobileAuthError(code, 'Rejected'));

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    expect(mockClear).toHaveBeenCalled();
    expect(result.current.session).toBeNull();
  });

  it('ignores a pending verification after logout', async () => {
    mockRead.mockResolvedValueOnce(SESSION);
    let resolveVerification!: (user: MobileSession['user']) => void;
    mockVerify.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveVerification = resolve;
      }),
    );

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    await waitFor(() => expect(mockVerify).toHaveBeenCalled());

    await act(async () => {
      await result.current.logout();
    });
    await act(async () => {
      resolveVerification({ ...SESSION.user, name: 'Late response' });
      await Promise.resolve();
    });

    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.session).toBeNull();
  });

  it('does not reconcile secure storage after unmount during verification', async () => {
    mockRead.mockResolvedValueOnce(SESSION);
    let resolveVerification!: (user: MobileSession['user']) => void;
    mockVerify.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveVerification = resolve;
      }),
    );

    const { unmount } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(mockVerify).toHaveBeenCalled());
    await act(async () => {
      unmount();
      await Promise.resolve();
    });

    await act(async () => {
      resolveVerification({ ...SESSION.user, name: 'Unmounted response' });
      await Promise.resolve();
    });

    expect(mockSave).not.toHaveBeenCalled();
  });

  it('clears locally and reports when remote logout cannot revoke', async () => {
    mockRead.mockResolvedValueOnce(SESSION);
    mockVerify.mockResolvedValueOnce(SESSION.user);
    mockLogout.mockRejectedValueOnce(new Error('offline'));

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('authenticated'));

    await act(async () => {
      await expect(result.current.logout()).resolves.toEqual({
        localClearFailed: false,
        remoteRevocationFailed: true,
      });
    });

    expect(mockClear).toHaveBeenCalled();
    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.session).toBeNull();
  });
});
