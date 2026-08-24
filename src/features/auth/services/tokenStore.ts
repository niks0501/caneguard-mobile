import * as SecureStore from 'expo-secure-store';

import type { MobileSession, MobileUser } from '@/features/auth/types';

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

  let value: unknown;
  try {
    value = JSON.parse(stored) as unknown;
  } catch {
    await clearMobileSession();
    return null;
  }

  if (!isEligibleStoredSession(value)) {
    await clearMobileSession();
    return null;
  }
  return value;
}

function isEligibleStoredSession(value: unknown): value is MobileSession {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as Partial<MobileSession>;
  return (
    typeof session.token === 'string' &&
    session.token.trim().length > 0 &&
    (session.expiresAt === null || isFutureIsoDate(session.expiresAt)) &&
    isMobileUser(session.user)
  );
}

function isMobileUser(value: unknown): value is MobileUser {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const user = value as Partial<MobileUser>;
  return (
    typeof user.uuid === 'string' &&
    user.uuid.trim().length > 0 &&
    typeof user.name === 'string' &&
    user.name.trim().length > 0 &&
    typeof user.email === 'string' &&
    user.email.trim().length > 0 &&
    user.role === 'field_reporter'
  );
}

function isFutureIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

export async function clearMobileSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY, STORE_OPTIONS);
}
