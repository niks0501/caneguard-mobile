const path = require('path');

const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const {
  isReleaseBuild,
  resolveWebValidationAlias,
} = require('./scripts/web-validation-config');

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

const releaseBuild = isReleaseBuild();

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
const devAssetsRoot = `${path.join(__dirname, 'dev-assets')}${path.sep}`;
const devAssetsStubPath = path.join(__dirname, 'scripts', 'dev-assets-stub.js');
const upstreamResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Browser validation rewrites: a fixed expo-sqlite worker bridge, plus a
  // flag-gated secure-store stand-in that is never applied to a release build.
  const validationAlias = resolveWebValidationAlias({
    moduleName,
    originModulePath: context.originModulePath,
    platform,
  });
  if (validationAlias) {
    return { type: 'sourceFile', filePath: validationAlias };
  }

  const resolved = upstreamResolveRequest
    ? upstreamResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);

  if (!releaseBuild) {
    return resolved;
  }

  const resolvedPaths =
    resolved?.type === 'sourceFile'
      ? [resolved.filePath]
      : resolved?.type === 'assetFiles'
        ? resolved.filePaths
        : [];

  if (resolvedPaths.some((filePath) => filePath?.startsWith(devAssetsRoot))) {
    return { type: 'sourceFile', filePath: devAssetsStubPath };
  }

  return resolved;
};

/**
 * The web SQLite bridge in `expo-sqlite` 57 talks to its worker through
 * `SharedArrayBuffer`, which browsers only expose to cross-origin-isolated
 * pages. Serving COOP/COEP from the dev server gives validators that isolation
 * without a proxy.
 */
const previousEnhanceMiddleware = config.server?.enhanceMiddleware;
config.server = config.server ?? {};
config.server.enhanceMiddleware = (middleware, server) => {
  const inner = previousEnhanceMiddleware
    ? previousEnhanceMiddleware(middleware, server)
    : middleware;
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    return inner(req, res, next);
  };
};

module.exports = config;
