# L7 guard file-fault UX — live validation notes

- Revision: `32bec75ac68fe089444937b4e513ade8c6608556` (branch `fm/cg-guard-l7-faults-20261121`)
- Web route: `npm run web:validate` (stub API `127.0.0.1:8210`, Expo web dev server `127.0.0.1:8199`), driver `chrome-devtools-axi` against real Chrome, `/login` entry (not `/`), fresh page session per account.
- Device route: `npm run live:up -- --exit-after-ready` -> `DEVICE_UNAVAILABLE` (no adb target, no AVD/emulator in the SDK). Recorded in `device-run.json` / `device-transcript.md` (driver `agent-device`).
- Synthetic inputs: locally generated JPEGs (`corrupt.jpg` = 59-byte non-image file, `dark.jpg` = 900x900 near-black frame, `pattern.jpg` = 900x900 high-contrast tiled frame) handed to the app's real gallery picker input (`input[type=file]`, the same element `expo-image-picker` creates and the same `change` event a user's file selection fires). Every state shown below was produced by the product's own preprocessing/guard pipeline from those files.

## Captures

| File | Account / language | What it shows |
| --- | --- | --- |
| `01-farmer-tl-check-failed.png` | farmer, Tagalog | corrupt file -> `check-failed`: title "Photo could not be used", cause detail, retake buttons `Kumuha ng ibang litrato` / `Pumili ng ibang larawan`, no Try again, old "This photo may be hard to read" card body gone |
| `02-farmer-tl-photo-rejected-old-card.png` | farmer, Tagalog | too-dark frame -> `photo-rejected`: old card kept ("This photo may be hard to read" + too-dark/low-contrast lines), no Try again |
| `03-farmer-tl-model-failed-guard-unavailable.png` | farmer, Tagalog | clean frame -> `model-failed`: "Check did not finish", no file-fault card and no file-fault retake labels |
| `04-field-reporter-en-check-failed.png` | field reporter, English | corrupt file -> `check-failed`: "Photo could not be used" + cause, `Take a new photo` / `Choose another photo`, no Try again |

## Driver commands (representative, in order)

```
chrome-devtools-axi open http://127.0.0.1:8199/login
chrome-devtools-axi fillform @<email>=farmer@validation.invalid @<password>=validation-only
chrome-devtools-axi click @<Login to CaneGuard>
chrome-devtools-axi click @<Mag-scan>            # farmer scan tab
chrome-devtools-axi eval "() => { /* capture picker input instead of native chooser */ }"
chrome-devtools-axi click @<Pumili ng isang larawan mula sa gallery>
chrome-devtools-axi eval "async () => { /* set input.files from fetched JPEG, dispatch change */ }"
chrome-devtools-axi eval "() => document.querySelector('[data-testid=\"scan.check-status\"]').textContent"
chrome-devtools-axi screenshot 01-farmer-tl-check-failed.png
...
chrome-devtools-axi open http://127.0.0.1:8199/login   # fresh session, field-reporter account
```

## Not reachable on this host

- `photo-unusable` (guard `GUARD_INPUT_INVALID` / `GUARD_INPUT_TOO_LARGE` -> "This photo can't be checked" + specific reason, both retake buttons) needs the real Guard V1 TFLite runtime. `adb devices` lists no target and the Android SDK here has no `emulator` package or AVD, so no phone/emulator run was possible; the web bundle fails the guard closed by design.
- A runtime model failure that leaves the session in `status: 'error'` (`model-failed` with Try again) also needs a passing guard followed by a failing V2 call, i.e. the same native runtime.
