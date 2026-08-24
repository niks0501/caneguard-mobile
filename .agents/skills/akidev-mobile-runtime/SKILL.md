---
name: akidev-mobile-runtime
description: Use only after explicit user intent for device/runtime inspection or mobile UI behavior; route agent-device, ADB, Maestro MCP, or static checks without racing a shared device.
---

<!-- Managed by AkiDev integration: akidev-mobile-runtime -->
# AkiDev mobile runtime routing

This skill is an explicit-user-intent router.
Read `.akidev/config` before any selected mobile runtime work.
When `maestro` or `maestro-mcp` is selected, also read the canonical `maestro-mobile-testing` skill.

## Choose the layer

1. Use source inspection and static tests when runtime state is not needed.
2. Use `agent-device` for unfamiliar-flow exploration, reproduction, logs, network or crash investigation, and deep runtime state.
3. Use shared `adb` for transport, package/process, logs, reverse ports, or facts that higher-level tools cannot provide.
4. Use the selected `mobile-mcp` child and installed Maestro MCP for explicit hierarchy, screenshot, selector, or incremental flow diagnosis.
5. Use the shared Maestro CLI and project npm commands for permanent flows and deterministic acceptance.

The canonical skill owns the evidence-driven lifecycle, version-sensitive MCP schema, selector policy, and failure gate.
This router owns only capability choice and the one-device boundary.

## One-device owner

Only one agent or worktree may control a physical device or emulator at a time.
Serialize `agent-device`, device-oriented ADB, Maestro MCP, and Maestro CLI sessions through the designated verification lane.
Do not start device tooling because a task is difficult or because a command happens to be available.
