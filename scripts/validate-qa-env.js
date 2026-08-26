#!/usr/bin/env node

const {
  loadLocalQaEnv,
  validateQaEnvironment,
  readEasConfig,
  validateQaProfile,
} = require('./qa-env');

function main(
  args = process.argv.slice(2),
  env = process.env,
  cwd = process.cwd(),
) {
  const configOnly = args.includes('--config-only');
  const localQaEnv = configOnly
    ? { values: {}, filePath: '.env.qa.local' }
    : loadLocalQaEnv(cwd);
  const effectiveEnv = { ...localQaEnv.values, ...env };
  const requireQa =
    args.includes('--require-qa') ||
    effectiveEnv.EXPO_PUBLIC_QA_MODE === 'true' ||
    effectiveEnv.EAS_BUILD_PROFILE === 'qa';

  if (!configOnly && !requireQa) {
    return 0;
  }

  try {
    validateQaProfile(readEasConfig());
    if (!configOnly) {
      validateQaEnvironment(effectiveEnv, {
        localEnvFilePath: localQaEnv.filePath,
      });
    }
    return 0;
  } catch (error) {
    console.error(`CaneGuard QA preflight failed:\n${error.message}`);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = { main };
