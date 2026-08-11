# Phase 5 — Reports Integration

**Repository:** `niks0501/caneguard-mobile`  
**Branch:** `feat/drizzle-sqlite-scan-records`  
**Stack:** Drizzle ORM + Expo SQLite + Expo FileSystem + Expo Crypto  
**Primary platform:** Android  
**Execution mode:** One phase at a time; do not continue past an unmet exit criterion


## Objective

Replace hardcoded production report values with efficient SQL aggregates over actual saved records. The Reports screen must summarize local observations honestly and must not imply confirmed disease cases, MAO submission, or unsupported model classes.

## Preconditions

- Phase 4 has real records and deletion.
- List and details use truthful local status.
- Read `01-SHARED-CONTRACT.md`.
- Confirm the initial date scope shown by the UI: all-time or current month.
- Repository aggregate functions must still accept an optional date range.

## Deliverables

- Report repository
- SQL aggregate queries
- total saved scans
- total healthy predictions
- total possible disease predictions
- counts grouped by stored predicted label
- count of local-only records
- low-top-score count with prototype wording
- recent local records
- optional date-range query contract
- zero-record state
- removal of hardcoded totals and fake submission wording
- UI and repository tests

## Execution steps

### 5.1 Create a dedicated report repository

Implement `getReportSummary(query)` using SQL aggregation. Keep it separate from route components.

Use:

- `COUNT`;
- conditional aggregation;
- grouping by predicted label;
- indexed date filtering;
- limited recent-record query.

Do not load all records into JavaScript merely to count them.

### 5.2 Define summary semantics

Calculate:

- total saved scans;
- healthy top predictions;
- possible disease top predictions;
- count by predicted label;
- local-only records;
- low top-score records;
- recent records.

“Possible disease” means a non-healthy model top label. It remains decision support, not confirmation.

### 5.3 Preserve supported-label integrity

Display stored model labels, with current UI expectations limited to Healthy, Mosaic, and Rust for Model v0.

Do not fabricate Smut, Downy Mildew, or other counts. A manually reported observation must remain distinct from an AI prediction if such a feature is added later.

### 5.4 Add date-range support in the query layer

The first UI may show all-time or current-month summaries, but the repository accepts optional start/end dates. Store and compare UTC values consistently; format dates locally in UI.

### 5.5 Replace all hardcoded report values

Remove hardcoded:

- totals;
- disease counts;
- pending counts;
- recent submissions.

When no records exist, show zeros and a Start Scan action.

### 5.6 Use truthful terminology

Preferred terms:

- `saved observations`
- `possible disease results`
- `AI predictions`
- `records by predicted class`
- `recent records`
- `saved on this device`

Avoid `cases` when it suggests confirmed disease. Rename `Recent submissions` to `Recent records` until submission exists.

### 5.7 Handle sync status accurately

Count `local_only` records. Do not show a fake pending queue or Sync to MAO action as though it works.

A future queue may show local-only records accurately or remain unavailable. This phase must not add network behavior.

### 5.8 Add report states

Support:

- loading;
- populated;
- zero records;
- database error;
- partial image absence in recent records.

### 5.9 Test aggregate correctness

Use deterministic fixtures with mixed labels, dates, confidence values, and statuses. Verify every displayed number against expected SQL results.

## Required verification

- No hardcoded production total remains.
- Zero-record report shows zeros.
- Totals match saved and deleted records.
- Counts group by exact stored label.
- Unsupported classes are not fabricated.
- Date-range contract works.
- Low-score count uses the existing presentation threshold only and labels it as a prototype rule.
- Aggregates run in SQL.
- Recent section says records, not submissions.
- Local-only status is truthful.
- No network or fake queue is added.
- Report updates after save/delete without restart.

## Stop conditions

Stop when:

- the screen counts records in JavaScript after loading all rows;
- hardcoded values remain in a production path;
- report terminology implies confirmed cases;
- unsupported diseases appear;
- a pending/synced value is fabricated;
- backend or sync work begins;
- report data no longer matches repository fixtures;
- date handling mixes local stored strings with UTC inconsistently.

## Exit criteria

- SQL aggregate repository exists.
- Actual summary tiles and grouped counts work.
- Recent local records work.
- Empty state works.
- No hardcoded production report values remain.
- Values match seeded and manually created records.
- Terminology is truthful and decision-support appropriate.
- Reports refresh after save and delete.

## Suggested commit

```text
feat(reports): calculate summaries from saved records
test(reports): cover local aggregate reporting
```

## Detailed source requirements

### FR-REP-001 — Replace hardcoded statistics

The Reports screen shall calculate its values from the local database. Hardcoded totals, disease counts, pending counts, and recent submissions shall be removed.

### FR-REP-002 — Required summary metrics

The initial local report shall include:

- total saved scans
- total healthy predictions
- total possible disease predictions
- count grouped by predicted label
- count of local-only records
- count of records with low top scores, using the existing presentation threshold only if clearly labeled as a prototype rule
- most recent saved observations

### FR-REP-003 — Supported-label integrity

Disease summaries shall reflect labels that exist in saved model results. The UI shall not count Downy Mildew, Smut, or another disease unless a model version actually produced that label or the record explicitly distinguishes a manually reported observation from an AI prediction.

### FR-REP-004 — Date-range support

Aggregate repository functions shall accept an optional date range. The first UI may use all-time or current-month data, but the query layer must not permanently hardcode one period.

### FR-REP-005 — Empty-state behavior

When no records exist, the Reports screen shall show zero values and a clear call to perform a scan. It shall not display demonstration cases.

### FR-REP-006 — Aggregate efficiency

Reports shall use SQL aggregate queries such as `COUNT`, grouping, and indexed date filtering. The screen shall not load every record into JavaScript merely to count them.

### FR-REP-007 — Recent records

The recent-submissions section shall be renamed to `Recent records` or another truthful local term until real submission is implemented.

---

### FR-SYNC-005 — No fake queue

A Sync Queue interface shall not display fabricated pending items. Until a backend and sync contract exist, the queue may show locally stored records as local-only, or remain unavailable with an accurate explanation.

### FR-SYNC-006 — Backend independence

Local repositories shall not depend on Laravel, Firebase, Supabase, or another backend SDK. Future synchronization shall consume repository data through a separate application service.

## 12.3 Reports screen

The Reports screen shall distinguish:

- AI predictions
- healthy predictions
- locally saved records
- future synchronization states

It shall not use the term `cases` as though each model prediction is a medically or agriculturally confirmed disease case. Preferred wording includes:

- `saved observations`
- `possible disease results`
- `AI predictions`
- `records by predicted class`

## Phase 5 — Reports integration

Deliverables:

- SQL aggregate repository
- actual summary tiles
- counts by stored model label
- recent local records
- truthful local-only wording

Exit criteria:

- no hardcoded production report totals remain
- report values match seeded and manually created records
