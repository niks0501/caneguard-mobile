// Pins the V1 rollback contract as the active model for this suite.
jest.mock('@/features/detection/constants/modelContract', () => {
  const actual = jest.requireActual('@/features/detection/constants/modelContract');
  return { ...actual, ACTIVE_MODEL_ID: 'v1', ACTIVE_MODEL: actual.MODEL_CONTRACTS.v1 };
});

import { postprocessOutput } from '@/features/detection/model/postprocessOutput';

function float32Buffer(values: readonly number[]): ArrayBuffer {
  return Float32Array.from(values).buffer as ArrayBuffer;
}

describe('postprocessOutput', () => {
  it('maps probabilities to labels, sorts scores, and preserves raw confidence', () => {
    const result = postprocessOutput(float32Buffer([0.1, 0.1, 0.2, 0.6]));

    expect(result.predictedLabel).toBe('smut');
    expect(result.confidence).toBeCloseTo(0.6);
    expect(result.scores).toEqual([
      { label: 'smut', score: expect.closeTo(0.6) },
      { label: 'rust', score: expect.closeTo(0.2) },
      { label: 'healthy', score: expect.closeTo(0.1) },
      { label: 'mosaic', score: expect.closeTo(0.1) },
    ]);
  });

  it('rejects an output with the wrong byte length', () => {
    expect(() => postprocessOutput(float32Buffer([0.5, 0.5]))).toThrow(
      expect.objectContaining({ code: 'OUTPUT_SIZE_MISMATCH' }),
    );
  });

  it.each([
    ['NaN', [Number.NaN, 0.2, 0.3, 0.5]],
    ['Infinity', [Number.POSITIVE_INFINITY, 0, 0, 0]],
    ['out-of-range probability', [-0.1, 0.2, 0.3, 0.6]],
    ['invalid probability sum', [0.1, 0.2, 0.3, 0.1]],
  ])('rejects %s values', (_caseName, values) => {
    expect(() => postprocessOutput(float32Buffer(values))).toThrow(
      expect.objectContaining({ code: 'OUTPUT_VALUE_INVALID' }),
    );
  });
});
