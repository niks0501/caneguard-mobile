import type { PropsWithChildren } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { loginMobile, verifyMobileSession } from '@/features/auth/api/mobileAuthApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthProvider } from '@/features/auth/providers/AuthProvider';
import {
  isBiometricUnlockEnabled,
  readProtectedMobileSession,
  saveProtectedMobileSession,
} from '@/features/auth/services/tokenStore';
import type { MobileSession } from '@/features/auth/types';

// Regression for "two finger touches per biometric action". The protected
// session is stored with `requireAuthentication`, so the OS prompts on its
// own when that item is read (and, on Android, written). The provider must
// not add a second explicit LocalAuthentication prompt on top of it. Here the
// real biometricAuth service runs against a mocked native layer, and the
// protected store counts the prompts the OS would show.

jest.mock('expo-device', () => ({ deviceName: 'Test phone', modelName: 'Test model' }));
jest.mock('expo-local-authentication', () => ({
  AuthenticationType: { FINGERPRINT: 1 },
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC_WEAK: 2, BIOMETRIC_STRONG: 3 },
  authenticateAsync: jest.fn(async () => ({ success: true })),
  getEnrolledLevelAsync: jest.fn(async () => 3),
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true),
  supportedAuthenticationTypesAsync: jest.fn(async () => [1]),
}));
jest.mock('expo-secure-store', () => ({
  canUseBiometricAuthentication: jest.fn(() => true),
}));
jest.mock('@/features/auth/api/mobileAuthApi', () => {
  const actual = jest.requireActual('@/features/auth/api/mobileAuthApi');
  return {
    ...actual,
    loginMobile: jest.fn(),
    logoutMobile: jest.fn(async () => undefined),
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
  hasCompletedMobileLogin: jest.fn(async () => true),
  isBiometricUnlockEnabled: jest.fn(async () => false),
  markMobileLoginCompleted: jest.fn(async () => undefined),
  readProtectedMobileSession: jest.fn(async () => null),
  saveProtectedMobileSession: jest.fn(async () => undefined),
}));
jest.mock('@/features/auth/services/deviceIdentity', () => ({
  DeviceIdentityError: class DeviceIdentityError extends Error {},
  getOrCreateMobileDeviceId: jest.fn(async () => 'installation-uuid'),
}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => () => undefined),
    fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
  },
}));

const SESSION: MobileSession = {
  deviceId: 'installation-uuid',
  token: 'stored-token',
  expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
  user: {
    uuid: 'user-uuid',
    name: 'Field Reporter',
    email: 'field@caneguard.test',
    role: 'field_reporter',
    capabilities: ['report:submit'],
  },
};

function wrapper({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('biometric prompts per action', () => {
  const mockAuthenticate = jest.mocked(LocalAuthentication.authenticateAsync);
  const mockEnabled = jest.mocked(isBiometricUnlockEnabled);
  const mockRead = jest.mocked(readProtectedMobileSession);
  const mockSave = jest.mocked(saveProtectedMobileSession);
  const mockLogin = jest.mocked(loginMobile);
  const mockVerify = jest.mocked(verifyMobileSession);
  const originalOs = Platform.OS;
  let storePrompts = 0;
  let promptOnStoreWrite = false;

  /** Every fingerprint touch the user would be asked for. */
  const prompts = () => mockAuthenticate.mock.calls.length + storePrompts;

  beforeEach(() => {
    storePrompts = 0;
    promptOnStoreWrite = false;
    mockAuthenticate.mockClear();
    mockEnabled.mockReset();
    mockEnabled.mockResolvedValue(false);
    mockRead.mockReset();
    mockRead.mockImplementation(async () => {
      storePrompts += 1;
      return SESSION;
    });
    mockSave.mockReset();
    mockSave.mockImplementation(async () => {
      if (promptOnStoreWrite) {
        storePrompts += 1;
      }
    });
    mockVerify.mockReset();
    mockVerify.mockResolvedValue(SESSION.user);
    mockLogin.mockReset();
    mockLogin.mockResolvedValue(SESSION);
  });

  afterEach(() => {
    Platform.OS = originalOs;
  });

  it('prompts once when the app is reopened with biometric unlock on', async () => {
    mockEnabled.mockResolvedValue(true);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('authenticated'));

    expect(prompts()).toBe(1);
  });

  it('prompts once for one manual unlock from the login screen', async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    mockEnabled.mockResolvedValue(true);

    await act(async () => {
      await expect(result.current.unlockWithBiometrics()).resolves.toBe(true);
    });

    expect(prompts()).toBe(1);
    expect(result.current.status).toBe('authenticated');
  });

  it.each([
    ['android', true],
    ['ios', false],
  ])('prompts once when enabling biometric unlock on %s', async (os, writePrompts) => {
    Platform.OS = os as typeof Platform.OS;
    promptOnStoreWrite = writePrompts;

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    await act(async () => {
      await result.current.login('field@caneguard.test', 'password');
    });
    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    storePrompts = 0;
    mockAuthenticate.mockClear();

    await act(async () => {
      await expect(result.current.enableBiometricUnlock()).resolves.toBe(true);
    });

    expect(prompts()).toBe(1);
  });
});
