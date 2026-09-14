# CaneGuard Agent Device workspace

Agent Device is the canonical Android device automation, UI verification,
E2E/flow testing, and debugging framework for CaneGuard Mobile.

Flows are grouped by implementation milestone so later phases can add coverage
without replacing the protected scan regression:

```text
.agent-device/
├── flows/              # deterministic .ad replay scripts (the E2E suite)
├── checks/             # Node drivers for ordered/cross-repository journeys
├── manual-tests/       # human-run guides for journeys automation cannot reach
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
scripts/ad-flow-env.sh preflight          # device check, reverse mappings, grant location, stage legacy fixture
scripts/ad-flow-env.sh preflight-v1       # same checks, then stage all four fixed Model V1 fixtures
scripts/ad-flow-env.sh stage-media        # push + media-scan one fixture (optional device filename)
scripts/ad-flow-env.sh stage-v1-fixture smut  # stage one V1 fixture; removes only controlled V1 copies
scripts/ad-flow-env.sh stage-v1-fixtures # stage healthy, mosaic, rust, and smut together
scripts/ad-flow-env.sh grant-permissions  # pm grant fine/coarse location
scripts/ad-flow-env.sh revoke-permissions # revoke + force-deny location (no system dialog)
scripts/ad-flow-env.sh connect-metro      # connect the dev client to http://127.0.0.1:8081 and close the setup session
scripts/ad-flow-env.sh reset-app          # clear app data and establish the Metro connection (replaces launchApp clearState)
```

`connect-metro` expects the post-reset onboarding state it waits for; for
state-preserving or mid-suite Metro reconnects, connect Metro directly without
this helper.

`preflight` remains compatible with the legacy parity-reference flows: it
stages the shared Rust fixture and grants location permissions.
`preflight-v1` stages all four fixed handoff fixtures after checking their
SHA-256 identities against `qa/expected-v1-outputs.json`. The source is the
read-only handoff directory (`$HOME/projects/CaneGuard-V1-Integration-Handoff/qa`)
when present, otherwise the identical tracked copies under
`assets/model-fixtures/v1-*.jpg` are used. `stage-v1-fixture <class>` removes
only the helper's controlled `caneguard-v1-*.jpg` media and stages one class;
use that form before the gallery flow so the Android system picker has exactly
one controlled candidate. `stage-v1-fixtures` keeps all four candidates for
host/debug flows. No command clears app data, resets an AVD, or removes
unrelated user media.
Flows that need location denied run `revoke-permissions` first (or the suite
runner notes it in the flow's evidence record).
`stage-media` removes only prior copies of the selected controlled fixture
before staging it, because Android's picker copies selected images into
Pictures. Run it before each scan flow or isolated scan-flow segment.
Scripts whose Maestro originals started with `launchApp clearState` assume
`reset-app` ran first; scripts that preserve state assume the app is already
signed in as documented per flow group.

Clipboard-based text entry has no helper on purpose: `.ad` scripts use the
agent-device `fill` command on the target field, which the bundled test IME
makes reliable.

## Manual test guides

`.agent-device/manual-tests/` holds one Markdown guide per journey that
Agent Device plus Chrome DevTools AXI genuinely cannot automate — for example
credential-gated offline restarts on an emulator that cannot enroll a device
credential, the captain-owned biometric skip, and the one flow blocked by the
replay harness's viewport failure after authorized repairs. Each guide states
the journey's intent, prerequisites, numbered steps with expected results,
and why automation was not possible. A human tester with only the emulator
and a browser can run them. When a guide's blocker is later removed, promote
the journey back into `flows/` and delete the guide in the same change.

## Script variables

`.ad` scripts do not inherit arbitrary environment variables. `${NAME}`
references resolve only from `AD_VAR_<NAME>` environment variables or explicit
`-e KEY=VALUE` flags on `agent-device replay` / `npm run e2e:flow`. Disposable
credential values stay in the git-ignored `.agent-device/test-artifacts/`
account file and are exported as `AD_VAR_AUTH_EMAIL` / `AD_VAR_AUTH_PASSWORD`
per session; never commit them.

## Chain drivers

Ordered and cross-repository journeys are driven by Node scripts in
`.agent-device/checks/` rather than one mega-flow. Each driver owns exactly
one device session at a time, closes it before the next setup step, and
restores the emulator networking/permission state it changed. The flagship
example is the T10 chain (`node .agent-device/checks/t10-acceptance.mjs`):
Mobile scan -> Web review/assignment via Chrome DevTools AXI -> Mobile owner
retrieval -> genuinely offline visit completion -> recovery sync ->
synchronized evidence verified on Web. See
`.agent-device/evidence/INTENT-REPLAY.md` for the full per-flow outcome map.

## E2E command behavior

Use the project npm scripts for Agent Device runs:

```bash
npm run e2e:doctor                                        # agent-device doctor
npm run e2e:flow -- .agent-device/flows/<flow>.ad         # one focused flow
npm run e2e                                               # all flows under .agent-device/flows
```

### New or changed behavior — Mode A interactive verification

For newly implemented or changed behavior, verify the path interactively first
with Agent Device. Open the app, inspect the live UI, act, re-inspect from the
current state, diagnose failures in place, and continue from the current
session when safe. Do not create, modify, or repeatedly replay a `.ad` script
while discovering the working application path.

After the behavior succeeds interactively, create or update the smallest
justified `.ad` regression flow and replay it once to prove deterministic Mode B
coverage.

### Existing regression/acceptance flow — Mode B deterministic replay

For an existing checked-in regression or acceptance flow, plain
`agent-device replay <script>` is the normal focused Mode B path and the
project action is its package-script form. If it diverges, preserve the exact
first failing interaction, device/build identity, logs, screenshots, and
artifacts; diagnose the smallest failing interaction from the structured
divergence report (step, file, line, ranked selector suggestions), make one
evidence-backed change, and rerun or guarded-resume the focused script.

Run broader or full E2E with `npm run e2e` only when the task or an acceptance
gate requires it.

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

Per-flow replay status from the first conversion pass (green,
fixed-and-green, or owned-exception) is owned by
`.agent-device/evidence/AD-FLOW-COMPLETION-2026-09-04.md`. The later
intent-based rewrite of every problem flow — reconstructed-and-green versus
manual-test-guide, with replay evidence and the script-variable contract — is
owned by `.agent-device/evidence/INTENT-REPLAY.md`, which supersedes the
earlier record for the flows it covers.

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
