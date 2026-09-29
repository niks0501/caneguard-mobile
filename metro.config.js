const path = require('path');

const { getSentryExpoConfig } = require('@sentry/react-native/metro');

// The Sentry Metro config embeds debug IDs and keeps the Expo defaults, so
// uploaded source maps can symbolicate release builds. It needs no DSN and
// changes nothing when crash reporting is disabled.
const config = getSentryExpoConfig(__dirname);

for (const extension of ['tflite', 'wasm']) {
  if (!config.resolver.assetExts.includes(extension)) {
    config.resolver.assetExts.push(extension);
  }
}

if (!config.resolver.sourceExts.includes('sql')) {
  config.resolver.sourceExts.push('sql');
}

/**
 * `dev-assets/` holds the Model V1 QA fixtures. Only the `__DEV__`-gated model
 * screens require them, but Metro resolves every static require it can see, so
 * without this the release bundle carries about 9.5 MB of fixture JPEGs.
 *
 * This is a resolver rewrite rather than `resolver.blockList` on purpose: a
 * blocked module is a build failure, and the dev screens stay in the release
 * route graph, so their requires still have to resolve to something. The stub is
 * a plain number, which is exactly what an asset module id is.
 */
const isReleaseBuild =
  ['preview', 'qa', 'production'].includes(process.env.EAS_BUILD_PROFILE) ||
  process.env.NODE_ENV === 'production';

if (isReleaseBuild) {
  const devAssetsRoot = `${path.join(__dirname, 'dev-assets')}${path.sep}`;
  const stubPath = path.join(__dirname, 'scripts', 'dev-assets-stub.js');
  const upstreamResolveRequest = config.resolver.resolveRequest;

  config.resolver.resolveRequest = (context, moduleName, platform) => {
    const resolved = upstreamResolveRequest
      ? upstreamResolveRequest(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);

    const resolvedPaths =
      resolved?.type === 'sourceFile'
        ? [resolved.filePath]
        : resolved?.type === 'assetFiles'
          ? resolved.filePaths
          : [];

    if (resolvedPaths.some((filePath) => filePath?.startsWith(devAssetsRoot))) {
      return { type: 'sourceFile', filePath: stubPath };
    }

    return resolved;
  };
}

module.exports = config;
