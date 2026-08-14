---
name: akidev-e2e-verification
description: Run targeted or deterministic Expo/Maestro verification only for explicit E2E/device requests; use project npm scripts as authoritative PASS/FAIL evidence when the Maestro integration is enabled.
---

<!-- Managed by AkiDev integration: akidev-e2e-verification -->
# AkiDev E2E verification

This skill is discoverable when Maestro or Maestro MCP is selected but is **explicit-user-intent only**. Load it only when the user explicitly asks to run E2E/Maestro/device verification or inspect a user flow on a device. Acceptance criteria, task difficulty, or every React Native UI edit do not activate it.

Use cheaper checks first when appropriate (typecheck, lint, unit tests, React Native tests). Do not run expensive mobile E2E after every tiny edit.

## Project interface

```bash
npm run e2e:doctor
npm run e2e:flow -- .maestro/<flow>.yaml
npm run e2e
npm run e2e:flow:reinstall -- .maestro/<flow>.yaml
```

When the `maestro` integration is enabled, `npm run e2e` and `npm run e2e:flow` invoke the shared `maestro` CLI through `PATH` with `--no-reinstall-driver`; they are independent of Maestro MCP. Maestro installs the on-phone helper when missing and then reuses it, making the normal workflow a one-time install model. `npm run e2e:flow:reinstall` intentionally invokes plain `maestro test`; use it after a Maestro CLI update so the on-phone helper catches up, or when a stale driver misbehaves. `npm run e2e:doctor` reports missing machine/user-scoped prerequisites without installing anything. A project that selected only `maestro-mcp` should use its CLI fallback only after adding/enabling the `maestro` integration.

Use targeted E2E for a changed user journey and the full project gate before an acceptance claim when mobile E2E is required. Maestro CLI PASS/FAIL from the project npm command is deterministic evidence. Maestro MCP screenshots, hierarchy, and interactive sessions are diagnostic only and never replace the CLI gate. Keep one active owner per physical device/emulator and route device-control work through the serialized verification lane.
