import { createHash } from 'node:crypto';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import {
  APP_PIN_MAX_ATTEMPTS,
  AppPinStoreError,
  clearAppPin,
  hasAppPinConfigured,
  isValidAppPin,
  saveAppPin,
  verifyAppPin,
} from '@/features/auth/services/appPinAuth';

const mockStore = new Map<string, string>();

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: jest.fn(async (_alg: string, data: string) => `hash(${data})`),
  randomUUID: jest.fn(() => 'salt-uuid-1234-5678'),
}));

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'device-only',
  deleteItemAsync: jest.fn(async (key: string) => {
    mockStore.delete(key);
  }),
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
}));

describe('appPinAuth (4-digit CaneGuard Quick PIN)', () => {
  beforeEach(() => {
    mockStore.clear();
    jest.clearAllMocks();
    jest.mocked(Crypto.digestStringAsync).mockImplementation(async (_alg, data) =>
      createHash('sha256').update(data).digest('hex'),
    );
  });

  it('validates exactly 4 numeric digits', () => {
    expect(isValidAppPin('1234')).toBe(true);
    expect(isValidAppPin('0000')).toBe(true);
    expect(isValidAppPin('123')).toBe(false);
    expect(isValidAppPin('12345')).toBe(false);
    expect(isValidAppPin('12a4')).toBe(false);
  });

  it('stores a salted hash rather than the plaintext PIN and verifies it', async () => {
    await expect(hasAppPinConfigured()).resolves.toBe(false);
    await saveAppPin('2580');

    await expect(hasAppPinConfigured()).resolves.toBe(true);
    const stored = mockStore.get('caneguard.mobile.app-pin.v1') ?? '';
    expect(stored).not.toContain('2580');
    expect(stored).toContain('salt-uuid-1234-5678');

    await expect(verifyAppPin('2580')).resolves.toEqual({ success: true });
  });

  it('rejects invalid PIN format on save', async () => {
    await expect(saveAppPin('12')).rejects.toBeInstanceOf(AppPinStoreError);
    await expect(hasAppPinConfigured()).resolves.toBe(false);
  });

  it('counts failed attempts, resets on success, and locks out after 5 wrong tries', async () => {
    await saveAppPin('4321');

    const fail1 = await verifyAppPin('0000');
    expect(fail1).toMatchObject({
      success: false,
      code: 'INVALID_PIN',
      attemptsRemaining: APP_PIN_MAX_ATTEMPTS - 1,
    });

    // A valid attempt resets the counter.
    await expect(verifyAppPin('4321')).resolves.toEqual({ success: true });

    for (let i = 1; i < APP_PIN_MAX_ATTEMPTS; i += 1) {
      const attempt = await verifyAppPin('9999');
      expect(attempt).toMatchObject({
        success: false,
        code: 'INVALID_PIN',
        attemptsRemaining: APP_PIN_MAX_ATTEMPTS - i,
      });
    }

    const lockout = await verifyAppPin('9999');
    expect(lockout).toMatchObject({
      success: false,
      code: 'LOCKED_OUT',
    });
    await expect(hasAppPinConfigured()).resolves.toBe(false);
  });

  it('clears the stored Quick PIN on request', async () => {
    await saveAppPin('7777');
    await clearAppPin();
    await expect(hasAppPinConfigured()).resolves.toBe(false);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      'caneguard.mobile.app-pin.v1',
      { keychainAccessible: 'device-only' },
    );
  });
});
