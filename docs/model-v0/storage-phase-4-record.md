# Storage Phase 4 Records Integration Record

## Decisions

- Use offset-capable repository pagination with an initial page size of 25.
- Refresh list and detail queries when their routes gain focus.
- Submit text search deliberately; do not query on every keystroke.
- Expose only Healthy, Mosaic, and Rust filters for Model v0.
- Keep barangay filter support in the repository but omit the UI control until
  reliable barangay values are collected.
- Hard-delete the database record before attempting managed-image cleanup.

## Deliverables

- Production Records screen backed by lightweight SQLite projections with
  deterministic newest-first ordering.
- Repository support for limit/offset, label, date range, sync status, barangay,
  and case-insensitive search predicates.
- Loading, true-empty, filtered-empty, error, populated, pagination, and
  missing-image list states.
- UUID-based saved-record details route with full metadata, local status, and
  decision-support disclosure.
- Explicit delete confirmation, foreign-key cascade, post-DB image cleanup, and
  partial-cleanup reporting.
- Open Saved Record navigation from the Analysis Result saved state.
- Repository integration, service-ordering, list UI, detail UI, deletion, and
  fallback tests.

## Verification Evidence

- Phase-targeted repository/service/UI Jest run: 5 suites and 42 tests passed.
- `just verify-targeted`: lint and TypeScript passed.
- `npm run test -- --runInBand`: 35 suites and 198 tests passed.
- `git diff --check`: passed.
- Source audit confirms `MOCK_RECORDS`, unsupported Model v0 filters, and false
  synchronization/review labels are absent from the production Records path.

Android restart persistence, route-focus behavior, image rendering/fallback,
scrolling at device dimensions, and native confirmation presentation remain
device-level checks. Jest and Node SQLite do not establish those native
behaviors.

## Manual Test

1. Save camera and gallery results in airplane mode.
2. Open Records and verify newest-first order, correct labels, local status, and
   image thumbnails.
3. Submit searches, switch each Model v0 filter, and load more than 25 records.
4. Reset the active scan, then open a saved detail record by UUID.
5. Remove a managed image in a development build and verify details metadata
   remains usable with an image-unavailable fallback.
6. Cancel deletion once, then confirm it and verify Records and Reports refresh.
7. Force image deletion failure and verify the record remains deleted while
   cleanup failure is reported.
8. Force-stop and reopen the Android app and verify records persist.

## Rollback

Return to the Phase 3 application commit. No schema migration was added. Existing
records and managed images remain compatible and must not be deleted during
rollback.
