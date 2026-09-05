import { execFileSync } from 'node:child_process';
import { withOffline } from './device-network.mjs';

const replay = name => execFileSync('npm', ['run', 'e2e:flow', '--',
  `.agent-device/flows/p1/${name}.ad`, '--timeout', '240000'], {
  stdio: 'inherit', timeout: 260_000,
});
replay('01-report-review-status-and-offline-cache');
withOffline(() => replay('02-warm-offline-review-cache'));
console.log('PASS: real office feedback retained during warm-session network loss');
