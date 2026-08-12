# 01 — Current-State Audit

This audit is based on the current `caneguard-mobile` repository structure inspected during preparation of this handoff.

## Highest-priority alignment issue

`src/features/detection/constants/modelContract.ts` supports only `healthy`, `mosaic`, and `rust`.

However, `src/app/home.tsx` currently defines a `DISEASES` array containing:

- Downy Mildew
- Sugarcane Smut
- Mosaic Disease
- Sugarcane Rust

and references four local JPG files under `assets/images/sugarcane-diseases/`.

This creates a product-scope mismatch. The UI can make users think CaneGuard supports disease classes that the model does not classify.

### Required correction

Replace the current home education content with exactly three supported reference classes: Healthy, Mosaic, Rust.

Do not simply relabel Downy Mildew or Smut imagery. Remove those unsupported cards from the supported-class education surface.

---

## Home screen — `src/app/home.tsx`

### Current strengths

- Clear primary Start Scan action.
- Existing local/offline status concepts.
- Feather icons already used.
- Existing theme tokens provide a consistent palette.
- Local disease images are already wired as bundled assets.

### Current issues

- Decorative `sugarcane-hero.svg` dominates the top area without adding task value.
- `offline-sync.svg` duplicates information already expressed by text and status.
- Four disease cards conflict with the three-class model.
- Sync appears both as a quick action and a dedicated unsent-report card, creating duplicate emphasis.
- The screen has several visual containers competing for first attention.

### Enhancement direction

Use a simple header/greeting, one dominant Start Scan CTA, two or three secondary destinations, a compact pending-sync status if needed, and a three-item real-photo education section.

---

## Scan screen — `src/app/scan.tsx`

### Current issues

- `scan-empty-state.svg` is a decorative empty-state illustration where a simple Feather `image` or `camera` icon would be clearer.
- `gold-leaf-corner.svg` decorates the decision-support disclaimer without adding meaning.
- Upload/gallery and capture actions are correct, but the amount of explanatory content makes the screen feel heavier than the task.
- The photo quality guide can be retained but simplified.

### Enhancement direction

Make the capture area and two source actions the visual center. Use a Feather icon for empty state. Keep only short, actionable photo guidance and the decision-support disclaimer.

---

## Image Preview — `src/app/image-preview.tsx`

### Current strengths

The user's actual selected image is already the main visual.

### Current issues

User-facing text exposes implementation details such as exact 224 × 224 RGB model input and preprocessing state. These are useful for debugging/evidence but not necessary for the normal farmer/field-reporter flow.

### Enhancement direction

Keep image, replace/retake, and Analyze as the primary hierarchy. Keep model/pipeline diagnostics behind a technical-details/dev affordance or make them non-dominant. Do not alter the actual preprocessing contract as part of a UI-only enhancement.

---

## Symptom Checklist — `src/app/symptom-checklist.tsx`

### Current strengths

The checklist correctly states that observations are compared with, but do not change, model scores.

### Current issues

The decorative bottom ornament is unnecessary. Severity controls and checklist items should feel like one coherent form rather than separate visual treatments.

### Enhancement direction

Use clean selectable rows, a compact optional severity selector, and one Continue CTA. Preserve the important independence statement between symptom observations and model scores.

---

## Analysis Result — `src/app/analysis-result.tsx`

### Current strengths

- Uses the user's scan image.
- Frames non-Healthy predictions as possible results.
- Shows image quality warnings.
- Separates checklist consistency from model scores.
- Includes a decision-support limitation.

### Current issues

The screen carries many blocks at equal visual weight: result, confidence, quality notices, all class scores, checklist consistency, advice/details, and actions. This makes the most important answer harder to parse.

### Enhancement direction

Prioritize:
1. user's image
2. result label/message
3. confidence
4. checklist consistency
5. one clear next action

Move all class scores and model/version/processing details to a lower-priority “Technical details” section. Do not introduce disease stock imagery into the result card.

---

## Records — `src/app/records.tsx`

### Current strengths

Search, filters, local persistence messaging, synchronization status, and pagination already exist.

### Current issues

Intro persistence card + `SyncStatusPanel` + search + filters stack several controls before the record list.

### Enhancement direction

Compress persistence/sync state into a small status row or conditional banner. Search should be immediately available. Filters stay as chips. Record list remains the dominant content.

---

## Record Details — `src/app/record-details.tsx`

### Current strengths

The record preserves image evidence, class scores, checklist context, report state, synchronization state, and processing metadata.

### Current issue

The screen is necessarily information-heavy but currently exposes many technical/storage fields in the main scroll, including model version, preprocessing/inference/total timing, remote UUID, and synchronization metadata.

### Enhancement direction

Group into:
- Result summary
- Field report state/action
- Observation details
- Synchronization state
- Technical details (collapsed/lowest priority)
- Destructive local delete action at the end

No new decorative visuals.

---

## Reports — `src/app/reports.tsx`

### Current strengths

Useful local summary, class breakdown, pending sync count, prototype caveat, and recent records.

### Current issue

Several large cards create a dashboard-within-a-dashboard feeling.

### Enhancement direction

Keep the same data but reduce card nesting and visual weight. Use whitespace, dividers, and small status icons. No hero art, decorative illustrations, or unsupported map imagery.

---

## Field Report — `src/app/field-report.tsx`

### Current strengths

Draft/finalized states, local saving, location capture, manual map fallback, inherited scan evidence, and synchronization are already represented.

### Current issue

Long form/state information can become visually dense.

### Enhancement direction

Use progressive disclosure and group content into:
- report status
- required form fields
- location
- inherited scan evidence
- finalize/sync actions

Do not add custom map assets. The online map fallback is a functional map view, not a place for decorative map imagery.

---

## Settings — `src/app/settings.tsx`

### Current issue

Some rows trigger “future update” alerts. The textual `>` chevron is inconsistent with the existing Feather icon strategy.

### Enhancement direction

Use Feather `chevron-right` for navigable rows. Do not visually present unfinished features as fully available. Keep account, accessibility, display, and about sections clean and conventional.

---

## Branding/configuration — `app.json`

Current configuration includes:

- app icon: `assets/images/icon.png`
- adaptive foreground: `assets/images/android-icon-foreground.png`
- adaptive background image: `assets/images/android-icon-background.png`
- monochrome icon: `assets/images/android-icon-monochrome.png`
- splash icon: `assets/images/splash-icon.png`

The current splash background is blue and the adaptive background is also configured with a pale blue. These should be normalized to the established CaneGuard green/neutral visual system while keeping the current brand mark.
