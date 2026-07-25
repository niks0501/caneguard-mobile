import { softmax } from '@/features/detection/model/softmax';

describe('softmax', () => {
  it('normalizes logits without overflowing for large values', () => {
    const probabilities = softmax([1_000, 1_001, 1_002]);

    expect(probabilities.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1);
    expect(probabilities[2]).toBeGreaterThan(probabilities[1]);
    expect(probabilities[1]).toBeGreaterThan(probabilities[0]);
    expect(probabilities.every(Number.isFinite)).toBe(true);
  });

  it('returns an empty array for an empty tensor', () => {
    expect(softmax([])).toEqual([]);
  });
});
