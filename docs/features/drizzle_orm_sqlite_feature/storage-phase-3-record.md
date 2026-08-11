# Storage Phase 3 Completed Scan Save Record

## Decisions

- Saving is explicit and optional; Analysis Result does not autosave.
- Generate one Expo Crypto UUID per mounted result and reuse it after recoverable
  failure.
- Stay on Analysis Result after success. Saved-record navigation is deferred to
  the Phase 4 detail route.
- Disable Save and New Scan while the coordinated write is in flight.
- Keep the active result visible after failure and expose a retry action.

## Deliverables

- Completed-session mapper and typed validation before file or database writes.
- Exact model label, confidence, complete class scores, version, timings,
  checklist context, severity, warnings, and nullable barangay persistence.
- Managed image copy followed by one transaction for the parent and child rows.
- Rollback on child failure and best-effort copied-image compensation on database
  failure.
- Honest `local_only` metadata with no backend or fake synchronization.
- Ready, saving, saved, failed, and retry Analysis Result states with local-only
  disclosure and duplicate-tap protection.
- Unit, Node SQLite repository integration, hook, and UI coverage.

## Verification Evidence

- `npx --no-install tsc --noEmit`: passed.
- `npm run lint`: passed.
- Phase-targeted Jest run: 5 suites and 44 tests passed.
- Repository integration tests apply both migrations to Node SQLite and verify
  exact values, empty optional children, duplicate IDs, and child-insert
  rollback.
- `just verify-targeted`: lint and TypeScript passed.
- `npm run test -- --runInBand`: 32 suites and 184 tests passed.
- `git diff --check`: passed.

Android airplane-mode save, real camera/gallery URI persistence, process restart,
and screen-state presentation remain required device-level checks. Jest and Node
SQLite do not establish those native behaviors.

## Rollback

Return to the Phase 2 application commit. No schema migration was added in this
phase. A copied file left by an interrupted or failed cleanup can be reported by
the Phase 2 orphan detector.
