# Live web run: upload attempts against a fault-injecting local stub

Real product: Expo web dev server on 127.0.0.1:8199 (EXPO_PUBLIC_WEB_VALIDATION=1),
real browser (Chrome), real OPFS SQLite, real fetch to a disposable stub on
127.0.0.1:8210 that mirrors validation/stub-api and adds fault injection.

## Fault window A: every POST /api/v1/mobile/assignments/<id>/completion -> 503 + `Retry-After: 300`

```
11:12:44.111Z  POST /api/v1/mobile/assignments/b8c9d0e1-.../completion   (Complete visit, CG-LAB-0001)
               -> 503 Retry-After: 300 ; screen: "Saved on this device / Try Again"
               three "Try Again" taps over ~21s  -> 0 new POSTs
```
No upload left the device for the whole hold window: manual Retry now is held too.

## Fault window B: same completion endpoint -> 503 with NO Retry-After (fresh app session)

```
11:16:15.367Z  POST .../completion (Complete visit, CG-LAB-0002)  -> 503, no hint
11:16:32.245Z  POST .../completion  (Try Again tap)  -> 503
11:16:34.261Z  POST .../completion  (in-service immediate retry, 2s)
11:16:39.267Z  POST .../completion  (in-service immediate retry, 5s)
```
Same button, same row, no server hint: the send goes out immediately. So the
zero-POST result in window A is attributable to `Retry-After`, not to the
per-record cooldown or a disabled control.

## Fault window C: completion endpoint -> 404

```
11:16:54.273Z  POST .../completion (CG-LAB-0002) -> 404
11:16:54.299Z  POST .../completion (CG-LAB-0001) -> 404
```
Activity afterwards: "CG-LAB-0001 / CG-LAB-0002 · Visit cancelled — The office
cancelled this visit. Your saved visit stays here. No further action is needed."
Terminal, not "will retry": the 404 stays endpoint-scoped to reports/boundaries.

## Fault window D: POST /api/v1/mobile/field-surveys -> 404

```
11:19:55.559Z  POST /api/v1/mobile/field-surveys -> 404
```
My boundaries afterwards: "BAT-001 · 3.52 ha   [Will retry]
The office could not be reached. It tries again on its own."
Home: "1 boundary, 2 visits waiting to send."  (retryable office-not-ready)
