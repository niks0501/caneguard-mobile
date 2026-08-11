# Phase 4 — Deterministic Image Preprocessing Pipeline

## Objective

Convert the selected Android image into an input tensor that exactly matches the training pipeline and TensorFlow Lite model contract.

## Primary Owners

- **Software Architect:** defines deterministic processing rules and module boundaries.
- **Software Developers:** implement crop, resize, decode, conversion, and tensor creation.
- **System Analyst:** confirms data transformations and error states.
- **QA Engineer:** performs notebook-to-mobile preprocessing parity checks.
- **DevOps Engineer:** verifies memory behavior in Android builds.

## Core Principle

A model can load and run while still producing meaningless results if mobile preprocessing differs from training. This phase must prioritize numerical correctness over visual convenience.

Do not guess:

- input size;
- crop behavior;
- color order;
- normalization;
- quantization;
- tensor type.

Use only the verified model contract from Phase 1.

## Proposed Modules

```text
src/features/detection/preprocessing/
├── preprocessImage.ts
├── calculateCenterCrop.ts
├── decodeJpeg.ts
├── rgbaToRgb.ts
├── createInputTensor.ts
└── preprocessingErrors.ts
```

## Recommended Pipeline

```text
Source image URI
      ↓
Read source dimensions
      ↓
Apply verified crop or resize policy
      ↓
Resize to exact model dimensions
      ↓
Save processed image as JPEG with Base64
      ↓
Decode Base64 to JPEG bytes
      ↓
Decode JPEG to RGBA pixels
      ↓
Remove alpha and preserve verified color order
      ↓
Normalize or quantize pixels
      ↓
Return exact ArrayBuffer input tensor
```

Saving the manipulated image as JPEG creates one predictable decode format even when the selected source was PNG, HEIC, or another picker-supported format.

## Crop and Resize

When the training pipeline used center crop:

```ts
const cropSize = Math.min(sourceWidth, sourceHeight);
const originX = Math.floor((sourceWidth - cropSize) / 2);
const originY = Math.floor((sourceHeight - cropSize) / 2);
```

Then crop and resize to the model dimensions.

When the training pipeline used stretch or letterbox, implement that exact method instead. The code must reflect the contract rather than this example.

## JPEG and Pixel Conversion

Recommended dependencies already present in the branch:

- `expo-image-manipulator`
- `base64-js`
- `jpeg-js`

Processing steps:

1. manipulate and save JPEG with Base64;
2. convert Base64 to compressed bytes;
3. decode JPEG bytes;
4. verify decoded width and height;
5. convert RGBA to RGB;
6. construct the required typed array.

## Tensor Rules

### Float32 normalized to `0..1`

```ts
value = pixel / 255;
```

### Float32 normalized to `-1..1`

```ts
value = pixel / 127.5 - 1;
```

### Uint8

```ts
value = pixel;
```

### Int8 quantized

```ts
value = Math.round(realValue / scale + zeroPoint);
```

Only one rule should be active, based on the verified model.

## Required Assertions

Before returning the input buffer, assert:

```text
processed width == expected width
processed height == expected height
channel count == expected channels
element count == width × height × channels
byte length == element count × bytes per element
all values are within the expected range
no NaN or Infinity exists
```

A failed assertion must stop inference and produce a typed preprocessing error.

## Return Contract

Recommended result:

```ts
export interface PreprocessingResult {
  processedUri: string;
  inputBuffer: ArrayBuffer;
  width: number;
  height: number;
  channels: number;
  dataType: 'float32' | 'uint8' | 'int8';
  minValue: number;
  maxValue: number;
  meanValue: number;
  preprocessMs: number;
}
```

The processed URI is useful for debugging and confirming what the model actually received.

## Memory and Performance Controls

- Avoid retaining multiple full-resolution Base64 strings.
- Release temporary references after tensor creation.
- Do not copy buffers repeatedly.
- Slice the exact active byte range when a typed array uses a larger underlying buffer.
- Disable duplicate Analyze taps.
- Test with large camera images.
- Run preprocessing outside render functions.

## UI Integration

On Analyze:

1. set status to `preprocessing`;
2. show immediate progress feedback;
3. run preprocessing;
4. store processed URI and timing;
5. pass the buffer to the inference phase later;
6. show a recoverable message on failure.

Do not navigate away until preprocessing succeeds.

## Parity Testing

Use the Phase 1 reference fixture.

Compare Android output with the training environment:

| Value | Required Comparison |
|---|---|
| Processed dimensions | Exact |
| Data type | Exact |
| Element count | Exact |
| Byte length | Exact |
| Minimum | Within tolerance |
| Maximum | Within tolerance |
| Mean | Within tolerance |
| First tensor values | Within tolerance |
| Processed visual crop | Same intended region |

A top-class match alone is not enough to prove preprocessing parity.

## QA Edge Cases

- portrait source;
- landscape source;
- square source;
- very large camera photo;
- low-resolution source;
- PNG source;
- screenshot;
- corrupted or unreadable source;
- missing dimensions;
- failed manipulator response;
- unexpected decoded size.

## Non-Goals

This phase does not:

- interpret model output;
- classify disease;
- combine symptoms;
- add image-quality decisions;
- persist tensors.

## Suggested Commit

```text
feat(model): add deterministic image preprocessing
```

## Rollback Safety

Keep preprocessing behind one exported function. The existing picker and preview flow must still work if this commit is reverted.

## Exit Criteria

- The selected image produces an exact model-sized tensor.
- All tensor assertions pass.
- The parity fixture matches the training pipeline within documented tolerance.
- Large images do not crash the primary device.
- Preprocessing failures never continue to inference.
