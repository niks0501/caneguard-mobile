# 04 — Asset Acquisition and Patch Contract

This file defines the **exact asset list needed to finish the UI/UX enhancement**.

## A. User/source-acquisition assets — REQUIRED

Only **three new real photographic assets** are required.

### 1. Healthy reference photo

Target filename:

`assets/images/sugarcane-diseases/reference_healthy.jpg`

Requirements:
- real sugarcane photograph
- visibly healthy leaf/plant appearance
- clear enough to read at mobile-card size
- no overlaid text/watermark covering symptoms
- properly licensed for the project's intended use
- source and license recorded in `ASSET-MANIFEST.csv`
- not an AI-generated image

### 2. Mosaic reference photo

Target filename:

`assets/images/sugarcane-diseases/reference_mosaic.jpg`

Requirements:
- real sugarcane image showing Mosaic-like mottling/discoloration appropriate to the class used by the capstone
- license evidence recorded
- not AI-generated
- no remote runtime dependency

### 3. Rust reference photo

Target filename:

`assets/images/sugarcane-diseases/reference_rust.jpg`

Requirements:
- real sugarcane image showing rust-colored spots/pustules appropriate to the supported Rust class
- license evidence recorded
- not AI-generated
- no remote runtime dependency

## B. Branding exports — DERIVED FROM EXISTING CANEGUARD MARK

These do **not** require sourcing a new image. They must be exported/normalized from the current approved CaneGuard mark.

Expected app outputs:

- `assets/images/icon.png`
- `assets/images/android-icon-foreground.png`
- `assets/images/android-icon-background.png` **only if the final adaptive treatment still requires an image background; otherwise prefer a configured brand color**
- `assets/images/android-icon-monochrome.png`
- `assets/images/splash-icon.png`
- existing iOS/Expo icon representation if required by the current project configuration

### Branding rules

- Preserve the recognizable current CaneGuard mark.
- Keep sufficient safe-zone around the mark for Android adaptive cropping.
- Monochrome asset must be truly single-color/mask-friendly.
- Do not bake a square background into the adaptive foreground.
- Splash icon should be simple, centered, and legible at small display width.
- Normalize splash/adaptive backgrounds to the CaneGuard green/neutral palette.
- Do not invent a new shield/leaf logo.

## C. Existing assets to retire from user-facing UI

Once code no longer imports them, verify and remove if unused:

- `assets/images/sugarcane-diseases/sugarcane_downey_mildew.jpg`
- `assets/images/sugarcane-diseases/sugarcane_smut.jpg`
- `assets/svg/sugarcane-hero.svg`
- `assets/svg/offline-sync.svg`
- `assets/svg/scan-empty-state.svg`
- `assets/svg/gold-leaf-corner.svg`
- `assets/svg/header-botanical-wave.svg`

For existing Mosaic/Rust photos, do not assume their license is acceptable simply because they are already in the repository. The final reference-photo set must have license/source evidence. The agent may reuse an existing image **only when its license is verified and recorded**.

## D. License evidence minimum

For each real photo, record:

- local filename
- class
- original source page
- original image/source identifier
- author/organization
- license name
- license URL or license evidence reference
- attribution text if required
- access date
- crop/edit notes
- reviewer approval/status

Preferred licensing characteristics:
- public domain, government/open-use, or clear Creative Commons reuse
- attribution-compatible with a student capstone
- no ambiguous “found on Google Images” sourcing

## E. What NOT to acquire

Do not spend time sourcing:
- hero photography
- farm background photography
- decorative sugarcane illustrations
- “AI” robot/brain graphics
- remote map images
- icons
- Downy Mildew reference photos
- Smut reference photos
- any unsupported disease class
- extra “before/after” photos

## F. Agent behavior when assets are missing

If any of the three real photos is missing:

1. Continue implementing layout and component cleanup where possible.
2. Use a neutral placeholder container with class text **only during development**.
3. Do not generate a fake disease photo.
4. Do not download a random remote image.
5. Report the exact missing filename as a blocker to final visual acceptance.
6. Do not mark the enhancement complete until all three final licensed photos are present and the manifest is filled.

## Final acquisition checklist

- [ ] `reference_healthy.jpg`
- [ ] `reference_mosaic.jpg`
- [ ] `reference_rust.jpg`
- [ ] License/source row completed for Healthy
- [ ] License/source row completed for Mosaic
- [ ] License/source row completed for Rust
- [ ] Existing CaneGuard mark confirmed as branding source
- [ ] Launcher icon normalized
- [ ] Adaptive icon normalized
- [ ] Monochrome icon normalized
- [ ] Splash icon normalized
