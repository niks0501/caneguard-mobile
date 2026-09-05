// Agent Device-native negative assertions: `is hidden` requires an existing
// node and cannot assert that app navigation was removed from the AX tree.
// Run from the repository root with private AD_VAR_AUTH_EMAIL/PASSWORD.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const session = 'cg-map-fullscreen';
const run = (...args) => execFileSync('agent-device', [...args, '--session', session], {
  encoding: 'utf8', timeout: 260_000, stdio: ['ignore', 'pipe', 'pipe'],
});
let owned = false;
try {
  // Replay uses an isolated daemon on this CLI; let its terminal close release
  // ownership before a state-preserving open for snapshot assertions.
  process.stdout.write(run('replay', '.agent-device/flows/p0/09-map-fullscreen-navigation.ad',
    '--timeout', '240000'));
  run('open', 'com.niks0501.caneguard', '--platform', 'android');
  owned = true;
  const snapshot = JSON.parse(run('snapshot', '--json'));
  assert.equal(snapshot.success, true);
  assert.equal(snapshot.data.truncated, false, 'Absence requires a complete snapshot');
  const nodes = snapshot.data.nodes;
  assert.ok(nodes.some(n => n.label === 'Exit fullscreen map'), 'Fullscreen must be active');
  for (const label of ['Go back', 'Home', 'Scan', 'Activity', 'Pan north', 'Pan south',
    'Pan east', 'Pan west', 'Zoom in', 'Zoom out']) {
    assert.ok(!nodes.some(n => n.label === label), `${label} must be absent in fullscreen`);
  }
  assert.ok(!nodes.some(n => n.identifier === 'manual-map.controls'));
  // On the 1080x2400 dev client, Expo's floating gear covers the semantic
  // center of Exit fullscreen. The uncovered upper-right corner was verified
  // from a screenshot; scope this coordinate fallback to that viewport only.
  const exit = nodes.find(n => n.label === 'Exit fullscreen map');
  assert.ok(exit.rect && exit.rect.x <= 1040 && exit.rect.x + exit.rect.width >= 1040
    && exit.rect.y <= 165 && exit.rect.y + exit.rect.height >= 165,
  'Reinspect the screenshot before adapting the dev-menu overlap workaround');
  run('press', '1040', '165', '--settle');
  run('wait', 'label="Expand map to fullscreen"', '10000');
  run('is', 'visible', 'id=manual-map.controls');
  run('is', 'visible', 'role=button label="Go back"');
  run('click', 'label="Keep Draft Unchanged"');
  run('wait', 'id=field-report.screen', '30000');
  console.log('PASS: fullscreen removes navigation/controls, exit restores them, Draft unchanged');
} finally {
  if (owned) run('close');
}
