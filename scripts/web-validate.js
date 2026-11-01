#!/usr/bin/env node

/**
 * One entry point for the browser validation route.
 *
 *   npm run web:validate               # stub API + dev server, defaults below
 *   npm run web:validate -- --port 8230
 *
 * It starts the deterministic stub API (`validation/stub-api`), then the Expo
 * web dev server with the validation flag, the stub as the API base URL, and the
 * pinned fixture date. The browser route is the default validation route; the
 * phone stays the second route and is unaffected by anything here.
 *
 * The dev server is served with COOP/COEP from `metro.config.js`, so load
 * `/login` (not `/`) and use one browser profile per origin: a second tab on the
 * same origin fails on the OPFS lock. `docs/qa/web-validation.md` covers the
 * route and its limits.
 */

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const {
  DEFAULT_STUB_API_HOST,
  DEFAULT_STUB_API_PORT,
  startStubServer,
} = require('../validation/stub-api/server');
const {
  FAKE_ACCOUNT,
  FAKE_PASSWORD,
  resolveTodayKey,
} = require('../validation/stub-api/fixtures');

const DEFAULT_WEB_PORT = 8199;
const VALIDATION_FLAG = 'EXPO_PUBLIC_WEB_VALIDATION';

function parsePort(value, flag) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`${flag} needs an integer port between 1 and 65535.`);
  }
  return port;
}

function parseArgs(argv = []) {
  const options = { apiPort: DEFAULT_STUB_API_PORT, host: DEFAULT_STUB_API_HOST, port: DEFAULT_WEB_PORT };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--port') {
      options.port = parsePort(argv[++index], '--port');
    } else if (arg === '--api-port') {
      options.apiPort = parsePort(argv[++index], '--api-port');
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

/**
 * The app must talk to the stub, and the stand-in must be on. An externally set
 * `EXPO_PUBLIC_API_BASE_URL` is overridden on purpose: mixing a real API with
 * the validation secure store would put a real session in `localStorage`.
 */
function buildWebValidationEnv({ apiBaseUrl, baseEnv = process.env, today = resolveTodayKey() }) {
  return {
    ...baseEnv,
    [VALIDATION_FLAG]: '1',
    CANEGUARD_WEB_VALIDATE_TODAY: today,
    EXPO_PUBLIC_API_BASE_URL: apiBaseUrl,
    EXPO_NO_TELEMETRY: '1',
  };
}

function resolveExpoCommand() {
  const localExpo = path.join(__dirname, '..', 'node_modules', '.bin', 'expo');
  return fs.existsSync(localExpo) ? localExpo : null;
}

function printInstructions({ apiPort, port }) {
  console.log('');
  console.log(`[web:validate] stub API       http://${DEFAULT_STUB_API_HOST}:${apiPort}`);
  console.log(`[web:validate] fake account   ${FAKE_ACCOUNT.email} / ${FAKE_PASSWORD}`);
  console.log(`[web:validate] open           http://${DEFAULT_STUB_API_HOST}:${port}/login`);
  console.log('[web:validate] open /login, not / — the single-page manifest at / skips COOP/COEP.');
  console.log('[web:validate] one browser profile per origin; never a second tab on the same origin.');
  console.log('[web:validate] fake account, stub API and fake records only.');
  console.log('');
}

async function main(argv = process.argv.slice(2), baseEnv = process.env) {
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    console.error(`[web:validate] ${error.message}`);
    return 2;
  }

  if (options.help) {
    console.log('Usage: npm run web:validate [-- --port 8199] [--api-port 8210]');
    return 0;
  }

  let today;
  try {
    today = resolveTodayKey(baseEnv);
  } catch (error) {
    console.error(`[web:validate] ${error.message}`);
    return 2;
  }

  let stub;
  try {
    stub = await startStubServer({
      host: options.host,
      log: (line) => console.log(`[web:validate] stub ${line}`),
      port: options.apiPort,
      today,
    });
  } catch (error) {
    console.error(`[web:validate] The stub API could not start: ${error.message}`);
    return 1;
  }

  const env = buildWebValidationEnv({
    apiBaseUrl: stub.baseUrl,
    baseEnv,
    today,
  });
  const expoCli = resolveExpoCommand();
  const command = expoCli ?? (process.platform === 'win32' ? 'npx.cmd' : 'npx');
  const args = expoCli
    ? ['start', '--web', '--port', String(options.port)]
    : ['--no-install', 'expo', 'start', '--web', '--port', String(options.port)];

  printInstructions({ apiPort: options.apiPort, port: options.port });
  console.log(`[web:validate] seeded visits: ${stub.visits
    .map((visit) => `${visit.reference_code} (${visit.case.barangay}, due ${visit.target_visit_date})`)
    .join(', ')}`);

  const child = spawn(command, args, { env, stdio: 'inherit' });

  let shuttingDown = false;
  const shutDown = async (code) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    if (!child.killed) {
      child.kill('SIGTERM');
    }
    await stub.close().catch(() => undefined);
    process.exitCode = code;
  };

  process.once('SIGINT', () => void shutDown(0));
  process.once('SIGTERM', () => void shutDown(0));

  return await new Promise((resolve) => {
    child.once('exit', (code, signal) => {
      void shutDown(code ?? (signal ? 1 : 0)).then(() => resolve(process.exitCode ?? 0));
    });
    child.once('error', (error) => {
      console.error(`[web:validate] The Expo web dev server could not start: ${error.message}`);
      void shutDown(1).then(() => resolve(1));
    });
  });
}

if (require.main === module) {
  main().then((code) => {
    process.exitCode = code;
  });
}

module.exports = {
  buildWebValidationEnv,
  main,
  parseArgs,
  resolveExpoCommand,
};
