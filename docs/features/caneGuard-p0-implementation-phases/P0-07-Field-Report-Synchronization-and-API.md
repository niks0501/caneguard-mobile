# P0-07 — Field Report Synchronization and API

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

Move synchronization ownership from Scan Record to Field Report and extend the existing backend contract only as needed for accepted P0 report data and location provenance.

## Entry Conditions

- P0-06 produces finalized pending Field Reports.
- Drafts cannot enter the sync queue.
- Field Report has stable local identity.
- Existing authentication/mobile-report API foundation remains available.

## In Scope

- Refactor sync entry point to Field Report identity.
- Join/load referenced Scan Record AI evidence for upload.
- Extend the existing mobile report payload for accepted P0 context.
- Preserve stable Field Report identity across automatic/manual retries.
- Implement report-owned pending/syncing/synced/failed lifecycle.
- Automatic retry when the running app observes restored usable connectivity.
- Manual Sync/Retry.
- Persist remote identity and successful sync time.

## Out of Scope

- Syncing Drafts.
- OS-level background sync jobs.
- P1 review/status synchronization.
- A new backend service.
- A new API version unless compatibility analysis actually requires it.

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

## Payload Semantics

The server-bound report must represent:
- stable Field Report client identity;
- referenced Scan Record AI/image evidence required by the current API;
- farmer/farm-owner;
- authenticated submitter context as appropriate to the existing auth boundary;
- Batangas / Nasugbu / barangay;
- final coordinates;
- location source;
- GPS accuracy only for GPS-derived final location;
- observation time; and
- local submission time.

Exact API field names are implementation details for this phase.

## Retry and Idempotency

Automatic and manual retry must target the **same logical Field Report**. Never create a new client identity per attempt, clone the local report to retry, or duplicate the referenced scan.

If the app was closed while offline, the next launch may discover pending reports and process them under the accepted foreground sync behavior.

## Verification

Prove locally that:
- Drafts are excluded;
- finalized pending report can sync;
- failure preserves local report;
- retry reuses the same Field Report identity;
- success stores remote identity and sync time;
- local evidence remains after success.

Prove at the API boundary that:
- accepted P0 report fields are represented;
- GPS/manual provenance is distinguishable;
- manual location does not require fake GPS accuracy;
- repeat submission using the same stable identity does not create duplicate reports.

Maestro path:
```text
finalize offline → pending → restore connectivity → automatic or manual sync → synced → restart → same report remains synced
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

Field Report is the authoritative sync owner and survives offline finalization, failed upload, retry, and successful idempotent synchronization.

## Handoff

P0-08 performs full architectural conformance and final acceptance evidence.
