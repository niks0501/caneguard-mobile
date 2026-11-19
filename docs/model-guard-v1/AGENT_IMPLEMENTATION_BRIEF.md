# Agent implementation brief — Sugarcane Guard V1

## Objective

Integrate the frozen, **binary** Guard V1 model in front of the existing five-class V2 disease classifier. Follow [issue #290](https://github.com/niks0501/caneguard-mobile/issues/290). Implement on this branch only. Do not enable production use or alter existing V2 model weights.

## Repository integration points

Inspect current sources before modifying:
- `src/features/detection/analysis/useScanAnalysis.ts` — preprocessing, quality gate, scan lifecycle, model inference and stale-result cancellation.
- `src/features/detection/preprocessing/preprocessImage.ts` — existing V2 letterbox. Preserve it. Add a **separate guard preprocessing path**.
- `src/features/detection/model/useCaneGuardModel.tsx` and `.web.tsx` — existing model provider. Guard must have a distinct contract/loader and web fail-closed behavior.
- `src/features/detection/model/runInference.ts` — V2 output mapping. Never interpret guard output as a disease score.
- `src/features/detection/constants/modelContract.ts` — preserve existing diagnostic V1/V2 labels, versions, and active model.
- `src/app/symptom-checklist.tsx`, `src/app/analysis-result.tsx`, session reducer/draft persistence, record validation and report paths — ensure rejected images never produce completed disease results or reports.

## Contract (immutable)

Read `assets/models/caneguard_guard_v1_contract.json` and `docs/model-guard-v1/MODEL_CARD.md`. Require [1,224,224,3] float32 RGB, 0–255 range, EXIF correction, and bilinear **direct stretch**. The guard graph already normalizes internally. Output is a scalar sigmoid in [0,1]. Accept at `>= 0.75`. Fail closed on invalid output or model errors. Do not use softmax or V2's letterbox tensor.

## Implement in this order

1. Add guard-only model loader and metadata verification, keeping existing V1/V2 disease classifiers intact.
2. Add guard-only direct-resize preprocessing from the same source photo used by V2. Preserve the existing basic image-quality gate.
3. Run guard before V2. If accepted, run the unchanged V2 once. If rejected, show an actionable retake message and block completed results, saving, and reports.
4. Distinguish model errors from photo rejections and allow retry. Guard V1 is required in the scan workflow, and a missing local binary must **not** silently fall back to unguarded V2.
5. Protect against replacement, owner change, cancellation, resumed drafts, background transitions, stale async callbacks and duplicate inference.
6. Keep the Guard model experimental and production activation pending independent testing. Do not change the V2 RSSI confidence-caution threshold here; separate recalibration remains open.
7. Update `PROJECT_CHECKS.md` and relevant unit/integration tests. Verify real Android camera and gallery inference, including offline execution.

## Acceptance tests

- Guard receives 602112 bytes (float32 224 × 224 × 3), correct EXIF/RGB/direct resize; no double normalization.
- Accept scores 0.75 and 1. Reject scores 0 and 0.749999. NaN, infinities, out-of-range, wrong shape, missing model and runtime errors fail closed.
- Rejected or errored guard produces **zero** V2 invocations, completed scan records or official reports.
- Accepted guard produces one V2 invocation and preserves V2's five labels including RSSI.
- Replacing a photo or changing owner cannot commit stale guard or disease results.
- Real CPU TFLite output and input tensor metadata verified on Android. Compare generated reference inputs/predictions with **licensed or self-created fixtures** and documented tolerance.
- Keep existing V1/V2 regression tests green. Capture exact commands, device evidence, inference latency and memory.

## Public repo and model binary

The repository is public. The project owner requested that the trained Guard V1 artifact be committed at `assets/models/caneguard_guard_v1_float32.tflite`, alongside the other shipped offline model assets. The owner will supply the exact validated binary if it is absent. Verify its SHA-256 using `python3 scripts/verify_guard_v1_assets.py`. Do not commit raw training images, private evidence, photographer signatures, or personal metadata. Existing source provenance is described in `DATASET_LICENSES.md`; do not claim unverified permissions or that the dataset rights review is complete. Keep the model experimental and production activation pending until Android verification; the Guard gate remains required in the scan workflow.

## Deliverable

Open a draft PR with implementation, unit/integration tests, documented real-device evidence, rollback path, open risks and a clear statement that production activation and source-license clearance are still pending. Preserve V2 behavior while keeping the required Guard gate in front of it.
