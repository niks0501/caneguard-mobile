# Live validation — photo-unusable retake copy dedupe

- Revision: `47554f9860773d1173e8d9e7b755ff39b250bbe8` (base `8550f0c49bd24f0c48360ec353bafdf3370abe30`)
- Tier: T1-fast (copy/refactor), live surface driven anyway on the web validation route
- Route: `npm run web:validate` (stub API `127.0.0.1:8210`, Expo web dev server `127.0.0.1:8199`, `/login`, fake accounts)
- Driver: `chrome-devtools-axi` against the real Expo web build of this worktree
- Device: no ready native target (no AVD/emulator component, no `.apk-cache`)? Not used for this change: the changed surface is copy rendered by the scan screen and the web route renders it. Native-only states remain out of scope for this refactor.

## What the change does

`src/app/symptom-checklist.tsx` hoists one `photoFileFault` ternary per retake button
(`retakeCameraCopy`, `retakeGalleryCopy`) and `src/constants/copy.ts` drops
`GUARD_COPY.unusableRetakeGallery`, reusing `SCAN_CHECK_COPY.retakeGallery`
(`'Choose another photo'`) for the unusable-gallery text. Only the genuinely new
camera string `GUARD_COPY.unusableRetakeCamera` (`'Take a new photo'`) stays.

## Live scenarios driven

### 1. Inspector, unreadable photo → photo-file-fault retake copy

Driver commands (verbatim):

```
chrome-devtools-axi open http://127.0.0.1:8199/login
chrome-devtools-axi fill @g7073:2_6 "inspector@validation.invalid"
chrome-devtools-axi click @g7075:2_9
chrome-devtools-axi type "validation-only"
chrome-devtools-axi click @g7078:2_11
chrome-devtools-axi click @g7080:8_15        # Start a scan
chrome-devtools-axi click @g7082:10_11       # Choose one image from the gallery
chrome-devtools-axi upload @g7090:18_0 ~/.no-mistakes/evidence/01M7Z376SS8RMY1R9FPDFS0MKM/fixtures/unreadable-photo.png
```

Observed on screen: status heading `Photo could not be used`
(`The selected image could not be resized. Please replace it and try again.`), a
retake card with exactly two buttons and no `Try again` action:

```
[{"text=Take a new photo || aria-label=Take a new photo"},
 {"text=Choose another photo || aria-label=Choose another photo"}]
```

Screenshot: `screenshots/01-unusable-photo-fault-retake-buttons.png`

### 2. Inspector, low-quality photo → quality-warning retake copy (unchanged wording)

Replacement through the real gallery button with a 120×120 flat grey PNG
(`fixtures/quality-low-flat.png`), which raises `low-resolution` and
`low-contrast` warnings:

```
chrome-devtools-axi click @g7093:20_7
chrome-devtools-axi upload @g7095:23_3 .../fixtures/quality-low-flat.png
```

Observed: `This photo may be hard to read` card with both warnings, then

```
[{"text=Take another photo || aria-label=Take another photo with the camera"},
 {"text=Choose another photo || aria-label=Choose another photo from the gallery"}]
```

Screenshot: `screenshots/02-quality-warning-retake-buttons.png`

Together 1 and 2 show the intended mapping end-to-end on the rendered screen: the
fault card's gallery wording is now the shared `SCAN_CHECK_COPY.retakeGallery`
string (`Choose another photo`, identical to the quality card) while the fault
card's camera wording keeps the new `Take a new photo`, and the quality card is
unchanged.

### 3. Adversarial — farmer copy must still win over the fault branch

The hoist moves `isFarmer` outward, so the risk is a precedence inversion that
would show inspector fault wording to a farmer. Signed in as
`farmer@validation.invalid` (Tagalog copy), opened the scan screen and uploaded
the same unreadable photo:

```
chrome-devtools-axi open http://127.0.0.1:8199/login
chrome-devtools-axi eval "…set farmer@validation.invalid / validation-only…"
chrome-devtools-axi click @g7105:28_12
chrome-devtools-axi click @g7107:35_6        # Magsimula ng pag-scan
chrome-devtools-axi click @g7109:37_11       # Pumili ng isang larawan mula sa gallery
chrome-devtools-axi upload @g7111:39_0 .../fixtures/unreadable-photo.png
```

Observed on the same `Photo could not be used` fault card:

```
[{"text=Kumuha ng ibang litrato || aria-label=Kumuha ng ibang litrato gamit ang camera"},
 {"text=Pumili ng ibang larawan || aria-label=Pumili ng ibang larawan mula sa gallery"}]
```

No English inspector fault copy appeared, so the farmer branch still takes
precedence after the hoist.

Screenshot: `screenshots/03-farmer-copy-precedence-on-photo-fault.png`

## Supplemental targeted test

`npm test -- --runInBand src/app/__tests__/symptom-checklist.test.tsx` — 1 suite,
23 tests passed (renders the real screen with the mocked native boundary; includes
the added fault/quality label assertions). Supplemental only, not live evidence.

## Limits of this evidence

- The web bundle's required Guard V1 runtime fails closed, so `photo-unusable`
  (guard read fault, `guardFailure === 'error' && photoPreparationFailed`) is not
  reachable here; `check-failed` is the same `photoFileFault` code path in the
  screen and was driven live. The `not-sugarcane` guard-rejected card code was not
  touched by this diff.
- No native device/emulator was needed: nothing in the diff is native, and the
  changed strings render from the same modules on web.
