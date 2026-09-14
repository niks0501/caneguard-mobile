# CaneGuard client-alignment acceptance

**Scope:** T06 (#103), under the canonical client-alignment specification #97. This is a verification record, not a replacement for the existing P0 lifecycle contracts.

## Evidence status

`PASS` means the named automated seam ran successfully. `DEFERRED` means the required interactive surface was attempted but the environment did not provide a usable harness. Automated evidence does not promote an unexecuted browser, Android, or cross-system journey to `PASS`.

| Required surface | Outcome | Evidence / provenance |
| --- | --- | --- |
| Mobile automated seams | **PASS** | Mobile `86b655791167d038499db907cf8e405971b7ded6`; focused 11-suite / 160-test run and `npm run verify:fast` (108 suites / 819 tests), plus `npm run db:check`. |
| Web automated seams | **PASS** | Web/API `76b9160d8828c430d1cbf645a75058efd3ab54cd`; `npm run verify:fast` (34 Vitest files / 167 tests, build), `npm run check:api` (224 tests / 2,401 assertions, Pint), and focused review/contract tests. |
| Browser | **DEFERRED** | Vite mock app served at `http://127.0.0.1:5173/`, but `npx -y chrome-devtools-axi open http://127.0.0.1:5173/` failed: no Google Chrome executable was available at the configured stable paths. No browser UI PASS is claimed. Follow Web QA-gap [#104](https://github.com/niks0501/caneguard-web/issues/104). |
| Android | **DEFERRED** | `adb devices -l` timed out after 30 seconds; a bounded `timeout 8s adb devices -l` retry also timed out. No usable emulator/device identity was available, so Agent Device was not launched. No Android PASS is claimed. Follow Mobile QA-gap [#106](https://github.com/niks0501/caneguard-mobile/issues/106). |
| Cross-system Mobile → API/Web → Mobile | **DEFERRED** | Android transport/runtime was unavailable, so the full upload → Web review → Mobile status return was not exercised. API/contract tests are supporting evidence only. Follow [Mobile #106](https://github.com/niks0501/caneguard-mobile/issues/106) and [Web #104](https://github.com/niks0501/caneguard-web/issues/104). |

**Run timestamp:** 2026-09-14 16:46 UTC. Tested heads were target `origin/main` at the revisions above. The Web revision was exercised in disposable checkout `/tmp/caneguard-web-cg-ca-103-t06-20260914`; no Web source changes were made.

## Prerequisites for a repeat run

- Mobile at the tested candidate (or a later candidate containing the same P0 contracts) with a compatible Android development build, a ready shared emulator/device, and `adb devices -l` reporting a usable device.
- Web/API at the tested candidate, with the local API and Web app pointed at the same disposable environment; use synthetic data and dedicated field-reporter/reviewer accounts only.
- For interactive Web review, a supported Chrome executable and the Web/API dependencies configured.
- For a real cross-system run, the same API must be reachable by Mobile and Web, and the status-refresh path must be available.
- Do not use historical Downy data as a new classification. Keep a historical Downy record only as a read-only compatibility fixture.

## Consultation-critical journey

Run these steps in order. The expected result is the acceptance behavior; the evidence column records what this run actually proved.

1. **Model V1 scan.** Capture/select a synthetic sugarcane image, run the on-device scan, and inspect the result. Expected: Model V1 exposes exactly `Healthy`, `Mosaic`, `Rust`, and `Smut`; RSSI is absent from model labels, scores, and metadata. **PASS —** `modelContract.test.ts`, `v1Qa.test.ts`, and the full Mobile suite.
2. **Guided observation.** Complete the short symptom/checklist observation and mismatch/reporter-observation path. Expected: checklist responses and reporter observation remain distinct from the model result. **PASS —** Mobile field-report/checklist tests and Web review mapper/UI tests.
3. **Possible Condition.** Continue to the report draft. Expected: the AI result is presented as **Possible Condition** and remains decision support, not a diagnosis. **PASS —** Mobile field-report tests and Web `CaseReviewPage.test.tsx`.
4. **Field Report.** Enter the required farmer/farm reference, place, area, affected portion, and location; save the draft and finalize. Expected: a separate Field Report owns authoring/submission while the referenced scan remains immutable source evidence. **PASS —** Mobile field-report repository/validation tests and Web API upload consumers.
5. **RSSI when applicable.** Select or enter RSSI as the field-observed/suspected concern. Expected: RSSI is retained as reporter observation, explicitly marked not AI-detected, and never becomes a Model V1 prediction. **PASS —** Mobile focused report/multipart tests and Web focused RSSI/review tests.
6. **Offline and pending state.** With connectivity unavailable or the upload unavailable, retain the finalized report locally. Expected: the same report remains pending/failed and retryable; no report or evidence is discarded. **PASS —** Mobile `syncFieldReport`, pending-queue, repository, and sync-provider tests. **Interactive offline transition: DEFERRED** with Android gap [#106](https://github.com/niks0501/caneguard-mobile/issues/106).
7. **Synchronization.** Restore connectivity and run the established sync path. Expected: the stable Field Report client identity uploads once, receives a remote identity, preserves the four-class AI evidence and RSSI observation separately, and becomes synced. **PASS —** Mobile multipart/sync tests plus Web V2 upload artifact and Laravel consumer contracts. **Real device upload: DEFERRED** with [#106](https://github.com/niks0501/caneguard-mobile/issues/106).
8. **SRA Web review.** Open the synchronized Submitted Report in the SRA Don Pedro Mill District Office review workspace. Expected: the report, Field Inspector identity, Possible Condition, guided observations, and reporter concern are visible with client-aligned terminology. **PASS —** Web focused review tests and API tests. **Browser journey: DEFERRED** with [#104](https://github.com/niks0501/caneguard-web/issues/104).
9. **Staff-Classified Condition.** Review the evidence and choose from the active set: Healthy / No Selected Concern, Sugarcane Smut, Sugarcane Mosaic Disease, Sugarcane Rust, RSSI, Mixed or Multiple Visible Concerns, or Unable to Classify. Expected: historical Downy records remain readable, but Downy is not offered as a new review choice; the staff result is separate from reporter observation and Possible Condition. **PASS —** Web metadata, schema, review UI, and Laravel review tests. **Browser journey: DEFERRED** with [#104](https://github.com/niks0501/caneguard-web/issues/104).
10. **Action/intervention.** Select an office action and record treatment, pesticide, medicine, technical assistance, or another action in Review notes when applicable. Expected: action and notes are understandable, persisted, and distinct from field evidence. **PASS —** Web review component and API tests. **Browser journey: DEFERRED** with [#104](https://github.com/niks0501/caneguard-web/issues/104).
11. **Optional Field Validation.** If follow-up is needed, assign a Field Inspector, complete the existing validation path, and return to review. Expected: field observation, field finding, and Action Taken remain separate read-only evidence in review; validation does not rewrite AI evidence or automatically close the case. **PASS —** Mobile assignment/completion tests and Web field-validation/API tests. **Browser journey: DEFERRED** with [#104](https://github.com/niks0501/caneguard-web/issues/104); Android is **NOT APPLICABLE** to this Web-owned review interaction.
12. **Completion and office disposition.** Record verification outcome, case state, and office action; close only through the explicit office decision. Expected: status dimensions remain separate and the original image, model version, class scores, Possible Condition, and reporter observation remain immutable. **PASS —** Web lifecycle/review tests and lifecycle contract consumers. **Browser journey: DEFERRED** with [#104](https://github.com/niks0501/caneguard-web/issues/104).
13. **Status visible again on Mobile.** Refresh the originating Mobile report through its existing authority-status path. Expected: the same local report displays the returned office status/review metadata without changing unrelated local records. **PASS —** Mobile status API, refresh hook, and status UI tests. **Real cross-system return: DEFERRED** with [#106](https://github.com/niks0501/caneguard-mobile/issues/106) and [#104](https://github.com/niks0501/caneguard-web/issues/104).

## Automated commands and results

### Mobile

- `npm run verify:fast` — **PASS**: lint, typecheck, 108 Jest suites / 819 tests, coverage run.
- `npm run db:check` — **PASS**: Drizzle schema check.
- Focused seam run with Model V1, field report, RSSI transport, sync, status, and field-validation tests — **PASS**: 11 suites / 160 tests.

### Web/API (disposable checkout)

- `npm run verify:fast` — **PASS**: lint, typecheck, 34 Vitest files / 167 tests, source-safety/security checks, production build.
- `npm run check:api` — **PASS**: 224 Laravel tests / 2,401 assertions and Pint.
- Contract artifacts/config and consumer commands — **PASS**: 22 contract helper tests; V1/V2 upload, assignment, completion, notification, and lifecycle artifacts; pinned-revision config; Laravel upload, assignment, completion, notification, and lifecycle consumers.
- Focused Web review/mapping/schema tests — **PASS**: 3 files / 41 tests; focused Laravel review/upload/lifecycle/field-validation/status filter — **PASS**: 100 tests / 1,344 assertions.

These checks prove repository seams and contracts only. They do not replace the deferred Browser, Android, or Cross-system outcomes above.

## Follow-up evidence

When Chrome and a usable Android runtime are available, append the browser, Android, and cross-system results to this record with the exact Web/Mobile revisions, device/build identity, timestamps, and artifacts. Do not change any `DEFERRED` result to `PASS` without executing that required surface.
