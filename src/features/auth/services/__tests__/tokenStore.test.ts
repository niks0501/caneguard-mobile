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
  StoredSessionExpiredError,
} from '@/features/auth/services/tokenStore';
import type { MobileSession } from '@/features/auth/types';

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'device-only',
  deleteItemAsync: jest.fn(async () => undefined),
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
}));

const SESSION: MobileSession = {
  deviceId: 'installation-uuid',
  token: 'test-session-value',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000).toISOString(),
  user: {
    uuid: 'server-user-uuid',
    name: 'Field Reporter',
    email: 'field@caneguard.test',
    role: 'field_reporter',
  },
};

describe('mobile secure session store', () => {
  const mockGet = jest.mocked(SecureStore.getItemAsync);
  const mockSet = jest.mocked(SecureStore.setItemAsync);
  const mockDelete = jest.mocked(SecureStore.deleteItemAsync);

  beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockReset();
    mockDelete.mockReset();
    mockGet.mockResolvedValue(null);
    mockSet.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
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
    mockGet.mockResolvedValueOnce('true');
    await expect(hasCompletedMobileLogin()).resolves.toBe(true);
    await markMobileLoginCompleted();

    expect(mockSet).toHaveBeenCalledWith(
      'caneguard.mobile.login-history.v1',
      'true',
      { keychainAccessible: 'device-only' },
    );
  });

  it('never persists a protected session without a fixed future expiry', async () => {
    await expect(
      saveProtectedMobileSession({ ...SESSION, expiresAt: null }),
    ).rejects.toThrow('Only an unexpired server session can be stored securely.');
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('rejects and removes an expired protected session', async () => {
    mockGet.mockImplementation(async (key) => {
      if (key === 'caneguard.mobile.session.protected.v1') {
        return JSON.stringify({
          ...SESSION,
          expiresAt: '2020-01-01T00:00:00.000Z',
        });
      }
      return null;
    });

    await expect(readProtectedMobileSession()).rejects.toBeInstanceOf(
      StoredSessionExpiredError,
    );
    expect(mockDelete).toHaveBeenCalledWith(
      'caneguard.mobile.session.protected.v1',
      { keychainAccessible: 'device-only' },
    );
  });

  it('does not restore malformed or non-field-reporter protected data', async () => {
    mockGet.mockResolvedValueOnce(
      JSON.stringify({ ...SESSION, user: { ...SESSION.user, role: 'admin' } }),
    );

    await expect(readProtectedMobileSession()).rejects.toMatchObject({
      code: 'ENROLLMENT_CHANGED',
    });
    expect(mockDelete).toHaveBeenCalledWith(
      'caneguard.mobile.session.protected.v1',
      { keychainAccessible: 'device-only' },
    );
  });

  it('stores the biometric-gated session in device-only SecureStore', async () => {
    await saveProtectedMobileSession(SESSION);

    expect(mockSet).toHaveBeenNthCalledWith(
      1,
      'caneguard.mobile.session.protected.v1',
      JSON.stringify(SESSION),
      { keychainAccessible: 'device-only' },
    );
    expect(mockSet).toHaveBeenNthCalledWith(
      2,
      'caneguard.mobile.biometric-enabled.v1',
      'true',
      { keychainAccessible: 'device-only' },
    );
    expect(mockDelete).toHaveBeenCalledWith(
      'caneguard.mobile.session.v1',
      { keychainAccessible: 'device-only' },
    );
  });

  it('reads the protected session after the provider completes biometric authentication', async () => {
    mockGet.mockResolvedValueOnce(JSON.stringify(SESSION));

    await expect(readProtectedMobileSession()).resolves.toEqual(SESSION);
    expect(mockGet).toHaveBeenCalledWith(
      'caneguard.mobile.session.protected.v1',
      { keychainAccessible: 'device-only' },
    );
  });

  it('treats a missing protected value as biometric enrollment change', async () => {
    mockGet.mockImplementation(async (key) =>
      key === 'caneguard.mobile.biometric-enabled.v1' ? 'true' : null,
    );

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
    expect(mockDelete).toHaveBeenCalledTimes(3);
    expect(mockDelete).toHaveBeenCalledWith(
      'caneguard.mobile.session.protected.v1',
      { keychainAccessible: 'device-only' },
    );

    await disableBiometricUnlock();
    expect(mockDelete).toHaveBeenCalledWith(
      'caneguard.mobile.biometric-enabled.v1',
      { keychainAccessible: 'device-only' },
    );
  });
});
