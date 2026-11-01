const path = require('node:path');

const {
  DEFAULT_STUB_API_HOST,
  DEFAULT_STUB_API_PORT,
} = require('../validation/stub-api/server');

/**
 * Shared gate for the browser validation route (`npm run web:validate`).
 *
 * Two web-only Metro rewrites live behind it:
 *
 * - `validation/expo-sqlite/WorkerChannel.ts` fixes the 255-byte sync result
 *   length bug in `expo-sqlite` 57. It keeps the app's reads honest on web and
 *   is removed when the app moves to SDK 58.
 * - `validation/expo-secure-store/ExpoSecureStore.web.ts` keeps a validation
 *   session in `localStorage` so a fake account can reach Home and Activity. It
 *   is a deliberate security downgrade, so it is gated on an explicit env flag,
 *   only applied to the fixed stub base URL, and never applied to a release
 *   build.
 */

const WEB_VALIDATION_FLAG = 'EXPO_PUBLIC_WEB_VALIDATION';
const RELEASE_EAS_PROFILES = ['preview', 'qa', 'production'];
const STUB_API_BASE_URL = `http://${DEFAULT_STUB_API_HOST}:${DEFAULT_STUB_API_PORT}`;

const SECURE_STORE_STAND_IN_PATH = path.join(
  __dirname,
  '..',
  'validation',
  'expo-secure-store',
  'ExpoSecureStore.web.ts',
);
const SQLITE_WORKER_CHANNEL_PATH = path.join(
  __dirname,
  '..',
  'validation',
  'expo-sqlite',
  'WorkerChannel.ts',
);

function isReleaseBuild(env = process.env) {
  return (
    RELEASE_EAS_PROFILES.includes(env.EAS_BUILD_PROFILE) ||
    env.NODE_ENV === 'production'
  );
}

/** The secure-store stand-in requires both the web platform and the opt-in flag. */
function isWebValidationEnabled(env = process.env) {
  return env[WEB_VALIDATION_FLAG] === '1' && !isReleaseBuild(env);
}

/** Only the fixed stub base URL is approved to receive a fake session. */
function isStubApiBaseUrl(value) {
  if (typeof value !== 'string') {
    return false;
  }

  let url;
  try {
    url = new URL(value.trim());
  } catch {
    return false;
  }

  return (
    url.origin === STUB_API_BASE_URL &&
    url.pathname === '/' &&
    !url.search &&
    !url.hash &&
    !url.username &&
    !url.password
  );
}

/**
 * Returns the absolute path a module request must be rewritten to, or null.
 * Metro calls this before it resolves anything, so the returned module replaces
 * the package file entirely.
 */
function resolveWebValidationAlias(
  { moduleName, originModulePath, platform },
  env = process.env,
) {
  if (platform !== 'web' || typeof originModulePath !== 'string') {
    return null;
  }

  if (
    moduleName === './ExpoSecureStore' &&
    originModulePath.includes('expo-secure-store') &&
    isWebValidationEnabled(env) &&
    isStubApiBaseUrl(env.EXPO_PUBLIC_API_BASE_URL)
  ) {
    return SECURE_STORE_STAND_IN_PATH;
  }

  if (
    moduleName === './WorkerChannel' &&
    originModulePath.includes('expo-sqlite')
  ) {
    return SQLITE_WORKER_CHANNEL_PATH;
  }

  return null;
}

module.exports = {
  SECURE_STORE_STAND_IN_PATH,
  SQLITE_WORKER_CHANNEL_PATH,
  WEB_VALIDATION_FLAG,
  isReleaseBuild,
  isWebValidationEnabled,
  resolveWebValidationAlias,
};
