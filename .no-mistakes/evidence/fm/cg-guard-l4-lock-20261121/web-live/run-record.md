# L4 guard question lock — live validation record (round 2, revision 44e0dc8)

- Revision: `44e0dc85ee9ca0c0a0231ce5ce4092ecef764a28` (branch `fm/cg-guard-l4-lock-20261121`), worktree clean.
- Product driven: `npm run web:validate` (Expo web dev server on `127.0.0.1:8199`, deterministic stub API on
  `127.0.0.1:8210`, fake inspector account `inspector@validation.invalid`, isolated browser session
  `CHROME_DEVTOOLS_AXI_SESSION=cg-l4-guard-lock`).
- Phone: `npm run live:up -- --exit-after-ready` returned exit 3 `DEVICE_UNAVAILABLE`
  (“adb devices: none listed”), recorded at `.agent-device/test-artifacts/live/44e0dc85ee9c/run.json`
  (copy: `live-up-run.json`). No emulator package, system image or AVD exists in the local Android SDK,
  so no agent-device phone run was possible.

## Route driven (all input through chrome-devtools-axi)

1. Open `http://127.0.0.1:8199/login`, sign in as the fake inspector.
2. `Scan` tab → `Choose one image from the gallery`; the file handed to expo-image-picker's own
   `<input type=file>` is the product's bundled reference photo (state A) or a deliberately tiny, dark
   synthetic capture (state B).
3. `Continue with the selected photo` / automatic advance → `/symptom-checklist`.

## Observations

State A — the check cannot confirm the photo (web guard fails closed):
`Check did not finish` card, question heading rendered, lock line
“You can answer once the photo is confirmed as sugarcane.”, all 7 picture tiles `aria-disabled="true"`
and dimmed, Continue `aria-disabled="true"`. Pointer click and Enter/Space on `scan.symptom-mosaic` /
`scan.symptom-rust` selected nothing (`aria-checked` never true), Continue stayed disabled.

State B — the check finished and the photo was not used (quality gate rejection, retake buttons offered):
same question, same lock line, tiles still disabled; tapping `scan.symptom-mosaic` and
`scan.symptom-something-else` selected nothing and Continue stayed disabled. This is the state the
review round asked to keep locked (it was unlocked before the fix).

Not reachable in the browser: `analysing` and `result`, because the required Guard V1 runtime fails
closed on web (`src/features/detection/model/useGuardModel.web.tsx`). Guard acceptance (and therefore the
unlock) and a real guard rejection are native-only (`docs/qa/web-validation.md`).

## Files

- `02-locked-question-after-tap.png` — state A after tapping Rust.
- `03-photo-rejected-still-locked.png` — state B after tapping Mosaic + Something else.
- `../../jest-symptom-checklist.log` — focused screen tests (`symptom-checklist`, `symptom-checklist.guard`), 29 passed.
- `live-up-run.json` — phone availability record.
