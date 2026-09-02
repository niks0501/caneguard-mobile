# T03 evidence

- Overall result: `PASS_WITH_GAPS` for the historical automated record.
- Acceptance closure: `CLOSED` through a captain-reported manual result.
- Behavior/flow: Direct Scan -> guided symptom observation -> Report to Office -> prefilled Field Report Draft -> four operational entries -> automatic GPS -> local finalization.
- Timestamp and timezone: 2026-08-28, Asia/Manila.
- Branch: `fm/cg-t03`
- Commit SHA: recorded by the commit containing this evidence.
- Worktree state: committed clean worktree on `fm/cg-t03`.

## Runtime

- Device/emulator: Android emulator `emulator-5554`, `sdk_gphone64_x86_64`.
- OS/API level: Android API 34.
- App version/build profile: installed `com.niks0501.caneguard` development build with matching Metro JavaScript bundle.
- Native-affecting changes in this phase: none.
- Native-runtime status: `PASS` for the existing development build; this phase changes TypeScript/UI and Maestro only.
- Metro/backend prerequisites: Metro served this worktree with `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`, the API health endpoint reported ready database and storage, and ADB reverse mappings for ports 8081 and 8000 were present.

## Verification

| Result | Command or check | Evidence/artifact |
|---|---|---|
| PASS | `npm run typecheck` | Exit 0. |
| PASS | `npm run lint` | Exit 0. |
| PASS | `npm test -- --runInBand --testTimeout=30000` | Full suite passed 659 tests across 77 suites. |
| PASS | Focused Jest suites for symptom checklist, analysis result, Field Report, validation, repository, hook, and multipart mapper behavior | Latest focused run passed 155 tests. |
| PASS | `maestro check-syntax .maestro/p0/10-direct-result-to-report.yaml` | Exit 0. |
| PASS_WITH_GAPS | `npm run e2e:flow -- .maestro/p0/10-direct-result-to-report.yaml` | `/home/aki/.maestro/tests/2026-08-28_183738` completed the direct result-to-report path through local finalization with inherited evidence, Batangas/Nasugbu context, farm reference, affected values, GPS location, and finalized pending state. |
| GAP | Direct API synchronization in the same flow | The provided local API returned HTTP 500 while persisting the valid report because its database has three pending migrations: notifications, lifecycle dimensions, and review actions/audits. The flow therefore remained `Waiting to sync`; no API migration was run from this mobile worktree. |

## Closure update

The captain later reported the optional P0 direct-report flow as `PASS` on physical Android phone `AYAUFIN76LEYR46X` after the earlier gap.

This is a manual closure report, not a new Maestro rerun.

The closure report did not include a new command or artifact path, so the historical automated result remains labeled `PASS_WITH_GAPS` above.

## Limitations and follow-up

- The historical automated run and its failure artifacts remain part of this record for traceability.
- Existing P0/P2 flows cover manual-map fallback and report retry behavior; this T03 flow intentionally uses the automatic GPS path to keep direct reporting minimum effort.
