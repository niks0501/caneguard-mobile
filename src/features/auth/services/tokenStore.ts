import * as SecureStore from 'expo-secure-store';

import { clearAppPin } from '@/features/auth/services/appPinAuth';
import {
  authenticateWithDeviceCredential,
  getBiometricCapability,
} from '@/features/auth/services/biometricAuth';
import { parseCapabilityGrant } from '@/features/auth/domain/sessionState';
import {
  isMobileUser,
  type LocalLockMode,
  type MobileSession,
} from '@/features/auth/types';

const LEGACY_SESSION_KEY = 'caneguard.mobile.session.v1';
const PROTECTED_SESSION_KEY = 'caneguard.mobile.session.protected.v1';
const SESSION_PERSISTED_KEY = 'caneguard.mobile.session-persisted.v1';
const LOCAL_LOCK_MODE_KEY = 'caneguard.mobile.local-lock-mode.v1';
const BIOMETRIC_ENABLED_KEY = 'caneguard.mobile.biometric-enabled.v1';
// Marks a protected session stored behind the device PIN/pattern/password
// instead of a strong-biometric-bound key (offline cold-start fallback).
const DEVICE_CREDENTIAL_GATE_KEY = 'caneguard.mobile.device-credential-gate.v1';
const LOGIN_HISTORY_KEY = 'caneguard.mobile.login-history.v1';

const STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};
// `requireAuthentication` makes Android use an authentication-bound Keystore
// key and makes iOS use an authentication-gated Keychain item. This option set
// is only used when `localLockMode === 'device'` and the device has strong
// biometrics without a device credential fallback; otherwise the session is
// stored with STORE_OPTIONS and gated by LocalAuthentication or App PIN as
// configured.
const PROTECTED_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  ...STORE_OPTIONS,
  authenticationPrompt: 'Unlock CaneGuard',
  requireAuthentication: true,
};

export interface PersistedSessionResult {
  farmerOfflineGrace: boolean;
  session: MobileSession;
}

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

function isLocalLockMode(value: unknown): value is LocalLockMode {
  return value === 'none' || value === 'device' || value === 'app-pin';
}

export async function getLocalLockMode(): Promise<LocalLockMode> {
  try {
    const stored = await SecureStore.getItemAsync(LOCAL_LOCK_MODE_KEY, STORE_OPTIONS);
    if (isLocalLockMode(stored)) {
      return stored;
    }
    // Seamless upgrade for installations that enabled biometric/device unlock
    // before persistence and local lock were decoupled.
    const [legacyBiometric, legacyDeviceGate] = await Promise.all([
      SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY, STORE_OPTIONS),
      SecureStore.getItemAsync(DEVICE_CREDENTIAL_GATE_KEY, STORE_OPTIONS),
    ]);
    return legacyBiometric === 'true' || legacyDeviceGate === 'true' ? 'device' : 'none';
  } catch {
    return 'none';
  }
}

export async function hasPersistedMobileSession(): Promise<boolean> {
  try {
    const persisted = await SecureStore.getItemAsync(
      SESSION_PERSISTED_KEY,
      STORE_OPTIONS,
    );
    if (persisted === 'true') {
      return true;
    }
    const legacyBiometric = await SecureStore.getItemAsync(
      BIOMETRIC_ENABLED_KEY,
      STORE_OPTIONS,
    );
    return legacyBiometric === 'true';
  } catch {
    return false;
  }
}

export async function savePersistedMobileSession(
  session: MobileSession,
  lockMode: LocalLockMode,
): Promise<void> {
  assertPersistableSession(session);
  try {
    const useDeviceLock = lockMode === 'device';
    const capability = useDeviceLock ? await getBiometricCapability() : null;
    const deviceCredentialGate = Boolean(
      useDeviceLock && capability?.deviceCredentialAvailable,
    );
    const useOsAuthBoundKey = Boolean(
      useDeviceLock && !deviceCredentialGate,
    );
    const sessionOptions = useOsAuthBoundKey
      ? PROTECTED_STORE_OPTIONS
      : STORE_OPTIONS;

    try {
      if (deviceCredentialGate) {
        await SecureStore.setItemAsync(
          DEVICE_CREDENTIAL_GATE_KEY,
          'true',
          STORE_OPTIONS,
        );
      }
      await SecureStore.setItemAsync(
        PROTECTED_SESSION_KEY,
        JSON.stringify(session),
        sessionOptions,
      );
      if (!deviceCredentialGate) {
        await SecureStore.deleteItemAsync(
          DEVICE_CREDENTIAL_GATE_KEY,
          STORE_OPTIONS,
        );
      }
      await SecureStore.deleteItemAsync(LEGACY_SESSION_KEY, STORE_OPTIONS);
      await SecureStore.setItemAsync(SESSION_PERSISTED_KEY, 'true', STORE_OPTIONS);
      await SecureStore.setItemAsync(LOCAL_LOCK_MODE_KEY, lockMode, STORE_OPTIONS);
      if (useDeviceLock) {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true', STORE_OPTIONS);
      } else {
        await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY, STORE_OPTIONS);
      }
    } catch (error: unknown) {
      await deleteBestEffort(PROTECTED_SESSION_KEY, sessionOptions);
      await deleteBestEffort(SESSION_PERSISTED_KEY, STORE_OPTIONS);
      await deleteBestEffort(LOCAL_LOCK_MODE_KEY, STORE_OPTIONS);
      await deleteBestEffort(BIOMETRIC_ENABLED_KEY, STORE_OPTIONS);
      await deleteBestEffort(DEVICE_CREDENTIAL_GATE_KEY, STORE_OPTIONS);
      throw error;
    }
  } catch (error: unknown) {
    throw toSecureStoreError(error);
  }
}

export async function saveProtectedMobileSession(
  session: MobileSession,
): Promise<void> {
  return savePersistedMobileSession(session, 'device');
}

export async function readPersistedMobileSession(
  options: { skipDevicePrompt?: boolean; defaultToDeviceLock?: boolean } = {},
): Promise<PersistedSessionResult | null> {
  let stored: string | null;
  let lockMode: LocalLockMode;
  try {
    const rawLockMode = await SecureStore.getItemAsync(LOCAL_LOCK_MODE_KEY, STORE_OPTIONS);
    if (isLocalLockMode(rawLockMode)) {
      lockMode = rawLockMode;
    } else if (options.defaultToDeviceLock) {
      lockMode = 'device';
    } else {
      lockMode = await getLocalLockMode();
    }
    const deviceCredentialGate =
      (await SecureStore.getItemAsync(DEVICE_CREDENTIAL_GATE_KEY, STORE_OPTIONS)) ===
      'true';
    if (lockMode === 'device' && deviceCredentialGate && !options.skipDevicePrompt) {
      const auth = await authenticateWithDeviceCredential();
      if (!auth.success) {
        throw new BiometricSessionError('ACCESS_FAILED', auth.message);
      }
    }
    const useOsAuthBoundKey = lockMode === 'device' && !deviceCredentialGate;
    stored = await SecureStore.getItemAsync(
      PROTECTED_SESSION_KEY,
      useOsAuthBoundKey ? PROTECTED_STORE_OPTIONS : STORE_OPTIONS,
    );
  } catch (error: unknown) {
    if (error instanceof BiometricSessionError) {
      throw error;
    }
    throw new BiometricSessionError(
      'ACCESS_FAILED',
      'Protected unlock could not access the stored session.',
    );
  }

  if (!stored) {
    await clearMobileSessionBestEffort();
    throw new BiometricSessionError(
      'ENROLLMENT_CHANGED',
      'Protected unlock changed. Sign in with your password again.',
    );
  }

  const parsed = await parseStoredSession(stored);
  if (!parsed) {
    await clearMobileSessionBestEffort();
    throw new BiometricSessionError(
      'ENROLLMENT_CHANGED',
      'The protected session could not be restored. Sign in with your password again.',
    );
  }
  return parsed;
}

export async function readProtectedMobileSession(): Promise<MobileSession | null> {
  const result = await readPersistedMobileSession({ defaultToDeviceLock: true });
  return result ? result.session : null;
}

export async function clearLegacyMobileSession(): Promise<boolean> {
  try {
    const stored = await SecureStore.getItemAsync(LEGACY_SESSION_KEY, STORE_OPTIONS);
    await SecureStore.deleteItemAsync(LEGACY_SESSION_KEY, STORE_OPTIONS);
    return stored !== null;
  } catch (error: unknown) {
    throw toSecureStoreError(error);
  }
}

export async function hasCompletedMobileLogin(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(LOGIN_HISTORY_KEY, STORE_OPTIONS);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function markMobileLoginCompleted(): Promise<void> {
  try {
    await SecureStore.setItemAsync(LOGIN_HISTORY_KEY, 'true', STORE_OPTIONS);
  } catch {
    // Login history only controls the public entry screen, not authentication.
  }
}

export async function isBiometricUnlockEnabled(): Promise<boolean> {
  try {
    const mode = await SecureStore.getItemAsync(LOCAL_LOCK_MODE_KEY, STORE_OPTIONS);
    if (isLocalLockMode(mode)) {
      return mode === 'device';
    }
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
    [SESSION_PERSISTED_KEY, STORE_OPTIONS],
    [LOCAL_LOCK_MODE_KEY, STORE_OPTIONS],
    [BIOMETRIC_ENABLED_KEY, STORE_OPTIONS],
    [DEVICE_CREDENTIAL_GATE_KEY, STORE_OPTIONS],
  ] as const) {
    try {
      await SecureStore.deleteItemAsync(key, options);
    } catch (error: unknown) {
      failures.push(error);
    }
  }
  await clearAppPin();
  if (failures.length > 0) {
    throw toSecureStoreError(failures[0]);
  }
}

export async function clearMobileSession(): Promise<void> {
  const failures: unknown[] = [];
  for (const [key, options] of [
    [LEGACY_SESSION_KEY, STORE_OPTIONS],
    [PROTECTED_SESSION_KEY, PROTECTED_STORE_OPTIONS],
    [SESSION_PERSISTED_KEY, STORE_OPTIONS],
    [LOCAL_LOCK_MODE_KEY, STORE_OPTIONS],
    [BIOMETRIC_ENABLED_KEY, STORE_OPTIONS],
    [DEVICE_CREDENTIAL_GATE_KEY, STORE_OPTIONS],
  ] as const) {
    try {
      await SecureStore.deleteItemAsync(key, options);
    } catch (error: unknown) {
      failures.push(error);
    }
  }
  await clearAppPin();
  if (failures.length > 0) {
    throw toSecureStoreError(failures[0]);
  }
}

async function parseStoredSession(
  stored: string,
): Promise<PersistedSessionResult | null> {
  let value: unknown;
  try {
    value = JSON.parse(stored) as unknown;
  } catch {
    await deleteStoredSessionBestEffort();
    return null;
  }

  if (!isEligibleStoredSession(value)) {
    await deleteStoredSessionBestEffort();
    return null;
  }

  // A malformed or unknown-version grant is dropped, never repaired.
  const rawGrant = (value as { capabilityGrant?: unknown }).capabilityGrant;
  const grant = parseCapabilityGrant(rawGrant);
  if (grant) {
    value.capabilityGrant = grant;
  } else {
    delete value.capabilityGrant;
  }

  if (value.expiresAt === null) {
    await clearMobileSessionBestEffort();
    throw new StoredSessionExpiredError(value.token);
  }
  if (!isFutureIsoDate(value.expiresAt)) {
    // Farmers keep offline personal-scan grace access after the 30-day server
    // token expires; their bearer token is stripped so no stale credential is
    // sent to the API, while their local owner identity remains usable offline.
    if (value.user.role === 'farmer') {
      const { capabilityGrant: _dropped, ...rest } = value;
      void _dropped;
      return {
        farmerOfflineGrace: true,
        session: {
          ...rest,
          token: '',
          user: { ...value.user, capabilities: [] },
        },
      };
    }

    await deleteStoredSessionBestEffort();
    await deleteBestEffort(SESSION_PERSISTED_KEY, STORE_OPTIONS);
    await deleteBestEffort(LOCAL_LOCK_MODE_KEY, STORE_OPTIONS);
    await deleteBestEffort(BIOMETRIC_ENABLED_KEY, STORE_OPTIONS);
    await deleteBestEffort(DEVICE_CREDENTIAL_GATE_KEY, STORE_OPTIONS);
    await clearAppPin();
    throw new StoredSessionExpiredError(value.token);
  }

  return { farmerOfflineGrace: false, session: value };
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

async function deleteStoredSessionBestEffort(): Promise<void> {
  await deleteBestEffort(PROTECTED_SESSION_KEY, PROTECTED_STORE_OPTIONS);
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
