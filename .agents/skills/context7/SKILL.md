---
name: context7
description: Retrieve current, version-sensitive library documentation through the project-local Context7 MCP server. Use when external package or API behavior may have changed since model training.
---

<!-- Managed by AkiDev integration: context7 -->

# Context7

Use Context7 when implementation depends on current external library or framework documentation and repository-local evidence is insufficient.

## How it is provided

AkiDev configures Context7 as a **project-local MCP server** for both Codex and OpenCode. The agent should use the Context7 MCP tools directly when they are available.

The project configuration is intentionally pinned to the reviewed Context7 MCP version recorded by AkiDev.

## Rules

- Prefer repository facts and framework-owner documentation first.
- Use Context7 for version-sensitive third-party APIs and packages.
- Mention the dependency version when it materially affects the answer.
- Do not call Context7 reflexively for ordinary repository questions.
- Never place API keys or credentials in committed configuration.
- Never modify global Codex or OpenCode configuration.
- If the MCP server is unavailable, report that gap and continue with repository evidence or other approved documentation sources.
