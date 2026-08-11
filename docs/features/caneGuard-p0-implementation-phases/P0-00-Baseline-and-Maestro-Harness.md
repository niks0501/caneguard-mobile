# P0-00 — Baseline and Maestro Harness

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

Protect the existing CaneGuard AI-supported scan path before any P0 structural change. Establish the Maestro harness and evidence convention that every later phase will use.

## Entry Conditions

- ADR-0001 is accepted.
- The current mobile application can launch in the team's normal development environment.
- The existing scan flow is available for regression testing.

## In Scope

- Establish the P0 Maestro workspace and naming convention.
- Add stable automation selectors needed by the existing scan flow.
- Create a deterministic regression path from image acquisition through completed AI-supported result.
- Establish a P0 evidence log/convention.
- Record the repository baseline before P0 changes.

## Out of Scope

- No Field Report entity or migration.
- No Draft lifecycle.
- No GPS or map.
- No finalization or sync refactor.

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

## Baseline Flow

Protect this existing path:

```text
Select/capture sugarcane image
→ AI processing
→ symptom validation
→ completed AI-supported result
→ existing persisted/retrievable Scan Record behavior
```

Stable selectors must reflect user intent, not layout position. Do not add hidden test-only shortcuts, bypass inference, or seed fake success states into production storage.

Organize Maestro flows so later phases can add phase-specific tests without replacing this regression. The evidence log must be able to associate a result with a phase, code state, device/build, artifact, and limitation.

## Verification

- Run the repository's existing lint/typecheck/unit tests that are applicable to the baseline.
- Run the Maestro baseline through the real user path.
- Confirm the existing Scan Record behavior still works.
- If the baseline is already broken, stop here and repair/understand it before P0-01.

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

The existing scan path is repeatable, Maestro can drive it, evidence conventions exist, and no P0 reporting architecture has yet been introduced.

## Handoff

P0-01 may begin only after this regression baseline is stable.
