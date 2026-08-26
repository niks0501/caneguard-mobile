/* global __dirname, describe, expect, it, jest */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  parseConfiguredQaApiBaseUrl,
  parseEnvFile,
  readEasConfig,
  validateQaProfile,
} = require('../qa-env');
const { main: validateQaEnv } = require('../validate-qa-env');
const { main: qaExport } = require('../qa-export');
const appConfig = require('../../app.config');

const missingValue = {
  EXPO_PUBLIC_QA_MODE: 'true',
};

function runScript(script, env, cwd) {
  return spawnSync(process.execPath, [script, '--require-qa'], {
    cwd,
    env,
    encoding: 'utf8',
  });
}

describe('QA build configuration', () => {
  it('accepts the representative public QA URL without exposing it in eas.json', () => {
    expect(
      parseConfiguredQaApiBaseUrl(' https://qa.example.test/api/// '),
    ).toBe('https://qa.example.test/api');
    expect(JSON.stringify(readEasConfig())).not.toContain(
      'EXPO_PUBLIC_API_BASE_URL',
    );
  });

  it('keeps the qa profile on the preview EAS environment with only QA mode local env', () => {
    expect(validateQaProfile()).toMatchObject({
      environment: 'preview',
      channel: 'qa',
      env: { EXPO_PUBLIC_QA_MODE: 'true' },
    });
  });

  it('parses the ignored local QA env file format', () => {
    expect(
      parseEnvFile(
        '# comment\nEXPO_PUBLIC_API_BASE_URL="https://qa.example.test"\nEXPO_PUBLIC_QA_MODE=true\n',
      ),
    ).toEqual({
      EXPO_PUBLIC_API_BASE_URL: 'https://qa.example.test',
      EXPO_PUBLIC_QA_MODE: 'true',
    });
  });

  it.each([
    'http://qa.example.test',
    'https://localhost:8000',
    'https://127.0.0.1:8000',
  ])('rejects a non-public QA URL in the export preflight: %s', (value) => {
    expect(() => parseConfiguredQaApiBaseUrl(value)).toThrow(
      /https for QA|public HTTPS staging host/,
    );
  });

  it('guards a direct QA Expo config/export before artifact creation', () => {
    const previousApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    const previousQaMode = process.env.EXPO_PUBLIC_QA_MODE;
    try {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
      process.env.EXPO_PUBLIC_QA_MODE = 'true';
      expect(() => appConfig({ config: {} })).toThrow(
        /EXPO_PUBLIC_API_BASE_URL[\s\S]*preview/,
      );
    } finally {
      if (previousApiUrl === undefined) {
        delete process.env.EXPO_PUBLIC_API_BASE_URL;
      } else {
        process.env.EXPO_PUBLIC_API_BASE_URL = previousApiUrl;
      }
      if (previousQaMode === undefined) {
        delete process.env.EXPO_PUBLIC_QA_MODE;
      } else {
        process.env.EXPO_PUBLIC_QA_MODE = previousQaMode;
      }
    }
  });

  it('fails the missing-variable preflight with remote and local instructions', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'caneguard-qa-'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(validateQaEnv(['--require-qa'], missingValue, cwd)).toBe(1);
    } finally {
      errorSpy.mockRestore();
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('fails a QA export before invoking Expo when the URL is absent', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'caneguard-qa-'));
    const previousCwd = process.cwd();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      process.chdir(cwd);
      expect(qaExport([], missingValue)).toBe(1);
      expect(fs.readdirSync(cwd)).toEqual([]);
    } finally {
      errorSpy.mockRestore();
      process.chdir(previousCwd);
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('fails the EAS QA hook when the selected build has no URL', () => {
    const script = path.resolve(__dirname, '..', 'validate-qa-env.js');
    const env = { ...process.env, EAS_BUILD_PROFILE: 'qa' };
    delete env.EXPO_PUBLIC_API_BASE_URL;
    delete env.EXPO_PUBLIC_QA_MODE;

    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'caneguard-qa-'));
    const result = runScript(script, env, cwd);
    fs.rmSync(cwd, { recursive: true, force: true });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('preview');
    expect(result.stderr).toContain('.env.qa.local');
  });

  it('allows the EAS QA hook when a non-secret test URL is present', () => {
    const script = path.resolve(__dirname, '..', 'validate-qa-env.js');
    const result = runScript(script, {
      ...process.env,
      EAS_BUILD_PROFILE: 'qa',
      EXPO_PUBLIC_API_BASE_URL: 'https://qa.example.test/api',
      EXPO_PUBLIC_QA_MODE: 'true',
    });

    expect(result.status).toBe(0);
  });
});
