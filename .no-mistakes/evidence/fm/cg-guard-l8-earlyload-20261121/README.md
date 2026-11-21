# L8 — start both model loaders when the Scan tab mounts

Branch `fm/cg-guard-l8-earlyload-20261121`, base `702bd1c`, target `22b2e81`.
Change: `src/app/(tabs)/scan.tsx` now calls `useCaneGuardModel().start` and
`useGuardModel().start` on mount; `src/app/__tests__/scan.test.tsx` asserts the
call; new focused test `src/app/__tests__/scan.modelStart.test.tsx` mounts the
real providers and asserts the native loaders run.

## Scenarios

| # | Scenario | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Android/emulator: opening the Scan tab starts both bundled TFLite loads before any checklist visit (the intent of L8) | untested | `07-live-up-device-unavailable.log`, `.agent-device/test-artifacts/live/22b2e818da27/run.json` — `npm run live:up` records `DEVICE_UNAVAILABLE`; `adb devices -l` listed no target and the SDK has no emulator package, so no native surface was reachable |
| 2 | Mounting the real Scan screen (real model providers, mocked native runtimes) reaches both native loaders with zero user interaction | pass | `03-fixed-model-start-tests.log`, `src/app/__tests__/scan.modelStart.test.tsx` |
| 3 | Same assertion against the pre-change Scan screen fails (the regression is reproducible before the fix) | pass (expected failure reproduced) | `02-baseline-prefix-loader-not-started.log` |
| 4 | Web: inspector opens the Scan tab in the running app; screen renders, no runtime error | pass | `01-inspector-scan-tab-web.png` |
| 5 | Web: farmer (Tagalog) opens the Scan tab, navigates Home → Scan again; screen re-mounts cleanly, console has no errors | pass | `05-farmer-scan-tab-web.png`, `06-farmer-scan-tab-remount-web.png` |
| 6 | Related detection/guard/checklist suites still pass (fallback start on the checklist is untouched) | pass | `04-related-detection-tests.log` |

## Commands actually run

```
npm ci --no-audit --no-fund
npx jest --runInBand src/app/__tests__/scan.test.tsx
npx jest --runInBand src/app/__tests__/scan.modelStart.test.tsx
npx jest --runInBand src/app/__tests__/scanBaseProbe.tmp.test.tsx   # base-commit probe, temp files deleted
npx jest --runInBand src/app/__tests__/symptom-checklist.guard.test.tsx src/features/detection/analysis src/features/detection/model/__tests__
CANEGUARD_WEB_VALIDATE_TODAY=2026-11-21 npm run web:validate
npx -y chrome-devtools-axi open http://127.0.0.1:8199/login     # then fill/click/snapshot/screenshot
npm run live:up -- --exit-after-ready
```

## Boundaries

The web route cannot prove this intent: on web both model controllers are
platform stubs whose `start` is a no-op and the required Guard V1 fails closed
(`docs/qa/web-validation.md`). So web proves only that the Scan tab mounts,
renders and re-mounts with the extra mount effects — the timing benefit of L8 is
native-only and stays untested without an attached Android target.
