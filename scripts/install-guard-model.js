#!/usr/bin/env node
/**
 * Private delivery of the Guard V1 binary. The model is Git-ignored and never
 * published; build and CI environments supply it, and this script verifies the pinned
 * SHA-256 (from assets/models/caneguard_guard_v1_contract.json) before it is kept.
 *
 * Sources, first match wins:
 *   1. an already-present, verified assets/models/caneguard_guard_v1_float32.tflite
 *   2. GUARD_V1_MODEL_FILE  - path to a file (an EAS file secret exposes one)
 *   3. GUARD_V1_MODEL_URL   - https URL, optional GUARD_V1_MODEL_TOKEN bearer token
 *
 * Usage: node scripts/install-guard-model.js [--require]
 * --require fails the build when no verified model can be installed (used by
 * eas-build-pre-install). Without it a missing source only prints a notice, so a
 * public checkout and the Jest suite still work; the app then fails closed at runtime.
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const modelsDir = process.env.GUARD_V1_MODEL_DIR || path.join(root, 'assets', 'models');
const destination = path.join(modelsDir, 'caneguard_guard_v1_float32.tflite');
const contract = JSON.parse(
  fs.readFileSync(path.join(root, 'assets', 'models', 'caneguard_guard_v1_contract.json'), 'utf8'),
);
const pinnedSha = contract.tflite_sha256;

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function fail(message) {
  console.error('[guard-model] ' + message);
  process.exit(1);
}

async function readSource(env) {
  if (env.GUARD_V1_MODEL_FILE) {
    return { label: 'GUARD_V1_MODEL_FILE', bytes: fs.readFileSync(env.GUARD_V1_MODEL_FILE) };
  }
  if (env.GUARD_V1_MODEL_URL) {
    const url = new URL(env.GUARD_V1_MODEL_URL);
    if (url.protocol !== 'https:') fail('GUARD_V1_MODEL_URL must use https.');
    const headers = env.GUARD_V1_MODEL_TOKEN
      ? { Authorization: 'Bearer ' + env.GUARD_V1_MODEL_TOKEN }
      : {};
    const response = await fetch(url, { headers });
    if (!response.ok) fail('Download failed with HTTP ' + response.status + '.');
    return { label: 'GUARD_V1_MODEL_URL', bytes: Buffer.from(await response.arrayBuffer()) };
  }
  return null;
}

async function main() {
  const required = process.argv.includes('--require');
  if (fs.existsSync(destination) && sha256(fs.readFileSync(destination)) === pinnedSha) {
    console.log('[guard-model] verified model already present.');
    return;
  }
  const source = await readSource(process.env);
  if (!source) {
    if (required) {
      fail('No Guard V1 model supplied. Set GUARD_V1_MODEL_FILE (EAS file secret) or GUARD_V1_MODEL_URL.');
    }
    console.log('[guard-model] no model supplied; the app will fail closed without it.');
    return;
  }
  const actual = sha256(source.bytes);
  if (actual !== pinnedSha) {
    fail(source.label + ' is not the frozen Guard V1 artifact (SHA-256 ' + actual + ').');
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, source.bytes);
  console.log('[guard-model] installed verified model from ' + source.label + '.');
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
