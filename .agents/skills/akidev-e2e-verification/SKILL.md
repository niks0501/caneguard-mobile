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
