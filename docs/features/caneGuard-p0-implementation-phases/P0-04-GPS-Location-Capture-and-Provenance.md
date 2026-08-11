# P0-04 — GPS Location Capture and Provenance

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

Implement foreground GPS as the primary Field Report location source while preserving honest accuracy/provenance and Draft safety when GPS is unresolved.

## Entry Conditions

- P0-03 report fields and Draft persistence are complete.
- A location implementation compatible with the current app has been selected.
- The choice does not introduce background or continuous location.

## In Scope

- Foreground permission handling.
- Point-in-time GPS capture.
- Persist coordinates and device-reported accuracy when available.
- Represent resolved, low-accuracy/unresolved, denied, and unavailable outcomes.
- Preserve useful GPS-attempt evidence for later manual fallback.
- Retry without losing Draft contents.

## Out of Scope

- Background GPS.
- Continuous tracking.
- Manual map pinning.
- Offline maps.
- A hard guarantee that GPS reaches five meters.

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

## Location Rules

GPS remains the primary source. The approximately five-meter value mentioned in the interview is a field-quality reference, **not** a guaranteed capability. ADR-0001 intentionally leaves exact retry/timeout behavior to implementation planning.

If GPS becomes the final report location:
- store final coordinates;
- mark the source as GPS conceptually;
- preserve the actual device-reported accuracy.

If GPS is poor, denied, or unavailable:
- do not fabricate coordinates;
- do not claim the preferred target was met;
- preserve the Draft and any useful attempt metadata;
- allow later P0-05 map fallback.

## Verification

Cover at least:
- resolved GPS with coordinates + accuracy;
- poor accuracy;
- permission denied;
- service/device unavailable;
- retry;
- correct cleanup of foreground location resources.

Prove GPS failure never deletes Draft content or mutates AI evidence.

Maestro should cover one resolved GPS path and one denied/unresolved path that preserves the Draft.

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

GPS can provide honest final location evidence or safely leave the report unresolved as Draft without data loss.

## Handoff

P0-05 implements the accepted online manual-map fallback.
