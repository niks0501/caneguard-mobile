import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'caneguard.mobile.device-id.v1';
const DEVICE_ID_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export class DeviceIdentityError extends Error {
  constructor(message = 'CaneGuard could not prepare this installation.') {
    super(message);
    this.name = 'DeviceIdentityError';
  }
}

export async function getOrCreateMobileDeviceId(): Promise<string> {
  try {
    const stored = await SecureStore.getItemAsync(
      DEVICE_ID_KEY,
      DEVICE_ID_OPTIONS,
    );
    if (isOpaqueDeviceId(stored)) {
      return stored;
    }

    const deviceId = Crypto.randomUUID();
    if (!isOpaqueDeviceId(deviceId)) {
      throw new DeviceIdentityError();
    }
    await SecureStore.setItemAsync(
      DEVICE_ID_KEY,
      deviceId,
      DEVICE_ID_OPTIONS,
    );
    return deviceId;
  } catch (error: unknown) {
    if (error instanceof DeviceIdentityError) {
      throw error;
    }
    throw new DeviceIdentityError();
  }
}

export function isOpaqueDeviceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}
