import * as SecureStore from 'expo-secure-store';

import {
  BiometricSessionError,
  clearLegacyMobileSession,
  clearMobileSession,
  disableBiometricUnlock,
  hasCompletedMobileLogin,
  markMobileLoginCompleted,
  readProtectedMobileSession,
  saveProtectedMobileSession,
  SecureSessionStoreError,
  StoredSessionExpiredError,
} from '@/features/auth/services/tokenStore';
import {
  authenticateWithDeviceCredential,
  getBiometricCapability,
} from '@/features/auth/services/biometricAuth';
import type { MobileSession } from '@/features/auth/types';

jest.mock('@/features/auth/services/biometricAuth', () => ({
  authenticateWithDeviceCredential: jest.fn(async () => ({ success: true })),
  getBiometricCapability: jest.fn(async () => ({
    deviceCredentialAvailable: true,
    status: 'available',
    strongBiometricsAvailable: true,
  })),
}));

const mockSecureStoreValues = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'device-only',
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureStoreValues.delete(key);
  }),
  getItemAsync: jest.fn(async (key: string) => mockSecureStoreValues.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStoreValues.set(key, value);
  }),
}));

const SESSION: MobileSession = {
  deviceId: 'installation-uuid',
  token: 'test-session-value',
  expiresAt: '2030-01-01T00:00:00.000Z',
  user: {
    uuid: 'server-user-uuid',
    name: 'Field Reporter',
    email: 'field@caneguard.test',
    role: 'field_reporter',
  },
};

describe('mobile secure session store', () => {
  const protectedOptions = {
    keychainAccessible: 'device-only',
    authenticationPrompt: 'Unlock CaneGuard',
    requireAuthentication: true,
  };
  const mockGet = jest.mocked(SecureStore.getItemAsync);
  const mockSet = jest.mocked(SecureStore.setItemAsync);
  const mockDelete = jest.mocked(SecureStore.deleteItemAsync);

  beforeEach(() => {
    mockSecureStoreValues.clear();
    mockGet.mockReset();
    mockSet.mockReset();
    mockDelete.mockReset();
    mockGet.mockImplementation(async (key) => mockSecureStoreValues.get(key) ?? null);
    mockSet.mockImplementation(async (key, value) => {
      mockSecureStoreValues.set(key, value);
    });
    mockDelete.mockImplementation(async (key) => {
      mockSecureStoreValues.delete(key);
    });
  });

  it('clears the legacy unprotected session during cold-start cleanup', async () => {
    await expect(clearLegacyMobileSession()).resolves.toBe(false);

    expect(mockGet).toHaveBeenCalledWith(
      'caneguard.mobile.session.v1',
      { keychainAccessible: 'device-only' },
    );
    expect(mockDelete).toHaveBeenCalledWith(
      'caneguard.mobile.session.v1',
      { keychainAccessible: 'device-only' },
    );
  });

  it('keeps login history separate from session credentials', async () => {
    await expect(hasCompletedMobileLogin()).resolves.toBe(false);
    mockSecureStoreValues.set('caneguard.mobile.login-history.v1', 'true');
    await expect(hasCompletedMobileLogin()).resolves.toBe(true);
    await markMobileLoginCompleted();

    expect(mockSet).toHaveBeenCalledWith(
      'caneguard.mobile.login-history.v1',
      'true',
      { keychainAccessible: 'device-only' },
    );
  });

  it('rejects a protected session without a scheduled expiry', async () => {
    await expect(
      saveProtectedMobileSession({ ...SESSION, expiresAt: null }),
    ).rejects.toBeInstanceOf(SecureSessionStoreError);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('rejects and removes an expired protected session', async () => {
    mockSecureStoreValues.set(
      'caneguard.mobile.session.protected.v1',
      JSON.stringify({
        ...SESSION,
        expiresAt: '2020-01-01T00:00:00.000Z',
      }),
    );

    await expect(readProtectedMobileSession()).rejects.toBeInstanceOf(
      StoredSessionExpiredError,
    );
    expect(mockDelete).toHaveBeenCalledWith(
      'caneguard.mobile.session.protected.v1',
      protectedOptions,
    );
  });

  it('does not restore malformed or non-field-reporter protected data', async () => {
    mockSecureStoreValues.set(
      'caneguard.mobile.session.protected.v1',
      JSON.stringify({ ...SESSION, user: { ...SESSION.user, role: 'admin' } }),
    );

    await expect(readProtectedMobileSession()).rejects.toMatchObject({
      code: 'ENROLLMENT_CHANGED',
    });
    expect(mockDelete).toHaveBeenCalledWith(
      'caneguard.mobile.session.protected.v1',
      protectedOptions,
    );
  });

  it('stores the session behind a device-credential gate when a PIN is available', async () => {
    await saveProtectedMobileSession(SESSION);

    expect(mockSet).toHaveBeenNthCalledWith(
      1,
      'caneguard.mobile.device-credential-gate.v1',
      'true',
      { keychainAccessible: 'device-only' },
    );
    expect(mockSet).toHaveBeenNthCalledWith(
      2,
      'caneguard.mobile.session.protected.v1',
      JSON.stringify(SESSION),
      { keychainAccessible: 'device-only' },
    );
    expect(mockSet).toHaveBeenNthCalledWith(
      3,
      'caneguard.mobile.biometric-enabled.v1',
      'true',
      { keychainAccessible: 'device-only' },
    );
    expect(mockDelete).toHaveBeenCalledWith(
      'caneguard.mobile.session.v1',
      { keychainAccessible: 'device-only' },
    );
  });

  it('reads a protected session with a finite expiry after biometric authentication', async () => {
    mockSecureStoreValues.set(
      'caneguard.mobile.session.protected.v1',
      JSON.stringify(SESSION),
    );

    await expect(readProtectedMobileSession()).resolves.toEqual(SESSION);
    expect(mockGet).toHaveBeenCalledWith(
      'caneguard.mobile.session.protected.v1',
      protectedOptions,
    );
  });

  it('treats a missing protected value as biometric enrollment change', async () => {
    mockSecureStoreValues.set('caneguard.mobile.biometric-enabled.v1', 'true');

    await expect(readProtectedMobileSession()).rejects.toMatchObject<
      Partial<BiometricSessionError>
    >({ code: 'ENROLLMENT_CHANGED' });
    expect(mockDelete).toHaveBeenCalledWith(
      'caneguard.mobile.biometric-enabled.v1',
      { keychainAccessible: 'device-only' },
    );
  });

  it('clears password, protected, and biometric flag entries without touching scan storage', async () => {
    await clearMobileSession();
    expect(mockDelete).toHaveBeenCalledTimes(4);
    expect(mockDelete).toHaveBeenCalledWith(
      'caneguard.mobile.session.protected.v1',
      protectedOptions,
    );

    await disableBiometricUnlock();
    expect(mockDelete).toHaveBeenCalledWith(
      'caneguard.mobile.biometric-enabled.v1',
      { keychainAccessible: 'device-only' },
    );
  });

  describe('device credential fallback', () => {
    const plainOptions = { keychainAccessible: 'device-only' };

    it('persists a gated session that cannot be read after authentication is cancelled', async () => {
      await saveProtectedMobileSession(SESSION);

      expect(mockSecureStoreValues.get('caneguard.mobile.session.protected.v1')).toBe(
        JSON.stringify(SESSION),
      );
      expect(mockSecureStoreValues.get('caneguard.mobile.device-credential-gate.v1')).toBe(
        'true',
      );
      jest.mocked(authenticateWithDeviceCredential).mockResolvedValueOnce({
        code: 'CANCELLED',
        message: 'Device unlock was cancelled. Sign in with your password.',
        success: false,
      });
      await expect(readProtectedMobileSession()).rejects.toMatchObject({
        code: 'ACCESS_FAILED',
        message: 'Device unlock was cancelled. Sign in with your password.',
      });
      expect(mockGet).not.toHaveBeenCalledWith(
        'caneguard.mobile.session.protected.v1',
        plainOptions,
      );
    });

    it('keeps one session and the matching gate when storage mode changes', async () => {
      await saveProtectedMobileSession(SESSION);
      const protectedSession = { ...SESSION, token: 'protected-session-value' };
      jest.mocked(getBiometricCapability).mockResolvedValueOnce({
        deviceCredentialAvailable: false,
        status: 'available',
        strongBiometricsAvailable: true,
      });

      await saveProtectedMobileSession(protectedSession);

      expect(mockSecureStoreValues).toEqual(
        new Map([
          ['caneguard.mobile.session.protected.v1', JSON.stringify(protectedSession)],
          ['caneguard.mobile.biometric-enabled.v1', 'true'],
        ]),
      );
      expect(authenticateWithDeviceCredential).not.toHaveBeenCalled();
    });

    it('stores the session without OS authentication when no strong biometric exists', async () => {
      jest.mocked(getBiometricCapability).mockResolvedValueOnce({
        deviceCredentialAvailable: true,
        status: 'available',
        strongBiometricsAvailable: false,
      });

      await saveProtectedMobileSession(SESSION);

      expect(mockSet).toHaveBeenCalledWith(
        'caneguard.mobile.session.protected.v1',
        JSON.stringify(SESSION),
        plainOptions,
      );
      expect(mockSet).toHaveBeenCalledWith(
        'caneguard.mobile.device-credential-gate.v1',
        'true',
        plainOptions,
      );
    });

    it('requires the device credential before reading a fallback session', async () => {
      mockSecureStoreValues.set('caneguard.mobile.device-credential-gate.v1', 'true');
      mockSecureStoreValues.set(
        'caneguard.mobile.session.protected.v1',
        JSON.stringify(SESSION),
      );

      await expect(readProtectedMobileSession()).resolves.toEqual(SESSION);
      expect(authenticateWithDeviceCredential).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        'caneguard.mobile.session.protected.v1',
        plainOptions,
      );
    });

    it('does not read the session when the device credential prompt is cancelled', async () => {
      mockSecureStoreValues.set('caneguard.mobile.device-credential-gate.v1', 'true');
      mockSecureStoreValues.set(
        'caneguard.mobile.session.protected.v1',
        JSON.stringify(SESSION),
      );
      jest.mocked(authenticateWithDeviceCredential).mockResolvedValueOnce({
        code: 'CANCELLED',
        message: 'Device unlock was cancelled. Sign in with your password.',
        success: false,
      });

      await expect(readProtectedMobileSession()).rejects.toMatchObject({
        code: 'ACCESS_FAILED',
        message: 'Device unlock was cancelled. Sign in with your password.',
      });
      expect(mockGet).not.toHaveBeenCalledWith(
        'caneguard.mobile.session.protected.v1',
        plainOptions,
      );
    });
  });
});
