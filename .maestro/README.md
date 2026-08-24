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

## WSL2-native Android toolchain

CaneGuard runs Metro, ADB, and Maestro inside WSL2. The project does not create
wrappers or fall back to Windows `adb.exe`, PowerShell, `.bat` launchers, or UNC
working directories:

```text
WSL2 Metro ------+
WSL2 Maestro --> WSL2 ADB --- Wi-Fi ---> Android device
WSL2 backend ----+
```

Use the shared `adb` and `maestro` commands from the active WSL2 `PATH`.
Keep both tools on the same native Linux toolchain so Maestro and terminal
commands use the same Linux ADB server.

### Pair a physical device directly with WSL2

The device and WSL host must be able to reach each other on the same network.
On Android, enable **Developer options → Wireless debugging**, choose
**Pair device with pairing code**, and note the displayed IP, pairing port, and
six-digit code. Then run from WSL:

```bash
adb pair PHONE_IP:PAIRING_PORT
adb connect PHONE_IP:CONNECTION_PORT
adb devices -l
```

Enter the six-digit code only at ADB's interactive prompt; never store it in the
repository or evidence logs. The connection port shown on the main Wireless
debugging screen is usually different from the temporary pairing port and may
change after wireless debugging restarts. If automatic discovery does not
reconnect the device, repeat only the `adb connect` command with the current
connection port.

For a physical device loading WSL-hosted services through localhost, configure
the reverse mappings on the same Linux ADB server:

```bash
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8000 tcp:8000
adb reverse --list
```

HyperOS must keep **Install via USB** and **USB debugging (Security settings)**
enabled for Maestro input injection. The normal npm E2E scripts pass
`--no-reinstall-driver`: Maestro installs the driver and server apps only when
they are missing. Approve that one-time install prompt on the unlocked phone;
both apps remain installed between runs, including failed reruns, so normal
retries do not reinstall them.

## E2E command behavior

Use the project npm scripts for Maestro runs:

```bash
npm run e2e                         # all flows under .maestro
npm run e2e:flow -- .maestro/p0/00-baseline-scan.yaml
```

These default commands do not reinstall the on-phone driver or server. If the
Maestro CLI has been updated and the on-phone helper version needs to catch up,
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

- an Android emulator/device has a development build for
  `com.niks0501.caneguard` installed;
- the build contains the current TFLite/Nitro native runtime;
- Metro is serving the matching JavaScript bundle;
- a valid field-reporter session is already stored on the device; and
- the device has enough free storage to copy one managed scan image.

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
