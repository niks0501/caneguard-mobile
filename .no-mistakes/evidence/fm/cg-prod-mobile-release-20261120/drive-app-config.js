#!/usr/bin/env node
/**
 * Live driver for the Expo app-config resolution (app.config.js).
 *
 * Runs the real Expo config resolver (`npx expo config --type public --json`) -
 * the same code path EAS uses to resolve a build config - under isolated
 * environments and asserts the resulting config: whether resolution is refused
 * for a production build without Sentry symbol-upload credentials (D9), and the
 * Sentry environment tag emitted for builds and for OTA updates.
 *
 * Expectations come from the author intent (D9 tag with environment, D15 OTA
 * lane names its environment) and the Expo config contract (`extra` is the
 * public config surface an app reads at runtime).
 */
const { spawnSync } = require('node:child_process');

const REPO = process.argv[2];
const LABEL = process.argv[3] || 'run';

const BASE_ENV = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  TMPDIR: '/tmp',
  CI: '1',
};

function expoConfig(env) {
  const result = spawnSync(
    'npx',
    ['expo', 'config', '--type', 'public', '--json'],
    {
      cwd: REPO,
      env: { ...BASE_ENV, ...env },
      encoding: 'utf8',
      timeout: 180000,
    },
  );
  const out = `${result.stdout || ''}${result.stderr || ''}`;
  let config = null;
  if (result.status === 0) {
    try {
      config = JSON.parse(result.stdout);
    } catch {
      config = null;
    }
  }
  return { code: result.status, output: out, config };
}

const cases = [
  {
    name: 'local dev config (no build profile)',
    env: {},
    expect: { resolves: true, appEnvironment: 'development' },
    note: 'dev builds keep working unchanged and are tagged development',
  },
  {
    name: 'preview build profile without Sentry upload creds',
    env: { EAS_BUILD_PROFILE: 'preview' },
    expect: { resolves: true, appEnvironment: 'preview' },
    note: 'only production requires symbol upload (D9)',
  },
  {
    name: 'qa build profile',
    env: {
      EAS_BUILD_PROFILE: 'qa',
      EXPO_PUBLIC_API_BASE_URL: 'https://qa.caneguard.ph',
      EXPO_PUBLIC_QA_MODE: 'true',
    },
    expect: { resolves: true, appEnvironment: 'qa' },
    note: 'qa builds tagged qa (pre-existing QA env gate satisfied)',
  },
  {
    name: 'production build profile with SENTRY_ORG/PROJECT/AUTH_TOKEN',
    env: {
      EAS_BUILD_PROFILE: 'production',
      SENTRY_ORG: 'caneguard',
      SENTRY_PROJECT: 'caneguard-mobile',
      SENTRY_AUTH_TOKEN: 'redacted-test-token',
    },
    expect: { resolves: true, appEnvironment: 'production', sentryPlugin: true },
    note: 'D9: production resolves and uploads source maps/symbols',
  },
  {
    name: 'production build profile without SENTRY_AUTH_TOKEN',
    env: {
      EAS_BUILD_PROFILE: 'production',
      SENTRY_ORG: 'caneguard',
      SENTRY_PROJECT: 'caneguard-mobile',
    },
    expect: { resolves: false, message: /SENTRY_ORG, SENTRY_PROJECT, and SENTRY_AUTH_TOKEN/ },
    note: 'D9: production must refuse to resolve without symbol upload',
  },
  {
    name: 'production build profile with blank SENTRY_PROJECT',
    env: {
      EAS_BUILD_PROFILE: 'production',
      SENTRY_ORG: 'caneguard',
      SENTRY_PROJECT: '   ',
      SENTRY_AUTH_TOKEN: 'redacted-test-token',
    },
    expect: { resolves: false, message: /SENTRY_ORG, SENTRY_PROJECT, and SENTRY_AUTH_TOKEN/ },
    note: 'blank values do not satisfy the upload requirement',
  },
  {
    name: 'production OTA update (EXPO_PUBLIC_APP_ENVIRONMENT, no build profile)',
    env: { EXPO_PUBLIC_APP_ENVIRONMENT: 'production' },
    expect: { resolves: true, appEnvironment: 'production' },
    note: 'D15: eas update has no build profile, so the lane names its environment',
  },
  {
    name: 'qa OTA update (EXPO_PUBLIC_APP_ENVIRONMENT=qa)',
    env: { EXPO_PUBLIC_APP_ENVIRONMENT: 'qa' },
    expect: { resolves: true, appEnvironment: 'qa' },
    note: 'existing qa update lane tagged qa',
  },
  {
    name: 'build profile wins over a conflicting OTA environment',
    env: { EAS_BUILD_PROFILE: 'preview', EXPO_PUBLIC_APP_ENVIRONMENT: 'production' },
    expect: { resolves: true, appEnvironment: 'preview' },
    note: 'a build is tagged by its own profile',
  },
];

const results = cases.map((testCase) => {
  const { code, output, config } = expoConfig(testCase.env);
  const resolves = code === 0 && config !== null;
  const appEnvironment = config?.extra?.appEnvironment ?? null;
  const plugins = config?.plugins ?? [];
  const sentryPlugin = plugins.some(
    (plugin) => Array.isArray(plugin) && plugin[0] === '@sentry/react-native/expo',
  );
  const expected = testCase.expect;
  const checks = [];
  checks.push({
    what: 'resolves',
    expected: expected.resolves,
    actual: resolves,
    ok: resolves === expected.resolves,
  });
  if (expected.appEnvironment) {
    checks.push({
      what: 'extra.appEnvironment',
      expected: expected.appEnvironment,
      actual: appEnvironment,
      ok: appEnvironment === expected.appEnvironment,
    });
  }
  if (expected.sentryPlugin !== undefined) {
    checks.push({
      what: 'sentry expo plugin',
      expected: expected.sentryPlugin,
      actual: sentryPlugin,
      ok: sentryPlugin === expected.sentryPlugin,
    });
  }
  if (expected.message) {
    checks.push({
      what: 'refusal message',
      expected: String(expected.message),
      actual:
        (output.match(/^Error: .*$/m) || [output.trim().split('\n')[0]])[0].slice(0, 200),
      ok: expected.message.test(output),
    });
  }
  return {
    name: testCase.name,
    note: testCase.note,
    pass: checks.every((check) => check.ok),
    checks,
    sentryPlugin,
    output: output.trim(),
  };
});

const failures = results.filter((r) => !r.pass);
const lines = [`# app.config.js resolution — live \`npx expo config\` (${LABEL})`, ''];
lines.push(`- repo: ${REPO}`);
lines.push(`- cases: ${results.length}, passed: ${results.length - failures.length}, failed: ${failures.length}`);
lines.push('');
lines.push('| case | expectation | result |');
lines.push('| --- | --- | --- |');
for (const r of results) {
  const detail = r.checks
    .map((c) => `${c.what}: expected \`${c.expected}\`, got \`${c.actual}\``)
    .join('; ');
  lines.push(`| ${r.name} | ${r.note} | ${r.pass ? 'PASS' : 'FAIL'} — ${detail.replace(/\|/g, '\\|')} |`);
}
lines.push('');
lines.push('## Raw resolver output (non-success cases)');
for (const r of results) {
  if (r.pass && r.checks.every((c) => c.what !== 'resolves' || c.actual === true)) continue;
  lines.push(`### ${r.name}`);
  lines.push('```');
  lines.push(r.output.split('\n').slice(-6).join('\n'));
  lines.push('```');
}
process.stdout.write(`${lines.join('\n')}\n`);
process.exitCode = failures.length === 0 ? 0 : 1;
