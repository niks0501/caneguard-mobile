/* global __dirname, afterEach, beforeEach, describe, expect, it, process */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const sourceScript = path.join(__dirname, '..', 'install-guard-model.js');
const sourceContract = path.join(
  __dirname,
  '..',
  '..',
  'assets',
  'models',
  'caneguard_guard_v1_contract.json',
);

function run(workspace, args, env) {
  return spawnSync(process.execPath, [path.join(workspace, 'scripts/install-guard-model.js'), ...args], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH, ...env },
  });
}

describe('install-guard-model (private delivery)', () => {
  let workspace;
  beforeEach(() => {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-model-'));
    fs.mkdirSync(path.join(workspace, 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(workspace, 'assets/models'), { recursive: true });
    fs.copyFileSync(sourceScript, path.join(workspace, 'scripts/install-guard-model.js'));
    fs.copyFileSync(sourceContract, path.join(workspace, 'assets/models/caneguard_guard_v1_contract.json'));
  });
  afterEach(() => fs.rmSync(workspace, { recursive: true, force: true }));

  it('does nothing without a source unless the model is required', () => {
    const result = run(workspace, [], {});
    expect(result.status).toBe(0);
    expect(fs.readdirSync(path.join(workspace, 'assets/models'))).toEqual([
      'caneguard_guard_v1_contract.json',
    ]);
  });

  it('fails a required install with no source', () => {
    expect(run(workspace, ['--require'], {}).status).toBe(1);
  });

  it('refuses a file with the wrong SHA-256', () => {
    const wrong = path.join(workspace, 'wrong.bin');
    fs.writeFileSync(wrong, 'not the guard model');
    const result = run(workspace, ['--require'], { GUARD_V1_MODEL_FILE: wrong });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/not the frozen Guard V1 artifact/);
    expect(fs.existsSync(path.join(workspace, 'assets/models/caneguard_guard_v1_float32.tflite'))).toBe(false);
  });

  it('refuses a non-https URL', () => {
    const result = run(workspace, ['--require'], { GUARD_V1_MODEL_URL: 'http://example.test/model' });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/https/);
  });

  const local = path.join(__dirname, '..', '..', 'assets', 'models', 'caneguard_guard_v1_float32.tflite');
  (fs.existsSync(local) ? it : it.skip)('installs the verified private binary', () => {
    const result = run(workspace, ['--require'], { GUARD_V1_MODEL_FILE: local });
    expect(result.status).toBe(0);
    expect(fs.existsSync(path.join(workspace, 'assets/models/caneguard_guard_v1_float32.tflite'))).toBe(true);
  });
});
