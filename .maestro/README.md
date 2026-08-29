# CaneGuard Maestro workspace

Flows are grouped by implementation milestone so later P0 phases can add coverage
without replacing the protected scan regression:

```text
.maestro/
├── p0/                 # P0 phase flows
├── p1/                 # P1 review-status evidence scaffolds
├── evidence/           # evidence convention and phase records
└── artifacts/          # generated screenshots/logs; ignored by Git
```

Stable application selectors use the user-intent form `domain.intent`, for
example `scan.choose-gallery`. Do not encode layout positions, translated copy,
or component implementation details in IDs. System-owned UI, such as Android's
photo picker, may require its own accessible system labels because CaneGuard
cannot assign IDs inside another application.

## Android Studio emulator workflow

CaneGuard uses the Android Studio emulator running on the Windows host.
When working from WSL2, the official `adb` command on the active `PATH` connects to the Windows-hosted ADB server that owns the emulator.
Use that existing server for terminal and Maestro commands.

Start from the Mobile repository root, or another directory where `adb` is available:

```bash
adb devices -l
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8000 tcp:8000
adb reverse --list
```

The current emulator should appear as `emulator-5554` with state `device`.
The reverse list should include the `8081` Metro mapping and the `8000` API mapping.
With these mappings, keep `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000` in the Mobile `.env`.

The normal npm E2E scripts pass `--no-reinstall-driver`: Maestro installs the driver and server apps only when they are missing.
Approve that one-time install prompt in the unlocked emulator if it appears.
Both apps remain installed between runs, including failed reruns, so normal retries do not reinstall them.

## E2E command behavior

Use the project npm scripts for Maestro runs:

```bash
npm run e2e                         # all flows under .maestro
npm run e2e:flow -- .maestro/p0/00-baseline-scan.yaml
```

These default commands do not reinstall the on-device driver or server. If the
Maestro CLI has been updated and the on-device helper version needs to catch up,
or if a flow misbehaves because its driver is stale, use the explicit reinstall
escape hatch:

```bash
npm run e2e:flow:reinstall -- .maestro/p0/00-baseline-scan.yaml
```

The reinstall command intentionally uses the plain `maestro test` path. After
the helper apps are current, return to `npm run e2e` or `npm run e2e:flow` for
normal runs.

## P0-00 baseline

Prerequisites:

- the Android Studio emulator has a development build for
  `com.niks0501.caneguard` installed;
- the build contains the current TFLite/Nitro native runtime;
- Metro is serving the matching JavaScript bundle;
- a valid field-reporter session is already stored in the emulator; and
- the emulator has enough free storage to copy one managed scan image.

The flow intentionally preserves application state because clearing it would
remove the authenticated session. It uses `addMedia` to stage the checked-in
`assets/model-fixtures/parity-reference.jpg`, whose model contract expects a
Rust result, and then follows the public scan UI.

Run the focused baseline from the repository root:

```bash
npm run e2e:flow -- .maestro/p0/00-baseline-scan.yaml
```

Run all current P0 flows:

```bash
npm run e2e:flow -- .maestro/p0
```

If `auth.login-screen` is visible, authenticate manually and rerun; do not add
credentials or test-only authentication shortcuts to this flow. Copy the
terminal result and generated screenshots into the evidence location described
in `.maestro/evidence/README.md`.
