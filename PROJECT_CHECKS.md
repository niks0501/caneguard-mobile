# Project Verification Commands

## Fast checks

- lint: `npm run lint`
- typecheck/static analysis: `npm run typecheck`
- focused test: `npm test -- --runInBand <test-file>`
- agent-facing fast gate: `npm run verify:fast`

`verify:fast` composes lint, TypeScript, and the existing Jest/jest-expo suite. Coverage is not a gate or a quality signal; `npm run test:coverage` is an on-demand report. The gate does not start Metro, an emulator, Agent Device, or any E2E flow.

## Adaptive validation tiers

Classify each task by intent and changed paths. Record exactly one tier line in the report and status, such as `Tier: T1-fast`. Changes touching `src/features/detection/**`, `src/database/**`, `drizzle/**`, `src/features/sync/**`, or `src/features/auth/**` are T3.

- **T0 — Docs-Only:** For Markdown and `docs/**` changes only, or comments/docstrings with no executable changes. Run `git diff --check` and review the document's location, links, and ownership. There is no configured Markdown linter; do not run the app test suite or a browser.
- **T1 — Fast Lane:** For copy, non-critical configuration, styling, or dead code, run `npm run lint && npm run typecheck && npm test -- --runInBand <test-file>`. No browser or server startup.
- **T2 — Feature:** Run `npm run verify:fast`. Add exactly one targeted browser/live check only when browser-compatible user-visible UI or a live HTTP contract changed; skip it for non-visual and native-only changes.
- **T3 — High-Stakes:** For detection/inference, database, sync, or authentication changes, run `npm run verify:fast && npm run db:check` and the relevant existing critical-path tests (for example, `npm test -- --runInBand <test-file>`). Obtain an independent adversarial review. Only human-owned or Secondmate-blessed tests are proof; worker-written tests remain supplemental until blessed. Follow the [frozen T3 golden suite matrix](#frozen-t3-golden-suite-matrix).

### Frozen T3 golden suite matrix

The suites and oracle below are frozen. A T3 claim is proved only by human-owned or explicitly Secondmate-blessed tests; worker-written tests are supplemental until blessed. Do not modify, delete, weaken, rename, or replace a frozen suite or its fixtures without explicit Captain sign-off.

| T3 area | Frozen suite and golden evidence |
| --- | --- |
| Detection / inference | `src/features/detection/model/__tests__/v1Qa.test.ts` (runs `scripts/tests/test_tflite_model_shapes.py`); oracle `qa/expected-v1-outputs.json`, documented in [`docs/model-v1/model-v1-integration-handoff.md` — Frozen QA expected outputs](docs/model-v1/model-v1-integration-handoff.md#frozen-qa-expected-outputs). |
| Database / migrations | `src/database/__tests__/migrations.test.ts` |
| Sync / local outbox | `src/features/reports/data/__tests__/fieldReportRepository.test.ts`, `src/features/sync/services/__tests__/syncFieldReport.test.ts`, and `src/features/sync/services/__tests__/syncPendingFieldReports.test.ts` |

Device, emulator, ADB, Agent Device, and staging checks are not routine gates. Run them only when the task brief explicitly requests them. Browser checks cannot prove native behavior.

## Broader checks

- test suite: `npm test`
- coverage: `npm run test:coverage`
- database schema: `npm run db:check`
- E2E: `npm run e2e` (separate escalated native/device gate)

## Manual verification

Native-boundary behavior such as biometrics, image picker, permissions, secure storage, notifications, TFLite, and device persistence uses the existing mock/abstraction tests for ordinary verification. Use a small representative native/device check only when the E2E decision gate justifies it.

## Rules

- Run targeted tests before `npm run verify:fast`.
- Do not run E2E as part of `verify:fast`.
- Mirror tests are not behavior evidence: tests that copy or reimplement production source or structure do not prove production behavior.
- Run only commands that actually exist in `package.json` or project scripts.
- Prefer deterministic emulator/ADB mechanisms over repeated attempts to fight native dialogs.
