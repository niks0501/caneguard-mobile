import { MODEL_INPUT } from '@/features/detection/constants/modelContract';
import { PreprocessingError } from '@/features/detection/preprocessing/preprocessingErrors';

const [, EXPECTED_HEIGHT, EXPECTED_WIDTH, EXPECTED_CHANNELS] = MODEL_INPUT.shape;
const [MIN_INPUT_VALUE, MAX_INPUT_VALUE] = MODEL_INPUT.mobileValueRange;

export interface InputTensor {
  inputBuffer: ArrayBuffer;
  minValue: number;
  maxValue: number;
  meanValue: number;
}

export function createInputTensor(
  rgbPixels: ArrayLike<number>,
  width: number = EXPECTED_WIDTH,
  height: number = EXPECTED_HEIGHT,
): InputTensor {
  if (width !== EXPECTED_WIDTH || height !== EXPECTED_HEIGHT) {
    throw new PreprocessingError(
      'dimension-mismatch',
      `Expected ${EXPECTED_WIDTH} × ${EXPECTED_HEIGHT}, received ${width} × ${height}.`,
    );
  }

  const expectedElementCount = EXPECTED_WIDTH * EXPECTED_HEIGHT * EXPECTED_CHANNELS;

  if (rgbPixels.length !== expectedElementCount) {
    throw new PreprocessingError(
      'element-count-mismatch',
      `Expected ${expectedElementCount} RGB values, received ${rgbPixels.length}.`,
    );
  }

  const tensor = new Float32Array(expectedElementCount);
  let minValue = Number.POSITIVE_INFINITY;
  let maxValue = Number.NEGATIVE_INFINITY;
  let valueSum = 0;

  for (let index = 0; index < expectedElementCount; index += 1) {
    const value = rgbPixels[index];

    if (!Number.isFinite(value) || value < MIN_INPUT_VALUE || value > MAX_INPUT_VALUE) {
      throw new PreprocessingError(
        'invalid-tensor-value',
        `Input value at index ${index} is outside ${MIN_INPUT_VALUE}..${MAX_INPUT_VALUE}.`,
      );
    }

    tensor[index] = value;
    minValue = Math.min(minValue, value);
    maxValue = Math.max(maxValue, value);
    valueSum += value;
  }

  const expectedByteLength = expectedElementCount * Float32Array.BYTES_PER_ELEMENT;

  if (tensor.byteLength !== expectedByteLength) {
    throw new PreprocessingError(
      'byte-length-mismatch',
      `Expected ${expectedByteLength} tensor bytes, received ${tensor.byteLength}.`,
    );
  }

  return {
    inputBuffer: tensor.buffer,
    minValue,
    maxValue,
    meanValue: valueSum / expectedElementCount,
  };
}
