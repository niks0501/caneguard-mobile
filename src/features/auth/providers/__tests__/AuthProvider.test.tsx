import { StrictMode, type PropsWithChildren } from 'react';
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
  clearLegacyMobileSession,
  clearMobileSession,
  disableBiometricUnlock,
  hasCompletedMobileLogin,
  isBiometricUnlockEnabled,
  markMobileLoginCompleted,
  readProtectedMobileSession,
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
  clearLegacyMobileSession: jest.fn(async () => false),
  clearMobileSession: jest.fn(async () => undefined),
  disableBiometricUnlock: jest.fn(async () => undefined),
  hasCompletedMobileLogin: jest.fn(async () => false),
  isBiometricUnlockEnabled: jest.fn(async () => false),
  markMobileLoginCompleted: jest.fn(async () => undefined),
  readProtectedMobileSession: jest.fn(async () => null),
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

function strictWrapper({ children }: PropsWithChildren) {
  return (
    <StrictMode>
      <AuthProvider>{children}</AuthProvider>
    </StrictMode>
  );
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
  const mockClearLegacy = jest.mocked(clearLegacyMobileSession);
  const mockLoginHistory = jest.mocked(hasCompletedMobileLogin);
  const mockMarkLogin = jest.mocked(markMobileLoginCompleted);
  const mockReadProtected = jest.mocked(readProtectedMobileSession);
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
    mockClearLegacy.mockReset();
    mockClearLegacy.mockResolvedValue(false);
    mockLoginHistory.mockReset();
    mockLoginHistory.mockResolvedValue(false);
    mockMarkLogin.mockReset();
    mockMarkLogin.mockResolvedValue(undefined);
    mockReadProtected.mockReset();
    mockReadProtected.mockResolvedValue(null);
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

  function prepareProtectedStartup(storedSession = SESSION) {
    mockBiometricEnabled.mockResolvedValueOnce(true);
    mockBiometricAuth.mockResolvedValueOnce({ success: true });
    mockReadProtected.mockResolvedValueOnce(storedSession);
  }

  it('signs in without retaining an unprotected session', async () => {
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
    expect(mockSaveProtected).not.toHaveBeenCalled();
    expect(mockMarkLogin).toHaveBeenCalledTimes(1);
    expect(result.current.hasCompletedLogin).toBe(true);
    expect(result.current.status).toBe('authenticated');
  });

  it('does not silently restore an unprotected session on cold start', async () => {
    mockClearLegacy.mockResolvedValueOnce(true);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    expect(mockClearLegacy).toHaveBeenCalled();
    expect(mockReadProtected).not.toHaveBeenCalled();
    expect(mockVerify).not.toHaveBeenCalled();
    expect(result.current.hasCompletedLogin).toBe(true);
    expect(result.current.session).toBeNull();
  });

  it('hydrates Home before an unreachable session verification settles', async () => {
    prepareProtectedStartup();
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
    prepareProtectedStartup();
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
    prepareProtectedStartup(cachedSession);
    mockVerify.mockResolvedValueOnce(verifiedUser);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() =>
      expect(result.current.sessionVerification).toBe('verified'),
    );

    expect(result.current.status).toBe('authenticated');
    expect(result.current.user).toEqual(verifiedUser);
    expect(mockSaveProtected).not.toHaveBeenCalled();
  });

  it.each([
    'FORBIDDEN_ROLE',
    'SESSION_EXPIRED',
  ] as const)('clears a restored session for authoritative %s rejection', async (code) => {
    prepareProtectedStartup();
    mockVerify.mockRejectedValueOnce(new MobileAuthError(code, 'Rejected'));

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    expect(mockClear).toHaveBeenCalled();
    expect(result.current.session).toBeNull();
  });

  it('ignores a pending verification after logout', async () => {
    prepareProtectedStartup();
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
    prepareProtectedStartup();
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

    expect(mockSaveProtected).not.toHaveBeenCalled();
  });

  it('clears locally and reports when remote logout cannot revoke', async () => {
    prepareProtectedStartup();
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
    prepareProtectedStartup(expiringSession);
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

  it('runs the automatic biometric startup prompt once and keeps the manual fallback configured after cancellation', async () => {
    mockBiometricEnabled.mockResolvedValue(true);
    let resolveBiometric!: (value: {
      code: 'CANCELLED';
      message: string;
      success: false;
    }) => void;
    mockBiometricAuth.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveBiometric = resolve;
      }),
    );

    const { result } = await renderHook(() => useAuth(), {
      wrapper: strictWrapper,
    });
    await waitFor(() => expect(mockBiometricAuth).toHaveBeenCalledTimes(1));

    resolveBiometric({
      code: 'CANCELLED',
      message: 'Cancelled',
      success: false,
    });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    expect(mockBiometricAuth).toHaveBeenCalledTimes(1);
    expect(mockReadProtected).not.toHaveBeenCalled();
    expect(result.current.biometricEnabled).toBe(true);
    expect(result.current.hasCompletedLogin).toBe(true);
  });

  it('uses one biometric prompt and one protected write for one enable action', async () => {
    mockLogin.mockResolvedValueOnce(SESSION);
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    await act(async () => {
      await expect(
        result.current.login('field@caneguard.test', 'password'),
      ).resolves.toBe(true);
    });

    let resolveBiometric!: (value: { success: true }) => void;
    mockBiometricAuth.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveBiometric = resolve;
      }),
    );

    let firstEnable!: Promise<boolean>;
    let secondEnable!: Promise<boolean>;
    await act(async () => {
      firstEnable = result.current.enableBiometricUnlock();
      secondEnable = result.current.enableBiometricUnlock();
      resolveBiometric({ success: true });
      await expect(Promise.all([firstEnable, secondEnable])).resolves.toEqual([
        true,
        true,
      ]);
    });

    expect(mockBiometricAuth).toHaveBeenCalledTimes(1);
    expect(mockSaveProtected).toHaveBeenCalledTimes(1);
  });

  it('uses one biometric prompt and one protected read for one manual unlock action', async () => {
    mockBiometricEnabled.mockResolvedValue(true);
    mockBiometricAuth.mockResolvedValueOnce({
      code: 'CANCELLED',
      message: 'Cancelled',
      success: false,
    });

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    mockBiometricAuth.mockResolvedValueOnce({ success: true });
    mockReadProtected.mockResolvedValueOnce(SESSION);
    mockVerify.mockResolvedValueOnce(SESSION.user);

    let firstUnlock!: Promise<boolean>;
    let secondUnlock!: Promise<boolean>;
    await act(async () => {
      firstUnlock = result.current.unlockWithBiometrics();
      secondUnlock = result.current.unlockWithBiometrics();
      await expect(Promise.all([firstUnlock, secondUnlock])).resolves.toEqual([
        true,
        true,
      ]);
    });

    expect(mockBiometricAuth).toHaveBeenCalledTimes(2);
    expect(mockReadProtected).toHaveBeenCalledTimes(1);
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
    expect(mockSaveProtected).toHaveBeenCalledWith(SESSION);
    expect(mockMarkLogin).toHaveBeenCalledTimes(1);
    expect(result.current.hasCompletedLogin).toBe(true);
  });

  it('keeps a protected session without a scheduled expiry after biometric unlock', async () => {
    mockBiometricEnabled.mockResolvedValueOnce(true);
    mockBiometricAuth.mockResolvedValueOnce({ success: true });
    mockReadProtected.mockResolvedValueOnce(SESSION);
    mockVerify.mockResolvedValueOnce(SESSION.user);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.sessionVerification).toBe('verified'));

    expect(result.current.status).toBe('authenticated');
    expect(result.current.session?.expiresAt).toBeNull();
    expect(mockClear).not.toHaveBeenCalled();
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
      expiresAt: null,
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
    expect(mockSaveProtected).not.toHaveBeenCalled();
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
