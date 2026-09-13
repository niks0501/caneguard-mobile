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
