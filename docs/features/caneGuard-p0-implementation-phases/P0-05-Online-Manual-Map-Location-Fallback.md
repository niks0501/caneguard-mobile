# P0-05 — Online Manual Map Location Fallback

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

Allow an inspector to reopen an unresolved Draft with internet access and manually pinpoint the observation location when GPS could not resolve it in the field.

## Entry Conditions

- P0-04 distinguishes resolved GPS from unresolved/poor/denied GPS.
- Drafts survive restart.
- An online mapping implementation compatible with the app has been selected.
- Offline map caching is not part of the selected P0 design.

## In Scope

- Open an online map for unresolved location.
- Allow manual coordinate selection/pin placement.
- Persist final coordinates and manual-map provenance.
- Preserve relevant prior GPS-attempt evidence.
- Return the user to the same Draft after selection.
- Optional online search/geocoding may be used only as a user aid if available.

## Out of Scope

- Offline map tile packages/downloads.
- Background map downloads.
- Requiring geocoding/search text as report data.
- Fabricating GPS accuracy for manual coordinates.

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

## Accepted Recovery Scenario

```text
field visit → GPS unresolved → no usable online map → save Draft
→ return to office → internet available → reopen Draft
→ open map → manually pinpoint location → save final location
```

For manual map final location:
- final coordinates are the inspector-selected coordinates;
- source is conceptually `manual_map`;
- final GPS accuracy is null/not applicable;
- the UI/data must not present the manual point as GPS-measured;
- relevant prior GPS-attempt evidence may remain as history.

If the map cannot load, keep the report as Draft. Never force a guessed location.

## Verification

Prove that:
- unresolved GPS can expose the map fallback when online;
- a manual pin is stored on the same Draft;
- manual provenance is distinguishable from GPS;
- no GPS accuracy is invented;
- prior GPS-attempt evidence is not silently rewritten;
- unavailable map leaves the Draft intact.

Maestro path:
```text
Draft with unresolved GPS → connectivity available → open map → select location → save → reopen → manual location remains
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

An unresolved Draft can be completed online with a manual pin without corrupting location provenance; no offline-map infrastructure is added.

## Handoff

P0-06 applies strict final submission validation using either GPS or manual-map final coordinates.
