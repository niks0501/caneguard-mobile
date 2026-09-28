import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';

import { scrubSentryBreadcrumb, scrubSentryEvent } from './scrubSentryPayload';

/**
 * Starts crash and release-health reporting. The DSN is supplied by the build
 * environment only: when `EXPO_PUBLIC_SENTRY_DSN` is unset the SDK is never
 * initialized and the app behaves exactly as it did before this feature.
 */

export const SENTRY_DSN_ENV_KEY = 'EXPO_PUBLIC_SENTRY_DSN';

/** The subset of the Expo app config used to name the release. */
export interface ExpoAppIdentity {
  slug?: string | null;
  name?: string | null;
  version?: string | null;
  android?: { package?: string | null; versionCode?: number | string | null } | null;
  ios?: { bundleIdentifier?: string | null; buildNumber?: string | null } | null;
}

export interface CrashReportingIdentity {
  release?: string;
  dist?: string;
}

function nonEmptyString(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = `${value}`.trim();
  return normalized === '' ? null : normalized;
}

/**
 * Reads the Sentry DSN from the build environment. A blank value disables
 * reporting; a malformed value is rejected rather than handed to the SDK so a
 * typo cannot silently start sending to the wrong place.
 */
export function parseSentryDsn(value: string | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    return null;
  }

  // A DSN is `https://<public key>@<host>/<project id>` and may carry a
  // self-hosted path prefix. The key charset matches the one the SDK accepts,
  // so a typo is reported here instead of disabling the SDK silently.
  if (
    url.protocol !== 'https:' ||
    !/^\w+$/.test(url.username) ||
    url.pathname.length <= 1 ||
    url.search ||
    url.hash
  ) {
    return null;
  }
  return normalized;
}

/**
 * Names the release and distribution the way the native build does
 * (`<app id>@<version>+<build>`). When the app config does not carry a build
 * number — EAS can assign it remotely — both values are omitted so the native
 * SDK reports the ones it reads from the installed package, which keeps events,
 * sessions, and uploaded symbols on the same release.
 */
export function resolveCrashReportingIdentity(
  appConfig: ExpoAppIdentity | null | undefined,
): CrashReportingIdentity {
  const appId =
    nonEmptyString(appConfig?.android?.package) ??
    nonEmptyString(appConfig?.ios?.bundleIdentifier) ??
    nonEmptyString(appConfig?.slug);
  const version = nonEmptyString(appConfig?.version);
  const build =
    nonEmptyString(appConfig?.android?.versionCode) ??
    nonEmptyString(appConfig?.ios?.buildNumber);

  if (!appId || !version || !build) {
    return {};
  }
  return { release: `${appId}@${version}+${build}`, dist: build };
}

/**
 * Initializes the Sentry React Native SDK. Returns whether reporting started.
 * The call is best effort: telemetry must never break app startup.
 */
export function startCrashReporting(
  dsnValue: string | undefined = process.env.EXPO_PUBLIC_SENTRY_DSN,
  appConfig: ExpoAppIdentity | null | undefined = Constants.expoConfig,
): boolean {
  const dsn = parseSentryDsn(dsnValue);
  if (!dsn) {
    if (dsnValue?.trim()) {
      console.warn(
        `${SENTRY_DSN_ENV_KEY} is not a valid Sentry DSN. Crash reporting stays disabled.`,
      );
    }
    return false;
  }

  try {
    Sentry.init({
      dsn,
      ...resolveCrashReportingIdentity(appConfig),
      // Native crash and Android ANR capture (ANR detection is on by default
      // in the bundled Sentry Android SDK) plus native release health.
      enableNativeCrashHandling: true,
      enableAutoSessionTracking: true,
      // Field data is scrubbed in `scrubSentryPayload`; no PII is added by the
      // SDK and no screenshot or view hierarchy leaves the device.
      sendDefaultPii: false,
      attachScreenshot: false,
      attachViewHierarchy: false,
      beforeSend: scrubSentryEvent,
      beforeBreadcrumb: scrubSentryBreadcrumb,
    });
  } catch (error) {
    console.warn('Crash reporting could not start.', error);
    return false;
  }
  return true;
}
