# CaneGuard Model v0 — Implementation Workflow

**Repository:** `niks0501/caneguard-mobile`  
**Branch:** `feat/model-v0-eas-integration`  
**Target:** Functional offline Android prototype for July 28, 2026  
**Supported Model v0 classes:** `healthy`, `mosaic`, `rust`

## Goal

Replace the current mock scan flow with a real on-device TensorFlow Lite pipeline:

```text
Capture or select image
        ↓
Preview and validate image
        ↓
Preprocess into the exact model tensor
        ↓
Run TensorFlow Lite inference
        ↓
Map output scores to labels
        ↓
Compare with the symptom checklist
        ↓
Display a truthful decision-support result
```

Each phase is designed as a separate implementation unit so it can be committed, reviewed, tested, and reverted without undoing unrelated work.

## Phase Order

| Phase | File | Main Output |
|---|---|---|
| 1 | `01-model-contract-and-scope.md` | Verified model contract and frozen prototype scope |
| 2 | `02-native-runtime-and-eas-smoke-test.md` | Android development build that loads the model |
| 3 | `03-scan-session-and-image-acquisition.md` | Real gallery/camera image flow |
| 4 | `04-image-preprocessing-pipeline.md` | Deterministic model-ready input tensor |
| 5 | `05-tflite-inference-engine.md` | Real on-device predictions |
| 6 | `06-symptom-validation-and-result-ui.md` | Model-aligned checklist and dynamic result screen |
| 7 | `07-quality-guards-errors-and-debugging.md` | Image warnings, error handling, and debug tools |
| 8 | `08-qa-device-offline-and-performance-testing.md` | Verified functional, offline, and performance behavior |
| 9 | `09-release-candidate-and-presentation.md` | Standalone preview APK and presentation package |

## Recommended Commit Sequence

```text
docs(model): define Model v0 contract and supported classes
build(android): verify EAS dev client and TFLite model loading
feat(scan): add scan session and real image acquisition
feat(model): add deterministic image preprocessing
feat(model): add on-device TFLite inference and output mapping
feat(results): connect checklist and dynamic analysis result
feat(quality): add quality warnings, errors, and model debug tools
test(model): validate parity, offline use, devices, and performance
chore(release): prepare preview APK and presentation release candidate
```

Do not combine phases into one large commit. A phase should be merged only after its exit criteria pass.

## Team Responsibilities

| Role | Main Responsibility |
|---|---|
| Product Owner | Freezes scope, prioritizes must-have behavior, accepts each phase |
| Business Analyst | Keeps workflow aligned with farmer and presentation needs |
| System Analyst | Converts user workflow into state, data, and integration requirements |
| UI/UX Designer | Defines interaction states, warnings, loading, recovery, and result clarity |
| Software Architect | Defines module boundaries, contracts, coding rules, and rollback safety |
| Software Developers | Implement screens, state, preprocessing, inference, and integration |
| QA Engineer | Designs tests, validates parity, finds regressions, and signs off releases |
| DevOps Engineer | Maintains EAS profiles, build reproducibility, APK delivery, and release checks |

## Global Rules

- Treat the AI output as decision support, not expert diagnosis.
- Keep Model v0 limited to `healthy`, `mosaic`, and `rust`.
- Never show a hardcoded disease or confidence after inference is introduced.
- Never invent a combined confidence from AI scores and checklist answers.
- Never convert an exception into a prediction.
- Run CPU inference first. Add acceleration only after correctness is proven.
- Use the standalone `preview` APK for presentation.
- Keep each phase independently revertible.
