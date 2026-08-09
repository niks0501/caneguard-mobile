# CaneGuard Maestro workspace

Flows are grouped by implementation milestone so later P0 phases can add coverage
without replacing the protected scan regression:

```text
.maestro/
├── p0/                 # P0 phase flows
├── evidence/           # evidence convention and phase records
└── artifacts/          # generated screenshots/logs; ignored by Git
```

Stable application selectors use the user-intent form `domain.intent`, for
example `scan.choose-gallery`. Do not encode layout positions, translated copy,
or component implementation details in IDs. System-owned UI, such as Android's
photo picker, may require its own accessible system labels because CaneGuard
cannot assign IDs inside another application.

## WSL2-native Android toolchain

CaneGuard runs Metro, ADB, and Maestro inside WSL2. The project wrappers do not
fall back to Windows `adb.exe`, PowerShell, `.bat` launchers, or UNC working
directories:

```text
WSL2 Metro ──────────────┐
WSL2 Maestro → WSL2 ADB ├── Wi-Fi ──→ Android device
WSL2 backend ────────────┘
```

`./.akidev/bin/adb` runs the native Linux binary installed at
`.akidev/tools/android-platform-tools/adb`. The ignored `.akidev/tools/`
directory keeps the platform package local to this checkout without committing
the downloaded SDK binaries. `./.akidev/bin/maestro` prepends the wrapper to
`PATH` so Maestro and terminal commands always share the same Linux ADB server.

### Pair a physical device directly with WSL2

The device and WSL host must be able to reach each other on the same network.
On Android, enable **Developer options → Wireless debugging**, choose
**Pair device with pairing code**, and note the displayed IP, pairing port, and
six-digit code. Then run from WSL:

```bash
./.akidev/bin/adb pair PHONE_IP:PAIRING_PORT
./.akidev/bin/adb connect PHONE_IP:CONNECTION_PORT
./.akidev/bin/adb devices -l
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
./.akidev/bin/adb reverse tcp:8081 tcp:8081
./.akidev/bin/adb reverse tcp:8000 tcp:8000
./.akidev/bin/adb reverse --list
```

HyperOS must keep **Install via USB** and **USB debugging (Security settings)**
enabled for Maestro input injection. A fresh Maestro session may still show an
on-device helper installation prompt; keep the phone unlocked and approve it.

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
./.akidev/bin/maestro test .maestro/p0/00-baseline-scan.yaml
```

Run all current P0 flows:

```bash
./.akidev/bin/maestro test .maestro/p0
```

If `auth.login-screen` is visible, authenticate manually and rerun; do not add
credentials or test-only authentication shortcuts to this flow. Copy the
terminal result and generated screenshots into the evidence location described
in `.maestro/evidence/README.md`.
