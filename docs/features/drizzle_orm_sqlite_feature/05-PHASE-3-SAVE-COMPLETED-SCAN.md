# Phase 3 — Save Completed Scan

**Repository:** `niks0501/caneguard-mobile`  
**Branch:** `feat/drizzle-sqlite-scan-records`  
**Stack:** Drizzle ORM + Expo SQLite + Expo FileSystem + Expo Crypto  
**Primary platform:** Android  
**Execution mode:** One phase at a time; do not continue past an unmet exit criterion


## Objective

Connect the completed AI analysis flow to durable local storage. The user must be able to explicitly save one real result offline, with a managed image and all approved metadata, without duplicates or partial records.

This phase creates the first end-to-end persisted CaneGuard record. It does not build the Records list or Reports screen yet.

## Preconditions

- Phase 1 schema and provider are ready.
- Phase 2 image-storage service is verified.
- Existing scan session contains the required result fields.
- Read `01-SHARED-CONTRACT.md`.
- Decide the primary post-save action.
- Decide whether leaving an unsaved result should show a warning. The warning must not force saving.

## Deliverables

- Scan-session-to-persistence mapper
- Input validation
- Transactional scan-record repository insert
- Child inserts for scores, symptoms, and quality warnings
- Application-level coordinated save service
- Compensation cleanup
- Stable UUID generation
- `local_only` sync metadata
- Save Record UI
- ready/saving/saved/failed states
- duplicate-tap prevention
- retry behavior
- navigation using saved record UUID
- unit, repository, and UI tests

## Execution steps

### 3.1 Reuse existing detection types

Map the current completed scan session into `SaveCompletedScanInput`.

Do not redefine model labels, class-score structure, symptom keys, severity, checklist consistency, warnings, or timings unless a persistence-specific type genuinely differs.

### 3.2 Validate before any file or database write

Reject incomplete or invalid input when required data is missing:

- completed inference;
- source URI;
- source type;
- predicted label;
- confidence;
- complete class scores;
- model version.

Validate:

- allowed enums;
- finite confidence and score values from 0 to 1;
- non-negative finite timings;
- positive dimensions when present;
- valid timestamp strings;
- UUID format or generated identity.

Use `INVALID_SCAN_RECORD` for typed validation failure.

### 3.3 Generate one stable UUID

Generate the UUID once per save operation through Expo Crypto. Reuse it for:

- parent primary key;
- managed image filename;
- later details navigation;
- future idempotent synchronization.

Do not regenerate the ID on retry after a recoverable UI failure unless the prior attempt is known not to have committed.

### 3.4 Coordinate file and database operations

Implement the approved workflow:

```text
1. Validate completed scan session
2. Generate or obtain stable record UUID
3. Copy source image to managed documents directory
4. Begin SQLite transaction
5. Insert scan_records parent row
6. Insert scan_class_scores rows
7. Insert scan_symptoms rows
8. Insert scan_quality_warnings rows
9. Commit SQLite transaction
10. Return saved record UUID
```

If image copy fails, do not begin the transaction.

If the transaction fails after copy:

- roll back;
- attempt copied-file deletion;
- report failure;
- do not report saved state.

Required class scores are atomic with the parent. Symptoms and warnings may be empty.

### 3.5 Preserve model-output integrity

Store:

- exact predicted label;
- exact top confidence;
- every returned class score;
- existing model version;
- preprocessing, inference, and total timings.

Do not:

- apply softmax again;
- let symptom consistency modify scores;
- relabel the prediction;
- store confidence as `"98%"`;
- call it a confirmed disease.

### 3.6 Preserve observation context

Store selected symptom keys, checklist consistency, user-reported severity, quality-warning keys, and nullable barangay context.

Barangay remains null unless the user explicitly provides or confirms it. Never persist the current hardcoded demonstration location as real data.

### 3.7 Initialize sync-ready metadata honestly

Create the record as:

```text
sync_status = local_only
remote_id = null
sync_attempt_count = 0
last_sync_error_code = null
last_sync_attempt_at = null
last_synced_at = null
```

No network request, queue worker, backend SDK, or fake synchronization status may be added.

### 3.8 Add the Save Record interface

On Analysis Result, add:

- Save Record button;
- saving indicator;
- saved confirmation;
- recoverable failure and retry;
- disabled duplicate tap;
- accurate local-storage disclosure;
- optional Open Saved Record action using returned UUID.

States:

- ready to save;
- saving;
- saved;
- failed.

Viewing a result does not autosave.

### 3.9 Guard duplicate operations

Use both:

- a UI in-flight guard;
- one stable UUID.

Also handle the possibility that a retry encounters an already-committed ID. Return or map `DUPLICATE_RECORD` without creating another record.

### 3.10 Preserve the active result after failure

A database or image-storage failure must not reset the scan session, destroy the result, or navigate away. The user must be able to retry or start a new scan deliberately.

### 3.11 Add tests

Cover:

- complete save;
- no optional symptoms;
- invalid required field;
- score outside range;
- duplicate rapid tap;
- child insert rollback;
- image copy failure;
- DB failure after image copy;
- cleanup failure;
- saved-state navigation;
- no fake sync;
- exact model score preservation;
- UTC timestamps.

## Required verification

- One real model result saves in airplane mode.
- Managed image and metadata persist.
- All class scores exist.
- Symptoms, severity, warnings, model version, and timings persist when available.
- Record starts as `local_only`.
- Rapid taps create one record.
- Required child failure rolls back parent.
- Failed save does not show success.
- Failed save preserves active result.
- No password, token, upload, or backend dependency appears.
- UI says local/AI-supported, not synced/confirmed.
- Existing inference output remains unchanged.

## Stop conditions

Stop when:

- save requires internet or authentication;
- symptoms alter model output;
- a hardcoded barangay is persisted;
- an image is stored in SQLite;
- the repository performs navigation or UI work;
- a partial parent record remains after child failure;
- a failed operation shows saved state;
- a sync worker or backend SDK is introduced;
- the app claims diagnosis confirmation;
- model flow regresses.

## Exit criteria

- One real model result can be saved offline.
- Managed image and all required structured data persist.
- All expected child rows are stored.
- Incomplete input is rejected.
- Transaction failure leaves no partial record.
- Compensation cleanup is attempted.
- Duplicate taps do not duplicate records.
- Save UI supports ready, saving, saved, failed, and retry states.
- Save service returns record UUID.
- Record is `local_only`.
- Existing model and symptom flow remain intact.

## Suggested commits

```text
feat(records): add transactional scan record repository
feat(records): save completed analysis results locally
test(records): cover scan save and rollback behavior
```

## Detailed source requirements

### FR-SAVE-001 — Eligibility

A record may be saved only when the scan session has:

- a completed inference result
- a source image URI
- a source type
- a predicted label
- a confidence value
- model class scores
- a model version

The save service shall reject incomplete sessions using a typed application error.

### FR-SAVE-002 — Explicit save action

The Analysis Result screen shall provide a clear **Save Record** action. Viewing a result shall not automatically create a permanent record unless the product team later approves autosave.

### FR-SAVE-003 — Save-state feedback

The save action shall expose these states:

- ready to save
- saving
- saved
- failed

While saving, the control shall be disabled and display progress feedback. After success, the interface shall make it clear that the record is stored on the current device.

### FR-SAVE-004 — Duplicate-tap protection

Repeated taps during one save operation shall not create duplicate records.

The save operation shall use both:

1. a UI in-flight guard; and
2. a stable UUID generated once for the operation.

### FR-SAVE-005 — Transactional metadata write

The parent scan record and all dependent rows shall be inserted in one database transaction. A failure in any required child insert shall roll back the database transaction.

### FR-SAVE-006 — Captured data

A saved record shall preserve the following available data from the current analysis flow:

- scan record UUID
- managed image URI
- image source type
- source width and height
- predicted model label
- top confidence score
- all model class scores
- selected symptom keys
- checklist consistency result
- reported severity
- image-quality warning keys
- model version
- preprocessing time
- inference time
- total processing time
- barangay or location context, when collected
- created timestamp
- updated timestamp
- local synchronization state

### FR-SAVE-007 — UTC timestamps

Persisted timestamps shall use ISO 8601 UTC strings. UI components may convert them to local display time.

### FR-SAVE-008 — Confidence storage

Confidence and class scores shall be stored as numeric values from `0` to `1`. The database shall not store formatted percentage strings such as `"98%"`.

### FR-SAVE-009 — Model-output integrity

The database shall store the actual model output returned by the completed scan. Symptom observations shall not overwrite, relabel, or numerically alter the AI class scores.

### FR-SAVE-010 — Decision-support wording

Persistence shall preserve the distinction between an AI-supported result and a confirmed diagnosis. Database and UI naming shall use terms such as `predictedLabel`, `possible result`, or `AI result`, not `confirmedDisease`.

### FR-SAVE-011 — Barangay handling

The local schema shall support a nullable barangay field during the initial implementation because authentication and local profiles do not yet exist.

Before barangay-level reports are presented as meaningful, the application must introduce a verified and controlled barangay selection mechanism. Hardcoded demonstration locations shall not be saved as real user data.

### FR-SAVE-012 — Post-save behavior

After a successful save, the user shall be able to:

- open the saved record;
- return to Home;
- start a new scan; or
- remain on the result screen with a visible saved state.

The team shall select one primary action, but the save service must return the record UUID so navigation can open the correct record.

---

### FR-SYNC-001 — Stable local identity

Each scan shall use a UUIDv4 generated on the device. The identifier shall remain stable throughout future synchronization retries.

### FR-SYNC-002 — Synchronization states

The data model shall support these values:

| State | Meaning |
|---|---|
| `local_only` | Record is stored locally and no backend synchronization is configured |
| `pending` | Record is eligible and waiting to be sent |
| `syncing` | A future sync worker is attempting upload |
| `synced` | A future backend confirmed successful storage |
| `failed` | A future sync attempt failed and may be retried |

The initial feature shall create records as `local_only`.

### FR-SYNC-003 — Future remote identifier

The record shall support a nullable `remoteId`. It shall remain null until a backend confirms a server-side identifier.

### FR-SYNC-004 — Future retry metadata

The model may include:

- sync attempt count
- last sync error code
- last sync attempt timestamp
- last successful sync timestamp

These fields shall not trigger network activity in this branch.

### FR-SYNC-005 — No fake queue

A Sync Queue interface shall not display fabricated pending items. Until a backend and sync contract exist, the queue may show locally stored records as local-only, or remain unavailable with an accurate explanation.

### FR-SYNC-006 — Backend independence

Local repositories shall not depend on Laravel, Firebase, Supabase, or another backend SDK. Future synchronization shall consume repository data through a separate application service.

### FR-SYNC-007 — Future idempotency

The eventual upload payload shall include the stable local UUID so that the server can reject duplicate uploads. This branch shall preserve the required local ID but shall not define an unapproved API payload as final.

---

### FR-RES-002 — Save interruption

The save service shall not report success until both the managed image and database transaction complete.

### FR-RES-003 — Atomic dependent data

A scan record shall never be committed without its required class-score rows. Optional symptoms and warnings may be absent when the user or analysis produced none.

### FR-RES-004 — Validation before write

Repository inputs shall be validated for required fields, allowed enum values, finite numeric values, and timestamp format before executing the transaction.

### FR-RES-005 — Database error isolation

A failed query shall not reset the active scan result or destroy previously saved records.

### SEC-001 — No passwords

The SQLite database shall not store passwords. Authentication remains a future feature.

### SEC-002 — No auth tokens

Future access and refresh tokens shall use secure device storage, not scan tables or AsyncStorage. This branch shall not introduce token storage.

### SEC-003 — Parameterized queries

All user-provided values shall be bound through Drizzle or parameterized SQL. String concatenation shall not construct database conditions from user input.

### SEC-004 — No silent upload

No scan record or image shall leave the device in this branch.

### SEC-005 — Location minimization

The feature shall not collect GPS coordinates automatically. Barangay text may be stored only when the user provides or confirms it.

### SEC-006 — Logging

Production logs shall not print:

- image binary data
- full local file paths when avoidable
- complete record payloads
- future authentication credentials
- personal contact information

### SEC-007 — Local disclosure

The UI shall disclose that records are stored on the device and may be removed if the application data is cleared or the application is uninstalled.

---

## 11. Save Transaction Workflow

Because file operations and SQLite transactions cannot participate in one shared transaction, the application shall use a coordinated workflow with compensating cleanup.

```text
1. Validate completed scan session
2. Generate or obtain stable record UUID
3. Copy source image to managed documents directory
4. Begin SQLite transaction
5. Insert scan_records parent row
6. Insert scan_class_scores rows
7. Insert scan_symptoms rows
8. Insert scan_quality_warnings rows
9. Commit SQLite transaction
10. Return saved record UUID
```

Failure behavior:

```text
Image copy fails
→ Do not begin database transaction
→ Report image-storage failure

Database transaction fails after image copy
→ Roll back transaction
→ Attempt to delete copied image
→ Report database-save failure

Cleanup deletion also fails
→ Keep database rolled back
→ Log orphan-file cleanup requirement
→ Do not report save success
```

---

## 12.1 Analysis Result screen

The Analysis Result screen shall gain:

- Save Record button
- saving indicator
- saved confirmation
- retry action after recoverable failure
- duplicate-save prevention
- accurate local-only wording
- optional navigation to saved details

The existing New Scan action shall warn the user when a completed result has not been saved only if the team deliberately chooses that behavior. It shall not trap the user or force saving.

## Phase 3 — Save completed scan

Deliverables:

- scan-session mapper
- record validation
- transactional repository insert
- Save Record UI
- duplicate guard
- saved state and navigation

Exit criteria:

- one real model result can be saved offline
- all expected child rows are stored
- failed transaction does not create a partial record
