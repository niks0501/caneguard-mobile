# L2 guard states / step copy — live web validation transcript

- worktree: `{run-worktree}`
- revision: `bfd733729d61fdf248b8c9198596c96973192b2c` (branch `fm/cg-guard-l2-states-20261121`)
- route: web validation (`npm run web:validate`) — stub API on `127.0.0.1:8210`, dev server on `127.0.0.1:8199`
- pinned fixture date: `CANEGUARD_WEB_VALIDATE_TODAY=2026-11-21`
- driver: `chrome-devtools-axi` (session `cg-l2-204153`), signed in as `inspector@validation.invalid`

## Commands, in order

| step | command | observed |
| --- | --- | --- |
| 1 | `npm run web:validate` (background, log `web-validate.log`) | stub API + Expo web dev server up on :8210 / :8199 |
| 2 | `chrome-devtools-axi open http://127.0.0.1:8199/login` | sign-in form |
| 3 | `chrome-devtools-axi fillform @Email=inspector@validation.invalid @Password=validation-only` | filled |
| 4 | `chrome-devtools-axi click @Login` | `/home` |
| 5 | `chrome-devtools-axi click @Start a scan` | `/scan` |
| 6 | `chrome-devtools-axi eval` — patch `EventTarget.prototype.dispatchEvent` to capture the hidden `input[type=file]` that `expo-image-picker` appends (`data-testid="file-input"`), then put a real `File` on it with `DataTransfer` and dispatch `change` | the app's own picker resolves with the asset, exactly as after a real file choice |
| 7 | `chrome-devtools-axi click @Choose one image from the gallery` + step 6 dispatch of a low-contrast 760x700 PNG | `/symptom-checklist`; heading **Photo not used** + "This photo was not analysed…" + hard-to-read card (`screenshots/01-low-contrast-photo-not-used.png`) |
| 8 | `chrome-devtools-axi click @Choose another photo from the gallery` + dispatch of `dev-assets/model-fixtures/v1-rust.jpg` (served by the disposable `fixture-server.js` on :8311) | heading **Check did not finish** + "The sugarcane photo check is not available on this phone…" (`screenshots/02-guard-unavailable-check-did-not-finish.png`) |
| 9 | `chrome-devtools-axi back` → `click @Choose another image to replace the selected image` → dispatch of the low-contrast PNG | heading returns to **Photo not used** |
| 10 | `chrome-devtools-axi click @Choose another photo from the gallery` (picker promise left pending) | heading **Checking your photo…** while the check is in progress (`screenshots/03-checking-photo-state.png`) |
| 11 | `chrome-devtools-axi eval` — dispatch `change` with no files (cancel) | heading back to **Photo not used** |
| 12 | `npm run live:up -- --exit-after-ready` | `DEVICE_UNAVAILABLE` (exit 3): `adb devices` lists no target → native states inconclusive, see `device/run.json` |

## State-copy log recorded in the page (30 ms poll of `scan.check-status` + its detail line)

```
Check did not finish | The sugarcane photo check is not available on this phone, so scans are paused. Update or reinstall the app, then try again.
Photo not used | This photo was not analysed. Please use a new photo.
Checking your photo… | The sugarcane photo check is not available on this phone, so scans are paused. Update or reinstall the app, then try again.
Photo not used | This photo was not analysed. Please use a new photo.
```

`Photo checked` never appeared in any of these states (`document.body.innerText` had no `Photo checked`).

## Not reachable on the web route

The required Guard V1 runtime is native-only and fails closed in the browser
(`useGuardModel.web.tsx`), so `checking-sugarcane`, `not-sugarcane`,
`photo-unusable`, `analysing`, `result` and `result-doubtful` cannot be produced
here; they need an attached Android target (`npm run live:up` reported
`DEVICE_UNAVAILABLE`).
