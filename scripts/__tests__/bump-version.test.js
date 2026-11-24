const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const script = path.resolve(__dirname, '..', 'bump-version.js');

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function makeRepo({ version, tag }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bump-version-'));
  fs.mkdirSync(path.join(dir, 'scripts'));
  fs.copyFileSync(script, path.join(dir, 'scripts', 'bump-version.js'));
  fs.writeFileSync(path.join(dir, 'app.json'), JSON.stringify({ expo: { version } }));
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ version }));
  git(dir, 'init', '-q');
  git(dir, 'config', 'user.email', 'test@example.com');
  git(dir, 'config', 'user.name', 'test');
  git(dir, 'add', '.');
  git(dir, 'commit', '-q', '-m', 'init');
  if (tag) git(dir, 'tag', '-a', tag, '-m', tag);
  return dir;
}

function bump(dir, ...args) {
  return spawnSync('node', [path.join(dir, 'scripts', 'bump-version.js'), ...args], { encoding: 'utf8' });
}

describe('bump-version', () => {
  it('bumps from the tag when app version matches it', () => {
    const result = bump(makeRepo({ version: '2.2.4', tag: 'v2.2.4' }), 'patch', '--dry-run');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('2.2.4 -> 2.2.5');
  });

  it('bumps from the app version when untagged dev/preview bumps put it ahead of the tag', () => {
    const result = bump(makeRepo({ version: '2.2.5', tag: 'v2.2.4' }), 'patch', '--dry-run');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('2.2.5 -> 2.2.6');
  });

  it('refuses when the app version is behind the latest release tag', () => {
    const result = bump(makeRepo({ version: '2.2.3', tag: 'v2.2.4' }), 'patch', '--dry-run');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('behind the latest release tag');
  });
});
