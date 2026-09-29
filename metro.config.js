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

module.exports = config;
