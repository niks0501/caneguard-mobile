# Phase 6 — Reliability and Release Verification

**Repository:** `niks0501/caneguard-mobile`  
**Branch:** `feat/drizzle-sqlite-scan-records`  
**Stack:** Drizzle ORM + Expo SQLite + Expo FileSystem + Expo Crypto  
**Primary platform:** Android  
**Execution mode:** One phase at a time; do not continue past an unmet exit criterion


## Objective

Prove the complete local-persistence feature is safe to release: migrations upgrade without data loss, queries meet agreed performance targets, offline and restart behavior work on Android, error states are reviewed, documentation is current, and the branch contains no fake production data or temporary debug artifacts.

This phase is verification and hardening. It must not become an opportunity to add authentication, backend sync, or unrelated features.

## Preconditions

- Phases 0–5 passed.
- Real scan save, Records, Details, Delete, and Reports work.
- Target Android device is identified.
- Read `01-SHARED-CONTRACT.md`.
- All unresolved open decisions are documented.

## Deliverables

- Full migration upgrade test
- 5,000-record performance fixture
- Performance measurements
- Physical-device acceptance record
- Airplane-mode evidence
- Application restart evidence
- App-update migration evidence
- Error-state review
- Security/privacy review
- Accessibility review
- Final lint/type/test/Expo Doctor/build results
- Updated architecture documentation
- Final requirement traceability
- Worktree and branch cleanup
- Release/handoff record

## Execution steps

### 6.1 Run the complete automated verification suite

Run:

```bash
npm ci
npm run lint
npx tsc --noEmit
npm test -- --runInBand
npx expo-doctor
```

Run any approved native/database test harness separately. Do not treat mocks as proof of native SQLite behavior.

### 6.2 Verify migration paths

Test:

- empty database to latest;
- immediately preceding schema to latest;
- repeated startup;
- foreign-key enforcement;
- migration bundle resolution;
- migration-error presentation;
- seeded prior-version data preservation;
- app update installation without clearing data.

No production migration may delete records unexpectedly.

### 6.3 Run performance fixtures

Seed 5,000 realistic records with child scores and mixed optional data.

Measure on the agreed Android device:

- normal cold-start migration check: target within 2 seconds;
- typical scan save including image copy: target within 2 seconds;
- first page of 50 records: target within 500 ms;
- report aggregate queries: target within 500 ms;
- scrolling responsiveness.

These are engineering acceptance targets, not universal public claims. When a target fails, profile before changing it.

### 6.4 Run physical-device acceptance

Perform every step listed in the source acceptance procedure:

1. Complete a scan.
2. Save while offline.
3. Close and reopen.
4. Confirm record remains.
5. Open details.
6. Confirm image.
7. Confirm filters.
8. Confirm Reports values.
9. Delete.
10. Confirm removal from Records and Reports.
11. Confirm image deletion or orphan marking.
12. Verify rapid repeated taps do not duplicate.
13. Install an update with a new migration and preserve records.

Record device model, Android version, build profile, app version, commit SHA, and results.

### 6.5 Review all error states

Exercise:

- database not ready;
- database open failure where safely simulatable;
- migration failure;
- invalid scan;
- image copy failure;
- image missing;
- save transaction failure;
- record not found;
- query failure;
- delete failure;
- image delete failure;
- duplicate record.

Confirm user messages are actionable and do not expose SQL, stack traces, or sensitive paths.

### 6.6 Review security and privacy

Confirm:

- no passwords in SQLite;
- no tokens in SQLite or AsyncStorage;
- no silent upload;
- no automatic GPS;
- barangay is user-provided/confirmed or null;
- user values are parameterized;
- logs omit image bytes, full payloads, credentials, personal information, and avoid full paths;
- UI discloses local storage and uninstall/app-data loss behavior.

### 6.7 Review data and UI honesty

Confirm:

- AI predictions are not diagnoses;
- Reports do not call predictions confirmed cases;
- Smut and Downy Mildew are not presented as Model v0 outputs;
- local records do not claim sync, submission, approval, or MAO review;
- hardcoded demonstration locations are not saved;
- mock production records/totals are gone.

### 6.8 Review accessibility

Confirm:

- progress is announced;
- errors are announced;
- controls have meaningful labels;
- disabled state is exposed;
- missing images have useful alternatives;
- status is not color-only.

### 6.9 Clean and document the branch

Remove:

- temporary databases;
- generated seed output;
- unapproved debug routes or keep `/storage-debug` behind `__DEV__`;
- compatibility-only Phase 0 artifacts no longer required;
- console debugging;
- stale mock production data.

Update:

- storage architecture;
- migration workflow;
- developer commands;
- test record;
- known limitations;
- rollback notes;
- future phase boundaries.

### 6.10 Complete final traceability

Use `09-TRACEABILITY-MATRIX.md`. Mark each requirement as implemented, verified, deferred by approved scope, or blocked. A requirement cannot be marked verified without evidence.

## Required verification

- Full automated suite passes or an external limitation is explicitly documented.
- Android development/preview build passes.
- Model loads and runs.
- Offline save/list/details/report/delete works.
- Restart persistence works.
- Migration upgrade preserves data.
- 5,000-record targets pass or are profiled and formally dispositioned.
- All error states are reviewed.
- Security/privacy rules pass.
- Accessibility review passes.
- No production mock or false status remains.
- Worktree is clean.
- Physical-device record is complete.

## Stop conditions

Stop release when:

- migration upgrade loses data;
- model integration regresses;
- save produces duplicates or partial records;
- app requires network for local features;
- report values disagree with database;
- missing images crash the app;
- production code auto-deletes database on failure;
- fake sync/review status remains;
- unsupported model labels remain in prediction UI;
- performance failure is ignored rather than profiled;
- device validation is unperformed;
- temporary debug or seeded data remains.

## Exit criteria

- Definition of Done is satisfied.
- Manual Android acceptance test passes.
- Migration and performance evidence exists.
- Documentation and traceability are current.
- Branch has no temporary database or generated debug data.
- Worktree is clean.
- Final commit SHA and build evidence are recorded.
- Feature is ready for pull-request review.

## Suggested commits

```text
test(storage): cover migrations and persistence workflows
perf(storage): add local records performance fixture
docs(storage): complete local persistence release evidence
chore(storage): clean persistence feature branch
```

## Source non-functional requirements

## 14. Non-Functional Requirements

## Source testing requirements

## 16. Testing Requirements

## Source acceptance criteria

## 21. Acceptance Criteria

The feature is accepted only when all of the following are true:

- [ ] Drizzle ORM uses Expo SQLite successfully in an Android development build.
- [ ] Generated migrations are bundled and applied at startup.
- [ ] The existing TensorFlow Lite model still loads and runs.
- [ ] A completed real scan can be saved without internet.
- [ ] The image used for analysis is copied to managed app storage.
- [ ] Saved results survive an app restart.
- [ ] All model class scores are preserved.
- [ ] Selected symptoms, severity, quality warnings, model version, and timings are preserved when available.
- [ ] Rapid repeated taps do not create duplicate records.
- [ ] A failed child insert rolls back the full database transaction.
- [ ] Failed database writes do not falsely show success.
- [ ] Records no longer use mock production data.
- [ ] Reports no longer use hardcoded production totals.
- [ ] Records are ordered newest first.
- [ ] Search, supported-label filtering, and pagination work.
- [ ] Record details do not depend on the active scan context.
- [ ] Missing image files produce a fallback state rather than a crash.
- [ ] Deleting a record removes dependent rows and attempts image cleanup.
- [ ] Reports use SQL aggregates rather than loading every record.
- [ ] The UI does not claim that local records were synced or reviewed by the MAO.
- [ ] The UI does not present unsupported model classes as current AI outputs.
- [ ] No password, access token, or authentication secret is stored in SQLite.
- [ ] Migrations preserve records from the previous schema version.
- [ ] Lint, TypeScript, tests, Expo Doctor, and the approved Android build checks pass or have explicitly documented external limitations.
- [ ] A physical-device acceptance test record is completed.

---

## Source Definition of Done

## 22. Definition of Done

The feature is done when it delivers a complete local workflow, not merely when packages are installed.

```text
Real scan
→ Real model result
→ User saves record
→ Managed image and structured metadata persist
→ Record survives restart
→ Record appears in Records
→ Record contributes to Reports
→ User can inspect and delete it
```

The branch must contain documentation, migrations, tests, error states, and device evidence. Mock values must not remain in production paths that claim to represent stored records or reports.

---

## Source risks and mitigations

## 23. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Drizzle Expo packages are incompatible with the current SDK | Build or runtime failure | Complete Phase 0 compatibility spike and pin tested versions |
| Migration SQL is not bundled by Metro | Database initialization failure | Configure SQL source extension and migration import; verify Android bundle |
| New Metro/Babel changes break TFLite assets | Model integration regression | Run model smoke test after configuration changes |
| Camera/gallery URI is temporary | Historical image disappears | Copy image into documents storage before committing the record |
| Image copy succeeds but DB save fails | Orphan file | Compensating deletion and orphan scan |
| DB deletion succeeds but image deletion fails | Storage leak | Log and detect orphan for cleanup |
| Records grow and list becomes slow | Poor UX | Pagination, indexed queries, lightweight list projections |
| Reports load all rows into JavaScript | Memory and speed issue | SQL aggregate queries |
| UI continues showing unsupported diseases | Misleading result interpretation | Derive AI filters and summaries from model/stored labels |
| Future backend requires a new ID | Duplicate sync or migration complexity | Stable local UUID and nullable remote ID |
| Team treats ORM as a replacement for database knowledge | Incorrect schema or inefficient queries | Review generated SQL and document indexes/transactions |
| Developer resets database to fix migration errors | Data loss | No destructive production fallback; dev-only reset |
| Authentication is mixed into this branch | Scope and schedule failure | Keep auth and backend explicitly out of scope |

---

## Source open decisions

## 24. Open Decisions Before Implementation

The team shall resolve these during Phase 0 or Phase 1:

1. Which tested Drizzle ORM and Drizzle Kit versions are compatible with Expo SDK 57?
2. Will the repository use Drizzle `useLiveQuery`, route-focus refresh, or a combination?
3. What database file name will remain stable through production?
4. Will the first version store the full original image only, or also generate a list thumbnail?
5. Is barangay optional during the prototype, or will save require a user-confirmed barangay?
6. What verified source will provide the controlled Nasugbu barangay list?
7. What first-page record count gives acceptable performance and usability?
8. Will deletion be permanent immediately, or will a future soft-delete migration be introduced before synchronization?
9. Which target Android device will be used for the performance and physical-device acceptance record?
10. Should a user receive a warning when starting a new scan without saving the current result?

Unresolved decisions shall not be silently guessed by the coding agent.

---

## Source implementation phase

## Phase 6 — Reliability and release verification

Deliverables:

- migration upgrade test
- 5,000-record performance fixture
- physical-device acceptance record
- error-state review
- documentation update
- branch cleanup

Exit criteria:

- Definition of Done is satisfied
- manual Android acceptance test passes
- worktree contains no temporary database or generated debug data

---
