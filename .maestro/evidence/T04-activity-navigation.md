# T04 Activity navigation evidence

- Overall result: `PASS`
- Behavior/flow: `.maestro/p0/04-activity-navigation.yaml` verifies Home -> Activity navigation, All/Reports/Scans filters, scan-only and report activity discovery, report-detail reopening, and return to filtered activity.
- Timestamp and timezone: 2026-08-28 16:05-16:07 CST (+0800)
- Branch: `fm/cg-maestro-gap` at the PR #47 head; the evidence commit is intended for `fm/cg-t04`.
- Commit SHA at device run: `99b8bbc79a86a097692e8ab018a98560559f2925`
- Worktree state at device run: clean.

## Runtime

- Device/emulator: Android emulator `emulator-5554`, model `sdk_gphone64_x86_64`.
- OS/API level: Android 14 / API 34.
- App version/build profile: CaneGuard `1.1.0`, version code `1`, debuggable Expo development build, package `com.niks0501.caneguard`.
- Native-affecting changes in this phase: none; PR #47 changes TypeScript, tests, Maestro YAML, Markdown, and generated graph artifacts, with no native dependency or app-configuration changes.
- Native-runtime status: `USABLE`.
- Metro/backend prerequisites: Metro served this worktree at `http://localhost:8081` with `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`; the API health endpoint returned database and storage `ready`; ADB reverse mappings for ports 8081 and 8000 were present; the authenticated field-reporter session and prior scan/report records were preserved.

## Verification

| Result | Command or check | Evidence/artifact |
|---|---|---|
| PASS | `npm run e2e:doctor` | Java 17, adb, Maestro, and the project Maestro skill were detected. |
| PASS | `maestro check-syntax .maestro/p0/04-activity-navigation.yaml` | Maestro 2.9.0 returned `OK`. |
| PASS | `npm run e2e:flow -- .maestro/p0/04-activity-navigation.yaml` | Maestro 2.9.0 ran on `emulator-5554`; every navigation, filter, record-discovery, detail-reopen, and screenshot step completed. Artifact: `/home/aki/.maestro/tests/2026-08-28_160514`. |
| PASS | API and Metro readiness probes | `GET /api/health` returned `data.status=ok` with database and storage ready; Metro returned `packager-status:running`. |
| PASS | Persistence proof | Before the flow, Activity loaded two saved items, including one scan-only item and one report-backed item. The flow reopened the report detail, returned to Activity, switched to Reports, then switched to Scans and rediscovered the scan-only item. |
| PASS | `git diff --check` | No whitespace errors in the evidence change. |
| NOT RUN | Full repository test suite | PR #47 already records passing typecheck, lint, 77-suite Jest run, and database checks; they were not rerun during this device-only closeout. |

## Limitations and follow-up

- The first Metro launch omitted `EXPO_PUBLIC_API_BASE_URL`, which produced the app's expected configuration error screen before the T04 flow could start.
- Metro was restarted with the documented local API URL, and the subsequent T04 run passed without changing application code or clearing app state.
- The screenshot, Maestro command log, manifest, and device logcat are retained in `/home/aki/.maestro/tests/2026-08-28_160514`.
