# Storage Phase 5 Reports Integration Record

## Decisions

- Show an explicitly labeled all-time local summary in the first Reports UI.
- Keep optional UTC date-range support in the repository contract.
- Use the existing `0.5` low top-score presentation threshold and label it as an
  uncalibrated prototype rule.
- Show exact stored top labels, with current Model v0 fixtures limited to
  Healthy, Mosaic, and Rust.
- Remove the fake pending queue and Sync to MAO action entirely.

## Deliverables

- Dedicated report repository with conditional SQL aggregation, grouped label
  counts, indexed date predicates, and limited recent-record projection.
- Actual saved-observation, healthy-prediction, possible-result, local-only, and
  low top-score metrics.
- Route-focus report refresh after save and delete.
- Loading, database-error, zero-record, populated, grouped-count, and recent
  local-record states.
- Honest offline and non-diagnostic wording without fabricated classes or
  submission state.
- Deterministic Node SQLite aggregate tests and Reports UI tests.

## Verification Evidence

- Phase-targeted repository and UI Jest run: 2 suites and 12 tests passed.
- `just verify-targeted`: lint and TypeScript passed.
- `npm run test -- --runInBand`: 36 suites and 204 tests passed.
- `git diff --check`: passed.
- Source audit found no hardcoded totals, fake sync action/queue text, recent
  submission label, or unsupported production class labels in the Reports path.

Android route-focus refresh, recent thumbnail fallback, scrolling, and visual
presentation remain device-level checks. Node SQLite and Jest do not establish
native lifecycle or rendering behavior.

## Manual Test

1. Open Reports with no records and verify all four metrics are zero and Start
   Scan is available.
2. Save known Healthy, Mosaic, and Rust results with scores above and below 50%.
3. Return to Reports and compare every total and grouped count with Records.
4. Delete a saved record, return to Reports, and verify totals and recent records
   update without restarting.
5. Force-stop and reopen the Android app and verify the same local summary.
6. Confirm there is no MAO sync action, submission claim, unsupported class, or
   confirmed-disease wording.

## Rollback

Return to the Phase 4 application commit. No schema migration or network state
was added; saved records and images remain compatible.
