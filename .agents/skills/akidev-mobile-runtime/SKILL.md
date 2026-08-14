---
name: akidev-mobile-runtime
description: Use only after explicit user intent for device/runtime inspection or mobile UI behavior; choose agent-device, ADB, Maestro MCP, or static checks without racing a shared device.
---

<!-- Managed by AkiDev integration: akidev-mobile-runtime -->
# AkiDev mobile runtime routing

This skill is discoverable for the selected Expo/mobile integrations but is **explicit-user-intent only**. Load or delegate it only when the user asks to use/check a physical device or emulator, inspect the running app, reproduce behavior on-device, interact with UI at runtime, or verify a mobile flow. Task difficulty or a desire for extra confidence never activates it.

## Choose the right layer

1. Use static code/tests when runtime state is not needed.
2. Use shared `agent-device` for quick app/device exploration and interaction.
3. Use shared `adb` for transport/device state, package/process/shell troubleshooting, install/connectivity checks, or when higher-level inspection cannot answer the question.
4. Use Maestro MCP through the dedicated `mobile-mcp` child for explicitly requested hierarchy/state, screenshot, selector, or interactive flow diagnosis. Interactive evidence is diagnostic.
5. Use the project npm commands and shared Maestro CLI for deterministic final acceptance evidence.

Do not use device-oriented ADB, agent-device, Maestro MCP, or `mobile-mcp` for code-only work. If a selected shared command is missing, report it and use static/fallback investigation; never install or upgrade workstation prerequisites.

## One-device-owner policy

Source analysis and Graphify may run in parallel, but a physical Android device or emulator is shared mutable state. Only one agent/worktree may actively own a given device at a time. Serialize agent-device, ADB-control, Maestro MCP, and Maestro sessions through the designated verification/debugging lane, and keep deterministic verification evidence in that lane.
