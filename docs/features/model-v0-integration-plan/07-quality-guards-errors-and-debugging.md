# Phase 7 — Quality Guards, Error Handling, and Debugging

## Objective

Make the prototype resilient enough for repeated field-style use and presentation by adding lightweight image warnings, explicit failure recovery, and a development-only model debug screen.

## Primary Owners

- **QA Engineer:** defines failure scenarios and validates recovery.
- **UI/UX Designer:** creates clear warning, error, retry, and progress states.
- **Software Developers:** implement quality metrics, typed errors, and debug tooling.
- **Software Architect:** separates warnings from disease inference.
- **DevOps Engineer:** ensures debug tools do not affect the release build.
- **Product Owner:** approves which warnings are visible in the prototype.

## Image Quality Philosophy

Quality checks are input warnings, not disease evidence.

They may tell the user that an image is:

- too small;
- too dark;
- too bright;
- low contrast.

They must not:

- increase or decrease model confidence;
- determine a disease;
- claim scientific blur detection unless it is implemented and validated;
- block every imperfect image.

## Proposed Module

```text
src/features/detection/validation/assessImageQuality.ts
```

Recommended output:

```ts
type QualityWarning =
  | 'low-resolution'
  | 'too-dark'
  | 'too-bright'
  | 'low-contrast';

interface ImageQualityAssessment {
  warnings: QualityWarning[];
  meanLuminance: number;
  luminanceStandardDeviation: number;
}
```

## Lightweight Metrics

Using the already decoded RGB values:

```text
luminance = 0.2126R + 0.7152G + 0.0722B
```

Calculate:

- mean luminance;
- luminance standard deviation;
- source short-side resolution.

Thresholds must be tuned using the project’s actual images. Store thresholds in one constant file and label them as prototype values.

## Warning Behavior

Warnings should appear before or after inference without changing scores.

Examples:

```text
The image may be too dark. Retake the photo in better lighting for a more reliable input.

The image resolution is low. Move closer and keep the affected area in focus.
```

The user may proceed unless the input cannot be decoded or converted.

## Error Architecture

Create typed errors for each stage:

```text
Image acquisition
Image manipulation
Image decoding
Tensor creation
Model loading
Inference execution
Output interpretation
Session state
```

Recommended user-facing matrix:

| Failure | User Behavior |
|---|---|
| Model loading | Analyze disabled; loading status |
| Model load failed | Retry or rebuild guidance |
| Camera denied | Permission explanation and retry |
| Picker canceled | No error; remain in workflow |
| Invalid image URI | Ask user to select another image |
| Decode failed | Replace image |
| Tensor mismatch | Stop analysis and show compatibility error |
| Inference failed | Retry analysis or start new scan |
| Output mismatch | Show model compatibility error |
| Missing result state | Return to scan |

Development logs may include technical details. Production-facing messages should remain readable.

## Progress States

The UI should distinguish:

```text
Preparing image
Running on-device model
Preparing result
```

Even when the total operation is short, immediate feedback prevents repeated taps.

## Model Debug Screen

Create a development-only route:

```text
src/app/model-debug.tsx
```

It should display:

- model load state;
- model version;
- label order;
- expected input dimensions;
- input tensor type;
- preprocessing min, max, and mean;
- input byte length;
- raw model output;
- mapped class scores;
- top prediction;
- preprocessing time;
- inference time;
- last error.

Include bundled fixture buttons:

```text
Run Healthy Fixture
Run Mosaic Fixture
Run Rust Fixture
Run Parity Reference
```

Recommended fixture paths:

```text
assets/model-fixtures/healthy-reference.jpg
assets/model-fixtures/mosaic-reference.jpg
assets/model-fixtures/rust-reference.jpg
assets/model-fixtures/parity-reference.jpg
```

The debug route should not appear in normal bottom navigation.

## Release Protection

Use a development condition to hide technical details:

```ts
if (__DEV__) {
  // show debug values
}
```

Do not expose stack traces or internal paths in the preview release UI.

## QA Failure Injection

Temporarily test:

- incorrect model path;
- invalid image URI;
- wrong tensor byte length;
- missing output;
- label count mismatch;
- repeated Analyze taps;
- navigation during inference;
- reset during error;
- app backgrounding during picker use.

Remove artificial failure triggers before the release commit.

## Non-Goals

This phase does not:

- add computer-vision blur models;
- reject non-sugarcane images reliably;
- guarantee image quality;
- collect remote crash analytics;
- alter model output.

## Suggested Commit

```text
feat(quality): add quality warnings, errors, and model debug tools
```

## Rollback Safety

Quality assessment and debug tools must wrap the stable inference pipeline rather than rewrite it. Reverting this commit should leave real inference and results functional.

## Exit Criteria

- Common failures produce readable recovery actions.
- Duplicate inference is prevented.
- Quality warnings are independent from model scores.
- Debug fixtures run with one tap.
- Technical debug details are hidden from normal release navigation.
- No tested failure causes an application crash.
