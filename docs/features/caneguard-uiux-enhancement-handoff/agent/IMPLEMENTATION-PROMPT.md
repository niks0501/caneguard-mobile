# Agent Implementation Prompt

You are implementing the CaneGuard Mobile UI/UX enhancement described in this folder.

Read, in order:

1. `README.md`
2. `00-FINAL-DECISIONS.md`
3. `01-CURRENT-STATE-AUDIT.md`
4. `02-IMPLEMENTATION-PLAN.md`
5. `03-SCREEN-SPECS.md`
6. `04-ASSET-ACQUISITION.md`
7. `05-CHANGESET-MAP.md`
8. `06-ACCEPTANCE-CRITERIA.md`
9. `testing/MAESTRO-TEST-PLAN.md`

## Hard constraints

- Work against the current repository, not the mockup as a literal product specification.
- Supported model classes are Healthy, Mosaic, Rust only.
- Do not change the model, preprocessing, inference, confidence math, or checklist logic as part of this UI enhancement.
- Keep the current CaneGuard logo/mark.
- Keep Feather icons. Do not add another icon library.
- Do not use AI-generated disease photos.
- Do not fetch or ship remote disease images.
- Do not add hero photography or decorative illustrations.
- Do not add unsupported disease reference content.
- Do not invent new product features such as farm/field management or onboarding just because they appear in the visual mockup.
- Preserve offline-first behavior, local record storage, field report flow, synchronization semantics, accessibility behavior, and dark mode.

## Asset blocker rule

The final education gallery cannot be marked complete until all of these exist:

- `assets/images/sugarcane-diseases/reference_healthy.jpg`
- `assets/images/sugarcane-diseases/reference_mosaic.jpg`
- `assets/images/sugarcane-diseases/reference_rust.jpg`

and license/source evidence is completed.

If missing, implement the surrounding layout with neutral development placeholders, but do not generate or download fake replacements.

## Implementation behavior

- Work phase by phase.
- At the start of each phase, inspect the files involved and existing tests.
- Make the smallest coherent changes necessary.
- Prefer existing components/tokens.
- Do not over-engineer a new design system.
- Add/refine shared primitives only when there is clear duplication.
- After each phase, run relevant automated tests and Maestro coverage.
- Do not delete assets until code search proves they are unused.
- Keep a short implementation/evidence note per phase.

## Completion response

When finished, report:

1. files changed
2. UI changes by screen
3. assets added/removed
4. test commands and results
5. Maestro evidence
6. any missing asset/license blocker
7. whether a new native build was used to verify launcher/adaptive/monochrome/splash branding
