import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { withOffline } from './device-network.mjs';

const replay = name => execFileSync('npm', ['run', 'e2e:flow', '--',
  `.agent-device/flows/t10/${name}.ad`, '--timeout', '240000'], {
  stdio: 'inherit', timeout: 260_000,
});
withOffline(() => replay('03a-mobile-offline-completion'));
const session = 'cg-t10-recovery';
const run = (...args) => execFileSync('agent-device', [...args, '--session', session], {
  encoding: 'utf8', timeout: 90_000, stdio: ['ignore', 'pipe', 'pipe'],
});
let owned = false;
try {
  run('open', 'com.niks0501.caneguard', '--platform', 'android');
  owned = true;
  const snapshot = JSON.parse(run('snapshot', '--json'));
  assert.equal(snapshot.success, true);
  assert.ok(snapshot.data.nodes.some(n => n.label === process.env.AD_VAR_T10_CASE_REFERENCE),
    'Recovery must target the same case');
  const labels = snapshot.data.nodes.map(n => n.label);
  if (labels.includes('Saved on this device')) {
    run('click', 'id=field-validation.retry');
    console.log('Recovery used the visible Retry synchronization control');
  } else {
    assert.ok(labels.includes('Validation synchronized'), 'Unexpected completion state');
    console.log('Completion already synchronized after network restoration');
  }
  run('wait', 'label="Validation synchronized"', '60000');
} finally {
  if (owned) run('close');
}
replay('04-mobile-connectivity-recovery-sync');
console.log('PASS: offline completion and connectivity recovery for the same case');
