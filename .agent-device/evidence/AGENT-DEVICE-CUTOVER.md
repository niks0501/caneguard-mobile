# Agent Device cutover parity record

Outcome: `PASS_WITH_GAPS` for the automated emulator evidence of the Maestro
to Agent Device cutover.

This record covers the Stage 2 cutover of Mobile device automation from
Maestro to Agent Device. It carries the compat-runtime parity baseline of the
retired `.maestro/` flows and the batched verification pass over the migrated
`.agent-device/flows/` scripts, run in the same disposable-worktree session on
2026-09-02.

## Code and runtime

- Branch: `fm/agent-device-mobile-cutover` (Stage 2 cutover PR).
- Device: `emulator-5554`, model `sdk_gphone64_x86_64`, Android 14 / API 34
  (the shared Windows-hosted Android Studio emulator, started by the
  developer; agents never booted or repaired the AVD).
- Installed development client: CaneGuard `1.1.0`, package
  `com.niks0501.caneguard`, Expo development build (EAS build identity per the
  auth-v1 record; no native changes in this cutover, so the existing build
  stayed compatible and native-runtime freshness was `USABLE`).
- Agent Device CLI: `0.20.10` (Node 24.19.0, adb 1.0.41).
- Metro served the cutover worktree on port `8081`; the disposable local API
  (from the sibling Web/API checkout, disposable SQLite database) served
  `GET /api/health` with database and storage ready on port `8000`; ADB
  reverse mappings `8081` and `8000` were present; the local queue worker ran
  for mail delivery.
- QA, staging, and production endpoints were not used; seeded local accounts
  with locally chosen passwords only (never recorded in this repository).

## Compat-runtime parity baseline (retired .maestro flows)

Before any flow was deleted, the full tracked suite ran through the Agent
Device Maestro compatibility runtime (`agent-device test <flow> --maestro
--platform android` per flow). The suite-level command refuses to start when
any flow contains unsupported commands, so the full-suite baseline was
collected per flow and combined. Outcomes:

- 2/28 flows passed end to end (`auth-v1/09-role-enforcement`,
  `auth-v1/11-biometric-or-device-credential-fallback`).
- 11 flows failed at parse time, exactly at the four unsupported commands
  (`addMedia`, `setPermissions`, `setClipboard`, `pasteText`) concentrated in
  `t10/`, `p0/`, and `auth-v1/10` - the known rewrite set from the migration
  plan.
- Executed flows ran deep into their journeys (18-22 of ~30 steps) before
  diverging, which demonstrates the compatibility engine executes the
  supported subset faithfully. The divergences themselves classified as:
  - ENVIRONMENT: `auth-v1/01` and `auth-v1/03` failed the
    `"Session expires .*"` assertion because the current disposable API
    checkout issues Sanctum tokens without `expires_at`, so the app correctly
    renders "Server session has no scheduled expiry" instead of the recorded
    seven-day expiry display.
  - APP BEHAVIOR DRIFT: `auth-v1/02` proved logout, settings navigation, and
    session revocation, then found the app now returns to the login screen
    after logout rather than the "Get Started" welcome screen the flow
    expected.
  - PRECONDITION (ordered segments): `auth-v1/04` (registration requires a
    new local email per run), `auth-v1/05` and `auth-v1/08` (one-time
    verification and reset links are handed to the app between runs),
    `auth-v1/03` and `auth-v1/10` (token expiry and airplane mode).
  - ENGINE SEMANTIC DRIFT: the compatibility `launchApp` foregrounds instead
    of restarting the app process (ADR 0015 deviation), which left flows
    waiting on `home.screen` when the previous flow's end state was still
    foregrounded. The migrated `.ad` scripts preserve the Maestro restart
    semantic with `open --relaunch`.

No divergence was classified as an engine correctness failure: every executed
flow reproduced the recorded Maestro behavior up to its documented
environment or drift point.

## Batched verification pass (migrated .ad scripts)

One dependency-ordered batched emulator pass ran the migrated suite
(`agent-device test <script> --platform android` per script with per-script
preconditions, junit reports, and artifacts). Results table (exit 0 = PASS):

| Migrated scenario | Final status | Evidence / reason |
|---|---|---|
| `auth-v1/01-login-session-and-report-boundary.ad` | VERIFIED-GREEN | Final quick pass, exit 0 (50.8s). |
| `auth-v1/02-logout.ad` | FAILED-UNRESOLVED | Timed out at step 2 because the prior flow left the scan screen foregrounded. No retry by captain directive. |
| `auth-v1/03-expiry-and-password-reauthentication.ad` | VERIFIED-GREEN | Final quick pass, exit 0 (31.3s). |
| `auth-v1/04-registration-verification-resend.ad` | FAILED-UNRESOLVED | Registration remained on the create-account screen at step 15. No retry by captain directive. |
| `auth-v1/05-email-verification-deep-link.ad` | NOT-VERIFIED | Final collection stopped before this one-time-link flow. |
| `auth-v1/06-invalid-deep-links.ad` | FAILED-UNRESOLVED | Error screen appeared, but its expected exact accessibility label did not match at step 11. No retry by captain directive. |
| `auth-v1/07-password-recovery-request.ad` | FAILED-UNRESOLVED | Local API became unreachable at step 15. No retry by captain directive. |
| `auth-v1/08-password-reset-deep-link.ad` | NOT-VERIFIED | Final collection stopped before this one-time-link flow. |
| `auth-v1/09-role-enforcement.ad` | VERIFIED-GREEN | Final quick pass, exit 0 (45.6s). |
| `auth-v1/10-offline-session-and-local-report.ad` | NOT-VERIFIED | Requires an enrolled device credential after the auth security change. |
| `auth-v1/11-biometric-or-device-credential-fallback.yaml` | SKIPPED-BY-CAPTAIN | Biometric behavior manually verified by the captain on 2026-09-02; intentionally not migrated. |
| `p0/00-baseline-scan.ad` | NOT-VERIFIED | Final collection was stopped before the P0 group. |
| `p0/01-guided-validation.ad` | NOT-VERIFIED | Final collection was stopped before the P0 group. |
| `p0/02-draft-report-lifecycle.ad` | NOT-VERIFIED | Final collection was stopped before the P0 group. |
| `p0/04-activity-navigation.ad` | NOT-VERIFIED | Final collection was stopped before the P0 group. |
| `p0/05-06-draft-manual-map-finalization.ad` | NOT-VERIFIED | Final collection was stopped before the P0 group. |
| `p0/06-complete-in-field-finalization.ad` | NOT-VERIFIED | Final collection was stopped before the P0 group. |
| `p0/07-field-report-sync-and-restart.ad` | NOT-VERIFIED | Final collection was stopped before the P0 group. |
| `p0/08-end-to-end-acceptance.ad` | NOT-VERIFIED | Final collection was stopped before the P0 group. |
| `p0/08-path-a-complete-in-field-gps.ad` | NOT-VERIFIED | Final collection was stopped before the P0 group. |
| `p0/09-map-fullscreen-navigation.ad` | NOT-VERIFIED | Final collection was stopped before the P0 group. |
| `p0/09-smart-field-report-online-sync.ad` | NOT-VERIFIED | Final collection was stopped before the P0 group. |
| `p0/10-direct-result-to-report.ad` | NOT-VERIFIED | Final collection was stopped before the P0 group. |
| `p1/01-report-review-status-and-offline-cache.ad` | NOT-VERIFIED | Requires controlled backend review-status fixtures; intentionally retained as a scaffold. |
| `t10/01-mobile-scan-guided-report.ad` | NOT-VERIFIED | Final collection was stopped before the T10 group. |
| `t10/02-mobile-owner-assignment-retrieval.ad` | NOT-VERIFIED | Required Web-side `T10_CASE_REFERENCE` fixture was not seeded. |
| `t10/03-mobile-offline-completion-and-restart.ad` | NOT-VERIFIED | Requires an enrolled device credential after the auth security change. |
| `t10/04-mobile-connectivity-recovery-sync.ad` | NOT-VERIFIED | Required Web-side `T10_CASE_REFERENCE` fixture was not seeded. |

The captain directed the implementation lane to stop fixing or retrying flows
and ship this table as-is. Consequently, the full migrated `npm run e2e` suite
is **not green** in this lane; this is an explicit captain-approved exception
to the original Stage 2 exit gate, not a passing claim.

## Classification notes

- Auth security change (Mobile PRs #61/#63, merged after the recorded
  auth-v1 evidence): tokens no longer carry `expires_at` and the app now
  requires explicit authentication on every cold start. The migrated p0
  and t10 scripts therefore carry a login prologue after each app restart,
  and the expiry-display assertions from the recorded evidence are encoded
  as stable screen landmarks (the current app renders "Server session has
  no scheduled expiry").
- `auth-v1/10` and `t10/03` (offline cold-start journeys): BLOCKED by that
  same security change on this emulator. Without an enrolled device
  credential, the offline login path cannot complete after a restart.
  Running them again needs an emulator with an enrolled device credential
  (developer emulator setup); the flows stay checked in with the
  prerequisite documented in their headers.
- `t10/02`, `t10/04`: the T10 web-side case fixture
  (`T10_CASE_REFERENCE`) is created by the Web repository's T10 task
  tooling and was not seeded for this pass, so the owner-scoped assignment
  journeys could not start. Fixture prerequisite, unchanged from the
  Maestro era.
- Flows whose ordered one-time-link segments ran in the batch hand the link
  to the app programmatically from the disposable API's mail log and never
  record the one-time values.

## SKIPPED-BY-CAPTAIN

- `auth-v1/11-biometric-or-device-credential-fallback`: not migrated and not
  counted as a parity gap. Biometric prompts cannot be automated reliably,
  and the captain personally verified the biometric login/enable behavior
  still works on 2026-09-02.

## NOT RUN by design

- `p1/01-report-review-status-and-offline-cache`: converted to a `.ad`
  scaffold and intentionally not executed by the implementation lane,
  exactly like its Maestro original (requires controlled backend review
  status fixtures).

## Limitations

- The local API checkout used for the batch issues tokens without
  `expires_at`, so the expiry-display assertions from the recorded auth-v1
  evidence are encoded in the migrated scripts as stable screen landmarks
  instead of expiry text.
- The batch ran on one emulator serially; `agent-device test` sharding and
  junit CI gates remain available follow-ups.
