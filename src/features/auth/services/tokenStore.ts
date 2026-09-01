import * as SecureStore from 'expo-secure-store';

import type { MobileSession, MobileUser } from '@/features/auth/types';

const SESSION_KEY = 'caneguard.mobile.session.v1';
const PROTECTED_SESSION_KEY = 'caneguard.mobile.session.protected.v1';
const BIOMETRIC_ENABLED_KEY = 'caneguard.mobile.biometric-enabled.v1';

const STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};
// AuthProvider performs the single explicit biometric or device-credential
// gate before protected session restore and biometric enablement. SecureStore's
// requireAuthentication option would start a second Android prompt and cannot
// share the device-credential fallback from expo-local-authentication.
const PROTECTED_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  ...STORE_OPTIONS,
};

export class StoredSessionExpiredError extends Error {
  readonly token: string | null;

  constructor(token: string | null = null) {
    super('The cached CaneGuard session expired.');
    this.name = 'StoredSessionExpiredError';
    this.token = token;
  }
}

export type BiometricSessionErrorCode =
  | 'ACCESS_FAILED'
  | 'ENROLLMENT_CHANGED';

export class BiometricSessionError extends Error {
  readonly code: BiometricSessionErrorCode;

  constructor(code: BiometricSessionErrorCode, message: string) {
    super(message);
    this.name = 'BiometricSessionError';
    this.code = code;
  }
}

export class SecureSessionStoreError extends Error {
  constructor(message = 'Secure session storage is unavailable.') {
    super(message);
    this.name = 'SecureSessionStoreError';
  }
}

export async function saveMobileSession(session: MobileSession): Promise<void> {
  assertPersistableSession(session);
  try {
    // A password login is the explicit fallback after a biometric cancel or
    // enrollment change, so do not leave the old protected credential active.
    if (await isBiometricUnlockEnabled()) {
      await disableBiometricUnlock();
    }
    await SecureStore.setItemAsync(
      SESSION_KEY,
      JSON.stringify(session),
      STORE_OPTIONS,
    );
  } catch (error: unknown) {
    throw toSecureStoreError(error);
  }
}

export async function saveProtectedMobileSession(
  session: MobileSession,
): Promise<void> {
  assertPersistableSession(session);
  try {
    await SecureStore.setItemAsync(
      PROTECTED_SESSION_KEY,
      JSON.stringify(session),
      PROTECTED_STORE_OPTIONS,
    );
    try {
      await SecureStore.setItemAsync(
        BIOMETRIC_ENABLED_KEY,
        'true',
        STORE_OPTIONS,
      );
      await SecureStore.deleteItemAsync(SESSION_KEY, STORE_OPTIONS);
    } catch (error: unknown) {
      await deleteBestEffort(PROTECTED_SESSION_KEY, PROTECTED_STORE_OPTIONS);
      await deleteBestEffort(BIOMETRIC_ENABLED_KEY, STORE_OPTIONS);
      throw error;
    }
  } catch (error: unknown) {
    throw toSecureStoreError(error);
  }
}

export async function readMobileSession(): Promise<MobileSession | null> {
  try {
    return (await isBiometricUnlockEnabled())
      ? await readProtectedMobileSession()
      : await readUnprotectedMobileSession();
  } catch (error: unknown) {
    if (
      error instanceof StoredSessionExpiredError ||
      error instanceof BiometricSessionError
    ) {
      throw error;
    }
    throw toSecureStoreError(error);
  }
}

export async function readProtectedMobileSession(): Promise<MobileSession | null> {
  let stored: string | null;
  try {
    stored = await SecureStore.getItemAsync(
      PROTECTED_SESSION_KEY,
      PROTECTED_STORE_OPTIONS,
    );
  } catch {
    throw new BiometricSessionError(
      'ACCESS_FAILED',
      'Biometric unlock could not access the protected session.',
    );
  }

  if (!stored) {
    await clearMobileSessionBestEffort();
    throw new BiometricSessionError(
      'ENROLLMENT_CHANGED',
      'Biometric enrollment changed. Sign in with your password again.',
    );
  }

  const parsed = await parseStoredSession(stored, true);
  if (!parsed) {
    await clearMobileSessionBestEffort();
    throw new BiometricSessionError(
      'ENROLLMENT_CHANGED',
      'The protected session could not be restored. Sign in with your password again.',
    );
  }
  return parsed;
}

export async function isBiometricUnlockEnabled(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(
      BIOMETRIC_ENABLED_KEY,
      STORE_OPTIONS,
    );
    return value === 'true';
  } catch (error: unknown) {
    throw toSecureStoreError(error);
  }
}

export async function disableBiometricUnlock(): Promise<void> {
  const failures: unknown[] = [];
  for (const [key, options] of [
    [PROTECTED_SESSION_KEY, PROTECTED_STORE_OPTIONS],
    [BIOMETRIC_ENABLED_KEY, STORE_OPTIONS],
  ] as const) {
    try {
      await SecureStore.deleteItemAsync(key, options);
    } catch (error: unknown) {
      failures.push(error);
    }
  }
  if (failures.length > 0) {
    throw toSecureStoreError(failures[0]);
  }
}

export async function clearMobileSession(): Promise<void> {
  const failures: unknown[] = [];
  for (const [key, options] of [
    [SESSION_KEY, STORE_OPTIONS],
    [PROTECTED_SESSION_KEY, PROTECTED_STORE_OPTIONS],
    [BIOMETRIC_ENABLED_KEY, STORE_OPTIONS],
  ] as const) {
    try {
      await SecureStore.deleteItemAsync(key, options);
    } catch (error: unknown) {
      failures.push(error);
    }
  }
  if (failures.length > 0) {
    throw toSecureStoreError(failures[0]);
  }
}

async function readUnprotectedMobileSession(): Promise<MobileSession | null> {
  const stored = await SecureStore.getItemAsync(SESSION_KEY, STORE_OPTIONS);
  if (!stored) {
    return null;
  }
  return parseStoredSession(stored, false);
}

async function parseStoredSession(
  stored: string,
  protectedSession: boolean,
): Promise<MobileSession | null> {
  let value: unknown;
  try {
    value = JSON.parse(stored) as unknown;
  } catch {
    await deleteBestEffort(
      protectedSession ? PROTECTED_SESSION_KEY : SESSION_KEY,
      protectedSession ? PROTECTED_STORE_OPTIONS : STORE_OPTIONS,
    );
    return null;
  }

  if (!isEligibleStoredSession(value)) {
    await deleteBestEffort(
      protectedSession ? PROTECTED_SESSION_KEY : SESSION_KEY,
      protectedSession ? PROTECTED_STORE_OPTIONS : STORE_OPTIONS,
    );
    return null;
  }

  if (value.expiresAt === null || !isFutureIsoDate(value.expiresAt)) {
    await deleteBestEffort(
      protectedSession ? PROTECTED_SESSION_KEY : SESSION_KEY,
      protectedSession ? PROTECTED_STORE_OPTIONS : STORE_OPTIONS,
    );
    await deleteBestEffort(BIOMETRIC_ENABLED_KEY, STORE_OPTIONS);
    throw new StoredSessionExpiredError(value.token);
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
    (session.expiresAt === null || isIsoDate(session.expiresAt)) &&
    isMobileUser(session.user)
  );
}

function assertPersistableSession(session: MobileSession): void {
  if (
    !isEligibleStoredSession(session) ||
    session.expiresAt === null ||
    !isFutureIsoDate(session.expiresAt)
  ) {
    throw new SecureSessionStoreError(
      'Only an unexpired server session can be stored securely.',
    );
  }
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

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  return Number.isFinite(Date.parse(value));
}

function isFutureIsoDate(value: unknown): value is string {
  return isIsoDate(value) && Date.parse(value) > Date.now();
}

async function deleteBestEffort(
  key: string,
  options: SecureStore.SecureStoreOptions,
): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key, options);
  } catch {
    // Cleanup is best effort while handling an invalid or superseded entry.
  }
}

async function clearMobileSessionBestEffort(): Promise<void> {
  try {
    await clearMobileSession();
  } catch {
    // The caller still falls back to password login if cleanup is unavailable.
  }
}

function toSecureStoreError(error: unknown): SecureSessionStoreError {
  if (error instanceof SecureSessionStoreError) {
    return error;
  }
  return new SecureSessionStoreError();
}
