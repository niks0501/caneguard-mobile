import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import {
  DeviceIdentityError,
  getOrCreateMobileDeviceId,
  isOpaqueDeviceId,
} from '@/features/auth/services/deviceIdentity';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => '123e4567-e89b-42d3-a456-426614174000'),
}));
jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'device-only',
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
}));

describe('mobile installation identity', () => {
  const mockRandomUUID = jest.mocked(Crypto.randomUUID);
  const mockGet = jest.mocked(SecureStore.getItemAsync);
  const mockSet = jest.mocked(SecureStore.setItemAsync);

  beforeEach(() => {
    mockRandomUUID.mockReturnValue('123e4567-e89b-42d3-a456-426614174000');
    mockGet.mockReset();
    mockGet.mockResolvedValue(null);
    mockSet.mockReset();
    mockSet.mockResolvedValue(undefined);
  });

  it('reuses a valid opaque installation identity', async () => {
    mockGet.mockResolvedValueOnce('123e4567-e89b-42d3-a456-426614174000');

    await expect(getOrCreateMobileDeviceId()).resolves.toBe(
      '123e4567-e89b-42d3-a456-426614174000',
    );
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('creates and securely stores an identity when none exists', async () => {
    await expect(getOrCreateMobileDeviceId()).resolves.toBe(
      '123e4567-e89b-42d3-a456-426614174000',
    );
    expect(mockRandomUUID).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith(
      'caneguard.mobile.device-id.v1',
      '123e4567-e89b-42d3-a456-426614174000',
      { keychainAccessible: 'device-only' },
    );
  });

  it('replaces an invalid stored value instead of using a hardware identifier', async () => {
    mockGet.mockResolvedValueOnce('device-name-or-hardware-id');

    await expect(getOrCreateMobileDeviceId()).resolves.toBe(
      '123e4567-e89b-42d3-a456-426614174000',
    );
    expect(mockSet).toHaveBeenCalled();
    expect(isOpaqueDeviceId('device-name-or-hardware-id')).toBe(false);
  });

  it('maps secure storage failures to a stable identity error', async () => {
    mockGet.mockRejectedValueOnce(new Error('storage unavailable'));

    await expect(getOrCreateMobileDeviceId()).rejects.toBeInstanceOf(
      DeviceIdentityError,
    );
  });
});
