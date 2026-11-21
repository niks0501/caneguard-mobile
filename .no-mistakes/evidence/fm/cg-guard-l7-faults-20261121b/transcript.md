# L7 guard file-fault presentation — live web validation transcript

Revision: `3462ddfecc0ca0fda7003fede39717e1d0bba4c7` (branch `fm/cg-guard-l7-faults-20261121b`)
Base: `3227815d14458dafec3ccc764b22cf65705c5497`

## Environment

- Web route: `npm run web:validate` (Expo web dev server `http://127.0.0.1:8199`, deterministic stub API `http://127.0.0.1:8210`, fake inspector account, isolated browser profile). Dependencies materialized with `npm ci`.
- Browser driver: `chrome-devtools-axi` (Chrome session kept alive across commands).
- Native route attempted first: `npm run live:up -- --exit-after-ready` →
  `live:up DEVICE_UNAVAILABLE: No ready native target (adb devices: none listed).`
  record: `.agent-device/test-artifacts/live/3462ddfecc0c/run.json` (result `DEVICE_UNAVAILABLE`,
  revision `3462ddfecc0ca0fda7003fede39717e1d0bba4c7`, dirty `false`, fallback `npm run web:validate`).
  No Android emulator binary and no AVD are installed in the workspace's SDK view, and installing
  system packages is outside the workspace boundary, so no live TFLite target exists.

## Fixtures (synthetic, disposable)

- `corrupt.jpg` — 844 bytes: JPEG SOI marker followed by non-image bytes (forces a decode/manipulation failure).
- `noisy-leaf.jpg` / `high-contrast.jpg` — generated JPEGs used only as replacement picks.

## Commands, in order

```
chrome-devtools-axi open http://127.0.0.1:8199/login
chrome-devtools-axi fill @g7027:2_6 "inspector@validation.invalid"
chrome-devtools-axi fill @g7029:2_9 "validation-only"
chrome-devtools-axi click @g7031:2_11          # Login to CaneGuard -> /home
chrome-devtools-axi click @g7033:7_27          # Scan tab -> /scan
chrome-devtools-axi upload @g7035:9_11 /tmp/l7-evidence/corrupt.jpg   # "Choose one image from the gallery"
chrome-devtools-axi snapshot                                          # -> /symptom-checklist, file-fault state
chrome-devtools-axi screenshot 01-check-failed.png
chrome-devtools-axi upload @g7038:11_7 /tmp/l7-evidence/noisy-leaf.jpg  # "Choose another photo"
chrome-devtools-axi screenshot 02-photo-rejected-after-replace.png
chrome-devtools-axi upload @g7042:16_5 /tmp/l7-evidence/high-contrast.jpg
chrome-devtools-axi upload @g7045:18_5 /tmp/l7-evidence/corrupt.jpg     # back to the file-fault state
chrome-devtools-axi upload @g7047:21_0 /tmp/l7-evidence/corrupt.jpg     # primary "Take a new photo"
chrome-devtools-axi screenshot 03-check-failed-after-primary-retake.png
chrome-devtools-axi eval "<visible button inventory>"
```

## Observed (accessibility snapshot of the running app)

After the corrupt pick the screen reported:

```
heading "Check your photo"
generic live="polite":
  StaticText "Photo could not be used"
  StaticText "The selected image could not be resized. Please replace it and try again."
button "Take a new photo"        (camera icon, primary)
button "Choose another photo"    (image icon, secondary)
heading "Which picture looks most like what you see?"
StaticText "You can answer once the photo is confirmed as sugarcane."
radio ... disabled (all seven observation choices)
button "Continue to analysis result" disabled
```

The previous "This photo may be hard to read" failure card copy and the `Try again` recovery button
were absent. A follow-up `eval` over visible buttons returned exactly:

```
["Take a new photo","Choose another photo","Checking photo…","Cancel Scan"]
visibleTryAgainButtons: 0
```

Tap-through of both fault actions re-entered the picker and restarted the check
(`01` → replacement → `03`), so the actions are wired, not decorative.

Replacing the corrupt file with a decodable image moved the screen to the quality-warning
state (`Photo not used` / "This photo may be hard to read", unchanged by this change), and a
following corrupt pick returned the same file-fault presentation, i.e. the fault is reproducible
across replacements.

## Not reachable on the web route

`photo-unusable` requires a real Guard V1 run that fails (`guardFailure: 'error'` +
`photoPreparationFailed`). The web bundle's guard controller reports state `error` at load
(`GUARD_UNSUPPORTED_PLATFORM`, `useGuardModel.web.tsx`), so guard inference is never invoked;
that state, and the `model-failed` (guard runtime fault) branch, need the Android dev client.
