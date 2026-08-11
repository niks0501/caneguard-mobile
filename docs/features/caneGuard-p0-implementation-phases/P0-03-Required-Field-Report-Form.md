# P0-03 — Required Field Report Form

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

Implement only the accepted required/automatic P0 report information and persist it into Draft Field Reports.

## Entry Conditions

- P0-02 Draft persistence is complete.
- The same Draft can be resumed and updated.

## In Scope

- Farmer/farm-owner name.
- Submitter identity and role from authenticated context.
- Province automatic as Batangas.
- Municipality automatic as Nasugbu.
- Barangay.
- Read-only/inherited Scan Record evidence needed to understand the report.
- Automatic observation-time representation.
- Draft-safe field validation.

## Out of Scope

- GPS coordinates and map selection.
- Strict final submission validation.
- Optional fields deferred by ADR-0001.
- Sync/API work.

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

## Accepted P0 Field Rules

| Field | Rule |
|---|---|
| Original scan image | Required; inherited from Scan Record |
| AI-supported result | Required; inherited |
| Confidence/class scores | Required; inherited |
| Symptom checklist | Required; inherited |
| Farmer/farm-owner name | Required for submission; may be blank in Draft |
| Submitter identity | Automatic from authenticated user |
| Submitter role | Automatic from authenticated user |
| Province | Automatic: Batangas |
| Municipality | Automatic: Nasugbu |
| Barangay | Required for submission; may be blank in Draft |
| Date/time observed | Automatic |
| Date/time submitted | Created only during finalization |

Do **not** add as P0-required scope: farmer contact, sitio/free-form location, variety, crop age, cane class, affected area/count, notes, or assistance/action.

The user must not be able to edit AI evidence as though it were report-entered data.

## Verification

Prove that:
- automatic Batangas/Nasugbu values behave as designed;
- submitter identity/role comes from authenticated context rather than free-form entry;
- farmer/farm-owner and barangay persist when entered;
- either may still be missing while Draft;
- inherited AI evidence remains unchanged.

Maestro path:
```text
open Draft → enter farmer/farm-owner → enter/select barangay → save Draft → reopen → values persist
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

All accepted non-location P0 fields are represented and persisted without accidentally adding ADR-deferred optional scope.

## Handoff

P0-04 adds primary GPS capture and location provenance.
