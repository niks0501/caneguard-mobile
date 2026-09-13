const fs = require('node:fs');
const path = require('node:path');

const appConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8'),
).expo;
const EXPECTED_CODE_SIGNING_KEY_ID = 'caneguard-v1-20260913';

const releaseRequired =
  process.argv.includes('--release') ||
  (process.argv.includes('--eas') && process.env.EAS_BUILD_PROFILE === 'production');

const blockedPermissions = appConfig.android?.blockedPermissions ?? [];
if (!blockedPermissions.includes('android.permission.SYSTEM_ALERT_WINDOW')) {
  fail('Android release config must block SYSTEM_ALERT_WINDOW.');
}

if (appConfig.scheme === 'caneguardmobile') {
  fail('The release source config must not declare the custom auth URI scheme.');
}

const updates = appConfig.updates ?? {};
const metadata = updates.codeSigningMetadata;
if (
  typeof updates.codeSigningCertificate !== 'string' ||
  !updates.codeSigningCertificate.trim() ||
  !metadata ||
  metadata.keyid !== EXPECTED_CODE_SIGNING_KEY_ID ||
  metadata.alg !== 'rsa-v1_5-sha256'
) {
  fail('Expo Updates code-signing certificate and metadata are incomplete.');
}

const certificatePath = path.resolve(
  path.join(__dirname, '..'),
  updates.codeSigningCertificate,
);
if (releaseRequired && !fs.existsSync(certificatePath)) {
  fail(
    'Production OTA signing certificate is not present. Supply the public certificate at the configured path before a production build.',
  );
}

const mapTileTemplate = process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL?.trim();
if (mapTileTemplate) {
  let tileUrl;
  try {
    tileUrl = new URL(mapTileTemplate);
  } catch {
    fail('EXPO_PUBLIC_MAP_TILE_PROXY_URL must be an absolute HTTPS URL template.');
  }
  if (
    tileUrl &&
    (tileUrl.protocol !== 'https:' ||
      tileUrl.username ||
      tileUrl.password ||
      tileUrl.hostname === 'tile.openstreetmap.org' ||
      tileUrl.hostname.endsWith('.tile.openstreetmap.org') ||
      !['{z}', '{x}', '{y}'].every((placeholder) =>
        mapTileTemplate.includes(placeholder),
      ))
  ) {
    fail(
      'EXPO_PUBLIC_MAP_TILE_PROXY_URL must be an HTTPS CaneGuard proxy template with {z}, {x}, and {y}.',
    );
  }
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (tileUrl && apiBaseUrl) {
    try {
      if (new URL(apiBaseUrl).origin !== tileUrl.origin) {
        fail('The map tile proxy must use the configured CaneGuard API origin.');
      }
    } catch {
      fail('EXPO_PUBLIC_API_BASE_URL must be a valid absolute URL.');
    }
  }
}

if (releaseRequired) {
  const host = process.env.EXPO_PUBLIC_AUTH_LINK_HOST?.trim();
  if (
    !host ||
    host.includes('://') ||
    host.includes('/') ||
    host.includes(':') ||
    host.includes(' ') ||
    host === 'localhost' ||
    /^127(?:\.\d{1,3}){3}$/.test(host)
  ) {
    fail(
      'Production auth App Links require EXPO_PUBLIC_AUTH_LINK_HOST as a public hostname without a scheme, port, or path.',
    );
  }
}

if (process.exitCode !== 1) {
  console.log(
    releaseRequired
      ? 'Security configuration is release-ready; certificate presence and App Link configuration passed static checks.'
      : 'Security configuration structure is valid; production certificate and App Link host are checked at release time.',
  );
}

function fail(message) {
  console.error(`Security configuration error: ${message}`);
  process.exitCode = 1;
}
