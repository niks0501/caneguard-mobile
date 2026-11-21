/**
 * Production release gate. Runs in the EAS pre-install hook when the build
 * profile is `production` (or with `--require-production`) and fails the build
 * before any dependency is installed when the release environment is unsafe:
 * a missing or malformed API URL, or missing crash reporting and symbol upload.
 */

const net = require('node:net');

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

function isNonPublicIpv4(hostname) {
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) {
    return false;
  }
  const [a, b, c, d] = match.slice(1).map(Number);
  if ([a, b, c, d].some((octet) => octet > 255)) {
    return false;
  }
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && b >= 18 && b <= 19) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function ipv6ToBigInt(hostname) {
  const sections = hostname.split('::');
  if (sections.length > 2) {
    return null;
  }

  const parseSection = (section) => {
    if (!section) {
      return [];
    }
    const groups = section.split(':');
    const lastGroup = groups[groups.length - 1];
    if (!lastGroup.includes('.')) {
      return groups;
    }
    const octets = lastGroup.split('.').map(Number);
    if (
      octets.length !== 4 ||
      octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
    ) {
      return null;
    }
    return [
      ...groups.slice(0, -1),
      ((octets[0] << 8) | octets[1]).toString(16),
      ((octets[2] << 8) | octets[3]).toString(16),
    ];
  };

  const left = parseSection(sections[0]);
  const right = sections.length === 2 ? parseSection(sections[1]) : [];
  if (!left || !right) {
    return null;
  }

  const groups = [...left, ...right];
  const missing = sections.length === 2 ? 8 - groups.length : 0;
  if (
    groups.length > 8 ||
    (sections.length === 1 && groups.length !== 8) ||
    (sections.length === 2 && missing < 1)
  ) {
    return null;
  }

  const expanded =
    sections.length === 2
      ? [...left, ...Array(missing).fill('0'), ...right]
      : groups;
  if (expanded.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) {
    return null;
  }

  return expanded.reduce(
    (value, group) => (value << 16n) | BigInt(parseInt(group, 16)),
    0n,
  );
}

function isIpv6InRange(hostname, prefix, prefixLength) {
  const address = ipv6ToBigInt(hostname);
  const network = ipv6ToBigInt(prefix);
  if (address === null || network === null) {
    return false;
  }
  const mask =
    prefixLength === 0
      ? 0n
      : ((1n << 128n) - 1n) ^ ((1n << BigInt(128 - prefixLength)) - 1n);
  return (address & mask) === (network & mask);
}

const NON_PUBLIC_IPV6_RANGES = [
  ['2001::', 32],
  ['2001:2::', 48],
  ['2001:10::', 28],
  ['2001:20::', 28],
  ['2001:db8::', 32],
  ['3fff::', 20],
];

function isPublicIpv6(hostname) {
  if (!isIpv6InRange(hostname, '2000::', 3)) {
    return false;
  }
  return !NON_PUBLIC_IPV6_RANGES.some(([prefix, prefixLength]) =>
    isIpv6InRange(hostname, prefix, prefixLength),
  );
}

function isValidDnsHostname(hostname) {
  if (!hostname || hostname.length > 253) {
    return false;
  }
  return hostname.split('.').every(
    (label) =>
      label.length > 0 &&
      label.length <= 63 &&
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label),
  );
}

function isPublicHostname(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  const bracketedHost = host.startsWith('[') && host.endsWith(']');
  const address = bracketedHost ? host.slice(1, -1) : host;
  const ipVersion = net.isIP(address);
  if (ipVersion === 4) {
    return !isNonPublicIpv4(address);
  }
  if (ipVersion === 6) {
    return isPublicIpv6(address);
  }
  if (bracketedHost || host.includes(':')) {
    return false;
  }
  if (!isValidDnsHostname(host) || host === 'localhost') {
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
  const projectId = url.pathname.split('/').pop() ?? '';
  if (
    url.protocol !== 'https:' ||
    !/^\w+$/.test(url.username) ||
    !/^\d+$/.test(projectId) ||
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
