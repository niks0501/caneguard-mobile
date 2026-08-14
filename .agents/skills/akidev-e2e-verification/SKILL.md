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
npm run e2e:flow:reinstall -- .maestro/<flow>.yaml  # only for helper-version/stale-driver recovery
```

When the `maestro` integration is enabled, `npm run e2e` and `npm run e2e:flow` invoke the shared `maestro` CLI through `PATH`; their normal commands skip driver/server reinstallation while still installing missing helpers. Use `npm run e2e:flow:reinstall` only after a Maestro CLI update or when a flow misbehaves because its driver is stale. These commands are independent of Maestro MCP. `npm run e2e:doctor` reports missing machine/user-scoped prerequisites without installing anything. A project that selected only `maestro-mcp` should use its CLI fallback only after adding/enabling the `maestro` integration.

Use targeted E2E for a changed user journey and the full project gate before an acceptance claim when mobile E2E is required. Maestro CLI PASS/FAIL from the project npm command is deterministic evidence. Maestro MCP screenshots, hierarchy, and interactive sessions are diagnostic only and never replace the CLI gate. Keep one active owner per physical device/emulator and route device-control work through the serialized verification lane.
