// Temporary network-state setup for the existing emulator, never ADB transport
// repair. Radio state is checked independently of the app's offline UI.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const exec = (command, args) => execFileSync(command, args, { encoding: 'utf8', timeout: 30_000 });
const devices = exec('adb', ['devices', '-l']).split('\n')
  .filter(line => /^emulator-\S+\s+device\b/.test(line));
assert.equal(devices.length, 1, 'Exactly one ready emulator is required; do not launch or repair one');
const serial = devices[0].split(/\s+/)[0];
const adb = (...args) => exec('adb', ['-s', serial, 'shell', ...args]).trim();
export const assertUnclaimedEmulator = () => {
  const result = JSON.parse(exec('agent-device', ['device', 'status', '--platform', 'android',
    '--serial', serial, '--json']));
  assert.equal(result.success, true);
  assert.deepEqual(result.data.claims, [], 'Close your own session; never change a claimed device');
};

export function withOffline(action) {
  assertUnclaimedEmulator();
  assert.equal(adb('cmd', 'connectivity', 'airplane-mode'), 'disabled', 'Start online');
  assert.equal(adb('settings', 'get', 'global', 'wifi_on'), '1', 'Start with Wi-Fi enabled');
  try {
    // `settings airplane on` on this CLI sends a protected broadcast that
    // Android rejects. The supported connectivity service command works.
    adb('cmd', 'connectivity', 'airplane-mode', 'enable');
    adb('svc', 'wifi', 'disable');
    assert.equal(adb('cmd', 'connectivity', 'airplane-mode'), 'enabled');
    assert.equal(adb('settings', 'get', 'global', 'wifi_on'), '0');
    console.log('Verified: airplane enabled, Wi-Fi disabled on ready emulator');
    action();
  } finally {
    assertUnclaimedEmulator();
    adb('cmd', 'connectivity', 'airplane-mode', 'disable');
    adb('svc', 'wifi', 'enable');
    assert.equal(adb('cmd', 'connectivity', 'airplane-mode'), 'disabled');
    assert.equal(adb('settings', 'get', 'global', 'wifi_on'), '1');
    console.log('Restored: airplane disabled, Wi-Fi enabled');
  }
}
