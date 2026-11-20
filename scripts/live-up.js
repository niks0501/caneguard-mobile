#!/usr/bin/env node

/**
 * One command for live (device) validation.
 *
 *   npm run live:up                  # check device, reuse dev client, start stub API + Metro, print READY
 *   npm run live:up -- --exit-after-ready   # same checks, then tear down (dry run / CI)
 *   npm run live:ad -- <args>        # run one agent-device command and log it verbatim
 *   npm run live:build               # local-only dev client rebuild (native delta only; never EAS)
 *
 * Order (every wait is bounded; a failure prints one fixing command and exits):
 *   1. adb devices: no ready native target -> record DEVICE_UNAVAILABLE, exit 3,
 *      and name the web fallback (npm run web:validate). That is inconclusive, not pass.
 *   2. expo fingerprint -> .apk-cache/<fingerprint>/<sha>.apk. The installed dev client is
 *      reused when its APK sha matches a cached build; a cached build is installed when it
 *      does not; no cached build means a native delta -> npm run live:build.
 *   3. stub API (:8210) and Metro (:8081), each waited on its health endpoint.
 *   4. adb reverse for both ports, verified against adb reverse --list.
 *   5. READY with the connection facts, then hold the servers until SIGINT/SIGTERM.
 *
 * Evidence lives at a fixed path per revision, .agent-device/test-artifacts/live/<rev>/
 * (screenshots/, db/, transcript.md, run.json, stub.log, metro.log); live/latest points at
 * the newest run. docs/qa/live-validation.md owns the runbook.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const {
  DEFAULT_STUB_API_HOST,
  DEFAULT_STUB_API_PORT,
  startStubServer,
} = require('../validation/stub-api/server');
const { resolveTodayKey } = require('../validation/stub-api/fixtures');

const REPO_ROOT = path.join(__dirname, '..');
const METRO_PORT = 8081;
const METRO_HOST = '127.0.0.1';
const APP_PACKAGE = process.env.AD_APP_PACKAGE || 'com.niks0501.caneguard';
const ADB = process.env.LIVE_UP_ADB || 'adb';
const DRIVER = 'agent-device';
const EXIT = { OK: 0, FAILED: 1, DEVICE_UNAVAILABLE: 3, USAGE: 64 };
/**
 * Fingerprint source skips: the 'balanced' preset (57347) plus PackageJsonScriptsAll (1024)
 * and GitIgnore (2048), so tooling edits to package.json scripts or .gitignore, such as this
 * command itself, never read as a native delta and force a rebuild.
 */
const FINGERPRINT_SOURCE_SKIPS = 57347 | 1024 | 2048;
const TIMEOUT_MS = {
  adb: 30_000,
  fingerprint: 180_000,
  install: 180_000,
  stubHealth: 10_000,
  metroHealth: 120_000,
  build: 40 * 60_000,
  driver: 120_000,
};

class LiveUpError extends Error {
  constructor(code, message, fix, exitCode = EXIT.FAILED) {
    super(message);
    this.code = code;
    this.fix = fix;
    this.exitCode = exitCode;
  }
}

/** Parses 'adb devices -l' output. Only state 'device' is a ready native target. */
function parseAdbDevices(text) {
  return String(text)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('List of devices') && !line.startsWith('*'))
    .map((line) => {
      const [serial, state, ...detail] = line.split(/\s+/);
      return { serial, state, detail: detail.join(' ') };
    });
}

function readyDevices(devices) {
  return devices.filter((device) => device.state === 'device');
}

/** Picks ANDROID_SERIAL when it is ready, otherwise the first ready target. */
function pickDevice(devices, preferredSerial) {
  const ready = readyDevices(devices);
  return ready.find((device) => device.serial === preferredSerial) ?? ready[0] ?? null;
}

/**
 * Decides what to do with the installed dev client. installedSha is the sha256 of the
 * installed base APK (null when not installed); cached lists .apk-cache/<fingerprint>/ builds.
 */
function decideClientAction({ installedSha, cached }) {
  const match = installedSha ? cached.find((apk) => apk.sha === installedSha) : null;
  if (match) {
    return { action: 'reuse', apk: match, reason: 'installed dev client matches the cached build for this fingerprint' };
  }
  if (cached.length > 0) {
    const newest = [...cached].sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
    return {
      action: 'install-cached',
      apk: newest,
      reason: installedSha
        ? 'installed dev client differs from the cached build for this fingerprint'
        : 'dev client is not installed; cached build exists for this fingerprint',
    };
  }
  return {
    action: 'build',
    apk: null,
    reason: 'no cached dev client for this fingerprint (native delta or first build)',
  };
}

function revisionStamp(cwd = REPO_ROOT) {
  const git = (args) => spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
  const sha = git(['rev-parse', 'HEAD']).stdout?.trim() || 'unknown';
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']).stdout?.trim() || 'unknown';
  const dirty = (git(['status', '--short']).stdout ?? '').trim().length > 0;
  return { sha, short: sha.slice(0, 12), branch, dirty };
}

/** Fixed evidence layout for one revision. */
function evidencePaths(revision, root = path.join(REPO_ROOT, '.agent-device', 'test-artifacts', 'live')) {
  const dir = path.join(root, revision.dirty ? revision.short + '-dirty' : revision.short);
  return {
    root,
    dir,
    latest: path.join(root, 'latest'),
    screenshots: path.join(dir, 'screenshots'),
    db: path.join(dir, 'db'),
    transcript: path.join(dir, 'transcript.md'),
    manifest: path.join(dir, 'run.json'),
    stubLog: path.join(dir, 'stub.log'),
    metroLog: path.join(dir, 'metro.log'),
  };
}

/** The app talks to the stub; an inherited API base URL is overridden on purpose. */
function buildMetroEnv({ apiBaseUrl, today, baseEnv = process.env }) {
  return {
    ...baseEnv,
    CI: '1',
    CANEGUARD_WEB_VALIDATE_TODAY: today,
    EXPO_NO_TELEMETRY: '1',
    EXPO_PUBLIC_API_BASE_URL: apiBaseUrl,
  };
}

function shellQuote(value) {
  return /^[A-Za-z0-9_@%+=:,./-]+$/.test(value) ? value : "'" + value.replace(/'/g, "'\\''") + "'";
}

function formatCommand(command, args) {
  return [command, ...args].map(shellQuote).join(' ');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Polls check() until it returns truthy or the timeout elapses. Never unbounded. */
async function waitFor(check, { timeoutMs, intervalMs = 500 }) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    try {
      last = await check();
      if (last) {
        return last;
      }
    } catch {
      last = null;
    }
    await sleep(intervalMs);
  }
  return null;
}

function httpGet(url, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk.slice(0, 200);
      });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.on('error', () => resolve(null));
  });
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function listCachedApks(fingerprint, cacheRoot = path.join(REPO_ROOT, '.apk-cache')) {
  const dir = path.join(cacheRoot, fingerprint);
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.apk'))
    .map((name) => {
      const file = path.join(dir, name);
      return { file, sha: name.slice(0, -4), mtimeMs: fs.statSync(file).mtimeMs };
    });
}

/** Command transcript with the revision stamped; every external command is listed verbatim. */
function createTranscript(paths, revision) {
  fs.mkdirSync(paths.screenshots, { recursive: true });
  fs.mkdirSync(paths.db, { recursive: true });
  if (!fs.existsSync(paths.transcript)) {
    fs.writeFileSync(
      paths.transcript,
      [
        '# Live validation transcript',
        '',
        '- revision: ' + revision.sha + (revision.dirty ? ' (dirty worktree)' : ''),
        '- branch: ' + revision.branch,
        '- driver: ' + DRIVER + ' (every navigation/input command is logged below verbatim)',
        '',
        '| time (UTC) | command | exit |',
        '| --- | --- | --- |',
        '',
      ].join('\n'),
    );
  }
  return {
    log(command, exit) {
      const cell = command.replace(/\|/g, '\\|').replace(/\n/g, ' ');
      fs.appendFileSync(paths.transcript, '| ' + new Date().toISOString() + ' | ' + '`' + cell + '`' + ' | ' + exit + ' |\n');
    },
    note(text) {
      fs.appendFileSync(paths.transcript, '\n' + text + '\n\n');
    },
  };
}

function writeManifest(paths, data) {
  fs.mkdirSync(paths.dir, { recursive: true });
  fs.writeFileSync(paths.manifest, JSON.stringify(data, null, 2) + '\n');
  try {
    fs.rmSync(paths.latest, { force: true, recursive: true });
    fs.symlinkSync(path.basename(paths.dir), paths.latest);
  } catch {
    // The symlink is a convenience; the fixed per-revision path is authoritative.
  }
}

function makeRunner(transcript) {
  return function run(command, args, { timeoutMs = TIMEOUT_MS.adb, cwd = REPO_ROOT, env } = {}) {
    const result = spawnSync(command, args, {
      cwd,
      encoding: 'utf8',
      env: env ?? process.env,
      maxBuffer: 64 * 1024 * 1024,
      timeout: timeoutMs,
    });
    const timedOut = result.error && result.error.code === 'ETIMEDOUT';
    const exit = timedOut ? 'timeout ' + timeoutMs + 'ms' : result.status === null ? 'error' : result.status;
    transcript.log(formatCommand(command, args), exit);
    return {
      ok: result.status === 0,
      missing: result.error && result.error.code === 'ENOENT',
      timedOut: Boolean(timedOut),
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
    };
  };
}

function generateFingerprint(run) {
  const bin = path.join(REPO_ROOT, 'node_modules', '.bin', 'fingerprint');
  if (!fs.existsSync(bin)) {
    throw new LiveUpError('NO_DEPENDENCIES', 'node_modules is missing, so the expo fingerprint cannot be computed.', 'npm ci');
  }
  const result = run(bin, ['fingerprint:generate', '--platform', 'android', '--source-skips', String(FINGERPRINT_SOURCE_SKIPS)], { timeoutMs: TIMEOUT_MS.fingerprint });
  const hash = (() => {
    try {
      return JSON.parse(result.stdout).hash;
    } catch {
      return null;
    }
  })();
  if (!result.ok || !hash) {
    throw new LiveUpError('FINGERPRINT_FAILED', 'The expo fingerprint could not be computed: ' + (result.stderr || result.stdout).slice(0, 300), 'npm run live:up -- --help');
  }
  return hash;
}

function installedApkSha(run, serial, paths) {
  const pm = run(ADB, ['-s', serial, 'shell', 'pm', 'path', APP_PACKAGE]);
  const remote = pm.stdout
    .split('\n')
    .map((line) => line.trim().replace(/^package:/, ''))
    .find((line) => line.endsWith('base.apk'));
  if (!remote) {
    return null;
  }
  const local = path.join(paths.dir, 'installed-base.apk');
  const pull = run(ADB, ['-s', serial, 'pull', remote, local], { timeoutMs: TIMEOUT_MS.install });
  return pull.ok && fs.existsSync(local) ? sha256File(local) : null;
}

function verifyReverses(run, serial, ports) {
  for (const port of ports) {
    const result = run(ADB, ['-s', serial, 'reverse', 'tcp:' + port, 'tcp:' + port]);
    if (!result.ok) {
      throw new LiveUpError('REVERSE_FAILED', 'adb reverse tcp:' + port + ' failed: ' + result.stderr.trim(), 'adb -s ' + serial + ' reverse tcp:' + port + ' tcp:' + port);
    }
  }
  const list = run(ADB, ['-s', serial, 'reverse', '--list']).stdout;
  const missing = ports.filter((port) => !list.includes('tcp:' + port));
  if (missing.length > 0) {
    throw new LiveUpError('REVERSE_MISSING', 'adb reverse --list lacks tcp:' + missing.join(', tcp:'), 'adb -s ' + serial + ' reverse --list');
  }
  return list.trim();
}

function killGroup(child) {
  if (child && child.pid && child.exitCode === null) {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      // already gone
    }
  }
}

function startMetro(env, logFile) {
  const expo = path.join(REPO_ROOT, 'node_modules', '.bin', 'expo');
  if (!fs.existsSync(expo)) {
    throw new LiveUpError('NO_DEPENDENCIES', 'node_modules is missing, so Metro cannot start.', 'npm ci');
  }
  const out = fs.openSync(logFile, 'w');
  return spawn(expo, ['start', '--dev-client', '--host', 'localhost', '--port', String(METRO_PORT)], {
    cwd: REPO_ROOT,
    detached: true,
    env,
    stdio: ['ignore', out, out],
  });
}

async function up(argv, deps = {}) {
  const exitAfterReady = argv.includes('--exit-after-ready');
  const revision = revisionStamp();
  const paths = evidencePaths(revision, deps.evidenceRoot);
  const transcript = createTranscript(paths, revision);
  const run = makeRunner(transcript);
  const manifest = {
    driver: DRIVER,
    revision: revision.sha,
    branch: revision.branch,
    dirty: revision.dirty,
    startedAt: new Date().toISOString(),
    result: 'FAILED',
    evidence: path.relative(REPO_ROOT, paths.dir),
  };
  const stubUrl = 'http://' + DEFAULT_STUB_API_HOST + ':' + DEFAULT_STUB_API_PORT;
  const metroUrl = 'http://' + METRO_HOST + ':' + METRO_PORT;
  let stub;
  let metro;
  const teardown = async () => {
    killGroup(metro);
    if (stub) {
      await stub.close().catch(() => undefined);
    }
  };

  try {
    // 1. Device. No ready native target is a recorded outcome, not a pass.
    const devicesRun = run(ADB, ['devices', '-l']);
    if (devicesRun.missing) {
      throw new LiveUpError('ADB_MISSING', 'adb is not on PATH.', 'npm run web:validate  # fallback only; record device-unavailable, then install platform-tools for the phone route', EXIT.DEVICE_UNAVAILABLE);
    }
    const devices = parseAdbDevices(devicesRun.stdout);
    const device = pickDevice(devices, process.env.ANDROID_SERIAL);
    if (!device) {
      const seen = devices.length ? devices.map((d) => d.serial + ':' + d.state).join(', ') : 'none listed';
      throw new LiveUpError('DEVICE_UNAVAILABLE', 'No ready native target (adb devices: ' + seen + ').', 'npm run web:validate', EXIT.DEVICE_UNAVAILABLE);
    }
    manifest.device = device;

    // 2. Dev client: reuse by expo fingerprint; rebuild only on native delta.
    const fingerprint = generateFingerprint(run);
    manifest.fingerprint = fingerprint;
    const cached = listCachedApks(fingerprint, deps.cacheRoot);
    const decision = decideClientAction({ cached, installedSha: installedApkSha(run, device.serial, paths) });
    manifest.devClient = { action: decision.action, reason: decision.reason, apkSha: decision.apk?.sha ?? null };
    if (decision.action === 'build') {
      throw new LiveUpError('NATIVE_DELTA', decision.reason + '. Fingerprint ' + fingerprint + '.', 'npm run live:build');
    }
    if (decision.action === 'install-cached') {
      const install = run(ADB, ['-s', device.serial, 'install', '-r', decision.apk.file], { timeoutMs: TIMEOUT_MS.install });
      if (!install.ok) {
        throw new LiveUpError('INSTALL_FAILED', 'adb install of the cached dev client failed: ' + install.stderr.trim().slice(0, 200), 'npm run live:build');
      }
    }

    // 3. Stub API and Metro on fixed ports, each waited on its health endpoint.
    const today = resolveTodayKey();
    try {
      stub = await startStubServer({
        host: DEFAULT_STUB_API_HOST,
        log: (line) => fs.appendFileSync(paths.stubLog, line + '\n'),
        port: DEFAULT_STUB_API_PORT,
        today,
      });
    } catch (error) {
      throw new LiveUpError('STUB_PORT', 'The stub API could not start on :' + DEFAULT_STUB_API_PORT + ': ' + error.message, "ss -ltnp '( sport = :" + DEFAULT_STUB_API_PORT + ' or sport = :' + METRO_PORT + " )'");
    }
    if ((await httpGet(metroUrl + '/status')) !== null) {
      throw new LiveUpError('METRO_PORT', 'Something already answers on :' + METRO_PORT + '; a fixed-port Metro must be the one this command starts.', "ss -ltnp '( sport = :" + METRO_PORT + " )'");
    }
    metro = startMetro(buildMetroEnv({ apiBaseUrl: stub.baseUrl, today }), paths.metroLog);
    transcript.log('expo start --dev-client --host localhost --port ' + METRO_PORT + ' (EXPO_PUBLIC_API_BASE_URL=' + stub.baseUrl + ')', 'started');
    const stubUp = await waitFor(async () => {
      const res = await httpGet(stubUrl + '/');
      return res && res.status < 500;
    }, { timeoutMs: TIMEOUT_MS.stubHealth });
    if (!stubUp) {
      throw new LiveUpError('STUB_UNHEALTHY', 'The stub API did not answer on ' + stubUrl + ' within ' + TIMEOUT_MS.stubHealth + 'ms.', 'tail ' + paths.stubLog);
    }
    const metroUp = await waitFor(async () => {
      if (metro.exitCode !== null) {
        throw new LiveUpError('METRO_EXITED', 'Metro exited early (code ' + metro.exitCode + ').', 'tail -40 ' + paths.metroLog);
      }
      const res = await httpGet(metroUrl + '/status');
      return res && res.body.includes('packager-status:running');
    }, { timeoutMs: TIMEOUT_MS.metroHealth });
    if (!metroUp) {
      throw new LiveUpError('METRO_UNHEALTHY', 'Metro did not report packager-status:running on ' + metroUrl + ' within ' + TIMEOUT_MS.metroHealth + 'ms.', 'tail -40 ' + paths.metroLog);
    }

    // 4. Reverses so the phone reaches both servers on 127.0.0.1.
    manifest.reverse = verifyReverses(run, device.serial, [METRO_PORT, DEFAULT_STUB_API_PORT]);

    // 5. READY.
    manifest.result = 'READY';
    manifest.stub = stubUrl;
    manifest.metro = metroUrl;
    manifest.readyAt = new Date().toISOString();
    writeManifest(paths, manifest);
    transcript.note('READY at ' + manifest.readyAt + ' on ' + device.serial + '; all later commands are agent-device commands logged via npm run live:ad.');
    console.log('READY');
    console.log('  revision    ' + revision.sha + (revision.dirty ? ' (dirty)' : ''));
    console.log('  device      ' + device.serial + ' (' + device.detail + ')');
    console.log('  dev client  ' + decision.action + ' ' + (decision.apk?.sha ?? '') + ' fingerprint ' + fingerprint);
    console.log('  stub API    ' + stubUrl + '  (fake accounts only; reversed to the phone)');
    console.log('  Metro       ' + metroUrl + '  (reversed; API base URL = stub)');
    console.log('  driver      ' + DRIVER + ' via: npm run live:ad -- <agent-device args>');
    console.log('  evidence    ' + path.relative(REPO_ROOT, paths.dir) + '/ (screenshots/, db/, transcript.md, run.json)');
    console.log('  connect     adb -s ' + device.serial + " shell am start -a android.intent.action.VIEW -d 'exp://127.0.0.1:" + METRO_PORT + "'");

    if (exitAfterReady) {
      await teardown();
      return EXIT.OK;
    }
    return await new Promise((resolve) => {
      const stop = () => {
        void teardown().then(() => resolve(EXIT.OK));
      };
      process.once('SIGINT', stop);
      process.once('SIGTERM', stop);
      metro.once('exit', () => {
        console.error('live:up: Metro exited; stopping.');
        void teardown().then(() => resolve(EXIT.FAILED));
      });
    });
  } catch (error) {
    await teardown();
    if (!(error instanceof LiveUpError)) {
      throw error;
    }
    manifest.result = error.code === 'DEVICE_UNAVAILABLE' || error.code === 'ADB_MISSING' ? 'DEVICE_UNAVAILABLE' : 'FAILED';
    manifest.reason = error.message;
    manifest.fix = error.fix;
    if (manifest.result === 'DEVICE_UNAVAILABLE') {
      manifest.verdict = 'inconclusive: no ready native target; web fallback (npm run web:validate) is device-unavailable, not pass';
      manifest.fallback = 'npm run web:validate';
    }
    writeManifest(paths, manifest);
    console.error('live:up ' + manifest.result + ': ' + error.message);
    if (manifest.verdict) {
      console.error('live:up ' + manifest.verdict);
    }
    console.error('live:up fix: ' + error.fix);
    console.error('live:up record: ' + path.relative(REPO_ROOT, paths.manifest));
    return error.exitCode;
  }
}

/** Runs one agent-device command and logs it verbatim into the revision's transcript. */
function ad(args) {
  if (args.length === 0) {
    console.error('usage: npm run live:ad -- <agent-device args>   e.g. -- snapshot');
    return EXIT.USAGE;
  }
  const revision = revisionStamp();
  const paths = evidencePaths(revision);
  const transcript = createTranscript(paths, revision);
  const result = spawnSync(DRIVER, args, { cwd: REPO_ROOT, stdio: 'inherit', timeout: TIMEOUT_MS.driver });
  const timedOut = result.error && result.error.code === 'ETIMEDOUT';
  transcript.log(formatCommand(DRIVER, args), timedOut ? 'timeout ' + TIMEOUT_MS.driver + 'ms' : result.status ?? 'error');
  return timedOut || result.status === null ? EXIT.FAILED : result.status;
}

/** Local-only dev client rebuild for a native delta. Never EAS. */
function build() {
  const revision = revisionStamp();
  const paths = evidencePaths(revision);
  const transcript = createTranscript(paths, revision);
  const run = makeRunner(transcript);
  const fail = (message, fix) => {
    console.error('live:build FAILED: ' + message);
    console.error('live:build fix: ' + fix);
    return EXIT.FAILED;
  };
  const devices = parseAdbDevices(run(ADB, ['devices', '-l']).stdout);
  const device = pickDevice(devices, process.env.ANDROID_SERIAL);
  if (!device) {
    return fail('No ready native target to install onto.', 'npm run web:validate  # fallback only; device-unavailable');
  }
  let fingerprint;
  try {
    fingerprint = generateFingerprint(run);
  } catch (error) {
    return fail(error.message, error.fix);
  }
  const androidDir = path.join(REPO_ROOT, 'android');
  if (!fs.existsSync(androidDir)) {
    const prebuild = run('npx', ['--no-install', 'expo', 'prebuild', '--platform', 'android', '--no-install'], { timeoutMs: TIMEOUT_MS.build });
    if (!prebuild.ok) {
      return fail('expo prebuild failed: ' + prebuild.stderr.slice(0, 300), 'npx --no-install expo prebuild --platform android --no-install');
    }
  }
  const gradle = run('./gradlew', [':app:assembleDebug'], { cwd: androidDir, timeoutMs: TIMEOUT_MS.build });
  if (!gradle.ok) {
    return fail('./gradlew :app:assembleDebug failed: ' + (gradle.stderr || gradle.stdout).slice(-300), 'cd android && ./gradlew :app:assembleDebug  # needs the Android SDK and a JDK');
  }
  const built = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  if (!fs.existsSync(built)) {
    return fail('The debug APK was not produced at ' + built + '.', 'cd android && ./gradlew :app:assembleDebug');
  }
  const sha = sha256File(built);
  const dest = path.join(REPO_ROOT, '.apk-cache', fingerprint, sha + '.apk');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(built, dest);
  const install = run(ADB, ['-s', device.serial, 'install', '-r', dest], { timeoutMs: TIMEOUT_MS.install });
  if (!install.ok) {
    return fail('adb install -r failed: ' + install.stderr.trim().slice(0, 200), 'adb -s ' + device.serial + ' install -r ' + dest);
  }
  console.log('live:build OK fingerprint ' + fingerprint + ' apk sha ' + sha + ' -> ' + path.relative(REPO_ROOT, dest));
  return EXIT.OK;
}

async function main(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;
  if (command === 'ad') {
    return ad(rest);
  }
  if (command === 'build') {
    return build();
  }
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('npm run live:up [-- --exit-after-ready] | live:ad -- <agent-device args> | live:build. See docs/qa/live-validation.md.');
    return EXIT.OK;
  }
  return await up(argv);
}

if (require.main === module) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      console.error('live:up crashed: ' + (error && error.stack ? error.stack : error));
      process.exitCode = EXIT.FAILED;
    },
  );
}

module.exports = {
  EXIT,
  METRO_PORT,
  buildMetroEnv,
  decideClientAction,
  evidencePaths,
  formatCommand,
  main,
  parseAdbDevices,
  pickDevice,
  readyDevices,
  waitFor,
};
