# Phase 2 — Native Runtime and EAS Smoke Test

## Objective

Prove that the current Expo/EAS Android configuration can build, install, launch, and load the bundled TensorFlow Lite model before the team invests in the complete image pipeline.

## Primary Owners

- **DevOps Engineer:** EAS configuration, build reproducibility, APK delivery.
- **Software Developer:** native model-loading smoke test.
- **Software Architect:** isolates the smoke-test implementation.
- **QA Engineer:** validates installation and model-load behavior on a physical device.
- **Product Owner:** accepts the runtime foundation before feature work continues.

## Existing Foundation

The branch already includes the native runtime dependencies, development client, EAS profiles, bundled model asset, and Metro support for `.tflite`.

This phase verifies that those configurations work together in an actual Android build. Dependency installation alone is not proof that the native module loads correctly.

## Implementation Plan

### 1. Establish Clean Build Baseline

Run:

```bash
npm ci
npx expo-doctor
npm run lint
npx tsc --noEmit
```

Record all warnings. Do not hide new warnings unless the team has documented why they are irrelevant.

### 2. Verify EAS Configuration

Confirm:

- Android package name is stable.
- EAS project ID resolves correctly.
- Development profile produces an APK.
- Preview profile produces a standalone APK.
- The project includes `expo-dev-client`.
- No secret or machine-specific path is stored in the repository.

### 3. Add Temporary Model Load Status

Create a minimal model hook or smoke-test screen:

```text
src/features/detection/model/useCaneGuardModel.ts
src/app/model-smoke-test.tsx
```

The screen must display:

- `Loading model`
- `Model loaded`
- `Model failed to load`
- actual error detail in development mode

Do not run image inference yet. This phase proves asset resolution and native module availability only.

### 4. Build Development APK

```bash
eas build --platform android --profile development
```

Install it on the primary Android phone.

Start the JavaScript development server with:

```bash
npx expo start --dev-client
```

### 5. Validate Runtime

Check:

- application launches;
- no native crash occurs;
- model asset can be resolved;
- TensorFlow Lite module initializes;
- the model reaches the loaded state;
- reopening the screen does not cause repeated uncontrolled model loading.

## Architecture Decision

The final model instance should live near the application root or inside a dedicated provider so scans reuse one loaded model. The smoke-test implementation may be simple, but it should be structured so it can evolve into the final model hook rather than becoming throwaway code.

## UI/UX Requirements

The smoke-test route is developer-facing. It does not need polished visual design, but status must be readable and distinguish loading from failure.

The normal scan workflow must remain unchanged during this phase.

## QA Test Cases

| Test | Expected Result |
|---|---|
| Launch development APK | App opens successfully |
| Open model smoke-test route | Loading state appears |
| Wait for model | Loaded state appears |
| Disable Metro after JS bundle is loaded | Native app does not crash |
| Reload route | Model remains reusable |
| Temporarily break model path locally | Clear failure state appears |
| Rebuild with correct path | Loaded state returns |

## DevOps Evidence

Store a short build record:

```text
docs/model-v0/build-records/development-smoke-test.md
```

Include:

- EAS build profile;
- build date;
- commit SHA;
- device model and Android version;
- build result;
- installation result;
- model-load result;
- unresolved warnings.

## Non-Goals

This phase does not:

- select images;
- preprocess pixels;
- run inference;
- build a final result screen;
- add delegates such as GPU or NNAPI.

## Suggested Commit

```text
build(android): verify EAS dev client and TFLite model loading
```

## Rollback Safety

Keep the smoke-test route isolated. If the native integration causes instability, this commit can be reverted without touching the existing mock scan flow.

## Exit Criteria

- Development APK builds successfully.
- APK installs on the primary phone.
- Application launches through the development client.
- Bundled TensorFlow Lite model loads without a native crash.
- Failure produces a visible and debuggable error.
- Build evidence is recorded.
