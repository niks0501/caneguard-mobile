# Release evidence record

**Purpose:** record what has actually been verified for a candidate, what has
not, and who owns each remaining gap. It must never infer native behaviour from
a browser, mock, or fixture.

## Current candidate

| Field | Value |
| --- | --- |
| Repository | `caneguard-mobile` |
| Branch | `fm/cg-guard-promote-main-20261119` |
| Verified commit | `a9c22b50428e0d2e42b8ca34a0fc8112373e4465` — the revision the pipeline test phase verified. Commit `0bc60ba` and later commits on this branch change documentation and test isolation only; re-run the commands below and re-stamp this file before calling any later revision verified |
| Change | Guard V1 sugarcane-presence gate promoted into the main scan flow (integration PR #292) |

## Verification scope for this candidate

Native verification ran inside this candidate's no-mistakes pipeline test phase,
web first and then on the attached phone. The phone ran the already installed
development client reused over Metro: the change has no native-affecting diff, so
the runbook's reuse path applied and no APK was rebuilt. A local
`./gradlew :app:assembleDebug` was not possible in this environment — the Android
SDK here has `platform-tools` only (no `gradle`, no `sdkmanager`) and the
repository has no `android/` project.

Evidence artifacts of that phase, by name in the pipeline's evidence record:
`r3-live-acceptance.log`, `r4-web-first-phone-recheck.log`, `r3-web-validate.log`,
`r3-device-availability-and-scope.log`, `r3-device-0*.png`,
`r3-caneguard-*.db`, `guard-checks.log`, `oracle-verify.log`, `oracle-model.log`.

Nothing in this repository may describe a browser check, a mocked module, or a
TFLite fixture as native inference, biometric, permission, or persistence proof.

## Evidence collected

| Evidence | How to reproduce | Status |
| --- | --- | --- |
| Full Jest / React Native Testing Library suite | `npm test -- --runInBand` | **Not run** in this candidate's pipeline test phase: only the configured pipeline test file and the targeted guard suites ran. CI's `verify:fast` job runs the full suite on the promoted revision |
| Configured pipeline test | `npm test -- --runInBand src/features/sync/services/__tests__/syncFieldReport.test.ts` | **PASS** on `a9c22b5` — 1 suite, 9 tests |
| Targeted guard suites | `npm test -- --runInBand src/features/detection/analysis src/features/detection/model/__tests__ src/features/detection/preprocessing/__tests__/guardPreprocess.test.ts src/app/__tests__/symptom-checklist.guard.test.tsx` | **PASS** on `a9c22b5` — 17 suites, 142 tests (the TFLite runtime is mocked, so this is workflow evidence, not inference proof) |
| Type check | `npm run typecheck` (`tsc --noEmit`) | **PASS** on `0bc60ba`, no diagnostics |
| Lint | `npm run lint` (Expo lint) | **PASS** on `0bc60ba` over the changed `src/` paths, no findings |
| Database migration check | `npm run db:check` | **PASS** on `0bc60ba` |
| Guard asset verifier | `python3 scripts/verify_guard_v1_assets.py` | **PASS** on `a9c22b5` — pinned SHA-256, checksums and frozen contract verified for `assets/models/caneguard_guard_v1_float32.tflite` (5,441,252 bytes) |
| Guard real-binary oracle | `python3 scripts/tests/test_guard_v1_model.py` | **PASS** on `a9c22b5` — 7 tests: real tensor ABI, real CPU inference, numeric goldens (accept 0.980837, EXIF-rotated 0.979495 against 0.259 with orientation dropped, reject 0.113288), arrangement and double-normalization checks |
| Expo Web guarded scan, fail-closed | `npm run web:validate` (stub API on `:8210`, web dev server on `:8199`), open `/login`, `farmer@validation.invalid`, choose a photo on `/scan` | **PASS** — the photo reaches `/symptom-checklist` with "The sugarcane photo check is not available on this phone, so scans are paused…" and **Continue to analysis result** stays disabled, so no result is reachable. The web bundle has no native Guard runtime by design; a 320×240 upload shows the photo-quality rejection first, which keeps precedence over the unavailable-model message |
| Phone: guarded scan accepted | Gallery photos on the attached phone (`AYAUFIN76LEYR46X`, `2311DRK48G`; app `com.niks0501.caneguard` 2.2.1 installed 2026-11-15, Metro on `:8081`, stub API on `:8210`) | **PASS** — a 1024×768 cane fixture and the real field photo `dev-assets/model-fixtures/v1-smut.jpg` (3000×4000) both passed Guard and reached a V2 result; the persisted `scan_class_scores` row carries all five labels (smut 0.9823, rssi 0.0142, rust 0.0018, healthy 0.0017, mosaic 0.0001) |
| Phone: non-sugarcane photo rejected | Same app, gallery | **PASS for the gate** — "This does not look like sugarcane", **Continue to analysis result** absent, `scan_records` unchanged (0). The input was a synthetic high-contrast image, not a photograph of a non-sugarcane plant, because no such photograph exists in the repository and the device camera is unusable |
| Phone: airplane mode repeat | `adb shell cmd connectivity airplane-mode enable`, `adb reverse --remove tcp:8210` | **PASS** — the accepted photo still produced a result and the rejected photo still showed the retake message, with no new saved record |
| Phone: EXIF-rotated portrait | `qa/guard-v1/cane-like-exif-rotated.jpg` (Orientation=8), upscaled to 768×1024 with its original APP1 segment re-attached | **PASS** — accepted and reached V2; the oracle scores the same content 0.979 upright against 0.259 with orientation dropped, so the accept is only reachable with EXIF applied |
| Phone: per-scan latency and memory | `scan_records` timings and `dumpsys meminfo` after four scans | **PASS (recorded)** — `inference_ms` 113.0 / `total_ms` 395.1 for the EXIF run and `inference_ms` 150.6 / `total_ms` 758.2 for the real gallery photo; TOTAL PSS ≈ 1007 MB with the development client over Metro, which includes dev tooling |

## Required native / cross-system outcomes

Every outcome below needs a device or a live Mobile → API → Web → Mobile journey.

| Outcome | Status | Owner | Consequence |
| --- | --- | --- | --- |
| Guard-gated scan accept on hardware | **PASS** on `a9c22b5` (gallery path) | Release owner | Guard, V2 and save/report gating are proven on this phone for gallery photos |
| Guard rejection on hardware | **PASS** on `a9c22b5` (synthetic non-sugarcane image) | Release owner | A rejection blocks the result and the save; a real non-sugarcane photograph was not scored |
| Camera-originated capture | **NOT TESTED** — the rear viewfinder returned an all-black frame and the front viewfinder a near-black scene, so the captured frame failed the photo-quality gate | Release owner | The camera path is unproven on this phone; gallery capture is the substitute path used above |
| Offline repeat, EXIF orientation, latency and memory on device | **PASS** on `a9c22b5` (see the evidence table) | Release owner | Airplane-mode scans and EXIF handling are proven on this phone; preparation time for oversized photos and offline sync/recovery journeys were not measured |
| Offline cold start with a biometric-protected session, Android picker interruption recovery, camera and location permission denial, process-restart persistence of scan/report/visit drafts, upload → office review → status return, clear-data preview and permanent removal | **Not re-verified** for this candidate | Release owner | Each remains unproven on this candidate; earlier candidate-era results do not transfer, and repository or component tests do not replace the OS or live-service journey |

## Standing rules

- Use only synthetic, disposable fixtures. Never use shared or production data.
- A deferred outcome must name an owner and a consequence; an ownerless
  deferral is not acceptance.
- Re-stamp the candidate commit and this evidence table for every release
  candidate. Historical PASS counts from another revision are not evidence for
  this one.
- Native and cross-system acceptance must be separately authorized and must not
  be inferred from `npm test`.
