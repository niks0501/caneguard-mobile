# Project Verification Commands

## Fast checks

- lint: `npm run lint`
- typecheck/static analysis: `npm run typecheck`
- focused test: `npm test -- --runInBand <test-file>`
- agent-facing fast gate: `npm run verify:fast`

`verify:fast` composes lint, TypeScript, and the existing Jest/jest-expo suite. Coverage is not a gate or a quality signal; `npm run test:coverage` is an on-demand report. The gate does not start Metro, an emulator, Agent Device, or any E2E flow.

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
