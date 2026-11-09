const { accessSync, constants } = require('node:fs');
const { spawn } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');

const linuxDefaultPrivateKeyPath = '/home/aki/.config/caneguard/updates/private-key.pem';
const defaultPrivateKeyPath =
  process.platform === 'win32'
    ? path.join(os.homedir(), '.config', 'caneguard', 'updates', 'private-key.pem')
    : linuxDefaultPrivateKeyPath;
const privateKeyPath = process.env.EXPO_UPDATES_PRIVATE_KEY_PATH?.trim() || defaultPrivateKeyPath;

try {
  accessSync(privateKeyPath, constants.R_OK);
} catch {
  console.error(
    'Expo Updates private key is missing or unreadable. Set EXPO_UPDATES_PRIVATE_KEY_PATH to a readable file.',
  );
  process.exit(1);
}

const expoCommand = process.platform === 'win32' ? 'expo.cmd' : 'expo';
const expo = spawn(
  expoCommand,
  ['start', '--dev-client', '--private-key-path', privateKeyPath, ...process.argv.slice(2)],
  {
    cwd: process.cwd(),
    env: process.env,
    shell: false,
    stdio: 'inherit',
  },
);

expo.on('error', (error) => {
  console.error(`Unable to start Expo CLI: ${error.message}`);
  process.exit(1);
});

expo.on('exit', (code) => {
  process.exit(code ?? 1);
});
