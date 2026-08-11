# Local Storage Requirement Traceability

Evidence baseline: reliability commit `c58f215`, built on Phase 1-5 commits
`aebc6be`, `70bc1a9`, `52a3405`, `32c479d`, and `d03cda8`, with compatible
transitive dependency refresh `6ab3061`.
Completion-audit pagination hardening is commit `ce389da`.

Status meanings:

- **VERIFIED**: implemented and exercised by the cited automated or source check.
- **IMPLEMENTED**: code exists, but required native/manual evidence is pending.
- **DEFERRED**: explicitly outside the approved local-storage scope.
- **BLOCKED**: required evidence cannot be produced without a physical device or
  external build/install environment.

## Requirement Matrix

| Requirements | Status | Evidence |
|---|---|---|
| FR-DB-001 to FR-DB-007 | VERIFIED | Stable `caneguard.db`, provider gating, FK verification, migrations, retry/error tests |
| FR-MIG-001 to FR-MIG-008 | VERIFIED | Generated SQL/snapshots, empty and Phase 0 upgrade tests, bundle/journal alignment, `db:check` |
| FR-IMG-001 to FR-IMG-009 | VERIFIED | Managed-only file service tests, exact-copy contract, missing file, cleanup, orphan detection |
| FR-SAVE-001 to FR-SAVE-010 | VERIFIED | Validation, coordinated save, transaction rollback, compensation, stable UUID, UI state tests |
| FR-REC-001 to FR-REC-011 | VERIFIED | SQL list/filter/search/date/sync/barangay tests, fixed 25-row offset pages beyond the 100-row query cap, focus hooks, UUID details, UI states |
| FR-REP-001 to FR-REP-007 | VERIFIED | Conditional/grouped SQL aggregate tests, date range, empty/populated report UI |
| FR-SYNC-001 to FR-SYNC-007 | VERIFIED | UUID identity, local-only/remote-null/retry metadata, no network/backend/fake queue source audit |
| FR-DEL-001 to FR-DEL-005 | VERIFIED | Confirmation UI, DB-first service order, FK cascade, cleanup-failure tests, focus refresh |
| FR-RES-002 to FR-RES-007 | VERIFIED | Invalid-input isolation, atomic children, rollback, migration failure UI, FK constraints |
| SEC-001 to SEC-007 | VERIFIED | Schema/source audits, parameterized Drizzle queries, code-only logs, null barangay, local disclosure |
| Accessibility source requirements | VERIFIED | Meaningful labels, live regions, disabled state, missing-image alternatives, UI tests |
| FR-RES-001 restart persistence | IMPLEMENTED | Documents-directory and SQLite design; physical restart test pending |
| Native Expo SQLite/Drizzle migration runtime | BLOCKED | Android device/build unavailable; Metro export is not runtime proof |
| Real camera/gallery managed URI persistence | BLOCKED | Android device/build unavailable |
| Airplane-mode end-to-end workflow | BLOCKED | Android device/build unavailable |
| App-update migration without clearing data | BLOCKED | Installed prior/current Android builds unavailable |
| Android 5,000-record performance targets | BLOCKED | Reproducible Node fixture exists; device measurements pending |
| Physical TalkBack and visual review | BLOCKED | Android device/build unavailable |
| Authentication, backend API, upload, real sync | DEFERRED | Explicit non-goals for this branch |
| GPS/automatic location collection | DEFERRED | Explicitly excluded; barangay persists null without confirmed input |
| Thumbnails, WAL, soft delete, recovery bin | DEFERRED | Approved Phase 1/2 scope decisions |

## Acceptance Checklist

| Acceptance criterion | Status |
|---|---|
| Drizzle and Expo SQLite bundle for Android | VERIFIED by Metro export; native runtime BLOCKED |
| Migrations bundle and apply in automated SQLite tests | VERIFIED |
| Existing model contract and smoke suite remain passing | VERIFIED |
| Real offline save and restart on Android | BLOCKED |
| Managed image and structured metadata | VERIFIED in service/repository tests; native URI test BLOCKED |
| Exact model values and optional context preserved | VERIFIED |
| Duplicate taps and child rollback | VERIFIED |
| Records and Reports use real database paths | VERIFIED |
| Newest-first, search, supported filters, pagination | VERIFIED |
| UUID details independent of active scan | VERIFIED |
| Missing image fallback | VERIFIED |
| DB-first deletion, cascades, image cleanup | VERIFIED |
| SQL report aggregates and truthful wording | VERIFIED |
| No password/token/secret persisted | VERIFIED by schema/source/secret scans |
| Previous migration data preservation | VERIFIED for Phase 0 to latest; installed app update BLOCKED |
| Lint, TypeScript, Jest, Expo packages, Doctor, Metro export | VERIFIED |
| Physical-device acceptance record complete | BLOCKED |

## Release Conclusion

Implementation and host automation are complete. The feature must not be called
release-ready until the Android acceptance record is completed and dependency
advisories receive project-owner disposition.
