/* global describe, expect, it */

const fs = require('node:fs');
const path = require('node:path');

const {
  FILE_SYSTEM_STAND_IN_PATH,
  SECURE_STORE_STAND_IN_PATH,
  isReleaseBuild,
  isWebValidationEnabled,
  resolveWebValidationAlias,
} = require('../web-validation-config');

const repoRoot = path.join(__dirname, '..', '..');
const enabledEnv = {
  EXPO_PUBLIC_API_BASE_URL: 'http://127.0.0.1:8210',
  EXPO_PUBLIC_WEB_VALIDATION: '1',
};

function resolveSecureStore(env, platform = 'web') {
  return resolveWebValidationAlias(
    {
      moduleName: './ExpoSecureStore',
      originModulePath: path.join(
        repoRoot,
        'node_modules',
        'expo-secure-store',
        'build',
        'SecureStore.js',
      ),
      platform,
    },
    env,
  );
}

function resolveFileSystem(env, platform = 'web') {
  return resolveWebValidationAlias(
    {
      moduleName: './ExpoFileSystem',
      originModulePath: path.join(
        repoRoot,
        'node_modules',
        'expo-file-system',
        'src',
        'File.ts',
      ),
      platform,
    },
    env,
  );
}

describe('web validation Metro gate', () => {
  it('keeps a single-page web output for the dev server', () => {
    const appConfig = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'app.json'), 'utf8'),
    );

    expect(appConfig.expo.web.output).toBe('single');
  });

  it('ships the files the aliases point at', () => {
    expect(fs.existsSync(SECURE_STORE_STAND_IN_PATH)).toBe(true);
    expect(fs.existsSync(FILE_SYSTEM_STAND_IN_PATH)).toBe(true);
  });

  it('applies the secure-store stand-in only when the validation flag is set', () => {
    expect(resolveSecureStore(enabledEnv)).toBe(SECURE_STORE_STAND_IN_PATH);
    expect(resolveSecureStore({})).toBeNull();
    expect(
      resolveSecureStore({ ...enabledEnv, EXPO_PUBLIC_WEB_VALIDATION: 'true' }),
    ).toBeNull();
  });

  it('refuses the secure-store stand-in for any API but the stub base URL', () => {
    for (const apiBaseUrl of [
      undefined,
      'https://api.example.test',
      'http://localhost:8210',
      'http://[::1]:8210',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:80',
      'https://127.0.0.1:8210',
      'http://192.168.1.5:8210',
      'http://127.0.0.1.evil.test:8210',
      'http://127.0.0.1:8210/api',
      'http://127.0.0.1:8210/?proxied=1',
      'http://127.0.0.1:8210/#fragment',
      'http://user:pass@127.0.0.1:8210',
    ]) {
      expect(
        resolveSecureStore({
          ...enabledEnv,
          EXPO_PUBLIC_API_BASE_URL: apiBaseUrl,
        }),
      ).toBeNull();
    }
  });

  it('accepts only the stub base URL', () => {
    for (const apiBaseUrl of [
      'http://127.0.0.1:8210',
      'http://127.0.0.1:8210/',
      ' http://127.0.0.1:8210 ',
    ]) {
      expect(
        resolveSecureStore({
          ...enabledEnv,
          EXPO_PUBLIC_API_BASE_URL: apiBaseUrl,
        }),
      ).toBe(SECURE_STORE_STAND_IN_PATH);
    }
  });

  it.each(['preview', 'qa', 'production'])(
    'never applies the secure-store stand-in to the %s release profile',
    (profile) => {
      const env = {
        ...enabledEnv,
        EAS_BUILD_PROFILE: profile,
      };

      expect(isReleaseBuild(env)).toBe(true);
      expect(isWebValidationEnabled(env)).toBe(false);
      expect(resolveSecureStore(env)).toBeNull();
    },
  );

  it('never applies the secure-store stand-in to a production bundle', () => {
    const env = { ...enabledEnv, NODE_ENV: 'production' };

    expect(isWebValidationEnabled(env)).toBe(false);
    expect(resolveSecureStore(env)).toBeNull();
  });

  it('applies the file-system stand-in only to the validation web route', () => {
    expect(resolveFileSystem(enabledEnv)).toBe(FILE_SYSTEM_STAND_IN_PATH);
    expect(resolveFileSystem({})).toBeNull();
    expect(
      resolveFileSystem({
        ...enabledEnv,
        EXPO_PUBLIC_API_BASE_URL: 'https://api.example.test',
      }),
    ).toBeNull();
    expect(
      resolveFileSystem({ ...enabledEnv, EAS_BUILD_PROFILE: 'production' }),
    ).toBeNull();
  });

  it('never applies any alias on a native platform', () => {
    expect(resolveSecureStore(enabledEnv, 'ios')).toBeNull();
    expect(resolveSecureStore(enabledEnv, 'android')).toBeNull();
    expect(resolveFileSystem(enabledEnv, 'ios')).toBeNull();
    expect(resolveFileSystem(enabledEnv, 'android')).toBeNull();
  });

  it('leaves unrelated modules alone', () => {
    expect(
      resolveWebValidationAlias(
        {
          moduleName: 'expo-secure-store',
          originModulePath: path.join(repoRoot, 'src', 'app', '_layout.tsx'),
          platform: 'web',
        },
        enabledEnv,
      ),
    ).toBeNull();
  });
});
