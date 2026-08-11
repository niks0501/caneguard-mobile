# P0-02 — Draft Report Lifecycle

## Source of Truth

**Authoritative architecture:** `ADR-0001-separate-field-reports-from-ai-scan-records.md`

This implementation phase is subordinate to ADR-0001. If this file conflicts with ADR-0001, **ADR-0001 wins**. Do not silently reinterpret, weaken, or bypass the accepted architecture. If implementation reveals a conflict that would change an ADR decision, stop and request architectural review before proceeding.

The following ADR decisions are non-negotiable unless ADR-0001 is superseded:
- one completed Scan Record may have zero or one Field Report;
- a Field Report cannot exist without a completed Scan Record;
- Field Reports may persist as incomplete Drafts;
- Draft-save validation is intentionally weaker than submission validation;
- final report coordinates are required before submission;
- GPS is the primary location source;
- online manual map selection is the P0 fallback when GPS remains unresolved;
- manual-map coordinates must be distinguishable from GPS and must not receive fabricated GPS accuracy;
- offline map caching/downloading is outside P0;
- Field Report owns report lifecycle and synchronization state; and
- finalized reports support foreground connectivity-triggered sync plus manual Sync/Retry.

## Purpose

Implement ADR-0001's persistent Draft behavior so incomplete field work can be saved, closed, reopened, and completed later.

## Entry Conditions

- P0-01 Field Report persistence is complete.
- A Field Report can be created from exactly one completed Scan Record.

## In Scope

- Create a Draft from a completed Scan Record.
- Persist partial edits.
- Resume the same Draft after navigation and app restart.
- Distinguish authoring state from synchronization state.
- Keep Drafts out of the sync queue.

## Out of Scope

- Final form completeness rules.
- GPS and manual map.
- Finalization.
- Server synchronization.

## Global Guardrails

- Preserve existing working Scan Records and managed images.
- Prefer additive migration/change over destructive redesign.
- Keep the existing SQLite/Drizzle local persistence boundary.
- Do not introduce a second local database.
- Do not introduce background GPS, continuous location tracking, offline map packages, or OS-level background sync for P0.
- Do not synchronize Drafts as submitted reports.
- Do not fabricate missing report values.
- Do not copy AI evidence into a second independent scan record.
- Do not delete local evidence merely because synchronization succeeds or fails.
- Do not add ADR-deferred optional report fields to P0 without revisiting the ADR.

## Core Rule

**Required for submission does not mean required for Draft saving.**

A Draft may be missing farmer/farm-owner name, barangay, final coordinates, or other submission-required information. It is a durable local Field Report, not temporary in-memory form state and not a failed upload.

```text
Completed Scan
→ Create Field Report
→ Draft
↺ save partial information
↺ close/reopen
↺ continue editing
→ later phase determines readiness for submission
```

Edits must update the same Field Report identity. They must not duplicate the Scan Record, create a replacement report, or change the original observation time merely because the Draft was edited later.

## Verification

Prove that:
- a Draft can be saved with missing submission-required data;
- partial values persist;
- reopening uses the same Field Report identity;
- app restart does not erase the Draft;
- a Draft never becomes syncable merely by being saved;
- the referenced Scan Record remains unchanged.

Maestro path:
```text
completed scan → create report → enter partial data → save/leave → restart → reopen same Draft → data remains
```

## Required Evidence

Do not mark this phase complete based only on code completion. Record:
- relevant unit/integration test results;
- migration/persistence proof where applicable;
- Maestro E2E result for the user-visible behavior added or protected by this phase;
- screenshots or logs sufficient for review;
- commit SHA or exact worktree state;
- device/emulator and build context; and
- known limitations or skipped checks, stated honestly.

## Exit Criteria

Drafts are durable, resumable, clearly distinguishable from submitted reports, and excluded from synchronization.

## Handoff

P0-03 adds the accepted required P0 report fields while preserving Draft permissiveness.
