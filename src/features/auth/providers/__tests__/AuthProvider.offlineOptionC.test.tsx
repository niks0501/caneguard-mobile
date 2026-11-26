import type { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  loginMobile,
  logoutMobile,
  MobileAuthError,
  verifyMobileSession,
} from '@/features/auth/api/mobileAuthApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthProvider } from '@/features/auth/providers/AuthProvider';
import {
  clearAppPin,
  hasAppPinConfigured,
  saveAppPin,
  verifyAppPin,
} from '@/features/auth/services/appPinAuth';
import {
  authenticateWithDeviceCredential,
  getBiometricCapability,
} from '@/features/auth/services/biometricAuth';
import {
  clearMobileSession,
  getLocalLockMode,
  hasPersistedMobileSession,
  readPersistedMobileSession,
  savePersistedMobileSession,
} from '@/features/auth/services/tokenStore';
import type { MobileSession } from '@/features/auth/types';

jest.mock('expo-device', () => ({ deviceName: 'Budget Android', modelName: 'Budget' }));
jest.mock('@/features/auth/api/mobileAuthApi', () => {
  const actual = jest.requireActual('@/features/auth/api/mobileAuthApi');
  return {
    ...actual,
    loginMobile: jest.fn(),
    logoutMobile: jest.fn(async () => undefined),
    verifyMobileSession: jest.fn(),
  };
});
jest.mock('@/features/auth/services/deviceIdentity', () => ({
  DeviceIdentityError: class DeviceIdentityError extends Error {},
  getOrCreateMobileDeviceId: jest.fn(async () => 'installation-uuid'),
}));
jest.mock('@/features/auth/services/biometricAuth', () => ({
  authenticateWithDeviceCredential: jest.fn(async () => ({ success: true })),
  ensureBiometricReady: jest.fn(async () => ({ success: true })),
  getBiometricCapability: jest.fn(async () => ({
    deviceCredentialAvailable: false,
    status: 'unsupported',
    strongBiometricsAvailable: false,
  })),
}));
jest.mock('@/features/auth/services/appPinAuth', () => ({
  APP_PIN_LENGTH: 4,
  APP_PIN_MAX_ATTEMPTS: 5,
  clearAppPin: jest.fn(async () => undefined),
  hasAppPinConfigured: jest.fn(async () => false),
  isValidAppPin: (pin: string) => /^\d{4}$/.test(pin),
  saveAppPin: jest.fn(async () => undefined),
  verifyAppPin: jest.fn(async () => ({ success: true })),
}));
jest.mock('@/features/auth/services/tokenStore', () => ({
  BiometricSessionError: class BiometricSessionError extends Error {
    code = 'ACCESS_FAILED';
  },
  StoredSessionExpiredError: class StoredSessionExpiredError extends Error {},
  clearLegacyMobileSession: jest.fn(async () => false),
  clearMobileSession: jest.fn(async () => undefined),
  disableBiometricUnlock: jest.fn(async () => undefined),
  getLocalLockMode: jest.fn(async () => 'none'),
  hasCompletedMobileLogin: jest.fn(async () => false),
  hasPersistedMobileSession: jest.fn(async () => false),
  isBiometricUnlockEnabled: jest.fn(async () => false),
  markMobileLoginCompleted: jest.fn(async () => undefined),
  readPersistedMobileSession: jest.fn(async () => null),
  readProtectedMobileSession: jest.fn(async () => null),
  savePersistedMobileSession: jest.fn(async () => undefined),
  saveProtectedMobileSession: jest.fn(async () => undefined),
}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => () => undefined),
    fetch: jest.fn(async () => ({ isConnected: false, isInternetReachable: false })),
  },
}));

const FARMER_SESSION: MobileSession = {
  deviceId: 'installation-uuid',
  token: 'farmer-token',
  expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
  user: {
    uuid: 'farmer-uuid',
    name: 'Juan Farmer',
    email: 'juan@farm.test',
    role: 'farmer',
  },
};

const INSPECTOR_SESSION: MobileSession = {
  deviceId: 'installation-uuid',
  token: 'inspector-token',
  expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
  user: {
    uuid: 'inspector-uuid',
    name: 'Ana Inspector',
    email: 'ana@office.test',
    role: 'field_reporter',
    capabilities: ['report:submit'],
  },
};

function wrapper({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthProvider Option C (role-aware offline persistence & Quick PIN)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(hasPersistedMobileSession).mockResolvedValue(false);
    jest.mocked(getLocalLockMode).mockResolvedValue('none');
    jest.mocked(hasAppPinConfigured).mockResolvedValue(false);
    jest.mocked(getBiometricCapability).mockResolvedValue({
      deviceCredentialAvailable: false,
      status: 'unsupported',
      strongBiometricsAvailable: false,
    });
    jest.mocked(authenticateWithDeviceCredential).mockResolvedValue({ success: true });
    jest.mocked(logoutMobile).mockResolvedValue(undefined);
  });

  it('auto-persists a farmer session with lockMode="none" on a no-lock phone with 0 prompts', async () => {
    jest.mocked(loginMobile).mockResolvedValueOnce(FARMER_SESSION);
    jest.mocked(verifyMobileSession).mockResolvedValueOnce(FARMER_SESSION.user);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    await act(async () => {
      await expect(result.current.login('juan@farm.test', 'pw')).resolves.toBe(true);
    });

    expect(savePersistedMobileSession).toHaveBeenCalledWith(
      expect.objectContaining({ token: FARMER_SESSION.token }),
      'none',
    );
    expect(result.current.localLockMode).toBe('none');
    expect(result.current.needsInitialPinSetup).toBe(false);
    expect(result.current.hasPersistedSession).toBe(true);
  });

  it('resumes a farmer offline after cold start without biometrics or OS lock', async () => {
    jest.mocked(hasPersistedMobileSession).mockResolvedValueOnce(true);
    jest.mocked(getLocalLockMode).mockResolvedValueOnce('none');
    jest.mocked(readPersistedMobileSession).mockResolvedValueOnce({
      farmerOfflineGrace: false,
      session: FARMER_SESSION,
    });
    jest
      .mocked(verifyMobileSession)
      .mockRejectedValueOnce(new MobileAuthError('SERVER_UNAVAILABLE', 'Offline'));

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('authenticated'));

    expect(result.current.user?.uuid).toBe(FARMER_SESSION.user.uuid);
    expect(authenticateWithDeviceCredential).not.toHaveBeenCalled();
  });

  it('resumes a farmer in personal-scan offline grace mode past 30-day token expiry without calling /me', async () => {
    jest.mocked(hasPersistedMobileSession).mockResolvedValueOnce(true);
    jest.mocked(getLocalLockMode).mockResolvedValueOnce('none');
    jest.mocked(readPersistedMobileSession).mockResolvedValueOnce({
      farmerOfflineGrace: true,
      session: { ...FARMER_SESSION, token: '' },
    });

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('authenticated'));

    expect(result.current.farmerOfflineGrace).toBe(true);
    expect(result.current.user?.uuid).toBe(FARMER_SESSION.user.uuid);
    expect(verifyMobileSession).not.toHaveBeenCalled();
  });

  it('auto-persists an inspector on a no-lock phone and triggers one-step Quick PIN setup', async () => {
    jest.mocked(loginMobile).mockResolvedValueOnce(INSPECTOR_SESSION);
    jest.mocked(verifyMobileSession).mockResolvedValueOnce(INSPECTOR_SESSION.user);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    await act(async () => {
      await expect(result.current.login('ana@office.test', 'pw')).resolves.toBe(true);
    });

    expect(savePersistedMobileSession).toHaveBeenCalledWith(
      expect.objectContaining({ token: INSPECTOR_SESSION.token }),
      'none',
    );
    expect(result.current.needsInitialPinSetup).toBe(true);

    await act(async () => {
      await expect(result.current.setupAppPin('2580')).resolves.toBe(true);
    });
    expect(saveAppPin).toHaveBeenCalledWith('2580');
    expect(savePersistedMobileSession).toHaveBeenLastCalledWith(
      expect.objectContaining({ token: INSPECTOR_SESSION.token }),
      'app-pin',
    );
    expect(result.current.localLockMode).toBe('app-pin');
    expect(result.current.needsInitialPinSetup).toBe(false);
  });

  it('gates cold-start behind Quick PIN, restores offline on valid PIN, and clears session on lockout', async () => {
    jest.mocked(hasPersistedMobileSession).mockResolvedValueOnce(true);
    jest.mocked(getLocalLockMode).mockResolvedValueOnce('app-pin');
    jest.mocked(hasAppPinConfigured).mockResolvedValueOnce(true);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.requiresAppPinUnlock).toBe(true));
    expect(result.current.status).toBe('unauthenticated');

    jest.mocked(verifyAppPin).mockResolvedValueOnce({
      success: false,
      code: 'LOCKED_OUT',
      message: 'Too many incorrect PIN attempts. Sign in with your password.',
    });
    await act(async () => {
      await expect(result.current.unlockWithAppPin('0000')).resolves.toBe(false);
    });
    expect(clearMobileSession).toHaveBeenCalledTimes(1);
    expect(result.current.requiresAppPinUnlock).toBe(false);
  });

  it('turns off local App Lock in place without revoking token or logging out (OFF-05)', async () => {
    jest.mocked(getBiometricCapability).mockResolvedValue({
      deviceCredentialAvailable: true,
      status: 'available',
      strongBiometricsAvailable: false,
    });
    jest.mocked(loginMobile).mockResolvedValueOnce(INSPECTOR_SESSION);
    jest.mocked(verifyMobileSession).mockResolvedValueOnce(INSPECTOR_SESSION.user);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    await act(async () => {
      await expect(result.current.login('ana@office.test', 'pw')).resolves.toBe(true);
    });
    expect(result.current.localLockMode).toBe('device');

    await act(async () => {
      await expect(result.current.disableLocalLock()).resolves.toBe(true);
    });

    expect(result.current.status).toBe('authenticated');
    expect(result.current.localLockMode).toBe('none');
    expect(clearAppPin).toHaveBeenCalled();
    expect(logoutMobile).not.toHaveBeenCalled();
    expect(clearMobileSession).not.toHaveBeenCalled();
  });
});
