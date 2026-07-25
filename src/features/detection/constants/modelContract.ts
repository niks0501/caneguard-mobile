export const MODEL_VERSION = 'v0.1-baseline' as const;

export const MODEL_FILENAME = 'caneguard_leaf_v0_1_baseline.tflite' as const;

export const MODEL_SHA256 =
  '64338596b5cb41ec8672275c80cdc4c607a18b6c378301cac856b64daace2a0e' as const;

export const MODEL_LABELS = ['healthy', 'mosaic', 'rust'] as const;

export type ModelLabel = (typeof MODEL_LABELS)[number];

export const MODEL_INPUT = {
  name: 'serving_default_sugarcane_image:0',
  shape: [1, 224, 224, 3],
  dataType: 'float32',
  layout: 'NHWC',
  colorOrder: 'RGB',
  resizePolicy: 'stretch',
  interpolation: 'bilinear',
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
