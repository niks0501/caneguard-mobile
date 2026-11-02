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

- `EXPO_PUBLIC_WEB_VALIDATION=1` — enables the validation-only secure-store
  stand-in (see below);
- `EXPO_PUBLIC_API_BASE_URL` — pointed at the local stub, overriding any value
  already in the environment on purpose;
- `CANEGUARD_WEB_VALIDATE_TODAY` — the reference date the fixtures are built
  from. Set it (`CANEGUARD_WEB_VALIDATE_TODAY=2026-11-01 npm run web:validate`)
  for a pinned run; otherwise the local date the script starts on is used.
  Accepted pins run from `1970-01-10` to `9999-12-31`; the fixtures derive
  earlier days, so anything outside that window stops the script with the
  one-line date error.

Then:

1. Open **`http://127.0.0.1:8199/login`**, not `/`. Under the single-page web
   output, `/` is answered by the manifest handler, which runs before the Metro
   middleware that adds COOP/COEP, so `SharedArrayBuffer` stays undefined there.
   `/login` and the other routes get the headers.
2. Sign in with the fake account printed at startup
   (`inspector@validation.invalid` / `validation-only`).
3. Use **one browser profile per origin**. A second same-origin tab fails on the
   OPFS lock (`NoModificationAllowedError`), which surfaces as a storage error.
   A password sign-in keeps its session in memory only, so a page reload returns
   to `/login`; navigate inside the app instead of reloading.

The stub seeds two active visits: `CG-LAB-0001` (Balayan, due today) and
`CG-LAB-0002` (Mabini, due two days ago). Home should lead with "One visit
today. One is overdue." and "Open next visit". The notification feed is empty,
and any other `GET` answers a well-formed empty page.

## Why the flags exist

| Piece | File | What it does |
| --- | --- | --- |
| Single-page output | `app.json` (`web.output: "single"`) | The dev server cannot bundle the SQLite worker with the committed static output; a static graph fails with HTTP 500 `Worker chunk not found`. |
| COOP/COEP | `metro.config.js` (`server.enhanceMiddleware`) | The web SQLite bridge uses `SharedArrayBuffer`, which needs a cross-origin-isolated page. The dev server now sends the headers, so no proxy is needed. |
| Async warm-up | `src/database/DatabaseProvider.tsx` | The first synchronous SQLite open busy-waits while the SQLite worker is still starting, and a blocked main thread starves that startup. On web only, one async open runs first, and the synchronous open is skipped unless it succeeds; a rejection or a 10-second timeout shows the retryable storage screen, and the warm-up connection is closed on retry and unmount. Native is untouched. |
| Worker length fix | `validation/expo-sqlite/WorkerChannel.ts` | `expo-sqlite` 57 writes the sync result length into a byte view, so results longer than 255 bytes are read back truncated. Delete this copy and its Metro alias when the app moves to SDK 58, which fixes it upstream. |
| Secure-store stand-in | `validation/expo-secure-store/ExpoSecureStore.web.ts` | `expo-secure-store` has no web implementation, so nobody can sign in on web. The stand-in keeps a fake session in `localStorage`. |
| Stub API | `validation/stub-api/` | Fake account, two fake visits, read-only feeds. No write is persisted. |

The stand-in is deliberately narrow: web platform only, requires
`EXPO_PUBLIC_WEB_VALIDATION=1` and `EXPO_PUBLIC_API_BASE_URL` set to the stub base
URL (`http://127.0.0.1:8210`), and is refused for `preview`, `qa` and
`production` builds (`EAS_BUILD_PROFILE`), for `NODE_ENV=production`, and for
any other API, including another loopback host or port. Never sign in to a real
server with it. The gate is pinned by
`scripts/__tests__/web-validation-config.test.js`.

## What this route proves

- that the app renders, routes and reads its cached records in a browser
  (Home, Activity, Visits, notifications list);
- that the web data path returns complete records, so "All clear." is not hiding
  a failed refresh.

It cannot prove anything native: TFLite inference, camera, permissions,
biometrics, secure storage, notifications delivery or device persistence. Those
remain `npm run e2e` / agent-device work with an attached device.

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
