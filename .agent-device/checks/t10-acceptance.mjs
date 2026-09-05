// Full cross-repository journey, except credential-gated offline cold restart.
// Start with the Web browser signed into disposable staff on localhost:5173.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const exec = (command, args, capture = false) => execFileSync(command, args, {
  encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  timeout: 600_000, env: { ...process.env, CHROME_DEVTOOLS_AXI_BROWSER_URL: 'http://127.0.0.1:9222' },
});
const replay = name => exec('npm', ['run', 'e2e:flow', '--',
  `.agent-device/flows/t10/${name}.ad`, '--timeout', '240000']);
exec('bash', ['scripts/ad-flow-env.sh', 'grant-permissions']);
exec('bash', ['scripts/ad-flow-env.sh', 'stage-media']);
replay('01-mobile-scan-guided-report');
const session = 'cg-t10-identity';
const ad = (...args) => exec('agent-device', [...args, '--session', session], true);
let owned = false;
try {
  ad('open', 'com.niks0501.caneguard', '--platform', 'android');
  owned = true;
  const snapshot = JSON.parse(ad('snapshot', '--json'));
  assert.equal(snapshot.success, true);
  assert.ok(snapshot.data.nodes.some(n => n.label === 'Finalized · Synced'));
  const uuids = snapshot.data.nodes.map(n => n.label).filter(label =>
    /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(label ?? ''));
  assert.equal(uuids.length, 1, 'Read exactly one server report UUID from Mobile');
  process.env.REPORT_UUID = uuids[0];
} finally {
  if (owned) ad('close');
}
exec('node', ['.agent-device/checks/web-review.mjs', 'assign']);
const web = exec('chrome-devtools-axi', ['snapshot', '--full'], true);
const heading = web.match(/heading "(CG-[A-Z0-9-]+)" level="1"/);
assert.ok(heading, 'Read the actual case reference from the reviewed Web page');
process.env.AD_VAR_T10_CASE_REFERENCE = heading[1];
console.log(`Cross-surface identity: ${process.env.REPORT_UUID} / ${heading[1]}`);
replay('02-mobile-owner-assignment-retrieval');
exec('node', ['.agent-device/checks/t10-recovery.mjs']);
exec('node', ['.agent-device/checks/web-review.mjs', 'verify-completion']);
console.log('PASS: Mobile scan -> Web review/assignment -> offline visit -> recovery -> Web evidence');
