const { withAndroidManifest } = require('@expo/config-plugins');

/** Keep local report databases and managed images out of Android backup/transfer. */
module.exports = function withSecurityAndroid(config) {
  return withAndroidManifest(config, (modConfig) => {
    const application = modConfig.modResults.manifest.application?.[0];
    if (!application) {
      throw new Error('CaneGuard Android application manifest entry is missing.');
    }
    application.$ = {
      ...application.$,
      'android:allowBackup': 'false',
      'android:fullBackupOnly': 'false',
    };
    return modConfig;
  });
};
