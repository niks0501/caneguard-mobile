/* global __dirname */

const fs = require('node:fs');
const path = require('node:path');

const API_BASE_URL_KEY = 'EXPO_PUBLIC_API_BASE_URL';
const QA_MODE_KEY = 'EXPO_PUBLIC_QA_MODE';
const EAS_QA_ENVIRONMENT = 'preview';
const LOCAL_QA_ENV_FILE = '.env.qa.local';

function parseEnvFile(contents) {
  const values = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const match = trimmed.match(
      /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/,
    );
    if (!match) {
      continue;
    }

    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }

  return values;
}

function loadLocalQaEnv(cwd = process.cwd()) {
  const filePath = path.join(cwd, LOCAL_QA_ENV_FILE);
  if (!fs.existsSync(filePath)) {
    return { filePath, values: {} };
  }

  return {
    filePath,
    values: parseEnvFile(fs.readFileSync(filePath, 'utf8')),
  };
}

function missingApiBaseUrlMessage(localEnvFilePath) {
  const localPath = localEnvFilePath || LOCAL_QA_ENV_FILE;
  return [
    `${API_BASE_URL_KEY} is required before a QA export or build; no artifact was started.`,
    `Remote EAS QA must set it as a plaintext variable in the EAS ${EAS_QA_ENVIRONMENT} environment selected by eas.json:`,
    `eas env:set --name ${API_BASE_URL_KEY} --value "$QA_PUBLIC_URL" --environment ${EAS_QA_ENVIRONMENT} --visibility plaintext`,
    `EAS config/build must load that environment before local Expo config resolution:`,
    `eas env:exec ${EAS_QA_ENVIRONMENT} 'EXPO_NO_DOTENV=1 eas build --platform android --profile qa --json --no-wait'`,
    `Local QA must copy .env.qa.example to ${localPath} with the current HTTPS Funnel URL, then run npm run qa:export.`,
  ].join('\n');
}

function parseConfiguredQaApiBaseUrl(value, localEnvFilePath) {
  const normalized = value?.trim().replace(/\/+$/, '');
  if (!normalized) {
    throw new Error(missingApiBaseUrlMessage(localEnvFilePath));
  }

  let url;
  try {
    url = new URL(normalized);
  } catch {
    throw new Error(`${API_BASE_URL_KEY} must be a valid absolute URL.`);
  }

  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.username ||
    url.password
  ) {
    throw new Error(
      `${API_BASE_URL_KEY} must use http or https and must not contain credentials.`,
    );
  }

  if (url.protocol !== 'https:') {
    throw new Error(`${API_BASE_URL_KEY} must use https for QA staging.`);
  }

  if (
    /^(localhost|0\.0\.0\.0|127(?:\.\d{1,3}){3}|\[?::1\]?)$/i.test(
      url.hostname,
    )
  ) {
    throw new Error(
      `${API_BASE_URL_KEY} must use the public HTTPS staging host for QA, not a local address.`,
    );
  }

  return normalized;
}

function validateQaEnvironment(env, options = {}) {
  return parseConfiguredQaApiBaseUrl(
    env[API_BASE_URL_KEY],
    options.localEnvFilePath,
  );
}

function readEasConfig() {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'eas.json'), 'utf8'),
  );
}

function validateQaProfile(config = readEasConfig()) {
  const profile = config?.build?.qa;
  if (!profile || profile.environment !== EAS_QA_ENVIRONMENT) {
    throw new Error(
      `The qa EAS profile must select the ${EAS_QA_ENVIRONMENT} environment so EXPO_PUBLIC_API_BASE_URL can be supplied by EAS.`,
    );
  }

  const profileEnv = profile.env || {};
  const profileEnvKeys = Object.keys(profileEnv);
  if (
    profileEnvKeys.length !== 1 ||
    profileEnv[QA_MODE_KEY] !== 'true'
  ) {
    throw new Error(
      `The qa EAS profile must keep only ${QA_MODE_KEY}=true in profile-local env; EXPO_PUBLIC_API_BASE_URL belongs in the ${EAS_QA_ENVIRONMENT} EAS environment.`,
    );
  }

  return profile;
}

module.exports = {
  API_BASE_URL_KEY,
  EAS_QA_ENVIRONMENT,
  LOCAL_QA_ENV_FILE,
  QA_MODE_KEY,
  loadLocalQaEnv,
  missingApiBaseUrlMessage,
  parseConfiguredQaApiBaseUrl,
  parseEnvFile,
  readEasConfig,
  validateQaEnvironment,
  validateQaProfile,
};
