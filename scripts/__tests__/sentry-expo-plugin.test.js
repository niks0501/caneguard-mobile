/* global describe, expect, it */

const appConfig = require('../../app.config');

const SENTRY_ENV_KEYS = [
  'SENTRY_ORG',
  'SENTRY_PROJECT',
  'SENTRY_AUTH_TOKEN',
  'SENTRY_URL',
];

/**
 * Runs `app.config.js` with exactly the given Sentry build environment and
 * restores everything it touched afterwards.
 */
function resolveConfigWithSentryEnv(values) {
  const previous = new Map();
  for (const key of [...SENTRY_ENV_KEYS, 'EXPO_PUBLIC_QA_MODE']) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  Object.assign(process.env, values);

  try {
    return appConfig({ config: { plugins: ['expo-router'] } });
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function sentryPluginEntry(config) {
  return config.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === '@sentry/react-native/expo',
  );
}

describe('Sentry release-build upload configuration', () => {
  it('leaves the plugin list alone when the build has no Sentry credentials', () => {
    const config = resolveConfigWithSentryEnv({});

    expect(config.plugins).toEqual(['expo-router']);
    expect(sentryPluginEntry(config)).toBeUndefined();
  });

  it('waits for the auth token before enabling the plugin', () => {
    const config = resolveConfigWithSentryEnv({
      SENTRY_ORG: 'caneguard',
      SENTRY_PROJECT: 'caneguard-mobile',
    });

    expect(sentryPluginEntry(config)).toBeUndefined();
  });

  it('enables source map and native symbol upload once credentials are present', () => {
    const config = resolveConfigWithSentryEnv({
      SENTRY_ORG: 'caneguard',
      SENTRY_PROJECT: 'caneguard-mobile',
      SENTRY_AUTH_TOKEN: 'token-that-must-not-be-embedded',
      SENTRY_URL: 'https://sentry.example.test/',
    });

    expect(sentryPluginEntry(config)).toEqual([
      '@sentry/react-native/expo',
      {
        organization: 'caneguard',
        project: 'caneguard-mobile',
        url: 'https://sentry.example.test/',
      },
    ]);
  });

  it('never writes the auth token into the exported config', () => {
    const config = resolveConfigWithSentryEnv({
      SENTRY_ORG: 'caneguard',
      SENTRY_PROJECT: 'caneguard-mobile',
      SENTRY_AUTH_TOKEN: 'token-that-must-not-be-embedded',
    });

    expect(JSON.stringify(config)).not.toContain(
      'token-that-must-not-be-embedded',
    );
  });
});
