# Release evidence record

**Purpose:** record what has actually been verified for a candidate, what has
not, and who owns each remaining gap. It must never infer native behaviour from
a browser, mock, or fixture.

## Current candidate

| Field | Value |
| --- | --- |
| Repository | `caneguard-mobile` |
| Branch | `fm/cg-mobile-ux-build-20261023` |
| Candidate commit | `c21f701fa4922b2dc75b79cac0c51eef7a858560` — the revision this evidence table was produced on. Review fixes and any other commit after it are separate revisions: re-run the commands below and re-stamp this file before calling any of them a candidate |
| Audit source | `data/cg-mobile-ux-audit-20261023/report.md` (16 findings) |

## Decision: native device verification skipped

On the captain's word, the phone is not attached, so **native device
verification is explicitly skipped for this candidate — not parked**.
This is a recorded release-evidence gap, not a pass. Nothing in this repository
may describe a browser check, a mocked module, or a TFLite fixture as native
inference, biometric, permission, or persistence proof.
The Expo Web checks above therefore cover layout, wording, and navigation only;
the web runtime uses a different SQLite/session implementation from Android.

The alternative evidence below was requested by the captain for this candidate.

## Alternative evidence collected

| Evidence | How to reproduce | Status |
| --- | --- | --- |
| Full Jest / React Native Testing Library suite | `npm test -- --runInBand` | **PASS** on `c21f701` — 154 suites, 1,335 tests |
| Type check | `npm run typecheck` (`tsc --noEmit`) | **PASS** on `c21f701`, no diagnostics |
| Lint | `npm run lint` (Expo lint) | **PASS** on `c21f701`, no errors or warnings |
| Database migration check | `npm run db:check` | **PASS** on `c21f701`, additive `0020` migration only |
| Expo Web rendering checks with screenshots for user-visible flows | `npx expo start --web` behind a temporary COOP/COEP proxy; screenshots in the task data directory | **PASS for the public flows**: login (including the password-only restart limit), register, forgot-password, field-guide index, and the Healthy/Mosaic/Rust/Smut entries. **Not covered in a browser**: authenticated screens. The web dev server's synchronous SQLite bridge (`expo-sqlite` web worker) timed out in this environment, and no live API session was available, so scan/report/visit/settings screens were exercised by RNTL tests only. SPA output mode and verbose DB logging were temporary local overrides and were reverted before commit. |
| Host-level TFLite tensor-shape fixture | `npm test -- --runInBand src/features/detection/model/__tests__/modelAsset.contract.test.ts` | **PASS** — parses the bundled FlatBuffer on the host and asserts one float32 input `[1,224,224,3]` and one float32 output `[1,4]`, then feeds those names/shapes through `validateModelContract` |
| Static contract assertions | `npm test -- --runInBand src/features/detection/model/__tests__/validateModelContract.test.ts src/features/sync/mappers/__tests__/reportMultipartMapper.contract.test.ts` | **PASS** |

## Required native / cross-system outcomes

Every outcome below needs a device or a live Mobile → API → Web → Mobile
journey. None of them is evidenced for this candidate.

| Outcome | Status | Owner | Consequence |
| --- | --- | --- | --- |
| Offline cold start with a biometric-protected session | Explicitly skipped (captain's word) | Release owner | Offline restart remains unproven on the release candidate; the readiness check only reflects configured state |
| Android picker interruption and pending-result recovery | Explicitly skipped | Release owner | Recovery is best-effort and remains unproven on hardware |
| Native inference on the bundled Model V1 asset | Explicitly skipped | Release owner | Host shape fixtures and static contract checks do not prove runtime inference |
| Camera and location permission denial on device | Explicitly skipped | Release owner | UI copy and mocked branches are tested; OS behaviour is unproven |
| Process-restart persistence of scan, report and visit drafts | Explicitly skipped | Release owner | Checkpoint persistence is covered by repository/component tests, not OS termination |
| Upload → office review → status return | Explicitly skipped | Release owner | The round trip against a live API/Web pair is unproven for this candidate |
| Clear-data preview and permanent removal on a real device | Explicitly skipped | Release owner | Count preview, re-check and refusal paths are covered by database tests only |

## Standing rules

- Use only synthetic, disposable fixtures. Never use shared or production data.
- A deferred outcome must name an owner and a consequence; an ownerless
  deferral is not acceptance.
- Re-stamp the candidate commit and this evidence table for every release
  candidate. Historical PASS counts from another revision are not evidence for
  this one.
- Native and cross-system acceptance must be separately authorized and must not
  be inferred from `npm test`.
