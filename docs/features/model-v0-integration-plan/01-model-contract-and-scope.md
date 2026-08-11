# Phase 1 — Model Contract and Prototype Scope

## Objective

Establish one verified technical contract between the trained TensorFlow Lite model and the Android application. Freeze the July 28 prototype to the classes actually supported by the bundled model.

## Primary Owners

- **Product Owner:** approves the final Model v0 scope.
- **System Analyst:** documents the end-to-end input and output contract.
- **Business Analyst:** checks that the scope remains useful and honestly presented.
- **Software Architect:** defines the source-of-truth files and validation rules.
- **QA Engineer:** prepares parity fixtures and acceptance checks.

## Business and Product Decision

The prototype supports only:

- `healthy`
- `mosaic`
- `rust`

The application must not present Downy Mildew, Smut, Pokkah Boeng, Red Rot, or RSSI as Model v0 outputs. These may remain in future research or backlog documentation, but they must not appear as capabilities of this model build.

The prototype proves that CaneGuard can run an image-classification pipeline offline on Android. It does not prove final agricultural accuracy or complete disease coverage.

## Required Model Contract

Create:

```text
docs/model-v0/model-contract.md
```

Document the following values from the training notebook or model inspection:

| Contract Field | Required Information |
|---|---|
| Model filename | Exact `.tflite` asset name |
| Model version | Example: `v0.1-baseline` |
| SHA-256 checksum | Release traceability |
| Input tensor shape | Exact dimensions |
| Input tensor type | `float32`, `uint8`, or `int8` |
| Input color order | RGB or another verified order |
| Resize method | Stretch, center crop, letterbox, or another method |
| Normalization | Exact formula used during training |
| Quantization | Scale and zero point when applicable |
| Output tensor shape | Exact output dimensions |
| Output tensor type | Float or quantized |
| Output interpretation | Probabilities, logits, or other |
| Label order | Exact index-to-label mapping |
| Softmax rule | Whether softmax is already included |

Do not begin production preprocessing code until these values are known.

## Label Source of Truth

Create a typed application constant:

```text
src/features/detection/constants/modelContract.ts
```

Recommended shape:

```ts
export const MODEL_VERSION = 'v0.1-baseline' as const;

export const MODEL_LABELS = [
  'healthy',
  'mosaic',
  'rust',
] as const;

export type ModelLabel = (typeof MODEL_LABELS)[number];
```

The following must use the same order:

1. training class indices;
2. TensorFlow Lite output indices;
3. `assets/models/labels.txt`;
4. application constants;
5. debug fixtures;
6. result-screen disease metadata.

## Reference Parity Fixture

Choose at least one held-out image that was not used for training. Produce a reference record from the training environment containing:

```text
Source filename
Source checksum
Processed width and height
Tensor data type
Tensor element count
Tensor byte length
Minimum input value
Maximum input value
Mean input value
First 20 tensor values
Raw model output
Expected top class
Expected top score
```

Recommended files:

```text
assets/model-fixtures/parity-reference.jpg
docs/model-v0/parity-reference.json
```

This fixture will later verify that Android preprocessing reproduces the training pipeline.

## Required Documentation Updates

Update the prototype wording to consistently use:

- **disease detection** rather than diagnosis;
- **possible result** rather than confirmed disease;
- **decision support** rather than expert replacement;
- **Model v0** or **prototype model** when presenting performance.

## Non-Goals

This phase does not:

- implement image selection;
- run the model in Android;
- redesign the result screen;
- estimate severity;
- add new disease classes;
- retrain or improve model accuracy.

## QA Checks

- Confirm there are exactly three labels.
- Confirm label order is identical across training and mobile files.
- Confirm the model input and output metadata are recorded.
- Confirm the reference fixture is reproducible in the training environment.
- Search the scan workflow for unsupported model outputs.
- Record every unsupported disease reference that must be removed or reworded in later phases.

## Deliverables

```text
docs/model-v0/model-contract.md
docs/model-v0/parity-reference.json
src/features/detection/constants/modelContract.ts
assets/model-fixtures/parity-reference.jpg
```

## Suggested Commit

```text
docs(model): define Model v0 contract and supported classes
```

## Rollback Safety

This phase should contain documentation and constants only. It must not alter application behavior. If the contract is later found incorrect, revert this commit and regenerate the contract before continuing.

## Exit Criteria

- Product Owner approves the three-class scope.
- The full model input and output contract is documented.
- Label order is verified.
- A parity reference fixture exists.
- No technical value is based on assumption.
