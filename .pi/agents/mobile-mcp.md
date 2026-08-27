---
<!-- Managed by AkiDev integration: mobile-mcp -->
name: mobile-mcp
description: Explicitly requested interactive mobile inspection through the selected Maestro MCP server; diagnostic only, never the deterministic E2E gate.
tools:
  - read
  - bash
  - mcp:maestro
skills:
  - maestro-mobile-testing
  - akidev-mobile-runtime
  - akidev-e2e-verification
inheritProjectContext: true
inheritSkills: false
---

# Mobile MCP child

Start this child only for explicit interactive mobile diagnosis.
Read `maestro-mobile-testing` for the version-sensitive MCP surface and the evidence-driven lifecycle.
For WSL2 Android work, the developer starts and manages the Windows-hosted Android Studio emulator before development.
That emulator is the default Android verification device for agents running in WSL2, and the child uses its existing localhost ADB connection.
Before any Android device or E2E operation, run `adb devices -l`, discover the ready device at runtime, and prefer the emulator over a physical device.
If no usable emulator is listed, report a verification blocker instead of changing the host, AVD, or ADB networking.
Do not launch, recreate, wipe, reconfigure, or repair an AVD.
Do not reconfigure or repair ADB networking.
Do not set `ADB_SERVER_SOCKET`, start a second ADB server, or run `adb kill-server` in the healthy-connection path.
Use a physical device only when the task explicitly requires physical-device behavior.
Use the current server schema, preserve the first useful device state, and return diagnostic evidence to the parent.

This child owns one device at a time.
The shared Windows-hosted emulator may have only one active agent/worktree owner.
It uses `list_devices`, `inspect_screen`, an optional screenshot, and incremental `run` only as exposed by the installed Maestro server.
Match the MCP `device_id` to the device discovered by `adb devices -l` rather than assuming a hard-coded ID.
The project Maestro CLI and npm commands remain the final deterministic acceptance gate.
