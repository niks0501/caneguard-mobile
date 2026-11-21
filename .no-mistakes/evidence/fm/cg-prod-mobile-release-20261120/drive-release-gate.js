#!/usr/bin/env node
/**
 * Live driver for the CaneGuard production release gate.
 *
 * Runs the real `scripts/release-env.js` CLI as a child process (the same entry
 * point package.json `eas-build-pre-install` / `release:preflight` use) with an
 * isolated environment, then records exit code + stderr.
 *
 * Expectations come from published contracts, not from the implementation:
 *  - RFC 1035 §2.3.1 DNS label syntax (no empty labels -> "api..caneguard.ph" invalid)
 *  - IANA IPv4/IPv6 special-purpose address registry (TEST-NET-1 192.0.2.0/24,
 *    benchmarking 198.18.0.0/15, CGNAT 100.64.0.0/10, RFC1918, loopback, ULA,
 *    link-local, documentation 2001:db8::/32, globally routable 2606:4700::/32)
 *  - Sentry DSN grammar: https://<public-key>@<host>[/prefix]/<numeric project id>
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const REPO = process.argv[2];
const SCRIPT = path.join(REPO, 'scripts/release-env.js');

const GOOD_DSN =
  'https://0123456789abcdef0123456789abcdef@o123456.ingest.sentry.io/7654321';

const baseEnv = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  EXPO_PUBLIC_API_BASE_URL: 'https://api.caneguard.ph',
  EXPO_PUBLIC_SENTRY_DSN: GOOD_DSN,
  SENTRY_ORG: 'caneguard',
  SENTRY_PROJECT: 'caneguard-mobile',
  SENTRY_AUTH_TOKEN: 'redacted-test-token',
  EAS_BUILD_PROFILE: 'production',
};

function run(args, env) {
  const result = spawnSync(process.execPath, [SCRIPT, ...args], {
    env: { PATH: process.env.PATH, HOME: process.env.HOME, ...env },
    encoding: 'utf8',
  });
  return {
    code: result.status,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
  };
}

function apiCase(url, expect, note) {
  return {
    group: 'api-url',
    label: `EXPO_PUBLIC_API_BASE_URL=${JSON.stringify(url)}`,
    args: [],
    env: { ...baseEnv, EXPO_PUBLIC_API_BASE_URL: url },
    expect,
    note,
  };
}

function dsnCase(dsn, expect, note) {
  return {
    group: 'sentry-dsn',
    label: `EXPO_PUBLIC_SENTRY_DSN=${JSON.stringify(dsn)}`,
    args: [],
    env: { ...baseEnv, EXPO_PUBLIC_SENTRY_DSN: dsn },
    expect,
    note,
  };
}

const cases = [
  // ---- accepted production environments ----
  {
    group: 'accept',
    label: 'complete production environment',
    args: [],
    env: baseEnv,
    expect: 'accept',
    note: 'API https public host + valid DSN + upload keys',
  },
  apiCase('https://api.caneguard.ph/v1', 'accept', 'path allowed'),
  apiCase('https://API.CaneGuard.ph', 'accept', 'host is case-insensitive'),
  apiCase('https://api.caneguard.ph.', 'accept', 'absolute FQDN root dot'),
  apiCase(
    'https://[2606:4700:4700::1111]',
    'accept',
    'globally routable IPv6 (R4: no blanket IPv6 rejection)',
  ),
  apiCase(
    'https://2606:4700:4700::1111',
    'reject',
    'unbracketed IPv6 is not a valid URL authority',
  ),

  // ---- adversarial / unsafe API URLs ----
  apiCase('http://api.caneguard.ph', 'reject', 'scheme must be https'),
  apiCase('', 'reject', 'required'),
  apiCase('not a url', 'reject', 'syntax'),
  apiCase('https://localhost', 'reject', 'localhost'),
  apiCase('https://api.localhost', 'reject', '*.localhost'),
  apiCase('https://127.0.0.1', 'reject', 'loopback'),
  apiCase('https://127.1.2.3', 'reject', 'loopback range'),
  apiCase('https://0.0.0.0', 'reject', 'unspecified'),
  apiCase('https://10.1.2.3', 'reject', 'RFC1918 10/8'),
  apiCase('https://192.168.0.10', 'reject', 'RFC1918 192.168/16'),
  apiCase('https://172.16.5.4', 'reject', 'RFC1918 172.16/12'),
  apiCase('https://169.254.169.254', 'reject', 'link-local / cloud metadata'),
  apiCase('https://100.64.0.1', 'reject', 'CGNAT 100.64/10'),
  apiCase('https://192.0.2.1', 'reject', 'IANA TEST-NET-1 (R1)'),
  apiCase('https://198.18.0.1', 'reject', 'IANA benchmarking 198.18/15 (R1)'),
  apiCase('https://203.0.113.9', 'reject', 'IANA TEST-NET-3'),
  apiCase('https://198.51.100.7', 'reject', 'IANA TEST-NET-2'),
  apiCase('https://224.0.0.1', 'reject', 'multicast'),
  apiCase('https://255.255.255.255', 'reject', 'broadcast / reserved'),
  apiCase('https://[::1]', 'reject', 'IPv6 loopback'),
  apiCase('https://[fe80::1]', 'reject', 'IPv6 link-local'),
  apiCase('https://[fd00::1]', 'reject', 'IPv6 ULA'),
  apiCase('https://[2001:db8::1]', 'reject', 'IPv6 documentation range'),
  apiCase('https://[::ffff:127.0.0.1]', 'reject', 'IPv4-mapped loopback'),
  apiCase('https://api..caneguard.ph', 'reject', 'RFC1035 empty label (R1)'),
  apiCase('https://api-.caneguard.ph', 'reject', 'label must not end with hyphen'),
  apiCase('https://-api.caneguard.ph', 'reject', 'label must not start with hyphen'),
  apiCase('https://intranet', 'reject', 'single-label intranet host'),
  apiCase('https://box.local', 'reject', '.local suffix'),
  apiCase('https://api.internal', 'reject', '.internal suffix'),
  apiCase('https://api.example.test', 'reject', 'reserved .test suffix'),
  apiCase('https://api.example.com', 'accept', 'example.com is public (not blocked)'),
  apiCase('https://user:pw@api.caneguard.ph', 'reject', 'embedded credentials'),
  apiCase('https://api.caneguard.ph/?a=1', 'reject', 'query string'),
  apiCase('https://api.caneguard.ph/#frag', 'reject', 'fragment'),
  apiCase(
    'https://api.caneguard.ph@evil.internal',
    'reject',
    'userinfo credential trick hides a non-public host',
  ),
  apiCase('https://2130706433', 'reject', 'WHATWG-normalized decimal IPv4 loopback'),
  apiCase('https://0x7f.0.0.1', 'reject', 'WHATWG-normalized hex IPv4 loopback'),
  apiCase('https://0x7f000001', 'reject', 'WHATWG-normalized hex IPv4 loopback (compact)'),

  // ---- Sentry DSN contract ----
  dsnCase('', 'reject', 'required'),
  dsnCase('not-a-dsn', 'reject', 'syntax'),
  dsnCase(
    'https://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io/not-a-project',
    'reject',
    'R2: final segment must be a numeric project id',
  ),
  dsnCase(
    'https://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io/123abc',
    'reject',
    'R2: project id must be all digits',
  ),
  dsnCase(
    'https://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io',
    'reject',
    'missing project id',
  ),
  dsnCase(
    'https://o123.ingest.sentry.io/7654321',
    'reject',
    'missing public key',
  ),
  dsnCase(
    'http://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io/7654321',
    'reject',
    'DSN scheme must be https',
  ),
  dsnCase(
    'https://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io/7654321?x=1',
    'reject',
    'query string is not part of a DSN',
  ),
  dsnCase(
    'https://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io/7654321#f',
    'reject',
    'fragment is not part of a DSN',
  ),
  dsnCase(
    'https://0123456789abcdef0123456789abcdef@sentry.caneguard.ph/sentry/7654321',
    'accept',
    'self-hosted path prefix preserved',
  ),

  // ---- symbol upload requirement (build lane) ----
  {
    group: 'upload',
    label: 'missing SENTRY_ORG/SENTRY_PROJECT/SENTRY_AUTH_TOKEN',
    args: [],
    env: {
      ...baseEnv,
      SENTRY_ORG: '',
      SENTRY_PROJECT: undefined,
      SENTRY_AUTH_TOKEN: '   ',
    },
    expect: 'reject',
    note: 'D9 requires source map + symbol upload for production builds',
  },
  {
    group: 'upload',
    label: 'blank upload keys but --skip-upload (OTA lane)',
    args: ['--skip-upload'],
    env: { ...baseEnv, SENTRY_ORG: '', SENTRY_PROJECT: '', SENTRY_AUTH_TOKEN: '' },
    expect: 'accept',
    note: 'OTA updates ship no native symbols',
  },
  {
    group: 'upload',
    label: 'complete build env but --skip-upload',
    args: ['--skip-upload'],
    env: baseEnv,
    expect: 'accept',
    note: 'flag only removes the upload requirement',
  },

  // ---- profile scoping: non-production builds stay unchanged ----
  {
    group: 'profile',
    label: 'development profile, unsafe env (no gate)',
    args: [],
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      EAS_BUILD_PROFILE: 'development',
      EXPO_PUBLIC_API_BASE_URL: 'http://127.0.0.1:8000',
    },
    expect: 'accept',
    note: 'gate applies to production only (D10)',
  },
  {
    group: 'profile',
    label: 'preview profile, unsafe env (no gate)',
    args: [],
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      EAS_BUILD_PROFILE: 'preview',
      EXPO_PUBLIC_API_BASE_URL: 'http://10.0.2.2:8000',
    },
    expect: 'accept',
    note: 'gate applies to production only (D10)',
  },
  {
    group: 'profile',
    label: 'no EAS_BUILD_PROFILE, unsafe env (local dev)',
    args: [],
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      EXPO_PUBLIC_API_BASE_URL: 'http://127.0.0.1:8000',
    },
    expect: 'accept',
    note: 'local dev pre-install must not gate',
  },
  {
    group: 'profile',
    label: '--require-production with no build profile',
    args: ['--require-production'],
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      EXPO_PUBLIC_API_BASE_URL: 'http://127.0.0.1:8000',
      EXPO_PUBLIC_SENTRY_DSN: GOOD_DSN,
    },
    expect: 'reject',
    note: 'manual preflight forces the production gate',
  },
  {
    group: 'profile',
    label: 'production profile with unsafe env',
    args: [],
    env: { ...baseEnv, EAS_BUILD_PROFILE: 'production', EXPO_PUBLIC_API_BASE_URL: 'http://localhost:8000' },
    expect: 'reject',
    note: 'the EAS pre-install hook gates production',
  },
];

const results = cases.map((testCase) => {
  const runResult = run(testCase.args, testCase.env);
  const actual = runResult.code === 0 ? 'accept' : 'reject';
  return {
    group: testCase.group,
    case: testCase.label,
    note: testCase.note,
    expected: testCase.expect,
    actual,
    exitCode: runResult.code,
    pass: actual === testCase.expect,
    stderr: runResult.stderr || runResult.stdout,
  };
});

const failures = results.filter((r) => !r.pass);
const lines = [];
lines.push(`# CaneGuard production release gate — live CLI matrix`);
lines.push('');
lines.push(`- repo: ${REPO}`);
lines.push(`- entry point: node scripts/release-env.js (same as npm run release:preflight / eas-build-pre-install)`);
lines.push(`- cases: ${results.length}, passed: ${results.length - failures.length}, failed: ${failures.length}`);
lines.push('');
lines.push('| group | case | expected | actual | exit | result |');
lines.push('| --- | --- | --- | --- | --- | --- |');
for (const r of results) {
  lines.push(
    `| ${r.group} | ${r.case.replace(/\|/g, '\\|')} | ${r.expected} | ${r.actual} | ${r.exitCode} | ${r.pass ? 'PASS' : 'FAIL'} |`,
  );
}
lines.push('');
lines.push('## Gate messages');
lines.push('');
for (const r of results) {
  lines.push(`### ${r.case}`);
  lines.push(`expected \`${r.expected}\`, got \`${r.actual}\` (exit ${r.exitCode}) — ${r.note}`);
  lines.push('```');
  lines.push(r.stderr || '(no output)');
  lines.push('```');
  lines.push('');
}
process.stdout.write(lines.join('\n'));
process.exitCode = failures.length === 0 ? 0 : 1;
