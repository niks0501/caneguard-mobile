const fs = require('node:fs');
const path = require('node:path');

const {
  SECURE_STORE_STAND_IN_PATH,
  SQLITE_WORKER_CHANNEL_PATH,
  isReleaseBuild,
  isWebValidationEnabled,
  resolveWebValidationAlias,
} = require('../web-validation-config');
const {
  invokeWorkerSync,
  sendWorkerResult,
} = require('../../validation/expo-sqlite/WorkerChannel');

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

function resolveWorkerChannel(env, platform = 'web') {
  return resolveWebValidationAlias(
    {
      moduleName: './WorkerChannel',
      originModulePath: path.join(
        repoRoot,
        'node_modules',
        'expo-sqlite',
        'web',
        'SQLiteModule.ts',
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
    expect(fs.existsSync(SQLITE_WORKER_CHANNEL_PATH)).toBe(true);
  });

  it('applies the secure-store stand-in only when the validation flag is set', () => {
    expect(resolveSecureStore(enabledEnv)).toBe(SECURE_STORE_STAND_IN_PATH);
    expect(resolveSecureStore({})).toBeNull();
    expect(
      resolveSecureStore({ ...enabledEnv, EXPO_PUBLIC_WEB_VALIDATION: 'true' }),
    ).toBeNull();
  });

  it('refuses the secure-store stand-in when the API is not the loopback stub', () => {
    for (const apiBaseUrl of [
      undefined,
      'https://api.example.test',
      'https://127.0.0.1:8210',
      'http://192.168.1.5:8210',
      'http://127.0.0.1.evil.test:8210',
    ]) {
      expect(
        resolveSecureStore({
          ...enabledEnv,
          EXPO_PUBLIC_API_BASE_URL: apiBaseUrl,
        }),
      ).toBeNull();
    }
  });

  it('accepts the loopback stub API host names', () => {
    for (const apiBaseUrl of [
      'http://127.0.0.1:8210',
      'http://localhost:8210',
      'http://[::1]:8210',
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

  it('never applies either alias on a native platform', () => {
    expect(resolveSecureStore(enabledEnv, 'ios')).toBeNull();
    expect(resolveSecureStore(enabledEnv, 'android')).toBeNull();
    expect(resolveWorkerChannel(enabledEnv, 'ios')).toBeNull();
    expect(resolveWorkerChannel(enabledEnv, 'android')).toBeNull();
  });

  it('always repairs the expo-sqlite worker bridge on web', () => {
    expect(resolveWorkerChannel(enabledEnv)).toBe(SQLITE_WORKER_CHANNEL_PATH);
    expect(resolveWorkerChannel({})).toBe(SQLITE_WORKER_CHANNEL_PATH);
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

describe('vendored expo-sqlite worker bridge', () => {
  function createWorker(result) {
    return {
      postMessage(message) {
        sendWorkerResult({
          error: null,
          id: message.id,
          result,
          syncTrait: {
            lockBuffer: message.lockBuffer,
            resultBuffer: message.resultBuffer,
          },
        });
      },
    };
  }

  it('reads a sync result longer than 255 bytes back intact', () => {
    const result = { rows: [{ notes: 'x'.repeat(400) }] };

    expect(JSON.stringify(result).length).toBeGreaterThan(255);
    expect(
      invokeWorkerSync(createWorker(result), 'exec', { source: 'select 1' }),
    ).toEqual(result);
  });
});
