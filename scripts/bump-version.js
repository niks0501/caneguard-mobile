#!/usr/bin/env node

const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'app.json');
const packagePath = path.join(root, 'package.json');
const dryRun = process.argv.includes('--dry-run');
const bump = process.argv.slice(2).find((argument) => !argument.startsWith('--'));
const validBumps = new Set(['patch', 'minor', 'major']);

if (!validBumps.has(bump)) {
  fail('Usage: node scripts/bump-version.js <patch|minor|major> [--dry-run]');
}

const app = JSON.parse(fs.readFileSync(appPath, 'utf8'));
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const current = app.expo?.version;
if (typeof current !== 'string' || current !== pkg.version) {
  fail(`Version drift: app.json expo.version (${current}) must match package.json version (${pkg.version}).`);
}

let baseVersion = current;
try {
  const tag = execFileSync('git', ['describe', '--tags', '--abbrev=0'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
  const taggedVersion = tag.match(/^v?(\d+\.\d+\.\d+)$/)?.[1];
  if (taggedVersion) baseVersion = taggedVersion;
} catch {
  // A first release can bootstrap from the checked-in Expo version.
}

if (baseVersion !== current) {
  fail(`Latest release tag (${baseVersion}) does not match app version (${current}); reconcile before bumping.`);
}

const parts = baseVersion.split('.').map(Number);
if (parts.length !== 3 || parts.some((part) => !Number.isSafeInteger(part) || part < 0)) {
  fail(`Cannot bump non-semver app version: ${baseVersion}`);
}
if (bump === 'major') parts[0] += 1;
if (bump === 'minor') {
  parts[1] += 1;
  parts[2] = 0;
}
if (bump === 'patch') parts[2] += 1;
const nextVersion = parts.join('.');

if (dryRun) {
  console.log(`${current} -> ${nextVersion} (dry run)`);
  process.exit(0);
}

app.expo.version = nextVersion;
pkg.version = nextVersion;
fs.writeFileSync(appPath, `${JSON.stringify(app, null, 2)}\n`);
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(nextVersion);

function fail(message) {
  console.error(message);
  process.exit(1);
}
