# P0-06 — Report Finalization and Submission Validation

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

Implement the strict boundary between an editable Draft and a locally finalized report eligible for synchronization.

## Entry Conditions

- P0-03 required report fields persist.
- P0-04 GPS path exists.
- P0-05 manual map path exists.
- A Draft can be reopened and edited.

## In Scope

- Strict submission readiness validation.
- Missing-requirement feedback without losing Draft data.
- Accept GPS-derived or manual-map-derived final coordinates.
- Create submission timestamp only at finalization.
- Preserve observation timestamp.
- Transition the same Field Report into local pending/syncable state.

## Out of Scope

- Actual server upload.
- API payload changes.
- Background synchronization.

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

## Submission Gate

A finalizable report must contain, directly or through its referenced Scan Record:
- original scan image;
- AI-supported result;
- confidence/class scores;
- symptom checklist evidence;
- farmer/farm-owner name;
- authenticated submitter identity and role;
- Batangas;
- Nasugbu;
- barangay;
- final coordinates;
- location source;
- GPS accuracy when final source is GPS; and
- observation time.

Accepted location paths:
```text
GPS → coordinates + actual accuracy + GPS provenance
```
or
```text
manual map → coordinates + manual_map provenance + no fabricated GPS accuracy
```

If requirements are missing, preserve the same Field Report as Draft.

Timestamp meanings must remain distinct: observation time, optional manual location selection time, local submission time, and later successful sync time.

## Verification

Prove that:
- incomplete Draft cannot finalize;
- validation failure preserves Draft data;
- GPS-derived location can satisfy the gate;
- manual-map-derived location can satisfy the gate without GPS accuracy;
- missing coordinates cannot finalize;
- the same Field Report identity transitions to pending.

Prove observation time is unchanged when a Draft is edited, location is added later, or finalization occurs later.

Maestro must cover both complete-in-field and Draft-completed-later finalization.

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

Only submission-ready Field Reports can leave Draft state, and finalization preserves historical timing and location provenance.

## Handoff

P0-07 refactors synchronization so Field Report—not Scan Record—owns the upload lifecycle.
