# Model V1 automation coverage

This is the focused issue #87 coverage record for the mobile V1 paths that
Agent Device can control and observe. It does not replace final human or
cross-system acceptance, and a checked-in `.ad` flow is not execution evidence
until its replay result, runtime identity, and artifacts are recorded.

## Non-destructive emulator preflight

Run from the Mobile repository root, with the Windows-hosted emulator already
started by the developer. Do not launch, wipe, recreate, or reconfigure an AVD;
do not run `adb kill-server`, start another ADB server, or clear app data as a
flow workaround.

```bash
adb devices -l                         # require one ready emulator
adb reverse tcp:8081 tcp:8081          # Metro
adb reverse tcp:8000 tcp:8000          # local API
adb reverse --list                     # confirm both mappings
curl --fail --silent http://127.0.0.1:8081/status   # matching Metro health
curl --fail --silent http://127.0.0.1:8000/api/health # local API health
npm run qa:preflight                    # verify QA configuration when API checks are needed
scripts/ad-flow-env.sh preflight-v1    # permissions + hash-checked four-fixture staging
```

`preflight-v1` stages `healthy`, `mosaic`, `rust`, and `smut` under controlled
names. It prefers the read-only handoff QA directory and falls back to the
identical tracked copies; it verifies each SHA-256 before pushing. For the
native gallery flow, run `scripts/ad-flow-env.sh stage-v1-fixture smut` so only
one controlled candidate is present. This is the only media cleanup performed
by the helper; it never removes unrelated user media or application state.

Before replay, confirm that Metro serves the matching worktree, the local API
health check is available when the flow needs it, and a disposable authenticated
field-reporter session is already available. Supply credentials only through
the ignored session environment (`AD_VAR_AUTH_EMAIL` and
`AD_VAR_AUTH_PASSWORD`); never put them in a flow or evidence record.

## Coverage matrix

| Scenario | Classification | Evidence / location | Constraint or follow-up |
|---|---|---|---|
| Model V1 runtime identity (version, four-label order, input shape/type) | Automated | `.agent-device/flows/v1/00-model-runtime-and-qa.ad`; `src/app/model-debug.tsx` stable `model-debug.*` selectors; `modelContract.test.ts` | Development-only route requires a matching authenticated Metro build. No release-build claim. |
| Four fixed QA fixture top-1 outputs, including Smut | Automated | Same debug flow; `qa/expected-v1-outputs.json`; `src/app/__tests__/model-debug.test.tsx` | Bundled fixtures and the debug route avoid native picker variability. Device replay still needs a fresh usable runtime. |
| Select one fixed image from Android gallery and enter the app preview | Hybrid | `.agent-device/flows/v1/01-smut-gallery-checklist-local-report.ad`; `scripts/ad-flow-env.sh stage-v1-fixture` | ADB staging is deterministic, but Android Photo Picker is system-owned. The flow uses its semantic accessible label only when one controlled candidate is staged. Unsupported picker/runtime variants are deferred to https://github.com/niks0501/caneguard-mobile/issues/91. |
| Smut result rendering, four-class evidence, and decision-support wording | Automated | Smut flow; `analysis-result.test.tsx`; `recordValidation.test.ts` | Uses the frozen V1 model contract; no model behavior or threshold changes are made here. |
| Smut observation/checklist consistency | Automated | Smut flow (`scan.symptom-smut`, `scan.checklist-consistency`); `symptom-checklist.test.tsx`; `checklistConsistency.test.ts` | Observation remains separate from model evidence. |
| Confidence presentation and frozen low-confidence caution branch | Automated | Smut flow asserts the confidence surface; `analysis-result.test.tsx` and `confidenceCaution.test.ts` assert the threshold branch | All four fixed QA outputs are high-confidence, so no fixed fixture can honestly prove the caution branch on device. The branch is covered by deterministic component/domain tests, not simulated device state. |
| Save a completed scan locally and reopen its record | Automated | Smut flow (`scan.record-saved`, `records.details-screen`); `saveCompletedScan.test.ts`; record repository tests | Requires authenticated local storage and a matching development build. No restart-survival claim is implied. |
| Create a local Field Report draft from the saved scan | Automated | Smut flow (`field-report.screen`, `field-report.minimum-requirements`); `analysis-result.test.tsx`; `field-report.test.tsx` | Draft creation is local; final submission is a separate cross-system scenario. |
| Camera capture, native camera permission, photo-picker variants, and OS permission dialogs | Human-only (deferred) | Existing manual guides under `.agent-device/manual-tests/`; final device acceptance ticket https://github.com/niks0501/caneguard-mobile/issues/91 | Native/system-owned UI is not forced into Agent Device replay. |
| Offline cold restart, biometric/device credential, and real connectivity transition | Human-only (deferred) | Existing auth/P1/T10 manual guides and `device-network.mjs` boundary helper | Credential enrollment and brittle radio/reset handling are not fabricated as automated PASS evidence; follow https://github.com/niks0501/caneguard-mobile/issues/91. |
| V2 report upload, Web authority review, assignment, and Mobile ↔ Web synchronization | Deferred | Existing ordered drivers under `.agent-device/checks/` remain reusable scaffolds; cross-system follow-up is https://github.com/niks0501/caneguard-mobile/issues/95 | No Web action or cross-repository result is counted in this Mobile change without a prepared environment and independently observed evidence on both surfaces. |

## Execution status for this change

The flow definitions and lower-level tests are the coverage deliverable. This
worktree did not record a device PASS: the required `adb devices -l` preflight
was unavailable (the bounded command timed out), which is an environment
blocker rather than an app failure. Do not convert that observation into a
replay PASS; obtain fresh runtime/build and service evidence in
https://github.com/niks0501/caneguard-mobile/issues/91. Cross-system execution
remains intentionally deferred to https://github.com/niks0501/caneguard-mobile/issues/95.
