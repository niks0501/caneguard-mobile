# Web live validation transcript — L6 Scan-tab guard photo copy

- revision: 93403e0e559c815d7efab6ebece3c224dfa1bc2e (branch fm/cg-guard-l6-scantab-20261121)
- route: `npm run web:validate` (stub API 127.0.0.1:8210, web dev server 127.0.0.1:8199, isolated Chrome profile `/tmp/cg-chrome-profile`)
- browser driver: `chrome-devtools-axi` attached over CDP to a headless Chrome launched for this run
  (`google-chrome --headless=new --remote-debugging-port=9333 --user-data-dir=/tmp/cg-chrome-profile`)
  with `CHROME_DEVTOOLS_AXI_BROWSER_URL=http://127.0.0.1:9333`
- file chooser: `input type=file` supplied by throwaway CDP helper `/tmp/cg-upload.js`
  (`Page.setInterceptFileChooserDialog` + `DOM.setFileInputFiles`); the app's own
  `expo-image-picker` web picker was driven, nothing in the app was stubbed or patched.
- fake account: `farmer@validation.invalid` / `validation-only` (stub API only, no real data)

Fixtures (throwaway, `/tmp/cg-fixtures`):
- `broken-leaf.jpg` — 2020-byte file with a JPEG SOI/APP0 header and undecodable body (unusable photo)
- `rejected.gif` — 1x1 GIF (a real image-acquisition error: unsupported format)
- `valid-leaf.png` — the repository's own `assets/images/icon.png` (a usable photo)

## Commands, in order

| # | command | observed |
| --- | --- | --- |
| 1 | `npm run web:validate` | stub API on :8210, Metro web on :8199, `/login` → 200 |
| 2 | `chrome-devtools-axi open http://127.0.0.1:8199/login` | Tagalog sign-in screen |
| 3 | `chrome-devtools-axi fill @g6831:1_7 "farmer@validation.invalid"` | email filled |
| 4 | `chrome-devtools-axi fill @g6832:1_10 "validation-only"` | password filled, Login enabled |
| 5 | `chrome-devtools-axi click @g6833:1_12` | signed in, `/home` as Farmer |
| 6 | `chrome-devtools-axi click @g6835:5_15` | Scan tab, `/scan` |
| 7 | `node /tmp/cg-upload.js 9333 /tmp/cg-fixtures/rejected.gif 1` then `chrome-devtools-axi click @g6836:7_11` | red "Hindi naidagdag ang larawan" (Image not added) card with the unsupported-format message; no neutral line — `screenshots/01-scan-picker-error-red-card.png` |
| 8 | `node /tmp/cg-upload.js 9333 /tmp/cg-fixtures/broken-leaf.jpg 1` then `chrome-devtools-axi click @g6837:7_11` | `/symptom-checklist`, "Photo not used — The selected image could not be resized." |
| 9 | `chrome-devtools-axi click @g6838:9_0` (Go back → Scan tab) | neutral line `This photo can't be used. Take or choose a new one.`, no red card — `screenshots/02-scan-photo-not-usable-neutral-line.png` |
| 10 | `node /tmp/cg-upload.js 9333 /tmp/cg-fixtures/valid-leaf.png 1` then `chrome-devtools-axi click @g6840:10_12` | `/symptom-checklist` with the usable photo, no preparation failure |
| 11 | `chrome-devtools-axi click @g6841:12_0` (Go back → Scan tab) | neutral line gone, photo shown, no red card — `screenshots/03-scan-usable-photo-no-neutral-line.png` |
| 12 | `npm run live:up -- --exit-after-ready` | `DEVICE_UNAVAILABLE` (no ready native target), record `.agent-device/test-artifacts/live/93403e0e559c/run.json` |

## What this route cannot prove

The not-sugarcane branch (`guardFailure === 'rejected'`) needs the native Guard V1
TFLite verdict. On web the guard controller is a constant fail-closed error
(`src/features/detection/model/useGuardModel.web.tsx`), so no web selection can
produce `guardFailure: 'rejected'`. `adb devices -l` did not return a ready target
(adb timed out after 30 s in `live:up`'s transcript), and `emulator` is not on PATH,
so the Android emulator route was unavailable as well. That scenario is reported
untested, not passed.

## Accessibility snapshots of the two Scan-tab states (chrome-devtools-axi snapshot)

Step 9 — after the unusable photo, back on `/scan` (note the neutral line inside the
polite live region and the absence of any "Hindi naidagdag ang larawan" card):

```
url: "http://127.0.0.1:8199/scan"
  heading "Mag-scan ng tubo" level="1"
  StaticText "Magdagdag ng maliwanag at malinaw na litrato ng apektadong dahon, tangkay o gitnang usbong."
  generic live="polite" relevant="additions text"
    StaticText "This photo can't be used. Take or choose a new one."
  StaticText "Napili ang larawan"
```

Step 7 — after the unsupported-format picker error (note the assertive error card and
no neutral line):

```
uid=g6837:8_0 generic live="assertive" relevant="additions text"
  uid=g6837:8_2 StaticText "Hindi naidagdag ang larawan"
  uid=g6837:8_3 StaticText "Hindi suportado ang format ng larawan. Pumili ng JPEG, PNG o WebP na larawan."
```

Step 11 — after replacing with a usable photo, back on `/scan` (no neutral line, no
error card; the only live region is the draft-status line):

```
url: "http://127.0.0.1:8199/scan"
  StaticText "Magdagdag ng maliwanag at malinaw na litrato ng apektadong dahon, tangkay o gitnang usbong."
  image "Kasalukuyang piniling larawan ng tubo" url="blob:http://127.0.0.1:8199/..."
  StaticText "Napili ang larawan"
```
