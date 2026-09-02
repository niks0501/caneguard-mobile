---
name: akidev-mobile-verification
description: Mobile verification policy for agent-device projects; explicit-intent gate, device ownership, WSL2 emulator contract, native-runtime freshness, two operating modes, failure classification, and evidence boundaries.
---

<!-- Managed by AkiDev integration: akidev-mobile-verification -->
# AkiDev mobile verification policy

Agent Device is the primary and canonical Android device automation, UI verification, E2E/flow testing, and debugging framework for this project.
The shared `agent-device` CLI is the canonical runtime.
The optional `agent-device-mcp` integration exposes the same commands as a structured MCP interface for agents; it never replaces the CLI as the acceptance gate.
Read `.akidev/config` before using a selected capability.
The official `agent-device` project skill owns the CLI's command syntax, session model, and accessibility reference.

## Operating modes

Use exactly one of two modes for device work, and say which one you are in.

### Mode A - implementation and debugging (interactive)

Work like a human tester against the current device state:

1. Open a session and inspect the current UI with `agent-device open` and `agent-device snapshot -i`.
2. Act on the current UI with the smallest command that answers the question (`press`, `click`, `fill`, `scroll`, `back`), using `--settle` where supported.
3. Re-inspect from the printed diff after each action before deciding the next step.
4. Diagnose unexpected states in place; recover only when it is safe, and continue from the existing session instead of restarting the whole journey.
5. Close the session when done.

Interactive evidence supports diagnosis and exploration.
A fixed interactive pass is not regression acceptance; promoting a verified journey into a `.ad` script is how it becomes coverage.

### Mode B - established regression/E2E coverage (deterministic)

Checked-in `.ad` scripts under the project flow directory are the regression suite.
Run a focused script with `agent-device replay <script>` and the suite through the project npm actions.
Scripts contain explicit verification steps so genuine regressions fail instead of being silently worked around.
A replay failure returns a structured divergence report (step, file, line, post-failure snapshot digest, ranked selector suggestions).
Use the guarded resume (`replay --from <step> --plan-digest <digest>`) only when the plan is unchanged and the repaired state is understood; there are exactly zero blind full-flow retries.

## Explicit intent gate and device ownership

Device, runtime, and E2E capabilities are explicit-user-intent only.
Task difficulty alone never activates them.
`akidev-mobile-runtime`, `akidev-e2e-verification`, this skill, the `agent-device` CLI and MCP, and device-oriented ADB all sit behind that gate.
Only one agent or worktree may actively control a physical device or emulator at a time.
The shared Windows-hosted emulator is mutable state, so route active device work through the designated serialized verification lane.
`agent-device` device claims add tool-level enforcement: a foreign live claim blocks `open`, and ambiguous multi-device matches fail instead of guessing.

## WSL2 Android emulator preflight

For React Native + Expo Android verification from WSL2, the developer starts and manages the Windows-hosted Android Studio emulator before development.
That emulator is the default Android verification device for agents running in WSL2.
Use the existing localhost ADB connection from WSL2 rather than changing host or ADB networking.

After explicit user intent is established and before any Android device or E2E operation, run:

```bash
adb devices -l
```

Discover a ready device from the current output at runtime.
Prefer the ready emulator over a physical device, and keep its current serial or device identity for the operation.
If no usable emulator is listed, report a verification blocker and stop.
Do not launch, recreate, wipe, reconf