/* global describe, expect, it */

const {
  EXIT,
  buildMetroEnv,
  decideClientAction,
  evidencePaths,
  formatCommand,
  parseAdbDevices,
  pickDevice,
  readyDevices,
  waitFor,
} = require('../live-up');

describe('live-up device selection', () => {
  const output = [
    'List of devices attached',
    '* daemon started successfully',
    'emulator-5554          device product:sdk model:Pixel_8 transport_id:1',
    'R58M1234ABC            unauthorized transport_id:2',
    'R58M9999XYZ            offline transport_id:3',
    '',
  ].join('\n');

  it('parses adb devices -l and treats only state "device" as ready', () => {
    const devices = parseAdbDevices(output);
    expect(devices.map((d) => [d.serial, d.state])).toEqual([
      ['emulator-5554', 'device'],
      ['R58M1234ABC', 'unauthorized'],
      ['R58M9999XYZ', 'offline'],
    ]);
    expect(readyDevices(devices).map((d) => d.serial)).toEqual(['emulator-5554']);
  });

  it('finds no target when the list is empty or nothing is ready', () => {
    expect(pickDevice(parseAdbDevices('List of devices attached\n\n'))).toBeNull();
    expect(pickDevice(parseAdbDevices('List of devices attached\nabc offline\n'))).toBeNull();
  });

  it('prefers ANDROID_SERIAL when it is ready, else the first ready target', () => {
    const devices = parseAdbDevices('List of devices attached\na device\nb device\n');
    expect(pickDevice(devices, 'b').serial).toBe('b');
    expect(pickDevice(devices, 'missing').serial).toBe('a');
  });
});

describe('live-up dev client decision', () => {
  const cached = [
    { file: '/c/old.apk', sha: 'old', mtimeMs: 1 },
    { file: '/c/new.apk', sha: 'new', mtimeMs: 2 },
  ];

  it('reuses the installed client when its sha is in the fingerprint cache', () => {
    expect(decideClientAction({ cached, installedSha: 'old' })).toMatchObject({ action: 'reuse', apk: { sha: 'old' } });
  });

  it('installs the newest cached build when the installed client differs or is absent', () => {
    expect(decideClientAction({ cached, installedSha: 'other' })).toMatchObject({ action: 'install-cached', apk: { sha: 'new' } });
    expect(decideClientAction({ cached, installedSha: null })).toMatchObject({ action: 'install-cached', apk: { sha: 'new' } });
  });

  it('asks for a local rebuild only when nothing is cached for the fingerprint', () => {
    expect(decideClientAction({ cached: [], installedSha: 'x' }).action).toBe('build');
    expect(decideClientAction({ cached: [], installedSha: null }).action).toBe('build');
  });
});

describe('live-up evidence and environment', () => {
  it('uses one fixed directory per revision and marks a dirty tree', () => {
    const clean = evidencePaths({ short: 'abc123', dirty: false }, '/r/live');
    const dirty = evidencePaths({ short: 'abc123', dirty: true }, '/r/live');
    expect(clean.dir).toBe('/r/live/abc123');
    expect(dirty.dir).toBe('/r/live/abc123-dirty');
    expect(clean).toMatchObject({
      screenshots: '/r/live/abc123/screenshots',
      db: '/r/live/abc123/db',
      transcript: '/r/live/abc123/transcript.md',
      manifest: '/r/live/abc123/run.json',
      latest: '/r/live/latest',
    });
  });

  it('points the app at the stub and overrides an inherited API base URL', () => {
    const env = buildMetroEnv({
      apiBaseUrl: 'http://127.0.0.1:8210',
      baseEnv: { EXPO_PUBLIC_API_BASE_URL: 'https://real.example', PATH: '/bin' },
      today: '2026-11-21',
    });
    expect(env.EXPO_PUBLIC_API_BASE_URL).toBe('http://127.0.0.1:8210');
    expect(env.CANEGUARD_WEB_VALIDATE_TODAY).toBe('2026-11-21');
    expect(env.PATH).toBe('/bin');
  });

  it('quotes only arguments that need it so logged commands replay verbatim', () => {
    expect(formatCommand('agent-device', ['click', 'id="scan.choose-gallery"'])).toBe(
      "agent-device click 'id=\"scan.choose-gallery\"'",
    );
    expect(formatCommand('adb', ['devices', '-l'])).toBe('adb devices -l');
  });

  it('exposes a distinct device-unavailable exit code', () => {
    expect(EXIT.DEVICE_UNAVAILABLE).toBe(3);
    expect(new Set(Object.values(EXIT)).size).toBe(Object.values(EXIT).length);
  });
});

describe('live-up bounded waits', () => {
  it('returns the truthy value as soon as the check passes', async () => {
    let calls = 0;
    const value = await waitFor(async () => (++calls >= 2 ? 'up' : null), { timeoutMs: 1000, intervalMs: 5 });
    expect(value).toBe('up');
  });

  it('gives up with null at the timeout instead of hanging', async () => {
    const started = Date.now();
    const value = await waitFor(async () => false, { timeoutMs: 60, intervalMs: 10 });
    expect(value).toBeNull();
    expect(Date.now() - started).toBeLessThan(1000);
  });
});
