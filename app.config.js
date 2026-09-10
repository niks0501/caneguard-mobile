const { validateQaEnvironment } = require('./scripts/qa-env');

const AUTH_LINK_SCHEME = 'caneguardmobile';
const AUTH_LINK_PATHS = ['/reset-password', '/verify-email'];

function readAuthLinkHost() {
  const value = process.env.EXPO_PUBLIC_AUTH_LINK_HOST?.trim();
  if (!value) {
    return null;
  }
  if (
    value.includes('://') ||
    value.includes('/') ||
    value.includes(':') ||
    value.includes(' ') ||
    value === 'localhost' ||
    /^127(?:\.\d{1,3}){3}$/.test(value)
  ) {
    throw new Error(
      'EXPO_PUBLIC_AUTH_LINK_HOST must be a public hostname without a scheme, port, or path.',
    );
  }
  return value.toLowerCase();
}

module.exports = ({ config }) => {
  const isQa =
    process.env.EXPO_PUBLIC_QA_MODE === 'true' ||
    process.env.EAS_BUILD_PROFILE === 'qa';
  const easBuildProfile = process.env.EAS_BUILD_PROFILE;
  const isReleaseBuild =
    easBuildProfile === 'preview' ||
    easBuildProfile === 'qa' ||
    easBuildProfile === 'production' ||
    process.env.NODE_ENV === 'production';
  const authLinkHost = readAuthLinkHost();

  if (isQa) {
    validateQaEnvironment(process.env, {
      localEnvFilePath: '.env.qa.local',
    });
  }

  const nextConfig = {
    ...config,
    // Custom schemes are deliberately debug-only. Release recovery links must
    // use verified HTTPS App Links so another app cannot claim the token.
    scheme: isReleaseBuild ? undefined : AUTH_LINK_SCHEME,
    android: {
      ...config.android,
      intentFilters: authLinkHost
        ? [
            {
              action: 'VIEW',
              autoVerify: true,
              category: ['BROWSABLE', 'DEFAULT'],
              data: AUTH_LINK_PATHS.map((pathPrefix) => ({
                host: authLinkHost,
                pathPrefix,
                scheme: 'https',
              })),
            },
          ]
        : [],
    },
  };

  // A production config without a host intentionally has no auth deep-link
  // handler. The HTTPS link stays in the browser until the Web/API contract
  // supplies a host and assetlinks.json; no unverified token interception is
  // accepted as a fallback.
  return nextConfig;
};
