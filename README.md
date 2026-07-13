# OpenCode Production Workflow

This repository contains the OpenCode agent configuration for production-grade feature delivery.

## Install per project

Copy these files into any project that needs the production-grade orchestrator workflow:

- `AGENTS.md` → project root
- `.opencode/agents/` → project `.opencode/agents/`
- `.opencode/commands/` → project `.opencode/commands/`
- `docs/` → project `docs/` (optional reference)
- `PROJECT_CHECKS.md` → project root (scaffold, customize per stack)

## Main commands

| Command | Purpose |
|---|---|
| `/ship-feature` | Full production-grade feature planning, implementation, review, and verification. |
| `/plan-feature` | Architecture, API contracts, and implementation checklist without editing. |
| `/review-feature` | Review current working tree diff for production readiness. |
| `/graph-map` | Build repository graph context and summarize architecture. |
| `/quick-fix` | Small local fix with light verification, no heavy planning. |

## Default verification

Fast checks only (run whichever exist in the project):

- lint
- typecheck / static analysis
- tests
- build
- manual UI verification checklist

Playwright, browser automation, and long-running E2E tests are opt-in only.

## Safety rules

- No automatic push, deploy, destructive migration, or data deletion.
- No hardcoded secrets in code.
- No changes to unrelated files.
- Destructive actions require explicit approval.
