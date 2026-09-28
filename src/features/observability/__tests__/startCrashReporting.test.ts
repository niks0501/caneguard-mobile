import * as Sentry from '@sentry/react-native';

import {
  parseSentryDsn,
  resolveCrashReportingIdentity,
  startCrashReporting,
} from '../startCrashReporting';
import { scrubSentryBreadcrumb, scrubSentryEvent } from '../scrubSentryPayload';

jest.mock('@sentry/react-native', () => ({ init: jest.fn() }));

const VALID_DSN =
  'https://0123456789abcdef0123456789abcdef@o123456.ingest.sentry.io/7654321';

const FULL_APP_CONFIG = {
  slug: 'caneguard-mobile',
  version: '1.1.1',
  android: { package: 'com.niks0501.caneguard', versionCode: 42 },
};

function lastInitOptions(): Parameters<typeof Sentry.init>[0] {
  const calls = jest.mocked(Sentry.init).mock.calls;
  return calls[calls.length - 1][0];
}

describe('parseSentryDsn', () => {
  it.each([undefined, '', '   '])('stays disabled for %p', (value) => {
    expect(parseSentryDsn(value)).toBeNull();
  });

  it.each([
    'not-a-url',
    'http://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io/1',
    'https://o123.ingest.sentry.io/1',
    'https://public-key@o123.ingest.sentry.io/1',
    'https://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io',
    'https://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io/1?secret=1',
  ])('rejects a malformed DSN: %s', (value) => {
    expect(parseSentryDsn(value)).toBeNull();
  });

  it('accepts a hosted DSN and trims surrounding whitespace', () => {
    expect(parseSentryDsn(`  ${VALID_DSN}  `)).toBe(VALID_DSN);
  });

  it('accepts a self-hosted DSN with a path prefix', () => {
    expect(
      parseSentryDsn('https://selfhosted_key@errors.example.test/sentry/9'),
    ).toBe('https://selfhosted_key@errors.example.test/sentry/9');
  });
});

describe('resolveCrashReportingIdentity', () => {
  it('names the release the way the native build does', () => {
    expect(resolveCrashReportingIdentity(FULL_APP_CONFIG)).toEqual({
      release: 'com.niks0501.caneguard@1.1.1+42',
      dist: '42',
    });
  });

  it('falls back to the iOS bundle id and build number', () => {
    expect(
      resolveCrashReportingIdentity({
        version: '1.1.1',
        ios: { bundleIdentifier: 'com.niks0501.caneguard', buildNumber: '7' },
      }),
    ).toEqual({ release: 'com.niks0501.caneguard@1.1.1+7', dist: '7' });
  });

  it('leaves the native SDK to report release and dist without a build number', () => {
    expect(
      resolveCrashReportingIdentity({
        slug: 'caneguard-mobile',
        version: '1.1.1',
        android: { package: 'com.niks0501.caneguard' },
      }),
    ).toEqual({});
    expect(resolveCrashReportingIdentity(null)).toEqual({});
    expect(resolveCrashReportingIdentity(undefined)).toEqual({});
    expect(resolveCrashReportingIdentity({ version: '1.1.1' })).toEqual({});
  });
});

describe('startCrashReporting', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('stays disabled and does nothing when no DSN is supplied', () => {
    expect(startCrashReporting(undefined, FULL_APP_CONFIG)).toBe(false);
    expect(startCrashReporting('', FULL_APP_CONFIG)).toBe(false);
    expect(startCrashReporting('   ', FULL_APP_CONFIG)).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('stays disabled and warns when the supplied DSN is malformed', () => {
    expect(startCrashReporting('nonsense', FULL_APP_CONFIG)).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('EXPO_PUBLIC_SENTRY_DSN'),
    );
  });

  it('starts crash and release-health reporting with a valid DSN', () => {
    expect(startCrashReporting(VALID_DSN, FULL_APP_CONFIG)).toBe(true);

    const options = lastInitOptions();
    expect(options).toMatchObject({
      dsn: VALID_DSN,
      release: 'com.niks0501.caneguard@1.1.1+42',
      dist: '42',
      enableNativeCrashHandling: true,
      enableAutoSessionTracking: true,
      sendDefaultPii: false,
      attachScreenshot: false,
      attachViewHierarchy: false,
    });
    expect(options.beforeSend).toBe(scrubSentryEvent);
    expect(options.beforeBreadcrumb).toBe(scrubSentryBreadcrumb);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('omits release and dist when the app config does not carry them', () => {
    expect(startCrashReporting(VALID_DSN, null)).toBe(true);

    const options = lastInitOptions();
    expect(options).not.toHaveProperty('release');
    expect(options).not.toHaveProperty('dist');
  });

  it('never breaks app startup when the SDK cannot initialize', () => {
    jest.mocked(Sentry.init).mockImplementationOnce(() => {
      throw new Error('native module missing');
    });

    expect(startCrashReporting(VALID_DSN, FULL_APP_CONFIG)).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      'Crash reporting could not start.',
      expect.any(Error),
    );
  });
});
