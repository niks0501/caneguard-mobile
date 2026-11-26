import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const APP_PIN_KEY = 'caneguard.mobile.app-pin.v1';
const PIN_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export const APP_PIN_LENGTH = 4;
export const APP_PIN_MAX_ATTEMPTS = 5;
const HASH_ROUNDS = 64;

interface StoredAppPinRecord {
  v: 1;
  salt: string;
  hash: string;
  failedAttempts: number;
}

export type AppPinVerifyResult =
  | { success: true }
  | {
      success: false;
      code: 'INVALID_PIN';
      attemptsRemaining: number;
      message: string;
    }
  | {
      success: false;
      code: 'LOCKED_OUT';
      message: string;
    }
  | {
      success: false;
      code: 'NOT_CONFIGURED';
      message: string;
    };

export class AppPinStoreError extends Error {
  constructor(message = 'CaneGuard could not save your Quick PIN on this device.') {
    super(message);
    this.name = 'AppPinStoreError';
  }
}

export function isValidAppPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

async function derivePinHash(salt: string, pin: string): Promise<string> {
  let digest = `${salt}:${pin}:caneguard-app-pin-v1`;
  for (let round = 0; round < HASH_ROUNDS; round += 1) {
    digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${salt}:${digest}:${round}`,
    );
  }
  return digest;
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function parsePinRecord(raw: string | null): StoredAppPinRecord | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<StoredAppPinRecord>;
    if (
      parsed.v !== 1 ||
      typeof parsed.salt !== 'string' ||
      parsed.salt.length < 8 ||
      typeof parsed.hash !== 'string' ||
      parsed.hash.length === 0 ||
      typeof parsed.failedAttempts !== 'number' ||
      !Number.isInteger(parsed.failedAttempts) ||
      parsed.failedAttempts < 0
    ) {
      return null;
    }
    return parsed as StoredAppPinRecord;
  } catch {
    return null;
  }
}

export async function hasAppPinConfigured(): Promise<boolean> {
  try {
    const raw = await SecureStore.getItemAsync(APP_PIN_KEY, PIN_STORE_OPTIONS);
    return parsePinRecord(raw) !== null;
  } catch {
    return false;
  }
}

export async function saveAppPin(pin: string): Promise<void> {
  if (!isValidAppPin(pin)) {
    throw new AppPinStoreError('Enter a 4-digit PIN.');
  }
  try {
    const salt = Crypto.randomUUID();
    const hash = await derivePinHash(salt, pin);
    const record: StoredAppPinRecord = {
      v: 1,
      salt,
      hash,
      failedAttempts: 0,
    };
    await SecureStore.setItemAsync(
      APP_PIN_KEY,
      JSON.stringify(record),
      PIN_STORE_OPTIONS,
    );
  } catch (error: unknown) {
    if (error instanceof AppPinStoreError) {
      throw error;
    }
    throw new AppPinStoreError();
  }
}

export async function verifyAppPin(pin: string): Promise<AppPinVerifyResult> {
  let raw: string | null;
  try {
    raw = await SecureStore.getItemAsync(APP_PIN_KEY, PIN_STORE_OPTIONS);
  } catch {
    return {
      success: false,
      code: 'NOT_CONFIGURED',
      message: 'Quick PIN is unavailable. Sign in with your password.',
    };
  }

  const record = parsePinRecord(raw);
  if (!record) {
    return {
      success: false,
      code: 'NOT_CONFIGURED',
      message: 'Quick PIN is not set up. Sign in with your password.',
    };
  }

  if (record.failedAttempts >= APP_PIN_MAX_ATTEMPTS) {
    await clearAppPin().catch(() => undefined);
    return {
      success: false,
      code: 'LOCKED_OUT',
      message: 'Too many incorrect PIN attempts. Sign in with your password.',
    };
  }

  if (!isValidAppPin(pin)) {
    return {
      success: false,
      code: 'INVALID_PIN',
      attemptsRemaining: Math.max(0, APP_PIN_MAX_ATTEMPTS - record.failedAttempts),
      message: 'Enter your 4-digit PIN.',
    };
  }

  const candidateHash = await derivePinHash(record.salt, pin);
  if (constantTimeEquals(candidateHash, record.hash)) {
    if (record.failedAttempts > 0) {
      await SecureStore.setItemAsync(
        APP_PIN_KEY,
        JSON.stringify({ ...record, failedAttempts: 0 }),
        PIN_STORE_OPTIONS,
      ).catch(() => undefined);
    }
    return { success: true };
  }

  const nextFailures = record.failedAttempts + 1;
  const remaining = Math.max(0, APP_PIN_MAX_ATTEMPTS - nextFailures);
  if (nextFailures >= APP_PIN_MAX_ATTEMPTS) {
    await clearAppPin().catch(() => undefined);
    return {
      success: false,
      code: 'LOCKED_OUT',
      message: 'Too many incorrect PIN attempts. Sign in with your password.',
    };
  }

  await SecureStore.setItemAsync(
    APP_PIN_KEY,
    JSON.stringify({ ...record, failedAttempts: nextFailures }),
    PIN_STORE_OPTIONS,
  ).catch(() => undefined);

  return {
    success: false,
    code: 'INVALID_PIN',
    attemptsRemaining: remaining,
    message:
      remaining === 1
        ? 'Incorrect PIN. 1 try left before password sign-in is required.'
        : `Incorrect PIN. ${remaining} tries left.`,
  };
}

export async function clearAppPin(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(APP_PIN_KEY, PIN_STORE_OPTIONS);
  } catch {
    // Best-effort cleanup when clearing session or turning off Quick PIN.
  }
}
