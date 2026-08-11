# P0-08 — End-to-End Acceptance and Evidence

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

Prove that the complete P0 implementation conforms to ADR-0001. This phase adds no new product scope.

## Entry Conditions

- P0-00 through P0-07 are complete.
- Known blocking failures are resolved.
- The intended Android development build can run in the test environment.

## In Scope

- Full scan regression.
- Draft persistence/restart.
- Complete-in-field GPS path.
- Draft-completed-later manual map path.
- Offline finalization.
- Foreground connectivity recovery.
- Manual Sync/Retry.
- Idempotency and local-evidence retention.
- Evidence consolidation and device smoke test where available.

## Out of Scope

- New optional fields.
- P1 review/status workflow.
- Push notifications.
- Offline maps.
- Background GPS or background sync.
- Any architecture not accepted by ADR-0001.

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

## Required E2E Path A — Complete in Field

```text
AI scan
→ symptom validation
→ completed Scan Record
→ create Field Report
→ enter required information
→ acceptable GPS location
→ finalize locally
→ pending sync
→ connectivity available
→ sync
→ report remains locally retrievable
```

## Required E2E Path B — Incomplete in Field, Completed Later

```text
AI scan
→ completed Scan Record
→ create Field Report
→ information and/or GPS unresolved
→ save Draft
→ close/restart app
→ Draft remains intact
→ later internet available
→ reopen Draft
→ online map
→ manually pinpoint location
→ complete remaining required fields
→ finalize locally
→ sync
→ report remains locally retrievable
```

## Architectural Conformance Checklist

Confirm:
- Scan Record and Field Report remain distinct.
- One Scan Record has zero or one Field Report.
- Draft accepts missing submission data and survives restart.
- Draft never synchronizes as submitted.
- GPS is primary and stores actual accuracy.
- unresolved GPS can remain Draft.
- online manual map can resolve location later.
- manual map is explicitly manual and has no fake GPS accuracy.
- final coordinates are required before finalization.
- observation and submission times remain distinct.
- Field Report owns sync lifecycle.
- restored foreground connectivity can trigger sync.
- manual Sync/Retry works.
- retry uses the same Field Report identity.
- duplicate server reports are not created by retry.
- synced local evidence remains available.
- no offline-map, background-location, or OS-level background-sync architecture was introduced.

## Verification

Use all applicable verification layers available in the project:
- unit/domain tests;
- persistence/migration tests;
- API/integration tests;
- Maestro E2E;
- physical Android smoke testing where available.

Do not declare P0 complete if Draft is lost after restart, Draft can sync, finalization can occur without resolved coordinates, manual coordinates are labeled as GPS, retry duplicates server reports, sync deletes local evidence, or the scan/report relationship violates ADR-0001.

Compile a final evidence record that maps ADR-0001 to the phase results and both E2E paths.

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

P0 is complete when a field inspector can perform one AI-supported scan, preserve the completed Scan Record, create a Field Report, save incomplete work as Draft, complete it later, resolve location through GPS or the accepted online manual-map fallback, finalize locally without immediate connectivity, and synchronize the same report later without duplication or loss of local evidence.

## Handoff

Any P1 planning must treat ADR-0001 and the P0 evidence package as the baseline. If the ADR is superseded, these implementation files must be reviewed.
