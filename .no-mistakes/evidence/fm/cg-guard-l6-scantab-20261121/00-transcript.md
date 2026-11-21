# L6 Scan-tab neutral line — live validation transcript

Revision: 6961500bf999a59706fa9d1f5ca8230af08142c7 (branch fm/cg-guard-l6-scantab-20261121)
Route: web first (`npm run web:validate`, stub API :8210, Expo web :8199, fake farmer account),
phone second (`npm run live:up` → DEVICE_UNAVAILABLE, see 04-device-unavailable-run.json).
Driver: chrome-devtools-axi (real Chrome against the running Expo web build).
Environment: worktree-local `npm ci`; fixture images under /tmp/cg-l6/fixtures (synthetic,
disposable). Session: farmer@validation.invalid on the stub API, Tagalog preference.

## Setup

    npm ci --prefer-offline           # node_modules was empty; nothing in the worktree committed
    npm run web:validate              # stub API 127.0.0.1:8210 + Expo web 127.0.0.1:8199
    chrome-devtools-axi open http://127.0.0.1:8199/login
    fill Email=farmer@validation.invalid, Password=validation-only, click "Login to CaneGuard"
    click tab "Mag-scan"              # Scan tab, farmer/Tagalog session
    chrome-devtools-axi resize 900 1400

The web file picker stand-in (`expo-image-picker` web) appends a hidden `<input type=file>`;
in headless-capable Chrome the OS chooser is auto-cancelled, so the run patched
`HTMLInputElement.prototype.dispatchEvent` to keep the real picker input in
`window.__cgInputs` and supply a real `File` through `DataTransfer` + `change`.
Everything after the file is chosen is the unmodified product code
(`readPickerOutcome` → `SELECT_IMAGE` → `/symptom-checklist` → `preprocessImage` → Scan tab render).

## Scenario A — real picker failure keeps the red "Image not added" card

    click "Pumili ng isang larawan mula sa gallery" (scan.choose-gallery)
    inject File tiny.gif (42 B GIF89a, image/gif)
    path: /scan
    text: "Mag-scan ng tubo | ... | Hindi naidagdag ang larawan | Hindi suportado ang
           format ng larawan. Pumili ng JPEG, PNG o WebP na larawan. | Wala pang
           naidagdag na larawan | ..."
    screenshot: 01-picker-failure-red-card.png

Red error card with title "Hindi naidagdag ang larawan" (Image not added); no neutral line.

## Scenario B — photo-preparation failure shows the neutral line on the Scan tab

    click "Pumili mula sa device"
    inject File corrupt.jpg (44 B JPEG SOI + garbage, image/jpeg)
    path: /symptom-checklist
    text: "Check your photo | ... | The selected image could not be resized. Please replace
           it and try again."
    screenshot: 02-checklist-preparation-failed.png
    click "Go back"
    path: /scan
    text: "Mag-scan ng tubo | Magdagdag ng ... | This photo can't be used. Take or choose a
           new one. | Napili ang larawan | Tingnan ang napiling larawan ... | Na-save sa
           device · 4:25 PM ..."
    screenshot: 03-scan-tab-neutral-photo-unusable.png

Neutral line rendered (English, per the recorded Tagalog-approval tradeoff), red card absent;
the replace actions "Kumuha ng ibang litrato" / "Pumili ng ibang larawan" remain available.
`useScanAnalysis.ts` dispatch here is `SET_ERROR { photoPreparationFailed: true }` with no
`guardFailure` — the initial-preparation case from review round 1.

## Scenario C (attempted) — guard rejection / guard runtime fault

A 1024x1024 high-contrast JPEG passes the quality gate and reaches the checklist, but on web
the required Guard V1 controller is `state: 'error'` (`useGuardModel.web.tsx`,
GUARD_UNSUPPORTED_PLATFORM), so `guardReady` never becomes true, inference never starts and no
`SET_ERROR { guardFailure }` action is ever dispatched. The checklist shows the controller error
("The sugarcane photo check is not available on this phone, so scans are paused."), and going
back to /scan leaves the session at `image-selected` — there is no web-reachable
`guardFailure: 'rejected'` or `guardFailure: 'error'` session.

    click "Pumili ng ibang larawan"
    inject File highquality.jpg (1024x1024 counter-phase checkerboard, image/jpeg)
    path: /symptom-checklist
    text: "Check your photo | ... | The sugarcane photo check is not available on this phone,
           so scans are paused. Update or reinstall the app, then try again."
    chrome-devtools-axi back -> /scan, session status image-selected (no card, no neutral line)

Phone route: `npm run live:up -- --exit-after-ready` recorded DEVICE_UNAVAILABLE
(adb devices: none listed); there is no attached device or cached dev APK in this worktree,
so the two guard-driven states could not be driven natively.

## Supplemental (not live)

    npx jest --runInBand src/app/__tests__/scan.test.tsx   # 50 passed
