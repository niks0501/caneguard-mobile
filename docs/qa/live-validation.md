# Live (device) validation

`npm run live:up` is the single entry point for proving behaviour on a phone or
emulator. Device proof means **agent-device** commands: it is the mandated
live-validation driver. The web route (`npm run web:validate`, see
[`web-validation.md`](web-validation.md)) stays the first proof and the only
fallback; it cannot prove native behaviour.

## Run it

```bash
npm run live:up                 # holds stub API + Metro until Ctrl-C; run it in the background
npm run live:up -- --exit-after-ready   # same checks, then tear down (dry run)
npm run live:ad -- <agent-device args>  # run one driver command and log it verbatim
npm run live:build              # local-only dev client rebuild, native delta only
```

`live:up` runs these steps in order. Every wait is bounded, and any failure
prints one fixing command and a non-zero exit.

1. `adb devices -l`. No target in state `device` records **DEVICE_UNAVAILABLE**
   (exit 3), names the fallback `npm run web:validate`, and starts nothing.
   A web-only run is *device-unavailable, inconclusive*, never a pass.
2. `expo fingerprint` (Android) selects `.apk-cache/<fingerprint>/<sha>.apk`.
   The installed dev client's base APK is pulled and hashed:
   - sha matches a cached build: **reuse**;
   - differs or not installed, a cached build exists: `adb install -r` of that cached build;
   - nothing cached for this fingerprint: native delta; the fix is `npm run live:build`
     (`expo prebuild` if needed, then `./gradlew :app:assembleDebug`, then cache and install).
   Never spend EAS for dev verification. The fingerprint ignores `package.json` scripts and
   `.gitignore` so tooling edits do not read as native change.
3. Stub API on `127.0.0.1:8210` (checked by an HTTP request, 10 s bound) and Metro on
   `127.0.0.1:8081` with `EXPO_PUBLIC_API_BASE_URL` pointed at the stub
   (`/status` must report `packager-status:running`, 120 s bound). A busy port fails fast.
4. `adb reverse tcp:8081` and `tcp:8210`, then `adb reverse --list` must show both.
5. Prints **READY** with revision, device, dev client action and fingerprint, URLs and the
   evidence directory.

Then open the dev client with the `connect` command READY prints (or
`scripts/ad-flow-env.sh connect-metro`) and sign in with the fake accounts from
`web-validation.md`.

## Driver and run log

Drive the phone only with agent-device through `npm run live:ad -- …`
(for example `-- open com.niks0501.caneguard --platform android`, `-- snapshot -i`,
`-- click 'id="scan.choose-gallery"'`, `-- screenshot <path>`). The wrapper appends each
command verbatim, with a UTC time and exit code, to the transcript, so the run log
names the driver and lists every navigation and input command. Connectivity toggles
(`adb shell svc wifi|data disable|enable`) and any other adb command used to set
state are listed in the evidence record the same way.

## Fixed evidence paths

Per revision: `.agent-device/test-artifacts/live/<short-sha>[-dirty]/`, with
`live/latest` pointing at the newest run. The directory is git-ignored; copy durable
evidence to the review artifact store as `.agent-device/evidence/README.md` describes.

| Path | Content |
| --- | --- |
| `transcript.md` | revision stamp, driver name, every command in order with time and exit |
| `run.json` | result (`READY`, `DEVICE_UNAVAILABLE`, `FAILED`), device, fingerprint, APK sha, reversal list, fix command |
| `screenshots/` | `agent-device screenshot` output, named `NN-step.png` |
| `db/` | database copies pulled from the app (`adb exec-out run-as com.niks0501.caneguard cat databases/<db> > db/<name>.db`) |
| `stub.log`, `metro.log` | stub requests and Metro output |

## Rules that still apply

- Web-first proof before any phone claim.
- Missing phone, stale dev client or an unproven step is **inconclusive**, not pass.
- Dev client reuse is fingerprint-gated; rebuild locally only on a native delta.
- Record revision, fingerprint, APK sha and these evidence paths.
