# Browser validation route

The two validation routes are **web first** and **phone second**. Web is the
default because it needs no attached device; the phone stays the only proof for
native behaviour. This page covers the web route only: how to start it and what
it can and cannot prove.

Validation scaffolding is not product behaviour: it is web-only, env-gated, and
never part of a release build. Native paths are unchanged.

## Quick start

```bash
npm run web:validate               # dev server on :8199 with the stub API on :8210
```

The script starts the deterministic stub API (`validation/stub-api`) and then
the Expo web dev server with:

- `EXPO_PUBLIC_WEB_VALIDATION=1` — enables the validation-only secure-store,
  file-system and web-model stand-ins (see below);
- `EXPO_PUBLIC_API_BASE_URL` — pointed at the local stub, overriding any value
  already in the environment on purpose;
- `CANEGUARD_WEB_VALIDATE_TODAY` — the reference date the fixtures are built
  from. Set it (`CANEGUARD_WEB_VALIDATE_TODAY=2026-11-01 npm run web:validate`)
  for a pinned run; otherwise the local date the script starts on is used.
  Accepted pins run from `1970-01-10` to `9999-12-31`; the fixtures derive
  earlier days, so anything outside that window stops the script with the
  one-line date error.
- `EXPO_PUBLIC_WEB_VALIDATION_CONFIDENCE` — optional validation-only top
  probability for the fixed browser model stub. The default `0.8` is below the
  provisional V2 caution cutoff; set `0.9` for the above-cutoff result check.
  This affects only the development validation stub and never native inference.

Then:

1. Open **`http://127.0.0.1:8199/login`**, not `/`. Under the single-page web
   output, `/` is answered by the manifest handler, which runs before the Metro
   middleware that adds COOP/COEP, so `SharedArrayBuffer` stays undefined there.
   `/login` and the other routes get the headers.
2. Sign in with one of the fake accounts printed at startup:
   - `inspector@validation.invalid` / `validation-only` for the inspector route;
   - `farmer@validation.invalid` / `validation-only` for the farmer Check Again
     route.
3. Use **one browser profile per origin**. A second same-origin tab fails on the
   OPFS lock (`NoModificationAllowedError`), which surfaces as a storage error.
   A password sign-in keeps its session in memory only, so a page reload returns
   to `/login`; navigate inside the app instead of reloading.

The stub gives the inspector two active visits: `CG-LAB-0001` (Balayan, due
today) and `CG-LAB-0002` (Mabini, due two days ago). Inspector Home should lead
with "One visit today. One is overdue." and "Open next visit". The farmer
account gets no visits; instead it gets one seeded plant checked three times (a
first check plus two follow-ups, each with its own image and date; the
follow-ups carry notes) so the first-check history and the retained-note case
are visible immediately. Seeding is recorded in this browser profile, so a check
the validator deletes stays deleted; use a fresh profile or clear site data for
a fresh seed. The notification feed is empty, and any other `GET` answers a
well-formed empty page.

## Why the flags exist

| Piece | File | What it does |
| --- | --- | --- |
| Single-page output | `app.json` (`web.output: "single"`) | The dev server cannot bundle the SQLite worker with the committed static output; a static graph fails with HTTP 500 `Worker chunk not found`. |
| COOP/COEP | `metro.config.js` (`server.enhanceMiddleware`) | The web SQLite bridge uses `SharedArrayBuffer`, which needs a cross-origin-isolated page. The dev server now sends the headers, so no proxy is needed. |
| Async warm-up | `src/database/DatabaseProvider.tsx` | The first synchronous SQLite open busy-waits while the SQLite worker is still starting, and a blocked main thread starves that startup. On web only, one async open runs first, and the synchronous open is skipped unless it succeeds; a rejection or a 10-second timeout shows the retryable storage screen, and the warm-up connection is closed on retry and unmount. Native is untouched. |
| Worker length fix | `validation/expo-sqlite/WorkerChannel.ts` | `expo-sqlite` 57 writes the sync result length into a byte view, so results longer than 255 bytes are read back truncated. Delete this copy and its Metro alias when the app moves to SDK 58, which fixes it upstream. |
| Secure-store stand-in | `validation/expo-secure-store/ExpoSecureStore.web.ts` | `expo-secure-store` has no web implementation, so nobody can sign in on web. The stand-in keeps a fake session in `localStorage`. |
| Stub API | `validation/stub-api/` | Two fake accounts (the inspector's `/me` response carries the capability set the inspector screens require), two fake visits, the farmer's seeded checks and images, read-only feeds. The only write is a validation image held in memory until the run ends. |
| Web model stub | `src/features/detection/model/useCaneGuardModel.web.tsx` | Without a native TFLite runtime the web bundle fails closed. On the validation route only (`__DEV__`, flag and fixed stub origin) a fixed deterministic output lets a captured photo reach the result screen. Native inference is untouched. |
| File-system stand-in | `validation/expo-file-system/ExpoFileSystem.web.ts` | Keeps validation scan images in memory, mirrors new captures to the stub, and restores their metadata after a reload so a saved draft checkpoint can be recovered. Same flag, stub-only and release-build gates as the secure-store stand-in. |

The stand-ins are deliberately narrow: web platform only, each requires
`EXPO_PUBLIC_WEB_VALIDATION=1` and `EXPO_PUBLIC_API_BASE_URL` set to the stub base
URL (`http://127.0.0.1:8210`), and each is refused for `preview`, `qa` and
`production` builds (`EAS_BUILD_PROFILE`), for `NODE_ENV=production`, and for
any other API, including another loopback host or port. Never sign in to a real
server with them. The gate is pinned by
`scripts/__tests__/web-validation-config.test.js`.

## What this route proves

- that the app renders, routes and reads its cached records in a browser
  (Home, Activity, Visits, notifications list);
- that the web data path returns complete records, so "All clear." is not hiding
  a failed refresh;
- that the farmer Check Again flow runs in a browser: start from a saved scan,
  capture a new photo, see the two photos side by side with their own dates and
  Possible Condition lines, write a note, save the follow-up, review history in
  date order, and keep the surviving note after the first check is deleted;
- that a field-reporter session opening a saved record shows no Check Again
  button and no check-history section.

It cannot prove anything native: TFLite inference, camera, permissions,
biometrics, secure storage, notifications delivery or device persistence. Those
remain `npm run e2e` / agent-device work with an attached device. The web model
output is a fixed stub, so it proves the screen and state flow, never model
quality. A browser reload is the nearest available equivalent to a process
restart for draft recovery; it still cannot prove Android picker recovery or
native persistence.

Validation runs count as product acceptance evidence for exactly what this route proves above; only the native-only items still need `npm run e2e` / agent-device with an attached device.

## Reading a failure

With this route in place, `/` misbehaviour is a routing mistake, not a bug. If
the storage screen appears, the dev console now prints the underlying cause next
to `[storage:DATABASE_OPEN_FAILED] Local database open failed.` The cause is a
single bounded line containing only the error name and message; user-facing copy
stays generic. Typical causes:

- `ReferenceError: SharedArrayBuffer is not defined` — opened `/` instead of
  `/login/…`.
- `Sync operation timeout` — the worker never got a turn; check the async
  warm-up still runs before the sync open.
- `SyntaxError: Unterminated string in JSON` — the worker length fix is not
  applied; check the Metro alias in `metro.config.js`.
- `NoModificationAllowedError` — a second tab on the same origin; close it.
- `The web SQLite warm-up timed out.` — the async open never finished within 10
  seconds; the storage screen is retryable. Close other tabs on the origin, then
  use **Try Again**.
