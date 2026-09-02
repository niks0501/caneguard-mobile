# T02 guided validation evidence

- Overall result: `PASS`
- Behavior/flow: `.maestro/p0/01-guided-validation.yaml` covers Scan -> guided visible-pattern question -> Something else mismatch -> result outcome affordances -> scan-only persistence.
- Timestamp and timezone: 2026-08-28 16:18-16:19 CST (+0800)
- Branch: `fm/cg-maestro-gap` at the PR #48 head; the evidence and flow fix are intended for `fm/cg-t02`.
- Commit SHA at device run: `9639d6cec2f4d6a95c21919409d85d5483835248`
- Worktree state at device run: dirty only in `.maestro/p0/01-guided-validation.yaml` with the targeted scroll assertions.

## Runtime

- Device/emulator: Android emulator `emulator-5554`, model `sdk_gphone64_x86_64`.
- OS/API level: Android 14 / API 34.
- App version/build profile: CaneGuard `1.1.0`, version code `1`, debuggable Expo development build, package `com.niks0501.caneguard`.
- Native-affecting changes in this phase: none; PR #48 changes TypeScript, tests, JSON contract data, documentation, Maestro YAML, and generated graph artifacts, with no native dependency or app-configuration changes.
- Native-runtime status: `USABLE`.
- Metro/backend prerequisites: Metro served this worktree at `http://localhost:8081` with `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`; the API health endpoint returned database and storage `ready`; ADB reverse mappings for ports 8081 and 8000 were present; the authenticated field-reporter session was preserved.

## Verification

| Result | Command or check | Evidence/artifact |
|---|---|---|
| PASS | `npm run e2e:doctor` | Java 17, adb, Maestro, and the project Maestro skill were detected. |
| PASS | `maestro check-syntax .maestro/p0/01-guided-validation.yaml` | Maestro 2.9.0 returned `OK` after the flow fix. |
| PASS | `npm run e2e:flow -- .maestro/p0/01-guided-validation.yaml` | Maestro 2.9.0 ran on `emulator-5554`; every guided-question, mismatch, outcome-affordance, screenshot, and scan-only-save step completed. Artifact: `/home/aki/.maestro/tests/2026-08-28_161808`. |
| PASS | API and Metro readiness probes | `GET /api/health` returned `data.status=ok` with database and storage ready; Metro returned `packager-status:running`. |
| PASS | Persistence proof | The flow selected `Something else`, displayed the mismatch explanation, then selected `Keep as Scan Only` and reached `scan.record-saved`, proving the completed mismatch scan was saved locally without changing the model result. |
| PASS | `git diff --check` | No whitespace errors in the flow and evidence changes. |
| NOT RUN | Full repository test suite | PR #48 already records passing lint, typecheck, database checks, and a 75-suite / 654-test Jest run; they were not rerun during this device-only closeout. |

## Failure diagnosis and correction

- Observed: the first PR #48 run reached the mismatch explanation but could not find `scan.report-to-office` after scrolling only to `scan.checklist-consistency`.
- Expected: the Report to Office, Keep as Scan Only, and New Scan affordances should be assertable on the result screen.
- Evidence: `/home/aki/.maestro/tests/2026-08-28_160946` captured the failing hierarchy and screenshot; the result hierarchy placed the consistency card at `[53,2133][1028,2337]` with the outcome panel below the viewport.
- Cause: `TEST`; the flow's visibility assertion assumed that scrolling to the consistency card also exposed the later outcome panel, while the UI correctly rendered those controls further down the same scroll view.
- Correction: added targeted `scrollUntilVisible` steps for `scan.report-to-office`, `scan.keep-as-scan-only`, and `scan.new-scan`.
- Changed-cause reruns: intermediate artifacts `/home/aki/.maestro/tests/2026-08-28_161323` and `/home/aki/.maestro/tests/2026-08-28_161541` confirmed each subsequent control boundary; the final run passed at `/home/aki/.maestro/tests/2026-08-28_161808`.

## Limitations and follow-up

- The run preserves app state and relies on the existing authenticated field-reporter session and the checked-in parity fixture.
- The screenshot, Maestro command log, manifest, and device logcat are retained in `/home/aki/.maestro/tests/2026-08-28_161808`.
- The benign Android permission-grant warnings for unrequested legacy external-storage permissions did not affect the flow, which completed successfully.
