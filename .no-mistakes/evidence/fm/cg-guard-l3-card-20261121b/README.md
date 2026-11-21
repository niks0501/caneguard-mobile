# L3 not-sugarcane decision card — test-phase evidence (rev d5ed0fb1)

Change under validation: `symptom-checklist.tsx` replaces the guided question with the
not-sugarcane decision card (`GUARD_COPY.rejectedTitle` / `rejectedBody` / `rejectedTip` /
`retakeCamera` / `goHome`), keeps Cancel Scan, hides the question grid and Continue, sets the
photo heading to `Photo not used`, and scrolls to top on rejection.

## What could be driven live

- `npm run live:up -- --exit-after-ready` → **DEVICE_UNAVAILABLE** (see `live-up-run.json`).
  `adb devices` lists nothing; `agent-device devices` only reports the Linux desktop target,
  and the local Android SDK has no emulator binary or AVD, so no native target exists.
- `npm run web:validate` (stub API :8210, web :8199), driven with `chrome-devtools-axi`
  through the farmer account, `/login` → Home → Scan → gallery upload:
  - `02-web-photo-failed-check-card-mobile.png` — a dark, low-contrast photo reaches the
    **photo-failed-check** card. The restructured `photoFailedCheck && !guardRejected` branch
    keeps the warning list, the farmer Tagalog retake buttons and the locked question, and
    renders no decision card.
  - `03-web-guard-fault-locked-question.png` — a good photo reaches the guard **fault**
    ("Check did not finish", Guard V1 runtime unavailable on web). The question stays locked
    and disabled and no decision card appears, as the intent requires for a fault.
- The guard **rejection** state itself is unreachable on web: `src/features/detection/model/`
  `useGuardModel.web.tsx` fails closed before any rejection can be derived, which the browser
  run above demonstrates. Reaching the decision card therefore needs the native guard runtime.

## Not live

The decision-card scenarios (card contents, hidden question grid and Continue, Cancel Scan →
discard dialog, Tagalog farmer labels) were driven only by the Jest screen/workflow suites,
which mock the guard runtime and are not live evidence. The new focused test for the
scroll-to-top effect lives in `src/app/__tests__/symptom-checklist.guard.test.tsx`.
The paired `AccessibilityInfo.setAccessibilityFocus(node)` call cannot be observed in that
environment because `findNodeHandle` yields no node under react-test-renderer.
