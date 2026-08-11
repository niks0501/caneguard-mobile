# P0-01 — Field Report Domain and Database Migration

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

Introduce Field Report as a separate persisted domain concept while preserving Scan Record as authoritative AI evidence.

## Entry Conditions

- P0-00 baseline passes.
- Existing local database is readable.
- Current Scan Records and managed images are preserved before migration.

## In Scope

- Add Field Report persistence within existing SQLite/Drizzle.
- Enforce one completed Scan Record → zero-or-one Field Report.
- Keep Field Report identity separate from Scan Record identity.
- Establish report authoring state and fields needed by later phases.
- Preserve legacy report-like Scan Record fields only for compatibility, not as new authority.

## Out of Scope

- Full report form UI.
- Draft UX beyond basic representability.
- GPS/map implementation.
- Backend/API payload extension.
- Automatic sync behavior.

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

## Required Domain Shape

The Field Report must be able to represent, conceptually:
- stable local Field Report identity;
- exactly one referenced completed Scan Record;
- report authoring state including Draft;
- incomplete P0 report data while Draft;
- final coordinates and location source when resolved;
- GPS accuracy only when applicable;
- distinct observation/submission/sync timing semantics; and
- report-owned synchronization lifecycle fields for later phases.

Exact table/column names remain implementation details.

## Migration Rules

- Use an additive migration.
- Existing Scan Records remain readable.
- Existing managed image references remain valid.
- Do not auto-create Field Reports for all historical scans without a separate requirement.
- Enforce uniqueness so the same Scan Record cannot have two Field Reports.
- A Field Report cannot reference a nonexistent Scan Record.

## Verification

Prove with migration/repository tests that:
- existing Scan Records survive;
- a Scan Record can exist without a Field Report;
- one valid Field Report can reference a completed Scan Record;
- a nonexistent Scan Record cannot be referenced;
- a second Field Report for the same Scan Record is rejected.

Rerun the P0-00 Maestro scan regression after migration.

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

Scan Record and Field Report are distinct persisted concepts; the 0..1 relationship is enforced; existing scan evidence is intact; and the scan regression still passes.

## Handoff

P0-02 adds durable Draft lifecycle and resume/edit semantics on this persistence boundary.
