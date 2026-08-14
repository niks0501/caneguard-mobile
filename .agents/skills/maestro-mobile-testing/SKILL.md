---
name: maestro-mobile-testing
description: "Project-local Maestro mobile E2E authoring and diagnostics for React Native/Expo apps, including stable selectors, auth-aware flows, GraalJS helpers, and explicit MCP troubleshooting"
version: 1.1.0
category: toolchain
author: "tovimx (adapted by AkiDev)"
license: MIT
progressive_disclosure:
  entry_point:
    summary: "Write reliable Maestro YAML flows with stable selectors, auth-aware waits, and deterministic AkiDev verification commands"
    when_to_use: "When the user explicitly asks to write, debug, or verify a Maestro mobile flow or diagnose a selected Maestro MCP integration"
    quick_start: "1. Read .akidev/config 2. Run npm run e2e:doctor when maestro is selected 3. Write a focused YAML flow 4. Verify with npm run e2e:flow -- <flow>"
  token_estimate:
    entry: 180
    full: 7000
context_limit: 900
tags:
  - react-native
  - expo
  - testing
  - maestro
  - e2e
  - mobile
  - ios
  - android
  - yaml
  - mcp
requires_tools: []
---

<!-- Managed by AkiDev integration: maestro-mobile-testing -->

# Maestro mobile testing

## Scope and AkiDev adaptation

This skill is adapted from the upstream `maestro-mobile-testing` skill:

- Source: https://github.com/tovimx/maestro-mobile-testing-skill
- Imported version: `1.1.0`
- Adaptation: https://github.com/tovimx/maestro-mobile-testing-skill is used as a knowledge source; AkiDev keeps only the focused Maestro authoring and diagnostics guidance in this project-local skill.

AkiDev owns project orchestration, agent roles, routing, and verification policy. This optional skill adds specialized Maestro knowledge; it does not replace AkiDev workflow skills or install a third-party workflow framework.

This file is installed only when the project explicitly selects the `maestro-mobile-testing` tool for the `react-native-expo` profile. It does **not**:

- install Java, Android Platform Tools, Maestro, Node, an emulator, or any other workstation runtime;
- write global Codex, OpenCode, Pi, shell, or IDE configuration;
- start a device-control session, Maestro MCP server, emulator, simulator, backend, or background daemon;
- add or overwrite npm scripts, `.maestro` flows, MCP configuration, or ADB wrappers.

Use the capabilities already selected in `.akidev/config` and available on `PATH`. Mobile runtime and E2E work is explicit-user-intent only. If the user asks for code-only work, write or review flows statically without touching a device.

## Select the correct AkiDev integration

The guidance skill and runtime integrations are intentionally separate:

| Need | AkiDev tool | What it provides |
| --- | --- | --- |
| Authoring patterns and diagnostics guidance | `maestro-mobile-testing` | This project-local skill; no runtime installation |
| Deterministic local E2E | `maestro` | Checks shared Java 17+, `maestro`, and `adb`; adds conflict-safe project npm scripts |
| Interactive hierarchy, screenshots, or selectors | `maestro-mcp` | Project-local `maestro mcp` configuration; no separate runtime |
| Quick agent-driven device exploration | `agent-device` | Shared `agent-device` plus its project skill |

A project may select the guidance skill without selecting a runner. In that case, use it for static flow authoring and report missing prerequisites instead of installing them. `maestro-mcp` is independent from npm E2E and is never implied by this skill.

Read `.akidev/config` before using any selected capability. Do not infer permission from tool availability or task difficulty.

## Deterministic AkiDev verification

When the user explicitly requests E2E verification and `maestro` is selected, use the project-owned npm interface:

```bash
npm run e2e:doctor
npm run e2e
npm run e2e:flow -- .maestro/example.yaml
```

The normal `e2e` and `e2e:flow` scripts invoke the shared Maestro CLI with `--no-reinstall-driver`. This is the default because Maestro installs the on-device helper when missing and then reuses it. Do not remove that flag to work around a routine run.

After a Maestro CLI update, or when a stale on-device helper is suspected, the explicit escape hatch is:

```bash
npm run e2e:flow:reinstall -- .maestro/example.yaml
```

That project script intentionally invokes the plain Maestro reinstall path. The npm/Maestro CLI result is the deterministic acceptance evidence. MCP screenshots, hierarchy, and interactive actions are diagnostic evidence only and do not replace the CLI gate.

If the project selected only `maestro-mcp`, do not invent npm scripts. Explain that the project needs the separate `maestro` integration for the standard CLI gate.

## Stable selector strategy

Maestro is a declarative YAML runner with automatic waiting and retries. Prefer selectors that express user-visible intent and remain stable across releases.

| Context | Prefer | Reason |
| --- | --- | --- |
| Multiple languages or changing copy | `id:` / React Native `testID` | Stable across translations and copy edits |
| One language and stable copy | Text | Readable and self-documenting |
| Native/system dialogs | Text | No app `testID` is available |
| Repeated elements | Relative selectors | More robust than an index |

```yaml
# Stable testID selector
- tapOn:
    id: "submit-button"

# Human-readable text selector
- tapOn: "Submit"
```

In React Native, expose a semantic `testID` at the interaction boundary:

```tsx
<TouchableOpacity testID="submit-button" onPress={handleSubmit}>
  <Text>Submit</Text>
</TouchableOpacity>
```

Use a consistent `{component}-{action/type}[-{variant}]` convention, for example `auth-prompt-login-button`, `product-card-42`, `otp-input-0`, and `tab-home`. Avoid index-based selectors when a relation can identify the element:

```yaml
- tapOn:
    text: "Buy Now"
    below: "Product Title"

- tapOn:
    text: "Delete"
    childOf:
      id: "item-card-42"
```

Other useful selector relations include `above`, `leftOf`, `rightOf`, `containsChild`, and `containsDescendants`. State properties such as `enabled`, `selected`, `checked`, and `focused` are useful for proving behavior rather than merely locating a control.

```yaml
- tapOn:
    id: "submit-button"
    enabled: true
- assertVisible:
    id: "terms-checkbox"
    checked: true
- extendedWaitUntil:
    visible:
      id: "email-input"
      focused: true
    timeout: 3000
```

## Launch and authentication patterns

Auth and the first render are asynchronous. Add a zero-size marker that renders only after auth loading completes:

```tsx
{!isLoading && <View testID="auth-loaded" style={{ width: 0, height: 0 }} />}
```

Use the marker before interacting:

```yaml
- launchApp

# Helps avoid an iOS XCTest cold-boot accessibility race.
- swipe:
    direction: DOWN
    duration: 100

- extendedWaitUntil:
    visible:
      id: "auth-loaded"
    timeout: 15000
```

Keep flows adaptive when a project can launch in either auth state:

```yaml
- runFlow:
    when:
      visible: "Sign In"
    file: flows/auth-flow.yaml

- runFlow:
    when:
      visible:
        id: "tab-home"
    file: flows/authenticated-action.yaml
```

Do not assume `clearState: true` creates a guest user on iOS. It clears the app sandbox but does not clear Keychain values such as Expo SecureStore tokens, even after reinstall. Prefer the auth-loaded pre-flight and conditional flows. Android app data has different reset behavior, so keep platform-specific assumptions explicit.

For native permission dialogs and alerts, wait for the expected app state first and make only genuinely optional dismissals optional:

```yaml
- tapOn:
    id: "save-button"
- extendedWaitUntil:
    visible:
      id: "saved-indicator"
    timeout: 5000
- tapOn:
    text: "OK"
    optional: true
- tapOn:
    text: "Allow"
    optional: true
```

## Verifying behavior, not just taps

Optimistic updates should be observable on a short timeout before the server response:

```yaml
- tapOn:
    id: "action-button"

- extendedWaitUntil:
    visible:
      id: "undo-button"
    timeout: 3000

- extendedWaitUntil:
    visible:
      id: "user-indicator"
    timeout: 5000
```

Use roughly three seconds for an immediate mutation-state assertion and five seconds for a derived list/state update, adjusted to the project contract. Repeat the action or reload when persistence is part of the requirement. Take descriptive screenshots at meaningful checkpoints rather than after every step.

If a mobile app depends on a local API, its backend or project-approved mock must already be running under the user's explicit test request. This skill does not start services or invent test data. Diagnose a loading/empty state from project logs and scripts before changing a flow.

## Reusable flow structure

Keep flows focused and put repeated sequences in sub-flows:

```text
.maestro/
├── README.md
├── config.yaml
├── flows/
│   ├── auth-and-return.yaml
│   └── verify-result.yaml
├── scripts/                 # GraalJS helpers when needed
├── smoke-test.yaml
└── feature-action.yaml
```

A flow should document its prerequisites and behavior:

```yaml
# Checkout purchase flow
# Prerequisites: app installed, auth fixture available, API/mock running if needed
appId: com.myapp
---
- launchApp
- swipe:
    direction: DOWN
    duration: 100
- extendedWaitUntil:
    visible:
      id: "auth-loaded"
    timeout: 15000
- tapOn:
    id: "checkout-button"
- extendedWaitUntil:
    visible:
      id: "order-confirmation"
    timeout: 5000
- takeScreenshot: checkout-confirmed
```

Use Expo's registered scheme for deep links, not the bundle identifier:

```yaml
- openLink: "myapp://profile/settings"
```

For platform-specific behavior, use conditional sub-flows rather than hiding divergent expectations in scripts:

```yaml
- runFlow:
    when:
      platform: ios
    file: flows/ios-specific.yaml
- runFlow:
    when:
      platform: android
    file: flows/android-specific.yaml
```

## GraalJS helpers

Maestro scripts use GraalJS. Do not use `async`, `await`, `fetch`, or assumptions about a Node.js module environment. Use the Maestro `http` and `json` helpers, `var` declarations, and `output` values:

```javascript
var response = http.get("http://localhost:8025/api/v1/messages");
if (!response.ok) {
  throw new Error("Failed to fetch messages: " + response.status);
}
var data = json(response.body);
var body = data.messages[0].Content.Body;
var match = body.match(/(\d{6})/);
if (!match) {
  throw new Error("No OTP found");
}
output.OTP_CODE = match[1];
```

Use an approved local email capture service or test fixture for OTPs. Never commit real credentials or use production accounts. For split OTP inputs, tap each field before entering its digit because auto-focus behavior varies by implementation.

## Android, ADB, and device ownership

Android tests use an emulator or USB device. ADB is a project/device diagnostic capability, not a second runner. When explicit device verification is requested:

```bash
adb devices
adb shell am start -n com.myapp/.MainActivity
adb logcat | grep Maestro
```

Run these from the project verification context and use the shared `adb` on `PATH`. Do not create `.akidev/bin/adb`, download Platform Tools, or start a competing control session. Only one agent/worktree may actively own a physical device or emulator at a time; serialize ADB, agent-device, Maestro CLI, and Maestro MCP actions through the designated verification lane.

Android permissions often need platform-appropriate optional taps:

```yaml
- tapOn:
    text: "Allow"
    optional: true
- tapOn:
    text: "While using the app"
    optional: true
```

If `adb devices` or an app launch fails, report transport/package state first. Do not repair or install workstation tooling from this skill.

## Maestro MCP diagnostics

The upstream skill describes MCP as an interactive execution layer. AkiDev keeps that layer optional and project-local:

- Select `maestro-mcp` separately when the user explicitly asks for interactive hierarchy, screenshot, selector, or runtime diagnosis.
- AkiDev writes `maestro mcp` entries only to project-local `opencode.jsonc`, `.codex/config.toml`, and (when safe) `.mcp.json`; an existing user config gets a merge snippet instead.
- Pi users without a manually provisioned `pi-mcp-adapter` should use the npm/Maestro CLI commands above. AkiDev never installs that adapter.
- Do not start MCP merely because a task is difficult. Start it only after explicit user intent and only when the designated device owner is clear.
- MCP actions are diagnostic. Re-run the relevant project npm/Maestro CLI gate for deterministic acceptance evidence.

For a configuration diagnosis, inspect without rewriting:

```bash
sed -n '/maestro/,+8p' .codex/config.toml 2>/dev/null || true
grep -n -A8 -B2 '"maestro"' opencode.jsonc .mcp.json 2>/dev/null || true
```

Then verify the shared executable without launching a session:

```bash
command -v maestro
maestro --version
```

If an MCP session is explicitly authorized, do not also run agent-device, ADB-control, or a second Maestro session against the same device. Stop at the first useful diagnostic result and hand deterministic verification back to the serialized lane.

## CI and cloud guidance

CI providers may build an Android artifact and invoke Maestro Cloud, but this skill does not add CI files, secrets, or cloud credentials. Keep `MAESTRO_API_KEY` in the CI secret store and use project-approved actions/configuration. iOS local-device constraints and Android artifact setup belong in the project's CI documentation.

For local and CI flow selection, use descriptive tags such as `ci`, `smoke`, and `wip` only when the project already has a tag convention. Review the project's build and test scripts before suggesting a cloud workflow.

## Debugging checklist

1. Confirm the user explicitly requested E2E/device/MCP work.
2. Read `.akidev/config` and confirm the required AkiDev integration is selected.
3. Run `npm run e2e:doctor` when `maestro` is selected; missing Java/`adb`/`maestro` is a prerequisite report, not an installation task.
4. Confirm app ID, Expo scheme, backend/mock prerequisites, and auth state.
5. Prefer a stable `testID`, text, relation, or state selector over an index.
6. Add `auth-loaded` and the iOS post-launch swipe for cold-start-sensitive flows.
7. Check for native alerts and platform permission dialogs.
8. If API-dependent, inspect the service contract/logs rather than adding sleeps.
9. Use MCP or ADB only for the explicitly requested, serialized diagnostic session.
10. Finish with `npm run e2e:flow -- <flow>` or `npm run e2e`; use `npm run e2e:flow:reinstall -- <flow>` only as the explicit stale-driver escape hatch.

Common diagnoses:

| Symptom | Likely cause | Safer next step |
| --- | --- | --- |
| Element not found after tap | Alert, auth race, or unstable selector | Dismiss expected alert, wait for `auth-loaded`, use a semantic selector |
| OTP does not enter | Auto-focus interference | Tap each digit field before input |
| Empty/loading screen | API/mock is absent or wrong | Check project service setup and logs |
| iOS state unexpectedly authenticated | Keychain survived `clearState` | Use adaptive auth flows; do not assert guest-only UI |
| iOS accessibility crash on cold boot | First render race | Add the short post-launch swipe |
| Android permission blocks flow | System dialog text differs | Use platform-specific optional taps |
| MCP action competes with another run | Multiple device owners | Stop and serialize through the verification lane |
| CLI helper is stale | Maestro CLI/driver mismatch | Use the explicit reinstall npm script once |

## New-flow checklist

- [ ] User explicitly requested E2E, device, or MCP work before runtime actions.
- [ ] `.akidev/config` and selected capabilities were checked.
- [ ] Prerequisites are on `PATH`; no runtime was installed by the skill.
- [ ] Selector strategy is deliberate and stable.
- [ ] `auth-loaded` pre-flight and platform cold-start handling are present where needed.
- [ ] Both auth states and native alerts are handled intentionally.
- [ ] Optimistic updates use short, meaningful assertions.
- [ ] Reusable sequences are sub-flows, not copy-pasted waits.
- [ ] Backend/mock and test-account prerequisites are documented.
- [ ] Exactly one device owner is active.
- [ ] Deterministic project npm/Maestro CLI evidence was collected.
- [ ] MCP was used only for explicit diagnostics and did not replace the CLI gate.

## Further reading

- https://docs.maestro.dev/
- https://docs.maestro.dev/api-reference/selectors
- https://docs.maestro.dev/advanced/javascript/make-http-s-requests
- https://docs.maestro.dev/advanced/conditions
- https://docs.maestro.dev/getting-started/maestro-mcp
- https://docs.maestro.dev/cloud/ci-integration/github-actions
- https://github.com/mobile-dev-inc/Maestro
