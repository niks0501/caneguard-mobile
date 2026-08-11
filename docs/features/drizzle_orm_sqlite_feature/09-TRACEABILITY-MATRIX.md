# Requirement Traceability Matrix

**Repository:** `niks0501/caneguard-mobile`  
**Branch:** `feat/drizzle-sqlite-scan-records`  
**Stack:** Drizzle ORM + Expo SQLite + Expo FileSystem + Expo Crypto  
**Primary platform:** Android  
**Execution mode:** One phase at a time; do not continue past an unmet exit criterion


## How to use this file

Update the status and evidence columns at each phase handoff.

Allowed status values:

- `Not started`
- `In progress`
- `Implemented`
- `Verified`
- `Deferred by approved scope`
- `Blocked`

Do not mark a requirement `Verified` without a test, build, device record, screenshot, query result, or other concrete evidence.

## Functional and security requirement coverage

| ID | Requirement | Planned phase | Status | Evidence |
|---|---|---|---|---|
| `FR-DB-001` | Database creation | Phase 1 | ☐ | Evidence pending |
| `FR-DB-002` | Root-level database availability | Phase 1 | ☐ | Evidence pending |
| `FR-DB-003` | Migration gate | Phase 1 | ☐ | Evidence pending |
| `FR-DB-004` | Database configuration | Phase 1 | ☐ | Evidence pending |
| `FR-DB-005` | Single source of schema truth | Phase 1 | ☐ | Evidence pending |
| `FR-MIG-001` | Generated migrations | Phase 1 | ☐ | Evidence pending |
| `FR-MIG-002` | Forward-only production migration policy | Phase 1 | ☐ | Evidence pending |
| `FR-MIG-003` | Idempotent startup | Phase 1 | ☐ | Evidence pending |
| `FR-MIG-004` | Empty-database support | Phase 1 | ☐ | Evidence pending |
| `FR-MIG-005` | Upgrade support | Phase 1 | ☐ | Evidence pending |
| `FR-MIG-006` | No runtime schema improvisation | Phase 1 | ☐ | Evidence pending |
| `FR-MIG-007` | Migration failure visibility | Phase 1 | ☐ | Evidence pending |
| `FR-IMG-001` | Managed directory | Phase 2 | ☐ | Evidence pending |
| `FR-IMG-002` | Database reference | Phase 2 | ☐ | Evidence pending |
| `FR-IMG-003` | Source preservation | Phase 2 | ☐ | Evidence pending |
| `FR-IMG-004` | Stable file naming | Phase 2 | ☐ | Evidence pending |
| `FR-IMG-005` | File metadata | Phase 2 | ☐ | Evidence pending |
| `FR-IMG-006` | Compensating cleanup | Phase 2 | ☐ | Evidence pending |
| `FR-IMG-007` | Missing-file behavior | Phase 2 / Phase 4 / Phase 6 | ☐ | Evidence pending |
| `FR-IMG-008` | Record deletion cleanup | Phase 2 / Phase 4 / Phase 6 | ☐ | Evidence pending |
| `FR-IMG-009` | Orphan cleanup | Phase 2 / Phase 4 / Phase 6 | ☐ | Evidence pending |
| `FR-SAVE-001` | Eligibility | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-002` | Explicit save action | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-003` | Save-state feedback | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-004` | Duplicate-tap protection | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-005` | Transactional metadata write | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-006` | Captured data | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-007` | UTC timestamps | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-008` | Confidence storage | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-009` | Model-output integrity | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-010` | Decision-support wording | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-011` | Barangay handling | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-012` | Post-save behavior | Phase 3 | ☐ | Evidence pending |
| `FR-REC-001` | Replace mock data | Phase 4 | ☐ | Evidence pending |
| `FR-REC-002` | Default ordering | Phase 4 | ☐ | Evidence pending |
| `FR-REC-003` | Pagination | Phase 4 | ☐ | Evidence pending |
| `FR-REC-004` | Filtering | Phase 4 | ☐ | Evidence pending |
| `FR-REC-005` | Search | Phase 4 | ☐ | Evidence pending |
| `FR-REC-006` | State handling | Phase 4 | ☐ | Evidence pending |
| `FR-REC-007` | Record cards | Phase 4 | ☐ | Evidence pending |
| `FR-REC-008` | Honest status text | Phase 4 | ☐ | Evidence pending |
| `FR-REC-009` | Record details route | Phase 4 | ☐ | Evidence pending |
| `FR-REC-010` | Record details content | Phase 4 | ☐ | Evidence pending |
| `FR-REC-011` | Reactive refresh | Phase 4 | ☐ | Evidence pending |
| `FR-REP-001` | Replace hardcoded statistics | Phase 5 | ☐ | Evidence pending |
| `FR-REP-002` | Required summary metrics | Phase 5 | ☐ | Evidence pending |
| `FR-REP-003` | Supported-label integrity | Phase 5 | ☐ | Evidence pending |
| `FR-REP-004` | Date-range support | Phase 5 | ☐ | Evidence pending |
| `FR-REP-005` | Empty-state behavior | Phase 5 | ☐ | Evidence pending |
| `FR-REP-006` | Aggregate efficiency | Phase 5 | ☐ | Evidence pending |
| `FR-REP-007` | Recent records | Phase 5 | ☐ | Evidence pending |
| `FR-SYNC-001` | Stable local identity | Phase 3 | ☐ | Evidence pending |
| `FR-SYNC-002` | Synchronization states | Phase 3 | ☐ | Evidence pending |
| `FR-SYNC-003` | Future remote identifier | Phase 3 | ☐ | Evidence pending |
| `FR-SYNC-004` | Future retry metadata | Phase 3 | ☐ | Evidence pending |
| `FR-SYNC-005` | No fake queue | Phase 3 | ☐ | Evidence pending |
| `FR-SYNC-006` | Backend independence | Phase 3 | ☐ | Evidence pending |
| `FR-SYNC-007` | Future idempotency | Phase 3 | ☐ | Evidence pending |
| `FR-DEL-001` | Confirmation | Phase 4 | ☐ | Evidence pending |
| `FR-DEL-002` | Related-row deletion | Phase 4 | ☐ | Evidence pending |
| `FR-DEL-003` | File deletion | Phase 2 / Phase 4 / Phase 6 | ☐ | Evidence pending |
| `FR-DEL-004` | Partial-failure handling | Phase 2 / Phase 4 / Phase 6 | ☐ | Evidence pending |
| `FR-DEL-005` | UI refresh | Phase 4 | ☐ | Evidence pending |
| `FR-RES-001` | Application restart | Phase 4 / Phase 6 | ☐ | Evidence pending |
| `FR-RES-002` | Save interruption | Phase 3 / Phase 6 | ☐ | Evidence pending |
| `FR-RES-003` | Atomic dependent data | Phase 3 / Phase 6 | ☐ | Evidence pending |
| `FR-RES-004` | Validation before write | Phase 3 / Phase 6 | ☐ | Evidence pending |
| `FR-RES-005` | Database error isolation | Phase 3 / Phase 6 | ☐ | Evidence pending |
| `FR-RES-006` | Corruption behavior | Phase 1 / Phase 6 | ☐ | Evidence pending |
| `FR-RES-007` | Referential integrity | Phase 1 / Phase 6 | ☐ | Evidence pending |
| `SEC-001` | No passwords | Phase 3 / Phase 6 | ☐ | Evidence pending |
| `SEC-002` | No auth tokens | Phase 3 / Phase 6 | ☐ | Evidence pending |
| `SEC-003` | Parameterized queries | Phase 3 / Phase 6 | ☐ | Evidence pending |
| `SEC-004` | No silent upload | Phase 3 / Phase 6 | ☐ | Evidence pending |
| `SEC-005` | Location minimization | Phase 3 / Phase 6 | ☐ | Evidence pending |
| `SEC-006` | Logging | Phase 3 / Phase 6 | ☐ | Evidence pending |
| `SEC-007` | Local disclosure | Phase 3 / Phase 6 | ☐ | Evidence pending |

## Original-section coverage

| Original section | Destination in phase packet |
|---|---|
| 1. Purpose | 01-SHARED-CONTRACT.md |
| 2. Product Context | 01-SHARED-CONTRACT.md |
| 3. Architecture Decision | 01-SHARED-CONTRACT.md; Phase 0 and Phase 1 |
| 4. Goals | 01-SHARED-CONTRACT.md |
| 5. Non-Goals | 01-SHARED-CONTRACT.md |
| 6. Users and Stakeholders | 01-SHARED-CONTRACT.md |
| 7. Core User Stories | 01-SHARED-CONTRACT.md |
| 8.1 Database Initialization | Phase 1 |
| 8.2 Migration Management | Phase 1 |
| 8.3 Persistent Image Management | Phase 2, Phase 4, Phase 6 |
| 8.4 Saving Completed Scan Results | Phase 3 |
| 8.5 Records List | Phase 4 |
| 8.6 Reports and Aggregates | Phase 5 |
| 8.7 Local Synchronization Readiness | Phase 3 |
| 8.8 Record Deletion | Phase 4 |
| 8.9 Recovery and Data Integrity | Phases 1, 3, 4, and 6 |
| 9. Proposed Data Model | Phase 1 |
| 10. Domain and Repository Contracts | Phase 1; implemented across Phases 2–5 |
| 11. Save Transaction Workflow | Phase 3 |
| 12. UI and Experience Requirements | Phases 3–5 |
| 13. Error Model | Phase 1; exercised Phases 2–6 |
| 14. Non-Functional Requirements | Phase 6; applied throughout |
| 15. Security and Privacy Requirements | Phase 3 and Phase 6 |
| 16. Testing Requirements | Phase-specific tests; final Phase 6 |
| 17. Developer and Debugging Requirements | Phase 1 and Phase 6 |
| 18. Proposed Project Structure | Phase 1; evolved minimally in later phases |
| 19. Implementation Phases | Files 02–08 |
| 20. Suggested Commit Plan | Distributed per phase |
| 21. Acceptance Criteria | Phase 6 |
| 22. Definition of Done | Phase 6 |
| 23. Risks and Mitigations | Phase 0–6; final review Phase 6 |
| 24. Open Decisions | Resolved in relevant phases; final review Phase 6 |
| 25. Future Enhancements | 01-SHARED-CONTRACT.md |
| 26. Coding Agent Guardrails | 01-SHARED-CONTRACT.md and every phase |
| 27. Requirement Traceability Summary | This file |
| 28. Final Technical Direction | 01-SHARED-CONTRACT.md |

## Cross-phase release checklist

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

## Final workflow

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


## Original suggested commit plan

## 20. Suggested Commit Plan

```text
chore(storage): add Drizzle and Expo persistence dependencies
build(storage): configure Drizzle migration bundling
feat(storage): initialize CaneGuard SQLite database
feat(storage): define local scan record schema and migrations
feat(records): add managed scan image storage
feat(records): add transactional scan record repository
feat(records): save completed analysis results locally
feat(records): replace mock records with local database data
feat(records): add local record details and deletion
feat(reports): calculate summaries from saved records
test(storage): cover migrations and persistence workflows
docs(storage): document local persistence architecture
```

Each commit should preserve or restore passing lint and type checks. Large generated migration artifacts may be committed with the schema change that produced them.

---

## Original requirement traceability summary

## 27. Requirement Traceability Summary

| Product need | Primary requirements |
|---|---|
| Offline scan history | FR-DB, FR-IMG, FR-SAVE, FR-REC |
| Durable AI result | FR-SAVE-006 to FR-SAVE-010 |
| Real Records screen | FR-REC-001 to FR-REC-011 |
| Real Reports screen | FR-REP-001 to FR-REP-007 |
| Future backend readiness | FR-SYNC-001 to FR-SYNC-007 |
| Data integrity | FR-MIG, FR-RES, transaction workflow |
| Maintainability | Drizzle schema, repositories, migrations |
| Field practicality | Offline NFR and managed local files |
| Honest decision support | FR-SAVE-010, FR-REC-008, FR-REP-003 |
| Safe deletion | FR-DEL and FR-IMG-008 |
| Release confidence | Testing requirements and acceptance criteria |

---
