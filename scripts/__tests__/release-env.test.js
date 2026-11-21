/* global describe, expect, it, jest */

const {
  main,
  validateProductionApiBaseUrl,
  validateProductionEnvironment,
  validateSentryDsn,
} = require('../release-env');

const VALID_DSN =
  'https://0123456789abcdef0123456789abcdef@o123456.ingest.sentry.io/7654321';

const VALID_ENV = {
  EAS_BUILD_PROFILE: 'production',
  EXPO_PUBLIC_API_BASE_URL: 'https://api.caneguard.ph',
  EXPO_PUBLIC_SENTRY_DSN: VALID_DSN,
  SENTRY_ORG: 'caneguard',
  SENTRY_PROJECT: 'caneguard-mobile',
  SENTRY_AUTH_TOKEN: 'token',
};

describe('production API URL gate', () => {
  it('accepts an https public host', () => {
    expect(validateProductionApiBaseUrl('https://api.caneguard.ph')).toEqual([]);
    expect(validateProductionApiBaseUrl('https://api.caneguard.ph/v1/')).toEqual(
      [],
    );
  });

  it.each([
    ['', /is required/],
    ['not a url', /valid absolute URL/],
    ['http://api.caneguard.ph', /https/],
    ['https://user:pw@api.caneguard.ph', /credentials/],
    ['https://api.caneguard.ph/?a=1', /query string/],
    ['https://localhost', /public host/],
    ['https://127.0.0.1', /public host/],
    ['https://10.0.0.5', /public host/],
    ['https://192.168.1.20', /public host/],
    ['https://172.20.0.1', /public host/],
    ['https://169.254.1.1', /public host/],
    ['https://[::1]', /public host/],
    ['https://intranet', /public host/],
    ['https://api.example.test', /public host/],
    ['https://box.local', /public host/],
  ])('rejects %p', (value, message) => {
    const problems = validateProductionApiBaseUrl(value);
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.join(' ')).toMatch(message);
  });
});

describe('Sentry DSN gate', () => {
  it('accepts a valid DSN and rejects missing or malformed ones', () => {
    expect(validateSentryDsn(VALID_DSN)).toEqual([]);
    expect(validateSentryDsn(undefined)[0]).toMatch(/is required/);
    expect(validateSentryDsn('nope')[0]).toMatch(/valid Sentry DSN/);
    expect(validateSentryDsn('http://k@host/1')[0]).toMatch(/must look like/);
    expect(validateSentryDsn('https://host/1')[0]).toMatch(/must look like/);
  });
});

describe('production release gate', () => {
  it('passes a complete production environment', () => {
    expect(validateProductionEnvironment(VALID_ENV)).toEqual([]);
  });

  it('requires the symbol upload settings', () => {
    const rest = { ...VALID_ENV, SENTRY_AUTH_TOKEN: '', SENTRY_ORG: undefined };
    expect(validateProductionEnvironment(rest)).toHaveLength(2);
    expect(validateProductionEnvironment(rest, { skipUpload: true })).toEqual([]);
  });

  it('only gates production builds unless asked', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(main([], { EAS_BUILD_PROFILE: 'preview' })).toBe(0);
    expect(main([], { EAS_BUILD_PROFILE: 'production' })).toBe(1);
    expect(main(['--require-production'], {})).toBe(1);
    expect(main([], VALID_ENV)).toBe(0);
    expect(error).toHaveBeenCalledTimes(2);
    error.mockRestore();
  });

  it('never prints secret values', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    main([], { ...VALID_ENV, EXPO_PUBLIC_API_BASE_URL: 'http://10.0.0.1', SENTRY_ORG: '' });
    expect(JSON.stringify(error.mock.calls)).not.toContain('token');
    error.mockRestore();
  });
});
