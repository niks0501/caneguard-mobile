# 02 — Implementation Plan

The work should be implemented in small, testable phases. Do not perform a one-shot visual rewrite of the whole app.

## Phase 0 — Baseline and scope lock

Before changing UI:

- Run the existing unit/integration test suite.
- Run the existing Maestro baseline flow(s).
- Capture baseline screenshots for the screens being changed.
- Confirm model labels are still Healthy, Mosaic, Rust.
- Confirm the current logo source to preserve.
- Record any pre-existing failures. Do not hide them inside this enhancement.

**Exit:** baseline is documented and scope is locked.

## Phase 1 — Asset contract and unsupported-content cleanup

- Add an app-level reference-photo mapping for only Healthy, Mosaic, Rust.
- Remove Downy Mildew and Smut from supported-class education UI.
- Do not delete source files immediately if other code still references them; first prove they are no longer required.
- Add the three final photo filenames only after the real licensed assets are supplied.
- Do not generate fake disease photos as placeholders.
- Do not add remote image URLs.

**Dependency:** Healthy reference image is currently missing from the approved three-photo set and must be supplied by the user/source-acquisition step.

**Exit:** UI data model cannot accidentally expose unsupported disease reference classes.

## Phase 2 — Branding normalization

Keep the current CaneGuard mark and regenerate/normalize the platform variants.

Update the Expo configuration only after the normalized exports exist.

Target outputs:
- launcher icon
- adaptive foreground
- adaptive background treatment
- monochrome icon
- splash icon

Use the established CaneGuard green/neutral palette from `src/constants/theme.ts`; do not introduce the current unrelated blue splash treatment as a new brand color.

**Exit:** icon/splash assets display consistently in Android launcher, adaptive icon, themed/monochrome icon where supported, and splash.

## Phase 3 — Home and education cleanup

Refactor `src/app/home.tsx`:

- remove decorative hero artwork
- remove decorative offline-sync artwork
- retain a compact greeting/account/location header
- make Start Scan the single dominant CTA
- remove duplicated sync emphasis
- show a three-item real-photo education/reference section for Healthy, Mosaic, Rust
- ensure education copy says “reference” or equivalent and does not imply diagnosis

**Asset gate:** final visual completion of the education section requires the three licensed reference photos.

**Exit:** no unsupported disease card appears on Home.

## Phase 4 — Scan and preview declutter

Refactor:
- `src/app/scan.tsx`
- `src/app/image-preview.tsx`

Scan:
- remove AI-looking/decorative empty-state and leaf assets
- use Feather camera/image icons
- keep clear Capture Photo and Choose from Gallery actions
- reduce helper copy

Preview:
- make user image dominant
- keep Replace/Retake and Analyze obvious
- demote technical 224×224/model pipeline details from normal reading order
- preserve technical behavior and existing error handling

**Exit:** scan workflow remains functionally equivalent with less visual noise.

## Phase 5 — Checklist and result hierarchy

Refactor:
- `src/app/symptom-checklist.tsx`
- `src/app/analysis-result.tsx`

Checklist:
- remove ornament
- standardize selection rows and optional severity control
- preserve statement that checklist observations do not alter model scores

Result:
- show user image first
- result + confidence second
- checklist consistency third
- action/advisory next
- move raw class score table and model diagnostics into lower-priority technical detail
- preserve decision-support language

**Exit:** a user can identify the result and next action without scanning a wall of cards.

## Phase 6 — Records, report, field report, and settings consistency

Refactor without changing data contracts:
- `src/app/records.tsx`
- `src/app/record-details.tsx`
- `src/app/reports.tsx`
- `src/app/field-report.tsx`
- `src/app/settings.tsx`
- shared UI components as needed

Targets:
- reduce stacked banners/cards
- use consistent section headers
- make sync states compact and conditional
- place technical/storage metadata below operational information
- standardize Feather icon use
- eliminate textual/rendered chevron substitutes
- maintain dark mode and accessibility behavior

**Exit:** all core screens share the same visual hierarchy and spacing system.

## Phase 7 — Remove dead decorative asset usage

After all imports are removed, verify whether the following can safely be deleted:

- `assets/svg/sugarcane-hero.svg`
- `assets/svg/offline-sync.svg`
- `assets/svg/scan-empty-state.svg`
- `assets/svg/gold-leaf-corner.svg`
- `assets/svg/header-botanical-wave.svg`

Delete only assets proven unused by code search/build.

Do not delete model fixtures or evidence imagery used by tests.

## Phase 8 — Verification and evidence

Run:
- type check
- lint
- unit/integration tests
- Expo/React Native project health checks already used by the repo
- Maestro end-to-end flows
- Android visual verification in light and dark themes
- offline flow verification
- accessibility smoke checks

Capture evidence for:
- Home
- Scan empty state
- Image Preview
- Symptoms
- Healthy result
- Mosaic result
- Rust result
- Records
- Record details
- Reports
- Field Report
- Settings
- launcher/adaptive/monochrome/splash brand variants

**Final exit:** all acceptance criteria in `06-ACCEPTANCE-CRITERIA.md` pass.
