# Intent-based Agent Device rewrite record

Date: 2026-09-05
Branch: `fm/cg-ad-intent-rewrite-4h` (rewrite committed at `d085840eb4c8`, on
top of the live-confirmation base `f592308319c8`)
Target: Pixel 8 Android emulator `emulator-5554`, Android 14 (API 34), app
`com.niks0501.caneguard` 1.1.0 (Expo development client)

## What this record covers

The captain's direction for the problem flows (failed-live, parked, or
owned-exception in `.agent-device/evidence/AD-FLOW-COMPLETION-2026-09-04.md`
and the live confirmation report): keep each Maestro flow's *intent*, not its
structure, and rewrite it as an Agent Device-native journey. Test everything
that Agent Device plus Chrome DevTools AXI can reach, including
cross-repository flows, and elevate only what genuinely cannot be automated
into manual guides in `.agent-device/manual-tests/`.

Proven-green flows were left untouched and keep their earlier evidence.

## Script-variable contract (learned during this rewrite)

`agent-device replay` does **not** inherit arbitrary process environment
variables. Script variables such as `${AUTH_EMAIL}` or `${T10_CASE_REFERENCE}`
resolve only from:

- `AD_VAR_<NAME>` environment variables (`AD_VAR_AUTH_EMAIL` -> `${AUTH_EMAIL}`), or
- explicit `-e KEY=VALUE` flags on `replay` / `npm run e2e:flow`.

The chain drivers pass `T10_CASE_REFERENCE` between segments in-process;
credential variables are supplied privately from the git-ignored
`.agent-device/test-artifacts/account.json` disposable local account. No
secret is stored in the repository.

## Chain drivers (`.agent-device/checks/`)

| Driver | Journey it proves |
|---|---|
| `p0-acceptance.mjs` | Ordered P0 acceptance: GPS Path A -> denied-GPS Draft -> manual-map finalization -> final acceptance segment. |
| `t10-acceptance.mjs` | Full cross-repository T10 chain: Mobile scan/submit -> Web review + field-validation assignment (Chrome DevTools AXI on the real submitted report UUID) -> Mobile owner retrieval -> genuinely offline visit completion -> network restoration + retry sync -> synchronized visit evidence visible on Web. |
| `t10-recovery.mjs` | Offline completion followed by real network restoration and conditional retry synchronization of the same case. |
| `review-cache.mjs` | Real airplane/Wi-Fi loss during an unlocked session must not erase cached office review/feedback; state restored afterward. |
| `web-review.mjs` | Web-side review/assignment/verification of the exact Mobile-submitted case (`assign`, `verify-report`, `verify-completion` modes). |
| `device-network.mjs` | Emulator claim check and supported airplane/Wi-Fi toggling with verified start/restore state. |
| `map-fullscreen.mjs` | Map fullscreen enter/exit assertions via Agent Device snapshot. |

## Per-flow outcome map (problem flows)

Every rewritten flow below has a fresh exit-0 replay; raw logs live in the
local, git-ignored `.agent-device/test-artifacts/` (`*.log` / `*.json`).

| Flow (intent owner) | Outcome | Replay evidence |
|---|---|---|
| `p0/00-baseline-scan.ad` (scan-only save keeps result on device) | reconstructed-and-green | `scan-only-1`: exit 0, 30 steps, 59.0s |
| `p0/02-draft-report-lifecycle.ad` (Draft save/restart/reopen) | reconstructed-and-green | `draft-footer-1`: exit 0, 46 steps, 127.3s; re-proven inside ordered chain `p0-chain-2` (46 steps, 143.1s) |
| `p0/04-activity-navigation.ad` (timeline navigation and filters) | reconstructed-and-green | `activity-2`: exit 0, 32 steps, 59.7s |
| `p0/05-06-draft-manual-map-finalization.ad` (manual pin finalization + restart) | reconstructed-and-green | `draft-manual-final-1`: exit 0, 60 steps, 159.3s; ordered chain `p0-chain-2` (60 steps, 171.6s) |
| `p0/06-complete-in-field-finalization.ad` (denied-GPS manual pin finalize + sync) | reconstructed-and-green | `manual-final-1`: exit 0, 46 steps, 104.0s |
| `p0/07-field-report-sync-and-restart.ad` (server identity survives restart + reauthentication) | reconstructed-and-green | `restart-1`: exit 0, 25 steps, 48.8s |
| `p0/08-end-to-end-acceptance.ad` (both reporting paths accepted) | reconstructed-and-green | ordered driver `p0-acceptance.mjs`, run `p0-chain-2`: all four replays exit 0 (113.6s / 143.1s / 171.6s / 2.7s), `PASS: ordered GPS and saved-Draft/manual-map acceptance` |
| `p0/08-path-a-complete-in-field-gps.ad` (immediate GPS completion + sync) | reconstructed-and-green | `gps-1`: exit 0, 47 steps, 100.9s; ordered chain `p0-chain-2` (47 steps, 113.6s) |
| `p0/09-map-fullscreen-navigation.ad` (fullscreen map enter/exit on a manual-eligible Draft) | reconstructed-and-green | `fullscreen-2`: exit 0, 24 steps, 60.2s (entry leg `map-entry-1`: exit 0, 25 steps, 58.2s) |
| `p0/09-smart-field-report-online-sync.ad` (six-field Mobile-to-Web preservation) | manual-test-guide | `.agent-device/manual-tests/p0-09-smart-field-report-online-sync.md`. Replay harness viewport failure reproduced after two authorized structural repairs (`smart-1`, `smart-settle-1`, `smart-pan-1`); the same journey passes interactively, so the blocker is the replay viewport, not the app. |
| `p0/10-direct-result-to-report.ad` (direct result -> submitted report) | reconstructed-and-green | `direct-1`: exit 0, 45 steps, 96.9s |
| `p1/01-report-review-status-and-offline-cache.ad` (office status/feedback cache survives network loss) | reconstructed-and-green | `p1-cache-1`: exit 0, 15 steps, 42.1s (online status + real network-loss refresh via `review-cache.mjs`). The credential-gated offline cold restart is elevated: `.agent-device/manual-tests/p1-review-offline-restart.md`. |
| `p1/02-warm-offline-review-cache.ad` (NEW: warm-session offline cache) | reconstructed-and-green | `p1-cache-1`: exit 0, 8 steps, 8.6s, `PASS: real office feedback retained during warm-session network loss` |
| `t10/01-mobile-scan-guided-report.ad` (Mobile produces the T10 case) | reconstructed-and-green | `t10-producer-2`: exit 0, 45 steps, 114.6s; re-proven in today's final chain (45 steps, 175.6s) |
| `t10/02-mobile-owner-assignment-retrieval.ad` (Web-assigned owner sees the case on Mobile) | reconstructed-and-green | `t10-owner-3`: exit 0, 17 steps, 46.7s; final chain (17 steps, 53.2s) |
| `t10/03a-mobile-offline-completion.ad` (NEW: genuinely offline visit completion; split from old t10/03) | reconstructed-and-green | final chain: exit 0, 15 steps, 34.7s under real airplane/Wi-Fi-off state |
| `t10/03-mobile-offline-completion-and-restart.ad` (credential-gated restart portion) | manual-test-guide | `.agent-device/manual-tests/t10-offline-completion-and-restart.md` — no enrollable device credential on this emulator (recorded in AD-FLOW-COMPLETION). |
| `t10/04-mobile-connectivity-recovery-sync.ad` (same case syncs after recovery, case stays open) | reconstructed-and-green | Final authorized replay: today's `t10-acceptance.mjs` run, exit 0 end-to-end, including recovery segment 7 steps, 4.0s with the named `Visit time` wait and `PASS: ... synchronized visit evidence visible on Web`. |
| `auth-v1/10-offline-session-and-local-report.ad` (offline unlock keeps local scan) | manual-test-guide | `.agent-device/manual-tests/auth-v1-10-offline-session-and-local-report.md` — no automatable enrolled device credential. |
| Biometric capability and fallback (captain-owned skip) | manual-test-guide | `.agent-device/manual-tests/auth-v1-11-biometric-capability-and-fallback.md`. |

Flagship result: the full T10 cross-repository chain
(`node .agent-device/checks/t10-acceptance.mjs`) passes end-to-end —
Mobile scan -> Web review/assignment -> owner retrieval -> real offline
completion -> network restoration/retry sync -> synchronized evidence on Web —
with the exact submitted report UUID and generated case reference
(`CG-20260905-F0AB54C4` in the final run) tied across surfaces.

## Runtime prerequisites for a replay session

1. One ready emulator `emulator-5554`, unclaimed (`agent-device device status`
   shows no claims). Never launch, wipe, or repair the AVD.
2. Metro serving the matching bundle and `adb reverse` mappings for 8081/8000
   (5173 for the Web app).
3. Disposable local API database; Web signed in at `http://localhost:5173`
   with the disposable review fixture for cross-repository flows.
4. Location/media preflow via `scripts/ad-flow-env.sh` as documented per flow.
5. Private disposable credentials exported as `AD_VAR_AUTH_EMAIL` /
   `AD_VAR_AUTH_PASSWORD` (never committed).

## Limitations

- The emulator cannot enroll an automatable device credential; all
  credential-gated cold restarts stay manual.
- The replay harness's viewport-unavailable failure class (recorded for
  smart-report) is a known harness limitation, not an app defect.
- Artifacts under `.agent-device/test-artifacts/` are local and git-ignored;
  move durable copies to the team's artifact store when needed.
