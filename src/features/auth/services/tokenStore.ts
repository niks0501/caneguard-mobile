import * as SecureStore from 'expo-secure-store';

import type { MobileSession } from '@/features/auth/types';

const SESSION_KEY = 'caneguard.mobile.session.v1';
const STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export async function saveMobileSession(session: MobileSession): Promise<void> {
  await SecureStore.setItemAsync(
    SESSION_KEY,
    JSON.stringify(session),
    STORE_OPTIONS,
  );
}

export async function readMobileSession(): Promise<MobileSession | null> {
  const stored = await SecureStore.getItemAsync(SESSION_KEY, STORE_OPTIONS);
  if (!stored) {
    return null;
  }

  try {
    const value = JSON.parse(stored) as Partial<MobileSession>;
    if (
      typeof value.token !== 'string' ||
      !value.token ||
      !value.user ||
      value.user.role !== 'field_reporter' ||
      typeof value.user.uuid !== 'string'
    ) {
      await clearMobileSession();
      return null;
    }
    return value as MobileSession;
  } catch {
    await clearMobileSession();
    return null;
  }
}

export async function clearMobileSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY, STORE_OPTIONS);
}
