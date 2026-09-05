// Ordered P0 acceptance; private AD_VAR_AUTH_EMAIL/PASSWORD are inherited.
// Every replay closes its own device session before the next setup operation.
import { execFileSync } from 'node:child_process';

const run = (command, args) => execFileSync(command, args, {
  stdio: 'inherit', timeout: 260_000,
});
const env = (action) => run('bash', ['scripts/ad-flow-env.sh', action]);
const flow = (name) => run('npm', ['run', 'e2e:flow', '--',
  `.agent-device/flows/p0/${name}.ad`, '--timeout', '240000']);

try {
  env('grant-permissions');
  env('stage-media');
  flow('08-path-a-complete-in-field-gps');
  env('revoke-permissions');
  env('stage-media');
  flow('02-draft-report-lifecycle');
  flow('05-06-draft-manual-map-finalization');
  flow('08-end-to-end-acceptance');
  console.log('PASS: ordered GPS and saved-Draft/manual-map acceptance');
} finally {
  // Restore only the permission state this driver changed. Native replays own
  // their sessions; do not close or steal another workspace's device claim.
  env('grant-permissions');
}
