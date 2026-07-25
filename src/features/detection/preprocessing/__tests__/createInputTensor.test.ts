import { createInputTensor } from '@/features/detection/preprocessing/createInputTensor';
import { PreprocessingError } from '@/features/detection/preprocessing/preprocessingErrors';

const ELEMENT_COUNT = 224 * 224 * 3;

describe('createInputTensor', () => {
  it('creates an exact raw float32 RGB tensor and statistics', () => {
    const pixels = new Uint8Array(ELEMENT_COUNT);

    for (let index = 0; index < pixels.length; index += 3) {
      pixels[index] = 0;
      pixels[index + 1] = 127;
      pixels[index + 2] = 255;
    }

    const result = createInputTensor(pixels);
    const values = new Float32Array(result.inputBuffer);

    expect(result.inputBuffer.byteLength).toBe(602_112);
    expect(values.length).toBe(ELEMENT_COUNT);
    expect(Array.from(values.slice(0, 6))).toEqual([0, 127, 255, 0, 127, 255]);
    expect(result.minValue).toBe(0);
    expect(result.maxValue).toBe(255);
    expect(result.meanValue).toBeCloseTo((0 + 127 + 255) / 3, 8);
  });

  it('rejects dimensions, element counts, and values outside the contract', () => {
    const pixels = new Uint8Array(ELEMENT_COUNT);

    expect(() => createInputTensor(pixels, 223, 224)).toThrow(
      expect.objectContaining<Partial<PreprocessingError>>({ code: 'dimension-mismatch' }),
    );
    expect(() => createInputTensor(pixels.slice(1))).toThrow(
      expect.objectContaining<Partial<PreprocessingError>>({ code: 'element-count-mismatch' }),
    );

    const invalidPixels = new Array<number>(ELEMENT_COUNT).fill(0);
    invalidPixels[20] = Number.NaN;

    expect(() => createInputTensor(invalidPixels)).toThrow(
      expect.objectContaining<Partial<PreprocessingError>>({ code: 'invalid-tensor-value' }),
    );
  });
});
