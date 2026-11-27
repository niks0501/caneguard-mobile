#!/usr/bin/env node

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const SEMVER_RE = /^\d+\.\d+\.\d+$/;

function readJsonFromFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readJsonFromGit(cwd, ref, repoPath) {
  const raw = execFileSync('git', ['show', `${ref}:${repoPath}`], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(raw);
}

function allowedNextVersions(baseVersion) {
  if (typeof baseVersion !== 'string' || !SEMVER_RE.test(baseVersion)) {
    throw new Error(`Invalid base semver version: ${String(baseVersion)}`);
  }
  const parts = baseVersion.split('.').map(Number);
  return [
    `${parts[0]}.${parts[1]}.${parts[2] + 1}`,
    `${parts[0]}.${parts[1] + 1}.0`,
    `${parts[0] + 1}.${parts[1]}.${parts[2]}`,
  ];
}

function listChangedFiles(cwd, baseSha) {
  const raw = execFileSync(
    'git',
    ['diff', '--name-only', '--no-renames', '-z', baseSha, 'HEAD'],
    { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  return raw.split('\0').filter(Boolean).sort();
}

function checkVersionGuard({ cwd, baseSha }) {
  const normalizedBaseSha = typeof baseSha === 'string' ? baseSha.trim() : '';
  if (!normalizedBaseSha) {
    throw new Error('BASE_SHA is required to validate app version changes against the PR base.');
  }

  const baseApp = readJsonFromGit(cwd, normalizedBaseSha, 'app.json');
  const basePkg = readJsonFromGit(cwd, normalizedBaseSha, 'package.json');
  const app = readJsonFromFile(path.join(cwd, 'app.json'));
  const pkg = readJsonFromFile(path.join(cwd, 'package.json'));

  const baseAppVersion = baseApp.expo?.version;
  const basePkgVersion = basePkg.version;
  const nextAppVersion = app.expo?.version;
  const nextPkgVersion = pkg.version;

  const versionChanged =
    nextAppVersion !== baseAppVersion || nextPkgVersion !== basePkgVersion;

  if (!versionChanged) {
    return {
      ok: true,
      kind: 'unchanged',
      version: nextAppVersion ?? null,
    };
  }

  const changedFiles = listChangedFiles(cwd, normalizedBaseSha);
  const expectedFiles = ['app.json', 'package.json'];
  if (
    changedFiles.length !== expectedFiles.length ||
    changedFiles[0] !== expectedFiles[0] ||
    changedFiles[1] !== expectedFiles[1]
  ) {
    throw new Error(
      `Release version bumps may only change app.json and package.json against PR base ${normalizedBaseSha}; changed files: ${changedFiles.join(', ') || '(none)'}.`,
    );
  }

  if (typeof baseAppVersion !== 'string' || !SEMVER_RE.test(baseAppVersion)) {
    throw new Error(`Base app.json expo.version is not valid semver: ${String(baseAppVersion)}`);
  }
  if (baseAppVersion !== basePkgVersion) {
    throw new Error(
      `Base version mismatch: app.json expo.version (${baseAppVersion}) does not match package.json version (${String(basePkgVersion)}).`,
    );
  }

  if (typeof nextAppVersion !== 'string' || !SEMVER_RE.test(nextAppVersion)) {
    throw new Error(`Target app.json expo.version must be X.Y.Z semver: ${String(nextAppVersion)}`);
  }
  if (nextAppVersion !== nextPkgVersion) {
    throw new Error(
      `Version mismatch: app.json expo.version (${nextAppVersion}) must match package.json version (${String(nextPkgVersion)}).`,
    );
  }

  try {
    assert.deepStrictEqual(app, {
      ...baseApp,
      expo: {
        ...baseApp.expo,
        version: nextAppVersion,
      },
    });
    assert.deepStrictEqual(pkg, {
      ...basePkg,
      version: nextPkgVersion,
    });
  } catch {
    throw new Error(
      'Release version bump PRs may only change app.json expo.version and package.json version; no other fields may be modified.',
    );
  }

  const allowed = allowedNextVersions(baseAppVersion);
  if (!allowed.includes(nextAppVersion)) {
    throw new Error(
      `Invalid version increment from ${baseAppVersion} to ${nextAppVersion}. Allowed next versions (patch, minor, major): ${allowed.join(', ')}.`,
    );
  }

  return {
    ok: true,
    kind: 'release-bump',
    from: baseAppVersion,
    to: nextAppVersion,
  };
}

if (require.main === module) {
  const baseFlagIndex = process.argv.indexOf('--base');
  const cliBase = baseFlagIndex !== -1 ? process.argv[baseFlagIndex + 1] : undefined;
  const baseSha = cliBase ?? process.env.BASE_SHA;
  const cwd = path.resolve(__dirname, '..');

  try {
    const result = checkVersionGuard({ cwd, baseSha });
    if (result.kind === 'unchanged') {
      console.log(`Protect app version passed: version unchanged (${result.version}).`);
    } else {
      console.log(`Protect app version passed: valid release bump ${result.from} -> ${result.to}.`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

module.exports = {
  allowedNextVersions,
  checkVersionGuard,
  readJsonFromGit,
};
