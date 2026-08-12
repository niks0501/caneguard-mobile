# 00 — Final Decisions

## Product and model scope

CaneGuard's current mobile classifier supports only:

1. Healthy
2. Mosaic
3. Rust

This is confirmed by `MODEL_LABELS` in `src/features/detection/constants/modelContract.ts`.

Any education gallery, class legend, class filter, disease reference card, or result-specific reference content introduced by this enhancement must remain aligned to those three classes.

**Do not display Downy Mildew or Smut as supported model classes.**

## Branding decision

Keep the current CaneGuard brand mark. The later decision to retain the existing mark supersedes any earlier idea to replace or redesign it.

Required work is normalization/export, not rebranding:

- launcher icon
- Android adaptive icon foreground/background treatment
- Android monochrome icon
- splash icon
- any equivalent existing platform icon entry already required by Expo

Do not create a new logo concept.

## Icon decision

Keep `@expo/vector-icons/Feather`.

Do not add Material Icons, Lucide, Font Awesome, custom rendered icon PNGs, or AI-generated icons solely for this enhancement.

Use Feather icons for navigation, status, upload/camera actions, settings rows, warnings, sync, search, and other utility actions.

## Imagery decision

The only new photographic assets approved for this enhancement are:

- one real Healthy sugarcane reference photo
- one real Mosaic sugarcane reference photo
- one real Rust sugarcane reference photo

These are **education/reference-only assets**. They must not be presented as proof that a user's scan has a disease.

The user's own captured/selected image remains the primary visual on scan preview, result, record details, and report evidence screens.

## Visual cleanup decision

Remove decorative visuals that do not carry essential information when implementing the enhanced UI. In particular, user-facing dependencies on the following existing decorative SVGs should be eliminated unless a strong functional reason is documented:

- `sugarcane-hero.svg`
- `offline-sync.svg`
- `scan-empty-state.svg`
- `gold-leaf-corner.svg`
- `header-botanical-wave.svg`

Prefer:

- spacing
- typography
- solid/tonal surfaces
- borders
- existing theme colors
- Feather icons
- real reference photos only where education benefits from them

## Mockup status

`references/caneguard-uiux-mockup-reference.png` is a visual mood/reference board.

It is **not** authorization to add:
- field/farm management
- onboarding
- a new history domain
- new disease classes
- a new capture engine
- a remote photo service

When the mockup conflicts with the current repository capability, the repository capability wins.
