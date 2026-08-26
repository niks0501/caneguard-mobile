#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const {
  loadLocalQaEnv,
  readEasConfig,
  validateQaEnvironment,
  validateQaProfile,
} = require('./qa-env');

function main(args = process.argv.slice(2), processEnv = process.env) {
  const localQaEnv = loadLocalQaEnv();
  const env = {
    ...localQaEnv.values,
    ...processEnv,
    EXPO_NO_DOTENV: '1',
    EXPO_PUBLIC_QA_MODE: 'true',
  };

  try {
    validateQaProfile(readEasConfig());
    validateQaEnvironment(env, { localEnvFilePath: localQaEnv.filePath });
  } catch (error) {
    console.error(`CaneGuard QA export preflight failed:\n${error.message}`);
    return 1;
  }

  const exportArgs = args.length
    ? args
    : ['--platform', 'android', '--output-dir', '.expo/qa-export-check'];
  if (!exportArgs.includes('--clear')) {
    exportArgs.unshift('--clear');
  }
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(
    npx,
    ['--no-install', 'expo', 'export', ...exportArgs],
    {
      env,
      stdio: 'inherit',
    },
  );

  if (result.error) {
    console.error(`CaneGuard QA export could not start: ${result.error.message}`);
    return 1;
  }

  return result.status ?? 1;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = { main };
