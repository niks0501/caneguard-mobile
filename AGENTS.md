# Project Agent Rules

These rules apply to AI coding agents working in this repository, including OpenCode and Codex.

## Core Operating Mode

Default mode: one-shot production feature delivery.

When the user asks for a feature, bug fix, refactor, UI improvement, backend change, test workflow, deployment change, or architecture update, use the production workflow unless the request is clearly trivial.

The goal is not to rush. The goal is to ship a complete, maintainable, tested implementation with fewer mistakes.

## Workflow Sizing

Use the light path for small, local changes:

1. Inspect the relevant files.
2. Make the smallest safe edit.
3. Run fast verification.
4. Summarize the change and any manual checks.

Use the full orchestrator path when the task touches multiple modules, architecture, frontend and backend contracts, database changes, security-sensitive behavior, unclear dependencies, or broad refactoring.

## Change Risk Level

Classify every task before editing:

- Low: single-file/local UI or copy fix. Use light path.
- Medium: multiple related files, normal feature, non-destructive backend change. Use full orchestrator path.
- High: auth, permissions, payments, file uploads, migrations, data deletion, production config, deployment, or security-sensitive logic. Use full orchestrator path, include rollback considerations, and do not proceed with destructive actions without explicit approval.

## Git Discipline

Before edits:

- Run `git status` to check the current branch and working tree state.
- Identify the current branch and warn if working directly on `main` or `master`.
- Never overwrite uncommitted user changes.
- Never commit, push, reset, rebase, stash, or delete files unless explicitly requested.

For large tasks, recommend a feature branch name, but do not create it unless asked.

## Multi-Agent Safety

- Prefer one active coding agent per branch.
- Do not run OpenCode and Codex on the same branch at the same time unless the user explicitly accepts the risk.
- If another agent changed files, inspect `git diff` before editing.
- Do not overwrite another agent's changes.
- For comparison between agents, use separate branches or worktrees.

## Mandatory Workflow

Use this sequence for every non-trivial request that needs the full path:

```text
User Request
   |
   v
Repository Discovery
   |
   +--> Architecture + Risk Planning
   |
   +--> UI/UX + Backend Contract Design
   |
   +--> Implementation Plan
   |
   +--> Code Changes
   |
   +--> Review + Verification
   |
   v
Final Summary
```

## Agent Roles

Use specialized reasoning roles when useful:

- Architecture: repository understanding, architecture, data flow, feature decomposition, API contracts, database impact, and risk analysis.
- Implementer: careful code implementation based on the approved or implied plan.
- Reviewer: security, correctness, maintainability, accessibility, performance, and test coverage review.

For Codex, these roles may be handled by custom agents in `.codex/agents/`. For OpenCode, these roles may be handled by `.opencode/agents/` and `opencode.jsonc`.

## Graphifyyy Usage

Use Graphifyyy for repository-wide understanding when the change affects multiple files, modules, domains, routes, database tables, components, or architectural boundaries.

Preferred behavior:

1. Check whether `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.json`, or `graphify-out/graph.html` exists.
2. If missing or clearly stale, use the available Graphifyyy command, skill, or local tool when available.
3. Use Graphifyyy output to identify important files, hidden dependencies, call flows, and architectural risks.
4. Do not rely only on grep if Graphifyyy is available and the task is repo-wide.

If Graphifyyy is unavailable, explain that and fall back to safe repository inspection using `find`, `rg`, `grep`, targeted reads, and package/config files.

## UI/UX Pro Max Usage

Use UI/UX Pro Max or equivalent UI review behavior whenever the task changes anything visual or interactive:

- pages
- layouts
- dashboards
- admin panels
- forms
- tables
- modals
- navigation
- responsive behavior
- animations
- loading, empty, error, success, disabled, and pending states
- accessibility
- design systems

For pure backend, scripts, migrations, or API-only work, skip UI/UX review unless the backend change affects frontend behavior.

## MCP Usage Policy

Use MCP tools intentionally:

- Use Context7 for current library/framework documentation, especially when implementing APIs, framework conventions, package configuration, or version-sensitive code.
- Use GitHub MCP for repository issues, pull requests, branch context, remote repository metadata, and code review workflows when available.
- Do not use Playwright or browser automation by default. Prefer fast verification commands and manual UI verification checklists. Use Playwright only when explicitly requested for E2E testing, browser automation, screenshots, accessibility snapshots, or browser-based debugging.

Do not expose private project information in output.

## Planning Requirements

Before code changes, create a compact but complete plan containing:

1. Restated user request.
2. Assumptions and constraints.
3. Files and modules likely affected.
4. ASCII architecture/data-flow diagram when useful.
5. Frontend behavior and UI state map when relevant.
6. Backend behavior and API contract when relevant.
7. Database/schema impact if any.
8. Security concerns.
9. Testing and verification strategy.
10. Implementation checklist.

For one-shot mode, do not stop for approval unless the action is destructive, security-sensitive, production-impacting, or impossible to interpret safely.

## Implementation Standards

### General

- Prefer small, cohesive changes over scattered rewrites.
- Preserve existing project conventions over personal preference.
- Do not rename public APIs, routes, tables, fields, or files unless required.
- Do not introduce new dependencies unless they clearly reduce complexity or are requested.
- Do not modify generated/vendor/build artifacts unless the project explicitly tracks them.
- Keep code readable before clever.

### Backend

- Keep controllers thin; place business logic in service/action classes when the framework/project supports it.
- Validate all input at boundaries.
- Enforce authorization server-side, not only in the UI.
- Use transactions for multi-step writes that must succeed or fail together.
- Handle errors predictably with structured responses.
- Avoid leaking internal errors to users.
- Use existing repository/model/query conventions.
- Add or update tests for business rules, validation, authorization, and edge cases.

### Frontend

- Build complete UI states: loading, empty, error, success, disabled, pending, and optimistic/non-optimistic behavior as appropriate.
- Make forms accessible: labels, focus states, keyboard flow, error messaging, and aria attributes where needed.
- Ensure responsive layouts for mobile, tablet, and desktop.
- Preserve design consistency with existing spacing, typography, color, and component patterns.
- Avoid fragile selectors and duplicated component logic.
- For tables and dashboards, include search/filter/sort/pagination behavior only when requested or consistent with the app.

### Security

Always check:

- Authentication and authorization.
- CSRF protection for state-changing requests.
- XSS risk in rendered user content.
- SQL injection and unsafe query construction.
- File upload validation, storage path safety, and MIME/extension checks.
- Sensitive information exposure in code, logs, errors, screenshots, or generated files.
- Rate limiting or abuse controls for sensitive actions.

### Database

- Prefer migrations over manual schema changes where the project supports migrations.
- Keep schema changes backward-compatible when possible.
- Add indexes for new query patterns where justified.
- Avoid destructive migrations unless explicitly requested.
- Document required seed data or config changes.

## Verification Requirements

After implementation, run the strongest fast verification available for the project:

1. Format/lint command if configured.
2. Typecheck/static analysis if configured.
3. Unit/integration tests if configured.
4. Build command if applicable.
5. Manual verification checklist for UI flows.

Do not run Playwright, browser automation, or long-running E2E tests unless explicitly requested.

If a command fails, diagnose and fix it when safe. If it cannot be fixed within the scope, report the exact failing command, exact failure, likely reason, and manual test steps.

## Final Response Requirements

At the end of a task, summarize:

1. What changed.
2. Files touched.
3. Verification commands run and their result.
4. Remaining risks or follow-ups.
5. How to test manually.

Do not claim tests passed unless they were actually run.

## Definition of Done

A task is done only when:

1. The requested behavior is implemented.
2. The change is limited to relevant files.
3. Existing conventions are preserved.
4. Fast verification was run or clearly explained if unavailable.
5. UI work includes manual test steps.
6. Security, validation, and authorization impact were checked.
7. The final response lists files changed, commands run, results, risks, and manual checks.
