/* global describe, expect, it */

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { checkVersionGuard } = require('../version-guard');

function git(cwd, ...args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function createBaseRepo({
  app = { expo: { name: 'CaneGuard', version: '2.5.0' } },
  pkg = { name: 'caneguard-mobile', version: '2.5.0', scripts: { lint: 'expo lint' } },
} = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'version-guard-'));
  fs.writeFileSync(path.join(dir, 'app.json'), `${JSON.stringify(app, null, 2)}\n`);
  fs.writeFileSync(path.join(dir, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'index.ts'), 'export const value = 1;\n');

  git(dir, 'init', '-q');
  git(dir, 'config', 'user.email', 'test@example.com');
  git(dir, 'config', 'user.name', 'Test User');
  git(dir, 'add', '.');
  git(dir, 'commit', '-q', '-m', 'base');
  const baseSha = git(dir, 'rev-parse', 'HEAD');
  return { dir, baseSha };
}

function commitChanges(dir, files) {
  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = path.join(dir, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`,
    );
  }
  git(dir, 'add', '.');
  git(dir, 'commit', '-q', '-m', 'pr change');
}

describe('version-guard', () => {
  it('allows ordinary PRs that leave app.json and package.json versions unchanged', () => {
    const { dir, baseSha } = createBaseRepo();
    commitChanges(dir, {
      'src/index.ts': 'export const value = 2;\n',
      'app.json': { expo: { name: 'CaneGuard Mobile', version: '2.5.0' } },
      'package.json': {
        name: 'caneguard-mobile',
        version: '2.5.0',
        scripts: { lint: 'expo lint', typecheck: 'tsc --noEmit' },
      },
    });

    expect(checkVersionGuard({ cwd: dir, baseSha })).toEqual({
      ok: true,
      kind: 'unchanged',
      version: '2.5.0',
    });
  });

  it.each([
    ['patch', '2.5.1', '2.5.2'],
    ['minor', '2.5.1', '2.6.0'],
    ['major', '2.5.1', '3.5.1'],
  ])('allows a clean version-only %s bump (%s -> %s)', (_kind, fromVersion, toVersion) => {
    const { dir, baseSha } = createBaseRepo({
      app: { expo: { name: 'CaneGuard', version: fromVersion } },
      pkg: { name: 'caneguard-mobile', version: fromVersion, scripts: { lint: 'expo lint' } },
    });
    commitChanges(dir, {
      'app.json': { expo: { name: 'CaneGuard', version: toVersion } },
      'package.json': { name: 'caneguard-mobile', version: toVersion, scripts: { lint: 'expo lint' } },
    });

    expect(checkVersionGuard({ cwd: dir, baseSha })).toEqual({
      ok: true,
      kind: 'release-bump',
      from: fromVersion,
      to: toVersion,
    });
  });

  it('matches bump-version.js output for patch, minor, and major bumps', () => {
    const bumpScript = path.resolve(__dirname, '..', 'bump-version.js');
    for (const kind of ['patch', 'minor', 'major']) {
      const { dir, baseSha } = createBaseRepo({
        app: { expo: { name: 'CaneGuard', version: '2.5.1' } },
        pkg: { name: 'caneguard-mobile', version: '2.5.1' },
      });
      fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
      fs.copyFileSync(bumpScript, path.join(dir, 'scripts', 'bump-version.js'));
      git(dir, 'add', 'scripts/bump-version.js');
      git(dir, 'commit', '-q', '-m', 'add bump script');
      const prBase = git(dir, 'rev-parse', 'HEAD');

      execFileSync('node', [path.join(dir, 'scripts', 'bump-version.js'), kind], {
        cwd: dir,
        encoding: 'utf8',
      });
      git(dir, 'add', 'app.json', 'package.json');
      git(dir, 'commit', '-q', '-m', `chore(release): ${kind}`);

      expect(checkVersionGuard({ cwd: dir, baseSha: prBase })).toMatchObject({
        ok: true,
        kind: 'release-bump',
        from: '2.5.1',
      });
      expect(baseSha).not.toBe('');
    }
  });

  it('rejects a version bump bundled with another file change', () => {
    const { dir, baseSha } = createBaseRepo();
    commitChanges(dir, {
      'app.json': { expo: { name: 'CaneGuard', version: '2.5.1' } },
      'package.json': { name: 'caneguard-mobile', version: '2.5.1', scripts: { lint: 'expo lint' } },
      'src/index.ts': 'export const value = 2;\n',
    });

    expect(() => checkVersionGuard({ cwd: dir, baseSha })).toThrow(/only change app\.json and package\.json/);
  });

  it('rejects a version bump that also modifies another field in app.json or package.json', () => {
    const { dir, baseSha } = createBaseRepo();
    commitChanges(dir, {
      'app.json': { expo: { name: 'Changed', version: '2.5.1' } },
      'package.json': { name: 'caneguard-mobile', version: '2.5.1', scripts: { lint: 'expo lint' } },
    });

    expect(() => checkVersionGuard({ cwd: dir, baseSha })).toThrow(/no other fields may be modified/);
  });

  it('rejects editing only one version manifest', () => {
    const { dir, baseSha } = createBaseRepo();
    commitChanges(dir, {
      'app.json': { expo: { name: 'CaneGuard', version: '2.5.1' } },
    });

    expect(() => checkVersionGuard({ cwd: dir, baseSha })).toThrow(/only change app\.json and package\.json/);
  });

  it('rejects mismatched versions across app.json and package.json', () => {
    const { dir, baseSha } = createBaseRepo();
    commitChanges(dir, {
      'app.json': { expo: { name: 'CaneGuard', version: '2.5.1' } },
      'package.json': { name: 'caneguard-mobile', version: '2.6.0', scripts: { lint: 'expo lint' } },
    });

    expect(() => checkVersionGuard({ cwd: dir, baseSha })).toThrow(/Version mismatch/);
  });

  it.each(['2.5.2', '2.4.9', '2.6.1', '3.0.0'])(
    'rejects disallowed increment 2.5.0 -> %s',
    (badVersion) => {
      const { dir, baseSha } = createBaseRepo();
      commitChanges(dir, {
        'app.json': { expo: { name: 'CaneGuard', version: badVersion } },
        'package.json': { name: 'caneguard-mobile', version: badVersion, scripts: { lint: 'expo lint' } },
      });

      expect(() => checkVersionGuard({ cwd: dir, baseSha })).toThrow(/Invalid version increment/);
    },
  );
});
