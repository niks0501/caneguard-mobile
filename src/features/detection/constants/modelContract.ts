/**
 * Model contracts.
 *
 * `MODEL_*` / `ModelLabel` below are the Model V1 contract. Downstream code
 * (stored-record validation, sync mapping, the V1 QA oracle and the V1
 * confidence-caution artifact) is bound to them, so they keep their V1 meaning
 * until the display/storage/sync follow-up lands.
 *
 * `ACTIVE_MODEL` is the contract the live scan flow uses by default; model-layer
 * functions also accept an explicit contract. Both `.tflite` files stay bundled.
 */
export const MODEL_VERSION = 'v1.0-mobilenetv2' as const;

export const MODEL_FILENAME = 'caneguard_v1_mobilenetv2_float32.tflite' as const;

export const MODEL_SHA256 =
  '9ebad12450866b47abc94ffb6b820048c1759e3f3e728a71775af42a0541bae7' as const;

export const MODEL_LABELS = ['healthy', 'mosaic', 'rust', 'smut'] as const;

export type ModelLabel = (typeof MODEL_LABELS)[number];

export const LEGACY_MODEL_VERSION = 'v0.1-baseline' as const;

export const LEGACY_MODEL_LABELS: readonly ModelLabel[] = [
  'healthy',
  'mosaic',
  'rust',
];

export const MODEL_INPUT = {
  name: 'serving_default_image:0',
  shape: [1, 224, 224, 3],
  dataType: 'float32',
  layout: 'NHWC',
  colorOrder: 'RGB',
  resizePolicy: 'letterbox',
  interpolation: 'bilinear',
  letterboxValue: 127.5,
  mobileValueRange: [0, 255],
  mobileNormalization: 'none',
  embeddedNormalization: 'x / 127.5 - 1',
} as const;

export const MODEL_OUTPUT = {
  name: 'StatefulPartitionedCall_1:0',
  shape: [1, MODEL_LABELS.length],
  dataType: 'float32',
  interpretation: 'probabilities',
  includesSoftmax: true,
} as const;

/**
 * Model V2 (five outputs). Output order is fixed by the artifact's
 * `labels.txt` / `preprocessing.json`: Healthy, Mosaic, Rust, Smut, RSSI.
 * Identifiers keep the existing lowercase convention.
 */
export const MODEL_V2_VERSION = 'v2.0-mobilenetv2' as const;

export const MODEL_V2_FILENAME = 'caneguard_v2.tflite' as const;

export const MODEL_V2_SHA256 =
  '349fe1b903e1ab3bef7cb7ad5fa83c8375ac4d73bae0b8fa4e27e7c1ff57ad86' as const;

export const MODEL_V2_LABELS = [
  'healthy',
  'mosaic',
  'rust',
  'smut',
  'rssi',
] as const;

export type ModelOutputLabel = (typeof MODEL_V2_LABELS)[number];

export const MODEL_V2_INPUT = {
  name: 'serving_default_rgb_0_255:0',
  shape: [1, 224, 224, 3],
  dataType: 'float32',
  layout: 'NHWC',
  colorOrder: 'RGB',
  resizePolicy: 'letterbox',
  interpolation: 'bilinear',
  letterboxValue: 0,
  mobileValueRange: [0, 255],
  mobileNormalization: 'none',
  embeddedNormalization: 'x / 127.5 - 1',
} as const;

export const MODEL_V2_OUTPUT = {
  name: 'StatefulPartitionedCall_1:0',
  shape: [1, MODEL_V2_LABELS.length],
  dataType: 'float32',
  interpretation: 'probabilities',
  includesSoftmax: true,
} as const;

export type ModelContract = {
  id: 'v1' | 'v2';
  version: string;
  filename: string;
  sha256: string;
  labels: readonly ModelOutputLabel[];
  input: {
    name: string;
    shape: readonly number[];
    dataType: string;
    letterboxValue: number;
    mobileValueRange: readonly [number, number];
  };
  output: {
    name: string;
    shape: readonly number[];
    dataType: string;
    interpretation: 'probabilities';
  };
};

export const MODEL_CONTRACTS = {
  v1: {
    id: 'v1',
    version: MODEL_VERSION,
    filename: MODEL_FILENAME,
    sha256: MODEL_SHA256,
    labels: MODEL_LABELS,
    input: MODEL_INPUT,
    output: MODEL_OUTPUT,
  },
  v2: {
    id: 'v2',
    version: MODEL_V2_VERSION,
    filename: MODEL_V2_FILENAME,
    sha256: MODEL_V2_SHA256,
    labels: MODEL_V2_LABELS,
    input: MODEL_V2_INPUT,
    output: MODEL_V2_OUTPUT,
  },
} as const satisfies Record<'v1' | 'v2', ModelContract>;

export type ModelId = keyof typeof MODEL_CONTRACTS;

/**
 * Model the live scan flow loads. Setting this to `'v1'` is the rollback path.
 * Until the display/storage/sync follow-up carries the fifth (RSSI) output,
 * the scan flow errors when RSSI is V2's top class and drops it otherwise.
 */
export const ACTIVE_MODEL_ID: ModelId = 'v2' as ModelId;

export const ACTIVE_MODEL: ModelContract = MODEL_CONTRACTS[ACTIVE_MODEL_ID];
