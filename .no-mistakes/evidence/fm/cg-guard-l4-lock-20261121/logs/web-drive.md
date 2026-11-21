# Live web drive — L4 guard lock (revision 88a56ba8)

Host: Linux, Chrome 157 via `chrome-devtools-axi`, isolated AXI session
`CHROME_DEVTOOLS_AXI_SESSION=cg-l4-guard-lock`, isolated Chrome profile
`/tmp/cg-l4-chrome-profile`. Repo revision under test:
`88a56ba88f1d8bbcfa37439ada6f06a17f63a1c2` (worktree
`{run-worktree}`).

Product stood up exactly as the runbook prescribes (`docs/qa/web-validation.md`):

```
npm run web:validate      # stub API 127.0.0.1:8210, Expo web Metro 127.0.0.1:8199,
                          # EXPO_PUBLIC_WEB_VALIDATION=1, farmer + inspector fake accounts
```

Synthetic inputs: fake farmer account `farmer@validation.invalid` /
`validation-only`, and two synthetic scan photos pushed through the real
`expo-image-picker` web file input:

- `inputs-cane-like-accept.jpg` (qa/guard-v1/cane-like-accept.jpg, 320x240) — trips
  the low-resolution quality warning, so the screen lands in the pre-acceptance
  `photo-rejected` state;
- `inputs-rust-hires.jpg` (assets/images/field-guide/rust/01-rust.jpg re-encoded to
  768x1024) — passes the quality check, so the screen lands in the
  pre-acceptance guard-unavailable (`model-failed`) state, because the required
  Guard V1 runtime fails closed in the web bundle by design.

Every command below was issued through the isolated AXI session
(`CHROME_DEVTOOLS_AXI_SESSION=cg-l4-guard-lock npx -y chrome-devtools-axi …`).

| # | command | result |
| --- | --- | --- |
| 1 | `open http://127.0.0.1:8199/login` | login screen |
| 2 | `fillform @email=farmer@validation.invalid @password=validation-only` | fields filled |
| 3 | `click @login` | `/home` (farmer, Tagalog copy) |
| 4 | `click @start-scan` ("Magsimula ng pag-scan") | `/scan` |
| 5 | `eval` patch: record `input[type=file]` elements created by `expo-image-picker` | patched |
| 6 | `click @gallery` ("Pumili ng isang larawan mula sa gallery") | file input created, pending |
| 7 | `eval` inject `File(cane-like-accept.jpg)` into the pending input + `change` event | `{ok:true,count:1}` |
| 8 | `eval location.href` | `/symptom-checklist` — "Check your photo", "Photo not used", lock line present, all 7 tiles `disabled` |
| 9 | `screenshot screenshots/01-locked-question-photo-rejected.png` | evidence |
| 10 | `eval` read every `[role=radio]` `aria-disabled` | all 7 `"true"` |
| 11 | `click @rust-tile` (locked) | tile focused, **not** selected |
| 12 | `eval` `aria-checked` scan + Continue state | no checked tile, Continue `aria-disabled="true"`, lock line still shown |
| 13 | `screenshot screenshots/02-after-tap-locked-no-selection.png` | evidence |
| 14 | `click @gallery-again` ("Pumili ng ibang larawan mula sa gallery") | new file input created |
| 15 | `eval` inject `File(rust-hires.jpg)` + `change` event | `{ok:true}` |
| 16 | `eval location.href` + body text | `/symptom-checklist` — "Check did not finish … scans are paused", lock line present |
| 17 | `screenshot screenshots/03-locked-question-guard-unavailable.png` | evidence |
| 18 | `eval` `[role=radio]` `aria-disabled` + Continue | all 7 `"true"`, Continue `"true"` |
| 19 | `click @rust-tile`, `click @mosaic-tile` (locked) | neither selected |
| 20 | `eval` selected tiles + Continue text + lock line | no selection, Continue still "Checking photo…" and disabled, lock line shown |
| 21 | `screenshot screenshots/04-after-taps-locked-guard-unavailable.png` | evidence |

What this drive proves and does not prove: the observation question renders, the
"you can answer once the photo is confirmed as sugarcane" line renders, and the
picture tiles are inert in both pre-acceptance states reachable in the web
bundle. Web cannot reach `analysing`, because the required Guard V1 runtime fails
closed on web (`src/features/detection/model/useGuardModel.web.tsx`), so the
unlock transition after guard acceptance is native-only and is not shown here.
