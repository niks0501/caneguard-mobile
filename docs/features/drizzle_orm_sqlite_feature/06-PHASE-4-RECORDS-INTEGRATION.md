# Phase 4 — Records Integration

**Repository:** `niks0501/caneguard-mobile`  
**Branch:** `feat/drizzle-sqlite-scan-records`  
**Stack:** Drizzle ORM + Expo SQLite + Expo FileSystem + Expo Crypto  
**Primary platform:** Android  
**Execution mode:** One phase at a time; do not continue past an unmet exit criterion


## Objective

Replace the production Records mock data with real local records and provide a complete record-management experience: newest-first list, pagination, search, filters, database-backed details, missing-image fallback, and confirmed deletion with image cleanup.

The interface must remain polished and consistent with CaneGuard's current design system without introducing a large state-management framework or unnecessary abstraction.

## Preconditions

- Phase 3 can save a real record.
- Record UUID can be returned after save.
- Image existence and deletion services work.
- Read `01-SHARED-CONTRACT.md`.
- Decide initial page size: 25 or 50.
- Decide refresh strategy: live query, route focus, or both.
- Keep barangay filters inactive or conditional until reliable values exist.
- Use hard delete for this branch unless separately approved.

## Deliverables

- Database-backed record list
- Lightweight list projection
- Newest-first ordering
- Pagination
- Supported-label filters
- Date and sync-status query support
- Controlled barangay filtering support
- Debounced or deliberate search
- loading, empty, no-results, error, and missing-image states
- record details route by UUID
- full database-backed details
- delete confirmation
- child cascade deletion
- managed-image cleanup
- reactive or focus refresh
- tests for list, details, deletion, and UI states

## Execution steps

### 4.1 Replace production mock data

Remove `MOCK_RECORDS` and any production path that treats demonstration records as stored data.

Tests may use fixtures, but production screens must query the repository.

### 4.2 Implement list queries

Provide a paginated `listScanRecords(query)` that:

- orders by `created_at DESC`;
- returns only list-card fields;
- accepts page size and cursor/offset;
- supports predicted label;
- supports optional date range;
- supports sync status;
- supports barangay only when meaningful data exists;
- supports controlled search.

Do not load all records and filter them entirely in JavaScript.

### 4.3 Align filters with actual model data

Current Model v0 filters must be based on Healthy, Mosaic, and Rust or labels actually present in stored results.

Do not present Smut or Downy Mildew as current Model v0 prediction filters.

A future model-version-aware label system may be added later through a separate migration. Do not overbuild it now.

### 4.4 Implement search deliberately

Search appropriate text such as barangay and display label. Use case-insensitive matching.

Debounce the query or require a deliberate search submission. Avoid uncontrolled database queries for every keystroke.

### 4.5 Build complete list states

Support:

- initial loading;
- populated list;
- no records;
- no results for current filter;
- database error;
- thumbnail missing.

The empty database state should lead to Start Scan. The filtered empty state should offer clearing filters.

### 4.6 Build truthful record cards

Display:

- thumbnail or placeholder;
- possible result or healthy label;
- confidence percentage formatted in UI only;
- local date/time;
- barangay when available;
- truthful local/sync status.

Use phrases such as:

- `Saved on this device`
- `Local record`
- `Not yet connected to MAO`

Do not show synced, reviewed, approved, or submitted without backend evidence.

### 4.7 Add record details by UUID

Create `record-details` route. It must query by UUID and must not depend on the active scan session.

Display:

- stored image or fallback;
- predicted result;
- confidence;
- all class scores;
- symptoms;
- checklist consistency;
- reported severity;
- quality warnings;
- barangay when available;
- model version;
- processing time;
- saved date/time;
- local/sync status;
- decision-support disclaimer.

A missing image does not hide metadata.

### 4.8 Implement deletion

Require explicit confirmation that the local record and saved image will be removed.

Deletion order:

```text
1. Delete database parent
2. Let foreign-key cascades remove child rows
3. Attempt managed-image deletion
4. Refresh Records and Reports
```

If DB deletion fails, do not delete the image first.

If DB deletion succeeds but image deletion fails:

- keep the record deleted;
- report or log cleanup failure;
- make the orphan detectable.

### 4.9 Refresh without restart

Use the approved refresh strategy so save and delete changes appear without restarting the app. Keep Drizzle details inside hooks; screens still must not import schema tables.

### 4.10 Preserve accessibility

Add:

- meaningful labels;
- disabled semantics;
- accessible loading and error announcements;
- useful missing-image alternatives;
- no color-only status.

### 4.11 Test at realistic volume

Test list and query behavior with enough records to expose pagination and filtering problems. Full 5,000-record performance acceptance remains Phase 6, but this phase should already use indexed queries and lightweight projections.

## Required verification

- Production Records contains no mock source.
- New records appear without restart.
- Restart preserves records.
- Newest record is first.
- Pagination works.
- Search and filters work.
- Unsupported disease filters are absent.
- Details route works after active session reset.
- Missing image displays fallback.
- Confirmation is required before delete.
- Child rows cascade.
- DB failure does not delete image first.
- Image-delete failure leaves detectable orphan.
- List and reports refresh after delete.
- Accessibility checks pass.

## Stop conditions

Stop when:

- screen imports Drizzle tables;
- all rows are loaded into JavaScript;
- filters imply unsupported model classes;
- details depend on the scan session;
- local records claim MAO sync/review;
- deletion removes image before DB success;
- a missing file crashes details;
- soft deletion or recovery bin expands scope without approval;
- a new global state framework is added only for this screen.

## Exit criteria

- No production mock record source remains.
- Database-backed list, search, filters, and pagination work.
- Records survive restart.
- Details are queried by UUID.
- Missing-image fallback works.
- Deletion confirms intent, cascades child rows, and attempts image cleanup.
- Saved and deleted changes appear without restart.
- UI is honest, accessible, and aligned with current model labels.

## Suggested commits

```text
feat(records): replace mock records with local database data
feat(records): add local record details and deletion
test(records): cover records queries and UI states
```

## Detailed source requirements

### FR-REC-001 — Replace mock data

The Records screen shall remove `MOCK_RECORDS` and obtain all displayed data from the local database.

### FR-REC-002 — Default ordering

Records shall be ordered by `createdAt` descending, with the newest record first.

### FR-REC-003 — Pagination

The repository shall support limit-and-cursor or limit-and-offset pagination. The first implementation may load a fixed first page, but it shall not require loading the entire database into memory.

Recommended initial page size: 25 or 50 records.

### FR-REC-004 — Filtering

The records query shall support these filters:

- predicted label
- date range
- local synchronization state
- barangay, once reliable barangay data is collected

Filter labels must derive from supported model labels or stored data. The screen shall not imply that the current model detects classes it does not support.

### FR-REC-005 — Search

Search shall support case-insensitive matching against appropriate stored text, including barangay and display label. Search shall be debounced or triggered deliberately to avoid querying on every keystroke without control.

### FR-REC-006 — State handling

The Records screen shall include:

- initial loading state
- populated list
- empty database state
- no-filter-results state
- database error state
- missing-image state at item or detail level

### FR-REC-007 — Record cards

Each record card shall show at minimum:

- image thumbnail or placeholder
- possible result or healthy result label
- confidence percentage
- date and time
- barangay when available
- local storage or synchronization status

### FR-REC-008 — Honest status text

Before synchronization exists, the UI shall use status text such as:

- `Saved on this device`
- `Local record`
- `Not yet connected to MAO`

The UI shall not show:

- `Synced to MAO`
- `Reviewed by MAO`
- `Approved`
- `Submitted`

unless a future backend provides evidence for that state.

### FR-REC-009 — Record details route

Selecting a record shall open a record-details route using the record UUID. The details screen shall query the database rather than reuse the active scan session.

### FR-REC-010 — Record details content

The details screen shall display:

- stored image or fallback
- predicted result
- confidence
- all class scores
- selected symptoms
- checklist consistency
- reported severity
- quality warnings
- barangay when available
- model version
- processing time
- saved date and time
- local/sync status
- decision-support disclaimer

### FR-REC-011 — Reactive refresh

Records shall reflect new saves and deletions without requiring the user to restart the app.

Drizzle live queries may be used inside feature hooks. Screens shall still depend on hooks rather than import the database directly.

---

### FR-DEL-001 — Confirmation

Record deletion shall require explicit confirmation. The confirmation shall state that the local record and saved image will be removed from the device.

### FR-DEL-002 — Related-row deletion

Deleting a scan record shall remove dependent class scores, symptoms, and warnings through foreign-key cascades or an explicit transaction.

### FR-DEL-003 — File deletion

The storage service shall attempt to delete the managed image after or as part of the application-level delete operation.

### FR-DEL-004 — Partial-failure handling

If database deletion succeeds but file deletion fails, the record shall remain deleted and the orphaned file shall be eligible for later cleanup.

If database deletion fails, the image shall not be deleted first.

### FR-DEL-005 — UI refresh

After successful deletion, Records and Reports shall update automatically or on route focus.

---

### FR-IMG-007 — Missing-file behavior

If a database record exists but its managed image is missing, the record details screen shall remain usable. It shall display an image-unavailable state rather than crash or hide the entire record.

### FR-IMG-008 — Record deletion cleanup

Deleting a scan record shall also attempt to delete its managed image. Database deletion and file cleanup behavior shall be documented and tested.

### FR-IMG-009 — Orphan cleanup

A maintenance function shall be designed to identify managed image files that do not correspond to a database record. Automatic deletion may be deferred, but the storage design shall not make orphan detection impossible.

---

### FR-RES-001 — Application restart

Saved records shall remain available after the app is closed, force-stopped, updated without data removal, and reopened.

## 12.2 Records screen

The Records screen shall retain the current design system but replace demonstration data with database-backed content.

Filters must align with the current stored model labels. The initial Model v0 supports Healthy, Mosaic, and Rust. The Records screen shall not present Smut or Downy Mildew as Model v0 filter results unless future migrations contain records from a model that supports those labels.

## 12.4 Accessibility

New controls and states shall include:

- meaningful accessibility labels
- disabled-state semantics
- accessible progress announcements
- accessible error announcements
- adequate text alternatives for missing images
- no information conveyed only through color

---

## Phase 4 — Records integration

Deliverables:

- database-backed list
- filters and search
- pagination
- details route
- empty, error, and missing-image states
- deletion flow

Exit criteria:

- no mock record source remains in the production Records screen
- records survive restart
- deleting updates the list
