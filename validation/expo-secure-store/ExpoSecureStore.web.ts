/**
 * Validation-only stand-in for `expo-secure-store`'s web module.
 *
 * `expo-secure-store` ships `ExpoSecureStore.web.js` as `export default {}`, so
 * on web every session read throws and `/login` reports that secure session
 * storage cannot be opened. That is a deliberate security boundary: the app
 * refuses to keep a credential without OS-backed storage.
 *
 * This module exists only for the browser validation route (`npm run
 * web:validate`). The captain approved it under these bounds:
 *
 * - web only: Metro rewrites `./ExpoSecureStore` for the `web` platform alone;
 * - env gated: it requires `EXPO_PUBLIC_WEB_VALIDATION=1`;
 * - stub API only: `scripts/web-validation-config.js` refuses the rewrite unless
 *   `EXPO_PUBLIC_API_BASE_URL` is the fixed stub base URL
 *   (`http://127.0.0.1:8210`), so no localStorage session can reach a proxy or
 *   a real server;
 * - excluded from release builds: `scripts/web-validation-config.js` refuses the
 *   rewrite when `EAS_BUILD_PROFILE` is `preview`, `qa` or `production`, or when
 *   `NODE_ENV` is `production`, and `scripts/__tests__/web-validation-config.test.js`
 *   pins that gate;
 * - fake accounts only: it is only ever used against the deterministic stub API
 *   in `validation/stub-api`, never against a real server.
 *
 * It stores values in `localStorage` in plain text. Nothing else in the product
 * may import it, and no real credential may pass through it.
 */

const STORAGE_PREFIX = 'caneguard.web-validation.secure-store.';

const KEYCHAIN_CONSTANTS = {
  AFTER_FIRST_UNLOCK: 'afterFirstUnlock',
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'afterFirstUnlockThisDeviceOnly',
  ALWAYS: 'always',
  ALWAYS_THIS_DEVICE_ONLY: 'alwaysThisDeviceOnly',
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'whenPasscodeSetThisDeviceOnly',
  WHEN_UNLOCKED: 'whenUnlocked',
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'whenUnlockedThisDeviceOnly',
};

function assertValidationOnly(): void {
  // A static `process.env.EXPO_PUBLIC_*` read is what Expo inlines into the bundle.
  if (process.env.EXPO_PUBLIC_WEB_VALIDATION !== '1') {
    throw new Error(
      'The secure-store stand-in is validation-only and requires EXPO_PUBLIC_WEB_VALIDATION=1.',
    );
  }
}

function readStorage(): Storage {
  assertValidationOnly();
  const storage = globalThis.localStorage;
  if (!storage) {
    throw new Error('The validation-only secure-store stand-in needs localStorage.');
  }
  return storage;
}

function storageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

const secureStoreStandIn = {
  ...KEYCHAIN_CONSTANTS,
  // `requireAuthentication` and the keychain accessibility options are accepted
  // and ignored: a browser has no OS-backed keystore to enforce them.
  async getValueWithKeyAsync(key: string): Promise<string | null> {
    const storage = readStorage();
    return storage.getItem(storageKey(key));
  },
  async setValueWithKeyAsync(value: string, key: string): Promise<void> {
    const storage = readStorage();
    storage.setItem(storageKey(key), value);
  },
  async deleteValueWithKeyAsync(key: string): Promise<void> {
    const storage = readStorage();
    storage.removeItem(storageKey(key));
  },
  canUseBiometricAuthentication(): boolean {
    return false;
  },
};

assertValidationOnly();

export default secureStoreStandIn;
