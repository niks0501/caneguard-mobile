---
name: akidev-e2e-verification
description: Run targeted or deterministic Expo/Maestro verification only for explicit E2E/device requests; use project npm scripts as authoritative PASS/FAIL evidence.
---

<!-- Managed by AkiDev integration: akidev-e2e-verification -->
# AkiDev E2E verification

This skill owns the project command interface and deterministic acceptance result.
Load it only after explicit E2E, Maestro, device, or mobile verification intent.
The task difficulty alone does not activate this skill.
The canonical `maestro-mobile-testing` skill owns incremental authoring, version-sensitive MCP use, selector policy, and failure diagnosis.

## Android emulator preflight

For React Native + Expo Android verification in WSL2, the developer starts and manages the Windows-hosted Android Studio emulator before development.
That emulator is the default Android verification device for agents running in WSL2.
Use the existing localhost ADB connection from WSL2 instead of creating a new connection.

This skill remains behind explicit user intent for device, runtime, or E2E work.
Before any Android device or E2E operation, run `adb devices -l` and discover the ready device at runtime from its output.
Prefer the emulator over a physical device, and retain its current serial or device ID for the operation.
If no usable emulator is listed, report a verification blocker and stop.
Do not launch, recreate, wipe, reconfigure, or repair an AVD.
Do not reconfigure or repair ADB networking.
Do not set `ADB_SERVER_SOCKET`, start a second ADB server, or run `adb kill-server` in the healthy-connection path.
Use a physical device only when the task explicitly requires physical-device behavior.

## Project interface

```bash
npm run e2e:doctor
npm run e2e:flow -- .maestro/<flow>.yaml
npm run e2e
npm run e2e:flow:reinstall -- .maestro/<flow>.yaml
```

Run relevant lint, typecheck, unit, and integration checks before interpreting mobile results.
Use the project's native-build freshness guidance before treating a device result as an app result.
When the `maestro` integration is selected, the normal flow commands use the shared CLI with `--no-reinstall-driver`.
Use the reinstall command only as the explicit stale-driver escape hatch supported by the project.

MCP hierarchy, screenshots, and interactive results are diagnostic evidence.
The project npm or Maestro CLI result is the deterministic PASS or FAIL gate.
Keep one active owner per physical device or emulator and return any failure to the canonical evidence lifecycle before another full-flow run.
