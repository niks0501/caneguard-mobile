<!-- Historical record - framework retired 2026-09. Device automation moved to Agent Device; see .agent-device/README.md. -->

# Maestro Test Plan — UI/UX Enhancement

The repository already contains a Maestro harness and evidence workflow. Extend that approach rather than introducing another E2E framework.

## Testing principle

Each implementation phase should leave runnable evidence before the next large visual phase begins.

Do not rely only on snapshots/screenshots. Validate interaction and state.

## Required critical-path flow

Create or update a UI/UX enhancement flow that covers the normal scan path:

1. launch app in a known authenticated/test state
2. open Home
3. assert Start Scan is visible
4. open Scan
5. choose/capture an available fixture image using the existing test strategy
6. assert Image Preview
7. Analyze
8. assert Symptoms
9. choose/skip observations according to the fixture
10. Continue
11. assert Analysis Result
12. verify the result screen has the expected semantic elements
13. save record if the current flow supports it
14. open Records
15. open saved Record Details

Use existing test IDs where they already exist rather than brittle text-only selectors.

## Visual assertions to add where practical

- Home contains exactly the intended supported-class education labels.
- Downy Mildew and Smut labels are absent from supported-class education.
- Scan has no decorative illustration dependency.
- Result still displays decision-support wording.
- Offline/pending state remains visible when applicable.
- Settings uses stable navigation affordances.

## Regression flows

Keep existing P0 flows passing.

Add focused flows only when a screen's interaction contract changes. Do not rewrite every existing Maestro file just because spacing/colors changed.

## Evidence

For each changed phase, record:
- commit SHA
- build identifier/device
- command executed
- pass/fail result
- screenshot(s) for relevant screen
- known limitation if any

Recommended evidence grouping:
- `UIUX-00-baseline`
- `UIUX-01-assets-home`
- `UIUX-02-scan-preview`
- `UIUX-03-checklist-result`
- `UIUX-04-records-reports`
- `UIUX-05-branding`
- `UIUX-06-final`

## Native branding check

Icon and splash changes may require a new native/development build. Metro refresh alone is not sufficient proof for launcher/adaptive/monochrome/splash assets.

Record the build used for this verification.
