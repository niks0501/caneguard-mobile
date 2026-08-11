# CaneGuard Drizzle + SQLite Phase Execution Plan

**Application:** CaneGuard  
**Project title:** *An AI-Based Disease Detection Android Application for Sugarcane in Nasugbu, Batangas*  
**Source requirements version:** 1.0  
**Source document status:** Approved implementation baseline  

**Repository:** `niks0501/caneguard-mobile`  
**Branch:** `feat/drizzle-sqlite-scan-records`  
**Stack:** Drizzle ORM + Expo SQLite + Expo FileSystem + Expo Crypto  
**Primary platform:** Android  
**Execution mode:** One phase at a time; do not continue past an unmet exit criterion


## What this packet is

This packet converts the approved local-persistence requirements into seven smaller implementation phases that a coding agent or development team can execute sequentially.

The packet preserves the full intent of the approved requirements while reducing the amount of context required for each execution step. The original requirements remain the source contract. This packet reorganizes them; it does not reduce their scope.

## Required reading order

1. `01-SHARED-CONTRACT.md`
2. `02-PHASE-0-COMPATIBILITY-SPIKE.md`
3. `03-PHASE-1-DATABASE-FOUNDATION.md`
4. `04-PHASE-2-MANAGED-IMAGE-STORAGE.md`
5. `05-PHASE-3-SAVE-COMPLETED-SCAN.md`
6. `06-PHASE-4-RECORDS-INTEGRATION.md`
7. `07-PHASE-5-REPORTS-INTEGRATION.md`
8. `08-PHASE-6-RELIABILITY-RELEASE.md`
9. `09-TRACEABILITY-MATRIX.md`

The coding agent must read the shared contract before every phase. A phase may be started only after the previous phase's exit criteria have been met and documented.

## Phase map

| Phase | Outcome | Primary user-visible change |
|---|---|---|
| 0 — Compatibility spike | Drizzle, migrations, Expo SQLite, Metro, EAS, and TFLite are proven compatible | None; technical proof only |
| 1 — Database foundation | Typed schema, migrations, provider, errors, and diagnostics exist | Storage initialization states |
| 2 — Managed image storage | Scan images can be copied, checked, and cleaned up safely | No permanent UI change yet |
| 3 — Save completed scan | A real completed AI analysis can be saved offline | Save Record flow |
| 4 — Records integration | Saved records can be listed, searched, filtered, opened, and deleted | Real Records and Record Details |
| 5 — Reports integration | Report summaries are calculated from actual local records | Real Reports |
| 6 — Reliability and release | Migrations, performance, device behavior, documentation, and release evidence are complete | Release-ready local workflow |

## Execution rules

- Work only on the current phase.
- Do not silently resolve an open decision. Record the decision and its rationale.
- Do not continue when a stop condition is triggered.
- Keep the worktree clean at each handoff.
- Commit generated migrations and snapshots with the schema change that produced them.
- Run the required checks after every package, Metro, Babel, migration, or native configuration change.
- Never claim Android device validation unless it was performed on an actual device or approved emulator path.
- Preserve the existing model contract, preprocessing behavior, inference pipeline, and `.tflite` asset.
- Authentication, backend APIs, actual synchronization, GPS collection, and new disease classes remain outside this feature.

## Shared completion flow

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

## Handoff discipline

At the end of every phase, provide:

- completed deliverables;
- files created or modified;
- tests and commands run;
- results and unresolved warnings;
- device or build evidence, when required;
- decisions made;
- known limitations;
- the exact commit SHA;
- confirmation that the next phase may or may not begin.

Use `10-HANDOFF-TEMPLATE.md` for that report.
