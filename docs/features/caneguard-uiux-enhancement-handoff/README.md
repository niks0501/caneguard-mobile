# CaneGuard Mobile UI/UX Enhancement Handoff

This package is an implementation handoff for the **existing `caneguard-mobile` repository**. It is designed to be committed to the repository so an AI coding agent can implement the visual/UX cleanup without inventing new product scope.

## Primary outcome

Improve the current CaneGuard Android UI so it is calmer, clearer, more field-usable, and less dependent on decorative or AI-looking visuals.

The enhancement must preserve the current product contract:

- CaneGuard remains an **offline-first, AI-assisted decision-support application**.
- The on-device model currently supports exactly **Healthy, Mosaic, and Rust**.
- Keep the **current CaneGuard mark/logo**. Do not replace the brand.
- Keep the existing **Feather** icon library. Do not add a second icon library.
- Disease education/reference imagery must use **real, properly licensed photos**.
- Do not add hero photography, decorative illustrations, unsupported-disease photos, remote image dependencies, or map artwork.
- The generated mockup in `references/` is **visual direction only**, not a feature contract.

## Important current-state facts found in the repository

The model contract at `src/features/detection/constants/modelContract.ts` declares:

`MODEL_LABELS = ['healthy', 'mosaic', 'rust']`

The home screen currently references four disease examples, including **Downy Mildew** and **Smut**, from `src/app/home.tsx`. Those two images must be removed from user-facing education/gallery surfaces because they are outside the current model's supported classes.

Current custom/decorative SVG assets include:

- `assets/svg/sugarcane-hero.svg`
- `assets/svg/offline-sync.svg`
- `assets/svg/scan-empty-state.svg`
- `assets/svg/gold-leaf-corner.svg`
- `assets/svg/header-botanical-wave.svg`

The enhancement should remove these from user-facing screens when a standard Feather icon, typography, whitespace, border, or status treatment can communicate the same thing.

## Package map

- `00-FINAL-DECISIONS.md` — source-of-truth product/design decisions.
- `01-CURRENT-STATE-AUDIT.md` — repository-specific UX and visual issues.
- `02-IMPLEMENTATION-PLAN.md` — phased implementation order and dependency gates.
- `03-SCREEN-SPECS.md` — screen-by-screen target behavior and layout direction.
- `04-ASSET-ACQUISITION.md` — exact images/exports needed before the agent can finish.
- `05-CHANGESET-MAP.md` — likely code/assets to touch.
- `06-ACCEPTANCE-CRITERIA.md` — definition of done.
- `assets-to-provide/ASSET-MANIFEST.csv` — fill this when the three real photos are acquired.
- `assets-to-provide/asset-manifest.json` — machine-readable asset contract for an agent.
- `assets-to-provide/PUT-ASSETS-HERE.md` — exact filenames and placement instructions.
- `testing/MAESTRO-TEST-PLAN.md` — E2E evidence expectations.
- `agent/IMPLEMENTATION-PROMPT.md` — ready-to-paste agent instruction.
- `references/caneguard-uiux-mockup-reference.png` — generated visual reference only.

## Recommended repo location

Commit this folder under a documentation path such as:

`docs/features/caneguard-uiux-enhancement/`

Do **not** copy the three final disease images into this documentation folder. Once acquired and licensed, place them in the app asset location defined in `04-ASSET-ACQUISITION.md`.

## Non-goals

This handoff does not approve new domain features. Do not implement fields/farms management, new onboarding, new disease classes, a new map feature, remote-image loading, or a new icon system just because something similar appears in the mockup.

The implementation should improve the UI around the capabilities already present in the repository.
