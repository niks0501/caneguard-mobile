import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import {
  MODEL_FILENAME,
  MODEL_INPUT,
  MODEL_LABELS,
  MODEL_OUTPUT,
  MODEL_SHA256,
  MODEL_VERSION,
} from '@/features/detection/constants/modelContract';

describe('Model v0 contract', () => {
  it('keeps the supported labels in the same order as the bundled label file', () => {
    const labelsPath = join(process.cwd(), 'assets/models/labels.txt');
    const bundledLabels = readFileSync(labelsPath, 'utf8').trim().split(/\r?\n/);

    expect(MODEL_LABELS).toEqual(['healthy', 'mosaic', 'rust']);
    expect(bundledLabels).toEqual([...MODEL_LABELS]);
  });

  it('matches the bundled model artifact and release metadata', () => {
    const modelPath = join(process.cwd(), 'assets/models', MODEL_FILENAME);
    const modelBytes = readFileSync(modelPath);

    expect(MODEL_VERSION).toBe('v0.1-baseline');
    expect(statSync(modelPath).size).toBe(2_512_848);
    expect(createHash('sha256').update(modelBytes).digest('hex')).toBe(MODEL_SHA256);
  });

  it('defines one RGB-sized float input and one three-class probability output', () => {
    expect(MODEL_INPUT).toEqual({
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
    });
    expect(MODEL_INPUT.shape.reduce<number>((product, value) => product * value, 1)).toBe(
      150_528,
    );

    expect(MODEL_OUTPUT).toEqual({
      name: 'StatefulPartitionedCall_1:0',
      shape: [1, MODEL_LABELS.length],
      dataType: 'float32',
      interpretation: 'probabilities',
      includesSoftmax: true,
    });
  });
});
