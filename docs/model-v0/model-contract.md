# CaneGuard Model v0 Contract

## Scope

Model v0 is an offline Android disease-detection prototype. Its possible outputs are exactly:

1. `healthy`
2. `mosaic`
3. `rust`

The model provides decision support. It does not confirm a diagnosis, estimate severity, replace an agricultural expert, or support Downy Mildew, Smut, Pokkah Boeng, Red Rot, or RSSI.

## Bundled Artifact

| Field | Verified value | Evidence |
|---|---|---|
| Model filename | `caneguard_leaf_v0_1_baseline.tflite` | Bundled asset |
| Model version | `v0.1-baseline` | Artifact release name |
| File size | `2,512,848` bytes | Local artifact inspection |
| SHA-256 | `0a12d1f50d66355ca8e798b942efa26f0eadd304d6250dc0ba122e2f47af577c` | `sha256sum` |
| TFLite schema | `3` (`TFL3`) | FlatBuffer header |
| Minimum runtime metadata | `2.17.0` | `min_runtime_version` model metadata |

## Input Contract

| Field | Value | Status |
|---|---|---|
| Tensor name | `serving_default_sugarcane_image:0` | Verified from model |
| Tensor shape | `[1, 224, 224, 3]` (NHWC) | Verified from model |
| Shape signature | `[-1, 224, 224, 3]` | Verified from model |
| Tensor type | `float32` | Verified from model |
| Element count | `150,528` | Derived from verified shape |
| Byte length | `602,112` | Derived from shape and `float32` |
| Color order | **Unverified** | Must be confirmed from the training pipeline |
| Resize method | **Unverified** | Must be confirmed from the training pipeline |
| App-side normalization | None | The model contains the transform below |
| Embedded normalization | `x * 0.007843137718737125 - 1` (equivalent to `x / 127.5 - 1`) | Verified from the model's first `MUL` and `SUB` operators |
| Quantization | None on the input tensor | Verified: no input scale or zero point |

Production preprocessing must not be implemented until color order and resize behavior are confirmed.

## Output Contract

| Field | Value | Status |
|---|---|---|
| Tensor name | `StatefulPartitionedCall_1:0` | Verified from model |
| Tensor shape | `[1, 3]` | Verified from model |
| Shape signature | `[-1, 3]` | Verified from model |
| Tensor type | `float32` | Verified from model |
| Quantization | None on the output tensor | Verified: no output scale or zero point |
| Interpretation | Probabilities | Verified from final Softmax operator |
| Softmax | Included in model; do not apply again | Verified from final operator |

The bundled mobile label order is:

| Output index | Label |
|---:|---|
| 0 | `healthy` |
| 1 | `mosaic` |
| 2 | `rust` |

This order is identical in `assets/models/labels.txt` and `src/features/detection/constants/modelContract.ts`. The training class-index export is not present in this repository, so training-to-mobile label parity still requires owner confirmation.

## Sources of Truth

- Binary model: `assets/models/caneguard_leaf_v0_1_baseline.tflite`
- Labels: `assets/models/labels.txt`
- Typed application contract: `src/features/detection/constants/modelContract.ts`
- Parity evidence: `docs/model-v0/parity-reference.json`

If these files disagree, stop integration and regenerate the contract from the training environment.

## Unsupported-Capability Audit

The Phase 1 scope does not change application behavior, but the following mock UI still presents classes outside Model v0 and must not be connected to real model output:

- `src/app/analysis-result.tsx`: Downy Mildew mock result
- `src/app/home.tsx`: Downy Mildew and Smut disease-library examples
- `src/app/records.tsx`: Smut and Mildew mock filters/data
- `src/app/reports.tsx`: Smut and Downy Mildew mock report data
- `src/components/ui/DiseasePill.tsx`: Smut and Mildew variants
- `src/components/ui/RecordCard.tsx`: Smut and Mildew icons
- `src/constants/theme.ts`: future/mock disease presentation tokens

These references may remain as mock or future content only if later phases clearly separate them from Model v0 capabilities.

## Open Contract Blockers

1. Confirm RGB or other channel order from the training notebook.
2. Confirm stretch, crop, letterbox, or other resize behavior from the training notebook.
3. Export the training class-index mapping and confirm it matches the mobile order.
4. Provide a held-out image that is confirmed absent from training data.
5. Generate the completed parity reference in the training environment.

Until these are resolved, model loading may be tested, but image preprocessing and inference integration must not begin.
