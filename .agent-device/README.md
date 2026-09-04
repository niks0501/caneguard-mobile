# CaneGuard Agent Device workspace

Agent Device is the canonical Android device automation, UI verification,
E2E/flow testing, and debugging framework for CaneGuard Mobile.

Flows are grouped by implementation milestone so later phases can add coverage
without replacing the protected scan regression:

```text
.agent-device/
├── flows/              # deterministic .ad replay scripts (the E2E suite)
├── evidence/           # evidence convention and phase records
└── test-artifacts/     # generated screenshots/logs; ignored by Git
```

Stable application selectors use the user-intent form `domain.intent`, for
example `scan.choose-gallery`. In `.ad` scripts that becomes `id="scan.choose-gallery"`.
Do not encode layout positions, translated copy, or component implementation
details in IDs. System-owned UI, such as Android's photo picker, may require
its own accessible system labels because CaneGuard cannot assign IDs inside
another application.

## Android Studio emulator workflow

CaneGuard uses the Android Studio emulator running on the Windows host.
When working from WSL2, the official `adb` command on the active `PATH`
connects to the Windows-hosted ADB server that owns the emulator.
Use that existing server for terminal and Agent Device commands.

Start from the Mobile repository root:

```bash
adb devices -l
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8000 tcp:8000
adb reverse --list
```

The current emulator should appear as `emulator-5554` with state `device`.
The reverse list should include the `8081` Metro mapping and the `8000` API
mapping. With these mappings, keep
`EXPO_PUBLIC_API_BASE_URL=http://localhost:8000` in the Mobile `.env` when the
local API `APP_URL` uses the same origin.

The development build is an Expo development client. After `clearState` or a
cold start it can show a connect dialog; entering `http://127.0.0.1:8081`
connects it to Metro. The reliable handoff when the launcher does not
auto-connect is the deep link:

```bash
adb shell am start -a android.intent.action.VIEW -d 'exp://127.0.0.1:8081'
```

Do not launch, recreate, wipe, or repair an AVD, and do not reconfigure or
repair ADB networking. Do not set `ADB_SERVER_SOCKET`, start a second ADB
server, or run `adb kill-server` when the existing localhost connection is
healthy. Only one agent or worktree may control the emulator at a time.

## Pre-flow environment helper

The Maestro commands `addMedia` and `setPermissions` are not part of the
agent-device Maestro compatibility subset, and `.ad` scripts have no
shell-out. Flows that need staged media or a known location-permission state
rely on `scripts/ad-flow-env.sh`, run before the flow or suite:

```bash
scripts/ad-flow-env.sh preflight          # device check, reverse mappings, grant location, stage fixture
scripts/ad-flow-env.sh stage-media        # push + media-scan assets/model-fixtures/parity-reference.jpg
scripts/ad-flow-env.sh grant-permissions  # pm grant fine/coarse location
scripts/ad-flow-env.sh revoke-permissions # revoke + force-deny location (no system dialog)
scripts/ad-flow-env.sh connect-metro      # connect the dev client to http://127.0.0.1:8081 and close the setup session
scripts/ad-flow-env.sh reset-app          # clear app data and establish the Metro connection (replaces launchApp clearState)
```

`connect-metro` expects the post-reset onboarding state it waits for; for
state-preserving or mid-suite Metro reconnects, connect Metro directly without
this helper.

`preflight` stages the shared Rust fixture and grants location permissions.
Flows that need location denied run `revoke-permissions` first (or the suite
runner notes it in the flow's evidence record).
`stage-media` removes only prior copies of the controlled fixture before
staging it, because Android's picker copies selected images into Pictures.
Run it before each scan flow or isolated scan-flow segment.
Scripts whose Maestro originals started with `launchApp clearState` assume
`reset-app` ran first; scripts that preserve state assume the app is already
signed in as documented per flow group.

Clipboard-based text entry has no helper on purpose: `.ad` scripts use the
agent-device `fill` command on the target field, which the bundled test IME
makes reliable.

## E2E command behavior

Use the project npm scripts for Agent Device runs:

```bash
npm run e2e:doctor                                        # agent-device doctor
npm run e2e:flow -- .agent-device/flows/<flow>.ad         # one focused flow
npm run e2e                                               # all flows under .agent-device/flows
```

Plain `agent-device replay <script>` is the normal focused path and the
project action is its package-script form. Use this evidence-driven
progression:

1. Run the focused script with `agent-device replay <script>`.
2. Preserve the exact command, first failing interaction, device/build
   identity, logs, screenshots, and artifacts.
3. Diagnose the smallest failing interaction from the structured divergence
   report (step, file, line, ranked selector suggestions).
4. Make one evidence-backed change.
5. Rerun the focused script.
6. Run broader or full E2E with `npm run e2e` only when the task or an
   acceptance gate requires it.

A failed replay command proves that the command failed; it does not by itself
prove an application defect. Do not add automatic retries, rebuilds, emulator
wipes, ADB or Metro recovery, or blind reruns. The guarded
`replay --from <step> --plan-digest <digest>` resume is allowed only with an
unchanged plan and understood, repaired state.

Interactive sessions (`agent-device open`, `snapshot -i`, act, close) are for
exploration and diagnosis (Mode A). Checked-in `.ad` scripts are the
deterministic regression surface (Mode B). A fixed interactive pass is not
regression acceptance; promote a verified journey into a `.ad` script to make
it coverage.

## Correction status

Per-flow replay status (green, fixed-and-green, or owned-exception) and which
corrections still lack live re-verification are owned by
`.agent-device/evidence/AD-FLOW-COMPLETION-2026-09-04.md`.

## P0-00 baseline

Prerequisites:

- the Android Studio emulator has a development build for
  `com.niks0501.caneguard` installed;
- the build contains the current TFLite/Nitro native runtime;
- Metro is serving the matching JavaScript bundle;
- a valid field-reporter session is already stored in the emulator; and
- `scripts/ad-flow-env.sh stage-media` has staged the checked-in fixture,
  whose model contract expects a Rust result.

The flow intentionally preserves application state because clearing it would
remove the authenticated session. It follows the public scan UI through the
staged gallery image, symptom checklist (Rust), result assertion, and
"keep as scan only" save.

If `auth.login-screen` is visible, authenticate manually and rerun; do not
add credentials or test-only authentication shortcuts to the flow. Copy the
terminal result and generated artifacts into the evidence location described
in `.agent-device/evidence/README.md`.

## auth-v1 evidence flows

The auth-v1 flow group keeps its own ordered evidence contract. Its runtime
prerequisites, environment values, ordered segments, and deep-link handoff
procedure live in `.agent-device/evidence/AUTH-V1.md` and the converted flow
records. The same rules apply as before: use the seeded local accounts, keep
QA/staging/production disconnected, and never record one-time tokens or
passwords in evidence or scripts.
