# Phase 5 — TensorFlow Lite Inference Engine

## Objective

Run the bundled TensorFlow Lite model on the preprocessed image buffer and return validated, correctly mapped class scores.

## Primary Owners

- **Software Architect:** defines the model service contract and lifecycle.
- **Software Developers:** implement model loading, execution, and postprocessing.
- **QA Engineer:** verifies output parity and repeated-run stability.
- **DevOps Engineer:** checks Android build compatibility and runtime logs.
- **System Analyst:** ensures every failure path is represented in application state.

## Architecture

```text
useCaneGuardModel
       ↓
runInference
       ↓
validate outputs
       ↓
postprocessOutput
       ↓
DetectionResult
```

Recommended files:

```text
src/features/detection/model/
├── useCaneGuardModel.ts
├── runInference.ts
├── postprocessOutput.ts
├── softmax.ts
└── inferenceErrors.ts
```

## Model Lifecycle

The model should load once per application runtime and be reused for scans.

Recommended hook contract:

```ts
interface CaneGuardModelController {
  state: 'loading' | 'loaded' | 'error';
  run(input: ArrayBuffer): Promise<ArrayBuffer[]>;
  error: Error | null;
}
```

The Analyze button remains disabled while the model is not loaded.

## Inference Flow

```text
Receive verified input buffer
      ↓
Confirm model state is loaded
      ↓
Record inference start
      ↓
Run model with one input tensor
      ↓
Validate output count and byte length
      ↓
Interpret exact output type
      ↓
Apply softmax only when contract says logits
      ↓
Map indices to MODEL_LABELS
      ↓
Sort scores and select top class
      ↓
Return result and timing
```

## Output Validation

Before creating a prediction, validate:

- expected output tensor exists;
- output element count equals label count;
- values are finite;
- quantized output is dequantized correctly when applicable;
- probability output is in a plausible range;
- label index exists for every score.

If the model emits logits, apply a numerically stable softmax:

```ts
const max = Math.max(...logits);
const exps = logits.map(value => Math.exp(value - max));
const sum = exps.reduce((total, value) => total + value, 0);
const probabilities = exps.map(value => value / sum);
```

Do not apply softmax when the model already outputs probabilities.

## Result Contract

```ts
export interface ClassScore {
  label: ModelLabel;
  score: number;
}

export interface InferenceTimings {
  preprocessMs: number;
  inferenceMs: number;
  totalMs: number;
}

export interface DetectionResult {
  predictedLabel: ModelLabel;
  confidence: number;
  scores: ClassScore[];
  timings: InferenceTimings;
  modelVersion: string;
}
```

Store raw model confidence as a decimal internally. Format it as a percentage only in the UI.

## CPU-First Decision

Use CPU inference first.

Do not add GPU or NNAPI delegates during the correctness phase. Delegates can create device-specific behavior and increase debugging complexity. Consider them only when:

- CPU output parity passes;
- the app is stable;
- measured performance is inadequate;
- there is enough time for multi-device validation.

## UI Integration

During inference:

- set status to `running`;
- prevent duplicate Analyze taps;
- show a visible progress state;
- do not display a previous result;
- on success, store the complete `DetectionResult`;
- on failure, set an explicit error and remain recoverable.

After successful inference, proceed to the symptom checklist or result flow according to the selected application sequence.

## QA Tests

### Reference Output Parity

Run the same parity image in:

1. training environment;
2. Android debug build.

Compare:

- raw output order;
- top class;
- each class score;
- score tolerance;
- whether softmax was applied;
- model version.

### Functional Tests

| Test | Expected Result |
|---|---|
| Valid input buffer | Three mapped scores returned |
| Model still loading | Inference blocked |
| Wrong input byte length | Typed error |
| Wrong output length | Contract error |
| NaN output | Contract error |
| Ten consecutive runs | No crash or uncontrolled memory growth |
| Same image repeated | Stable result within expected numerical tolerance |
| App route revisited | Model remains reusable |

## Error Policy

Never return a default class after an exception.

Examples of typed errors:

```text
MODEL_NOT_READY
INPUT_BUFFER_MISMATCH
MODEL_RUN_FAILED
OUTPUT_TENSOR_MISSING
OUTPUT_SIZE_MISMATCH
OUTPUT_VALUE_INVALID
LABEL_MAPPING_FAILED
```

## Non-Goals

This phase does not:

- change model scores using symptoms;
- estimate severity;
- determine whether the image is definitely sugarcane;
- upload results;
- add production analytics.

## Suggested Commit

```text
feat(model): add on-device TFLite inference and output mapping
```

## Rollback Safety

The inference engine must depend only on the preprocessing contract and model assets. Reverting this commit should restore image preview and preprocessing without affecting image selection.

## Exit Criteria

- Android produces three real class scores.
- Label mapping matches the training class order.
- Reference output matches the training environment within tolerance.
- Repeated scans remain stable.
- No hardcoded prediction is returned by the model layer.
- All inference errors are explicit and recoverable.
