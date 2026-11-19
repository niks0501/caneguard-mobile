/* global __dirname, afterEach, beforeEach, describe, expect, it, process */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const script = path.join(__dirname, '..', 'install-guard-model.js');

function run(args, env, dir) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH, GUARD_V1_MODEL_DIR: dir, ...env },
  });
}

describe('install-guard-model (private delivery)', () => {
  let dir;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-model-'));
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  // Proves: a public checkout without the private model is not broken by the script, and the app is left to fail closed.
  it('does nothing without a source unless the model is required', () => {
    const result = run([], {}, dir);
    expect(result.status).toBe(0);
    expect(fs.readdirSync(dir)).toEqual([]);
  });

  // Proves: a build that requires the model fails when none is supplied (no silent unguarded build).
  it('fails a required install with no source', () => {
    expect(run(['--require'], {}, dir).status).toBe(1);
  });

  // Proves: a file that is not the pinned Guard V1 artifact is refused and never installed.
  it('refuses a file with the wrong SHA-256', () => {
    const wrong = path.join(dir, 'wrong.bin');
    fs.writeFileSync(wrong, 'not the guard model');
    const result = run(['--require'], { GUARD_V1_MODEL_FILE: wrong }, dir);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/not the frozen Guard V1 artifact/);
    expect(fs.existsSync(path.join(dir, 'caneguard_guard_v1_float32.tflite'))).toBe(false);
  });

  // Proves: only https download sources are accepted.
  it('refuses a non-https URL', () => {
    const result = run(['--require'], { GUARD_V1_MODEL_URL: 'http://example.test/model' }, dir);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/https/);
  });

  // Proves: the real private binary, when supplied locally, installs through the file-secret path.
  const local = path.join(__dirname, '..', '..', 'assets', 'models', 'caneguard_guard_v1_float32.tflite');
  (fs.existsSync(local) ? it : it.skip)('installs the verified private binary', () => {
    const result = run(['--require'], { GUARD_V1_MODEL_FILE: local }, dir);
    expect(result.status).toBe(0);
    expect(fs.existsSync(path.join(dir, 'caneguard_guard_v1_float32.tflite'))).toBe(true);
  });
});
