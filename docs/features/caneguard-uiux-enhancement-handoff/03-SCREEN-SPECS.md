# 03 — Screen-by-Screen Target Specs

These are implementation specifications, not pixel-perfect mandates. Reuse existing theme tokens and components before inventing new abstractions.

## Global visual rules

### Hierarchy

Every screen should have one primary job.

Use this priority:
1. task/result
2. required context
3. optional supporting context
4. technical details

Do not make all four levels look like equal cards.

### Surfaces

Prefer a white/neutral page with selective tonal sections instead of every block receiving:
- a border
- a shadow
- a rounded card
- an icon tile

A screen with five containers should not look like five competing “feature cards.”

### Icons

Use Feather icons only.

Use icons for semantic utility:
- camera
- image
- upload
- search
- folder
- file-text
- refresh-cw
- wifi / wifi-off
- map-pin
- settings
- info
- alert-triangle
- check-circle
- chevron-right
- trash-2

Do not render rasterized icons.

### Photography

Only use bundled real photos for the **three-class education/reference gallery**.

No disease stock photo is needed on:
- scan empty state
- image preview
- result
- record detail
- field report
- reports
- settings

Those screens should use the user's scan image or no photo.

---

## Home

### Target structure

1. Compact header
   - greeting/name
   - connection status if meaningful
   - account/settings access
   - optional location line
2. Primary Start Scan button/card
3. Two secondary shortcuts at most in the first viewport
4. Conditional pending-sync row/banner
5. “Disease reference” section with three real photos
6. Bottom navigation

### Education cards

Exactly:
- Healthy
- Mosaic
- Rust

Each:
- real photo
- class name
- one short visual symptom/appearance sentence
- “Reference photo” cue

Do not show a fake confidence score or “detected” language on these cards.

---

## Scan

### Empty state

Use:
- Feather `image` or `camera`
- heading: no image selected
- one sentence on photo quality

No decorative illustration.

### Actions

Primary: `Capture Photo` or whichever action the product team chooses as first.
Secondary: `Choose from Gallery`.

Both remain accessible and at least touch-target sized.

### Photo guide

Limit to three short rules:
- keep symptoms focused
- avoid dark/blurry/distant photos
- capture the affected leaf/stalk/shoot relevant to the flow

### Decision-support copy

Keep it present but visually calm. Do not decorate it with a leaf illustration.

---

## Image Preview

Dominant element: user's selected image.

Metadata such as source and dimensions can remain but should be visually secondary.

Normal user flow should not be forced to read:
- RGB float32
- tensor dimensions
- interpolation policy
- preprocessing milliseconds

These can remain in technical/debug context if they are required for evidence.

Primary action: Analyze.
Secondary: Retake/Replace.
Tertiary: Start New Scan.

---

## Symptom Checklist

Use a simple form:

- Intro explanation
- selectable symptom rows
- optional severity selector
- Continue CTA

Preserve the wording concept:
“observations are compared with the model result but do not change its scores.”

Remove decorative ornament.

---

## Analysis Result

### Above the fold

1. User image
2. “Possible result: Mosaic/Rust” or Healthy presentation
3. AI confidence
4. short result explanation

Never use the reference-gallery photo as if it were the user's result.

### Next section

Checklist consistency:
- consistent
- inconsistent
- not enough info
- not applicable

Use one status icon and one short explanation.

### Warnings

Image-quality warnings should remain separate from confidence and should explicitly not imply that the warning modified the model scores.

### Technical details

Place:
- all class scores
- model version
- preprocessing/inference timings

in a low-priority/collapsible details section if practical.

### Decision-support limitation

Keep a concise limitation that the result supports decisions and does not confirm a disease.

---

## Records

Order:
1. header
2. search
3. filter chips
4. conditional compact sync state
5. result count
6. records list

The persistent “all records stay on this device” message can be reduced to a smaller one-time/contextual note instead of competing with the list.

---

## Record Details

Order:
1. saved image
2. result + confidence + sync status
3. Field Report status/action
4. observation context
5. quality warnings if any
6. technical details
7. delete local record

Technical storage/report identifiers should not visually outrank the actual crop observation.

---

## Reports

Keep the existing report data contract.

Recommended layout:
- two to four compact summary metrics
- class distribution
- sync/offline caveat
- recent records

Avoid decorative dashboard illustration.

Do not add a map just to make the screen look richer.

---

## Field Report

Draft:
- status
- required/optional field data
- location
- save draft
- validation issues only when present
- finalize

Finalized:
- finalized/sync status
- concise report summary
- retry sync only when relevant

Inherited scan evidence should be grouped and visually secondary to report completion.

---

## Settings

Use conventional platform list patterns.

Use Feather `chevron-right`, not a textual `>`.

Rows that are not actually implemented should not look fully interactive. Either:
- hide them for this enhancement, or
- present a clearly disabled “Coming later” state

Do not add decorative brand art.

---

## Bottom Navigation

Keep the existing Feather-based navigation and route behavior.

Visual target:
- no oversized floating-card effect
- stable touch targets
- clear active state
- consistent labels
- no decorative icon backgrounds unless necessary for accessibility

Any tab reorder must be justified and accompanied by updated Maestro assertions.
