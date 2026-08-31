---
name: maestro-mobile-testing
description: Use for explicit Maestro flow authoring, evidence-driven mobile diagnosis, or deterministic Maestro acceptance in a React Native or Expo project.
version: 2.1.0
category: toolchain
author: AkiDev
license: MIT
tags:
  - react-native
  - expo
  - maestro
  - mobile
  - e2e
  - mcp
---

<!-- Managed by AkiDev integration: maestro-mobile-testing -->

# Maestro mobile testing

This file is the AkiDev source owner for the generated `maestro-mobile-testing` skill.
AkiDev generates it at `.agents/skills/maestro-mobile-testing/SKILL.md` when `maestro` or `maestro-mcp` is selected for the `react-native-expo` profile.

The skill owns one evidence-driven lifecycle for authoring, diagnosing, and accepting mobile flows.
The smaller routing, runtime, E2E, and `mobile-mcp` skills point here instead of restating this lifecycle.

AkiDev keeps `maestro`, Java, Android Platform Tools, `agent-device`, and any MCP adapter as user or project prerequisites.
It never installs Maestro, Java, Android Platform Tools, Pi packages, wrappers, BrowserStack, Appium, generated tool payloads, or a device session.
Read `.akidev/config` before using a selected capability.
Device, MCP, and E2E work requires explicit user intent and one active owner for the target device or emulator.
For WSL2 Android verification, the developer starts and manages the Windows-hosted Android Studio emulator before development.
That emulator is the default Android verification device for agents running in WSL2.
Use the existing localhost ADB connection from WSL2 rather than changing host or ADB networking.

## Operating objective

Do not optimize for making the test continue.
Optimize for increasing certainty about the current failure until the next action is justified by evidence.

The normal CLI path is plain `maestro test`.
Do not wrap it in automatic retries, rebuilds, emulator wipes, ADB or Metro recovery, or blind reruns.

A failing Maestro command is an observation, not a diagnosis.
A plausible explanation is a hypothesis, not a proven cause.
A successful command is not acceptance unless it proves the required behavior on the required evidence surface.

Before every retry or modification, answer:

> What new evidence or changed state makes this action more informative than repeating the previous one?

If there is no good answer, do not repeat the action.

## Capability boundaries

Use the smallest layer that answers the question:

- Use `agent-device` for unfamiliar-flow exploration, reproduction, logs, network inspection, crash investigation, and deep runtime state.
- Use the installed Maestro MCP only for explicit interactive diagnostics: `list_devices`, `inspect_screen`, an optional screenshot, and incremental `run` calls.
- Use the Maestro CLI and project npm commands to author permanent flows, run syntax checks, and produce final deterministic acceptance evidence.
- Use ADB only for transport, package/process, logs, reverse ports, or facts that the higher-level tools cannot provide.

`agent-device` remains the owner of its own command syntax and accessibility reference.
Reach it through the selected project skill when the MCP hierarchy or logs are insufficient.
The MCP child is diagnostic and never replaces the CLI gate.
If only `maestro-mcp` is selected, do not invent npm scripts or claim deterministic acceptance; select `maestro` when the project owner wants the CLI gate.

## Version-sensitive Maestro MCP contract

The installed server schema is the contract for the current worker, not a permanent list of tool names.
Before an explicit MCP session, check `maestro --version` and `maestro mcp --help`, then use the connected client's `tools/list` response and server instructions.
Refresh this section when the shared Maestro CLI changes.

The observed Maestro CLI `2.8.0` server exposed these tools:

- `list_devices` with no arguments.
- `inspect_screen` with `device_id`.
- `take_screenshot` with `device_id` when visual evidence adds information.
- `run` with `device_id` and exactly one of inline `yaml`, `files`, or `dir`, plus the exposed tag and environment options.
- `cheat_sheet` with no arguments.
- `open_maestro_viewer` with no arguments.
- `list_cloud_devices`, `run_on_cloud`, `get_cloud_run_status`, and `describe_cloud_run` for cloud operations.

The server does not guarantee separate `tap`, `type`, `launchApp`, `assertVisible`, or other interaction tool names.
Express those operations inside the current `run` contract or through the CLI when the current schema supports them.
Do not invent a missing tool or generate a copied tool payload.
Use `cheat_sheet` before an unfamiliar command, required argument, nested property, conditional, or multi-screen flow when the current server asks for it.

The AkiDev MCP entry starts the local stdio server as `maestro mcp --no-viewer`.
The `--no-viewer` choice keeps the diagnostic server headless and avoids an unsolicited Viewer process.

## Android emulator preflight

After explicit user intent is established and before any Android device or E2E operation, run:

```bash
adb devices -l
```

Discover a ready device from the current output at runtime.
Prefer the ready emulator over a physical device, and pass its current serial or MCP `device_id` to later operations when the interface supports it.
For MCP, match the `list_devices` result to the device discovered by ADB instead of assuming a hard-coded ID.

If no usable emulator is listed, report a verification blocker and stop.
Do not launch, recreate, wipe, reconfigure, or repair an AVD to recover it.
Do not reconfigure or repair ADB networking to recover it.
Do not set `ADB_SERVER_SOCKET`, start a second ADB server, or run `adb kill-server` in the healthy-connection path.
Use a physical device only when the task explicitly requires physical-device behavior.

When the project defines a shared device lock, acquire it exactly once at the top-level device or UI segment.
Do not nest acquisition of the same lock inside a child command or wrapper.
Every agent, wrapper, and helper that actively controls the shared device must respect the same ownership convention.

Bound agent-issued ADB probes with a caller or shell timeout when the environment supports one.
A timed-out ADB client does not prove that the shared ADB server recovered.
ADB responsiveness also does not prove that the Maestro driver or device transport is healthy.
Do not restart the shared ADB server automatically merely because one client command timed out.

## Evidence-driven lifecycle

Run this sequence exactly:

```text
EXPLORE -> AUTHOR INCREMENTALLY -> VALIDATE -> DIAGNOSE LOCALLY ON FAILURE -> FIX -> RERUN ONLY AFTER EVIDENCE
```

When a failure occurs, use this internal control loop before changing anything:

```text
OBSERVE -> CLASSIFY -> ISOLATE -> PROVE -> CHANGE -> RERUN -> EVALUATE
```

Never jump directly from observation to change unless the evidence already identifies the faulty layer without a material competing explanation.

### EXPLORE

1. Confirm explicit mobile or E2E intent, the selected integration, the project worktree, app identity, backend or fixture prerequisites, and the native-build freshness status.
2. Run `adb devices -l` before any Android device or E2E operation, discover the ready device at runtime, and prefer the emulator.
3. Run the relevant lint, typecheck, unit, and integration checks before interpreting device behavior.
4. Run `npm run e2e:doctor` when `maestro` is selected.
5. Confirm that no other worker owns the target device or emulator.
6. Use `agent-device` for an unfamiliar flow or deep runtime investigation.
7. If Maestro MCP is selected and authorized, call `list_devices` once and retain exactly one returned `device_id` that matches the ADB-discovered emulator.

Completion criterion: prerequisites, build freshness, device ownership, and the next smallest observable transition are recorded.

### AUTHOR INCREMENTALLY

1. Start with the smallest permanent flow or one-transition reproduction.
2. Inspect the current screen or hierarchy when useful before choosing a selector or guessing at a transition.
3. Prefer selectors in this order: stable test or accessibility ID, stable semantic text, stable accessibility property, another proven selector, and coordinates only as a last resort after hierarchy inspection.
4. Copy visible hierarchy text exactly when using text selectors.
5. Prefer relative relationships over indexes when a hierarchy proves the relationship.
6. With MCP, use `run` with inline YAML first, then `files`, then a bounded `dir` or tag selection after the inline behavior is understood.
7. Keep app, backend, auth, and fixture assumptions explicit in the flow and its evidence.

Completion criterion: the smallest flow expresses one intended transition with an evidence-backed selector and no guessed interaction.

### VALIDATE

1. Run the project-supported Maestro syntax check or `maestro check-syntax` for the changed flow.
2. Run the focused flow with plain `maestro test <flow>`.
3. Preserve the exact command, first failing interaction, commit, build identity, device ID, logs, screenshots, and artifacts.
4. Diagnose the smallest failing interaction before changing code, flow, data, or environment.
5. Make one evidence-backed change.
6. Rerun the focused flow with `maestro test <flow>`.
7. Run broader or full E2E with `npm run e2e` only when the task or an acceptance gate requires it.

The project action `npm run e2e:flow -- <flow>` is the package-script form of the focused plain Maestro command.
Do not add automatic retries, rebuilds, emulator wipes, ADB or Metro recovery, or blind reruns around these commands.
A failed Maestro command proves that the command failed; it does not by itself prove an application defect.

Completion criterion: syntax and the focused flow pass, or a preserved first failure has the required diagnostic record below.

### DIAGNOSE LOCALLY ON FAILURE

Preserve the device and application state at the first failure.
Capture the exact failing step, command or MCP input, timestamp, device ID, build identity, logs, and any screenshot or artifact.
Use `inspect_screen` to capture the Maestro-visible UI at that state.
Use `take_screenshot` only when it adds visual evidence.
Reproduce the smallest interaction that demonstrates the failure.
Use inline MCP YAML first, then the smallest file or directory input.
Escalate to `agent-device` only when the MCP hierarchy, result, and artifacts are insufficient for the next experiment.

Classify the failure as exactly one of:

`TEST | APP | DATA | TIMING | ENVIRONMENT | DEVICE | BACKEND/NETWORK | VERIFIER/HARNESS | EXTERNAL | UNKNOWN`

Record all five fields before changing code, flow, or environment:

```text
Observed: what actually happened.
Expected: the intended state or result.
Evidence: the exact step, hierarchy, result, logs, screenshots, and identities.
Cause: the current evidence-backed classification and hypothesis.
Next experiment: the smallest change that can distinguish the hypothesis.
```

Do not modify product code while the best evidence-backed classification is `DEVICE`, `ENVIRONMENT`, `VERIFIER/HARNESS`, `EXTERNAL`, or `UNKNOWN`.
A nonzero command proves that the command failed.
It does not automatically prove that the application failed.

If two evidence sources disagree, stop progression and resolve the contradiction.
For example, if a device-side connectivity probe reports failure while an independent host/API check proves the service is healthy, investigate the probe before changing application networking.

Choose a smallest discriminating probe or counterfactual whenever more than one explanation remains plausible.
Change one relevant variable when practical.
Examples include a real UI trigger versus a development deep link, canonical input versus malformed input, one text-entry mechanism versus another, direct ADB health versus Maestro driver health, or API persistence versus required browser UI rendering.

Promote a hypothesis into an actionable diagnosis only when the reduced probe reproduces it, a counterfactual separates it from the competing explanation, or independent evidence identifies the faulty layer without contradiction.

Completion criterion: the first failure is preserved, classified, reduced to a smallest next experiment, and proven enough to justify the next change or stop decision.

### FIX

Apply only the relevant code, test, flow, data, timing, environment, device, backend, verifier, or tool correction supported by the evidence.
Make one evidence-backed change at a time.
Preserve native-build freshness and project conventions.
Add or update a unit or integration regression test when the cause is application or data behavior.
Do not hide an app defect with a guessed selector, blind sleep, coordinate fallback, or an unchanged retry.
Do not add product compatibility behavior solely to make a malformed test invocation pass unless that compatibility is an accepted requirement.
Do not weaken an assertion, skip a required stage, or relabel supporting evidence merely to obtain a pass.

Completion criterion: the correction is recorded and the smallest reproduction is ready to run.

### RERUN ONLY AFTER EVIDENCE

Run the smallest reproduction after the correction, then the focused flow.
Rerun the smallest previously failing segment before restarting a broader chain.
A second complete or full-flow run requires all of the following: new evidence, a relevant code, test, or environment correction, a passing smallest reproduction, and a passing focused flow.
It also requires a usable native build, known backend or fixture prerequisites, and the same serialized device owner.

Earlier evidence may be reused only when the source, build, runtime, and acceptance boundary remain valid and the correction cannot affect those earlier stages.
If the correction crosses an earlier stage's behavior boundary, invalidate and rerun that stage.

There are exactly zero blind full-flow retries.
A full-flow failure returns to local diagnosis and focused validation rather than another unchanged full-flow attempt.
Do not automatically rebuild, wipe the emulator, recover ADB or Metro, or rerun the same unchanged command.
Run exactly one final `npm run e2e` gate only after the evidence gate passes.
The Maestro CLI or project npm result is the deterministic PASS or FAIL record.
MCP hierarchy, screenshots, and interactive results remain diagnostic evidence.

After every run, choose one continuation state:

- `PROVEN`: the segment passed with valid evidence, so continue to the next required segment.
- `NEW_FAILURE`: the failure changed, so preserve the new first failure and return to classification.
- `SAME_FAILURE_CHANGED_STATE`: a meaningful recovery or correction changed relevant state, so one controlled rerun is justified.
- `SAME_FAILURE_UNCHANGED_STATE`: do not rerun the same operation.
- `EXTERNAL_BLOCKER`: the required dependency cannot be repaired safely within task authority, so preserve evidence, record a keyed blocker, and stop the affected chain.

Do not blind-retry an unchanged infrastructure, device, browser, driver, or external failure.
After two equivalent occurrences without a meaningful state change, preserve the evidence, record a stable blocker key, identify the exact missing recovery or capability, and stop.
A third identical retry is not diagnosis.

Completion criterion: the final CLI gate has one deterministic result and a complete evidence record, or the task stops with the unresolved diagnosis or keyed external blocker.

## Evidence boundaries

Match evidence to the claim being accepted.

- Required Android UI behavior needs real device or Maestro evidence.
- Required Web UI behavior needs real browser UI evidence.
- API or database evidence may support persistence, identity, or backend claims, but it does not replace explicitly required UI evidence.
- Restart survival requires an actual restart transition when that is the acceptance criterion.
- Offline behavior requires an actual offline device state when that is the acceptance criterion.
- Connectivity recovery requires a real connectivity transition and synchronization when that is the acceptance criterion.

Never relabel simulated state, local-only state, API state, static inspection, or an adjacent successful stage as evidence for a different required surface.

## Evaluate the evaluator

Treat preflights, assertions, shell probes, evidence scripts, and validation commands as fallible software.
When a verifier fails, identify the exact claim it was intended to prove and compare its result with independent evidence.
Inspect the verifier's assumptions before modifying product code.
Correct the verifier when it measures the wrong condition, uses an unsupported command contract, scopes files incorrectly, or interprets an expected artifact as a regression.

A failed verifier is evidence about the verifier execution first.
Only classify the product as failed when the verifier validly measures the product claim and the evidence supports that conclusion.

## Evidence closeout

Use the project's evidence template when present.
Record the phase or flow, commit and worktree status, device model and OS, app and native-build identity, runtime freshness, exact commands or MCP inputs, timestamps, artifacts, backend or persistence proof when relevant, and skipped checks.
Record required evidence surfaces separately so supporting evidence cannot silently substitute for them.
Leave no Viewer or MCP process running.
Close an `agent-device` session when that tool owns it.
Do not clear app state or delete test data unless the approved acceptance procedure requires it.

Claim acceptance only when every required stage is proven on its required evidence surface, required source/build/runtime identities are known, no required stage was skipped or weakened, and the required deterministic checks passed.
