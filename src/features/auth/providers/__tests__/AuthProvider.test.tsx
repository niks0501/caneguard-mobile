import type { PropsWithChildren } from 'react';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react-native';

import {
  changePassword,
  enrollMobileDevice,
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
  disableBiometricUnlock,
  isBiometricUnlockEnabled,
  readMobileSession,
  readProtectedMobileSession,
  saveMobileSession,
  saveProtectedMobileSession,
} from '@/features/auth/services/tokenStore';
import { getOrCreateMobileDeviceId } from '@/features/auth/services/deviceIdentity';
import {
  authenticateWithBiometrics,
  getBiometricCapability,
} from '@/features/auth/services/biometricAuth';
import type { MobileSession } from '@/features/auth/types';

jest.mock('expo-device', () => ({
  deviceName: 'Test Android phone',
  modelName: 'Test model',
}));
jest.mock('@/features/auth/api/mobileAuthApi', () => {
  const actual = jest.requireActual('@/features/auth/api/mobileAuthApi');
  return {
    ...actual,
    changePassword: jest.fn(),
    enrollMobileDevice: jest.fn(),
    loginMobile: jest.fn(),
    logoutMobile: jest.fn(),
    verifyMobileSession: jest.fn(),
  };
});
jest.mock('@/features/auth/services/tokenStore', () => ({
  BiometricSessionError: class BiometricSessionError extends Error {
    code = 'ACCESS_FAILED';
  },
  StoredSessionExpiredError: class StoredSessionExpiredError extends Error {},
  clearMobileSession: jest.fn(async () => undefined),
  disableBiometricUnlock: jest.fn(async () => undefined),
  isBiometricUnlockEnabled: jest.fn(async () => false),
  readMobileSession: jest.fn(async () => null),
  readProtectedMobileSession: jest.fn(async () => null),
  saveMobileSession: jest.fn(async () => undefined),
  saveProtectedMobileSession: jest.fn(async () => undefined),
}));

jest.mock('@/features/auth/services/deviceIdentity', () => ({
  DeviceIdentityError: class DeviceIdentityError extends Error {},
  getOrCreateMobileDeviceId: jest.fn(async () => 'installation-uuid'),
}));
jest.mock('@/features/auth/services/biometricAuth', () => ({
  authenticateWithBiometrics: jest.fn(async () => ({ success: false, code: 'CANCELLED', message: 'Cancelled' })),
  getBiometricCapability: jest.fn(async () => ({
    deviceCredentialAvailable: true,
    status: 'available',
    strongBiometricsAvailable: true,
  })),
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

function wrapper({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>;
}

function AuthenticatedHomeRoute() {
  const { status } = useAuth();
  return status === 'authenticated' ? <HomeScreen /> : null;
}

describe('AuthProvider', () => {
  const mockChangePassword = jest.mocked(changePassword);
  const mockEnroll = jest.mocked(enrollMobileDevice);
  const mockLogin = jest.mocked(loginMobile);
  const mockLogout = jest.mocked(logoutMobile);
  const mockVerify = jest.mocked(verifyMobileSession);
  const mockRead = jest.mocked(readMobileSession);
  const mockReadProtected = jest.mocked(readProtectedMobileSession);
  const mockSave = jest.mocked(saveMobileSession);
  const mockSaveProtected = jest.mocked(saveProtectedMobileSession);
  const mockClear = jest.mocked(clearMobileSession);
  const mockDisableBiometric = jest.mocked(disableBiometricUnlock);
  const mockBiometricEnabled = jest.mocked(isBiometricUnlockEnabled);
  const mockDeviceId = jest.mocked(getOrCreateMobileDeviceId);
  const mockBiometricAuth = jest.mocked(authenticateWithBiometrics);
  const mockBiometricCapability = jest.mocked(getBiometricCapability);

  afterEach(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    mockChangePassword.mockReset();
    mockEnroll.mockReset();
    mockLogout.mockReset();
    mockLogout.mockResolvedValue(undefined);
    mockLogin.mockReset();
    mockVerify.mockReset();
    mockRead.mockReset();
    mockRead.mockResolvedValue(null);
    mockReadProtected.mockReset();
    mockReadProtected.mockResolvedValue(null);
    mockSave.mockReset();
    mockSave.mockResolvedValue(undefined);
    mockSaveProtected.mockReset();
    mockSaveProtected.mockResolvedValue(undefined);
    mockClear.mockReset();
    mockClear.mockResolvedValue(undefined);
    mockDisableBiometric.mockReset();
    mockDisableBiometric.mockResolvedValue(undefined);
    mockBiometricEnabled.mockReset();
    mockBiometricEnabled.mockResolvedValue(false);
    mockDeviceId.mockResolvedValue('installation-uuid');
    mockBiometricAuth.mockResolvedValue({
      code: 'CANCELLED',
      message: 'Cancelled',
      success: false,
    });
    mockBiometricCapability.mockResolvedValue({
      deviceCredentialAvailable: true,
      status: 'available',
      strongBiometricsAvailable: true,
    });
  });

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
      deviceId: 'installation-uuid',
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

  it('expires a cached session at its fixed server deadline and attempts revocation', async () => {
    jest.useFakeTimers();
    const expiringSession = {
      ...SESSION,
      expiresAt: new Date(Date.now() + 1_000).toISOString(),
    };
    mockRead.mockResolvedValueOnce(expiringSession);
    mockVerify.mockResolvedValueOnce(expiringSession.user);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.status).toBe('authenticated');
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1_001);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.session).toBeNull();
    expect(mockClear).toHaveBeenCalled();
    expect(mockLogout).toHaveBeenCalledWith(expiringSession.token);
  });

  it('keeps password login available after biometric cancellation', async () => {
    mockBiometricEnabled.mockResolvedValueOnce(true).mockResolvedValue(false);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    expect(result.current.biometricEnabled).toBe(true);

    mockLogin.mockResolvedValueOnce(SESSION);
    await act(async () => {
      await expect(result.current.login('field@caneguard.test', 'password')).resolves.toBe(
        true,
      );
    });

    expect(result.current.status).toBe('authenticated');
    expect(mockSave).toHaveBeenCalledWith(SESSION);
  });

  it('unlocks the protected cached session without changing its expiry', async () => {
    mockBiometricEnabled.mockResolvedValueOnce(true);
    mockBiometricAuth.mockResolvedValueOnce({ success: true });
    mockReadProtected.mockResolvedValueOnce(SESSION);
    mockVerify.mockResolvedValueOnce(SESSION.user);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.sessionVerification).toBe('verified'));

    expect(result.current.session?.expiresAt).toBe(SESSION.expiresAt);
    expect(mockReadProtected).toHaveBeenCalled();
  });

  it('clears protected local state on logout after biometric enablement', async () => {
    mockLogin.mockResolvedValueOnce(SESSION);
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    await act(async () => {
      await result.current.login('field@caneguard.test', 'password');
    });
    mockBiometricAuth.mockResolvedValueOnce({ success: true });
    await act(async () => {
      await expect(result.current.enableBiometricUnlock()).resolves.toBe(true);
    });
    expect(mockSaveProtected).toHaveBeenCalledWith(SESSION);

    await act(async () => {
      await result.current.logout();
    });
    expect(mockClear).toHaveBeenCalled();
    expect(result.current.biometricEnabled).toBe(false);
    expect(result.current.status).toBe('unauthenticated');
  });

  it('rotates the session during password-protected installation enrollment', async () => {
    mockLogin.mockResolvedValueOnce(SESSION);
    const rotatedSession = {
      ...SESSION,
      token: 'rotated-session-value',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000).toISOString(),
    };
    mockEnroll.mockResolvedValueOnce(rotatedSession);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    await act(async () => {
      await result.current.login('field@caneguard.test', 'password');
      await expect(
        result.current.enrollMobileDevice('current-password', 'Test installation'),
      ).resolves.toBe(true);
    });

    expect(mockEnroll).toHaveBeenCalledWith('test-session-value', {
      currentPassword: 'current-password',
      deviceId: 'installation-uuid',
      deviceName: 'Test installation',
    });
    expect(mockSave).toHaveBeenLastCalledWith(rotatedSession);
    expect(result.current.session).toEqual(rotatedSession);
  });

  it('clears credentials when a security step-up receives authoritative rejection', async () => {
    mockLogin.mockResolvedValueOnce(SESSION);
    mockChangePassword.mockRejectedValueOnce(
      new MobileAuthError('SESSION_EXPIRED', 'Rejected'),
    );

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    await act(async () => {
      await result.current.login('field@caneguard.test', 'password');
      await expect(
        result.current.changePassword({
          currentPassword: 'current-password',
          password: 'new-password-value',
        }),
      ).resolves.toBe(false);
    });

    expect(mockClear).toHaveBeenCalled();
    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.session).toBeNull();
  });
});
