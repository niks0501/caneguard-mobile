/**
 * Production release gate. Runs in the EAS pre-install hook when the build
 * profile is `production` (or with `--require-production`) and fails the build
 * before any dependency is installed when the release environment is unsafe:
 * a missing or malformed API URL, or missing crash reporting and symbol upload.
 */

const API_BASE_URL_KEY = 'EXPO_PUBLIC_API_BASE_URL';
const SENTRY_DSN_KEY = 'EXPO_PUBLIC_SENTRY_DSN';
const SENTRY_UPLOAD_KEYS = ['SENTRY_ORG', 'SENTRY_PROJECT', 'SENTRY_AUTH_TOKEN'];

const NON_PUBLIC_HOST_SUFFIXES = [
  '.local',
  '.localdomain',
  '.internal',
  '.lan',
  '.home',
  '.test',
  '.example',
  '.invalid',
  '.localhost',
];

function isPrivateIpv4(hostname) {
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) {
    return false;
  }
  const [a, b] = [Number(match[1]), Number(match[2])];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

function isPublicHostname(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  // IPv6 literals (bracketed by URL) are never an acceptable production host.
  if (host.startsWith('[') || host.includes(':')) {
    return false;
  }
  if (host === 'localhost' || isPrivateIpv4(host)) {
    return false;
  }
  if (NON_PUBLIC_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return false;
  }
  // A public name has at least one dot (no bare intranet labels).
  return host.includes('.');
}

/** Returns a list of problems with the production API base URL (empty when valid). */
function validateProductionApiBaseUrl(value) {
  const normalized = value?.trim();
  if (!normalized) {
    return [`${API_BASE_URL_KEY} is required for a production build.`];
  }

  let url;
  try {
    url = new URL(normalized);
  } catch {
    return [`${API_BASE_URL_KEY} must be a valid absolute URL.`];
  }

  const problems = [];
  if (url.protocol !== 'https:') {
    problems.push(`${API_BASE_URL_KEY} must use https in production.`);
  }
  if (url.username || url.password) {
    problems.push(`${API_BASE_URL_KEY} must not contain credentials.`);
  }
  if (url.search || url.hash) {
    problems.push(`${API_BASE_URL_KEY} must not contain a query string or fragment.`);
  }
  if (!isPublicHostname(url.hostname)) {
    problems.push(
      `${API_BASE_URL_KEY} must use a public host, not a local, private, or placeholder address (received host "${url.hostname}").`,
    );
  }
  return problems;
}

/** Returns a list of problems with the Sentry DSN (empty when valid). */
function validateSentryDsn(value) {
  const normalized = value?.trim();
  if (!normalized) {
    return [`${SENTRY_DSN_KEY} is required for a production build.`];
  }

  let url;
  try {
    url = new URL(normalized);
  } catch {
    return [`${SENTRY_DSN_KEY} must be a valid Sentry DSN URL.`];
  }
  if (
    url.protocol !== 'https:' ||
    !/^\w+$/.test(url.username) ||
    url.pathname.length <= 1 ||
    url.search ||
    url.hash
  ) {
    return [
      `${SENTRY_DSN_KEY} must look like https://<public-key>@<host>/<project-id>.`,
    ];
  }
  return [];
}

/** Returns the missing Sentry source map and symbol upload settings. */
function validateSentryUpload(env) {
  return SENTRY_UPLOAD_KEYS.filter((key) => !env[key]?.trim()).map(
    (key) =>
      `${key} is required for a production build so source maps and native symbols are uploaded.`,
  );
}

function validateProductionEnvironment(env, options = {}) {
  return [
    ...validateProductionApiBaseUrl(env[API_BASE_URL_KEY]),
    ...validateSentryDsn(env[SENTRY_DSN_KEY]),
    // Over-the-air updates ship no native symbols, and the upload token is an
    // EAS secret that `eas env:exec` does not expose, so updates skip it.
    ...(options.skipUpload ? [] : validateSentryUpload(env)),
  ];
}

function main(args = process.argv.slice(2), env = process.env) {
  const required =
    args.includes('--require-production') ||
    env.EAS_BUILD_PROFILE === 'production';
  if (!required) {
    return 0;
  }

  const problems = validateProductionEnvironment(env, {
    skipUpload: args.includes('--skip-upload'),
  });
  if (problems.length > 0) {
    console.error(
      `CaneGuard production release gate failed; no build was started:\n- ${problems.join('\n- ')}`,
    );
    return 1;
  }
  return 0;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  isPublicHostname,
  main,
  validateProductionApiBaseUrl,
  validateProductionEnvironment,
  validateSentryDsn,
  validateSentryUpload,
};
