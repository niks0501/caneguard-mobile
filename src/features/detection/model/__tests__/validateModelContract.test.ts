import {
  MODEL_INPUT,
  MODEL_OUTPUT,
} from '@/features/detection/constants/modelContract';
import {
  validateModelContract,
  type ModelMetadata,
} from '@/features/detection/model/validateModelContract';

function createMetadata(overrides: Partial<ModelMetadata> = {}): ModelMetadata {
  return {
    inputs: [
      {
        name: MODEL_INPUT.name,
        dataType: MODEL_INPUT.dataType,
        shape: [...MODEL_INPUT.shape],
      },
    ],
    outputs: [
      {
        name: MODEL_OUTPUT.name,
        dataType: MODEL_OUTPUT.dataType,
        shape: [...MODEL_OUTPUT.shape],
      },
    ],
    ...overrides,
  };
}

describe('validateModelContract', () => {
  it('accepts the exact Model v0 tensor metadata', () => {
    expect(validateModelContract(createMetadata())).toBeNull();
  });

  it.each([
    ['missing input', []],
    [
      'wrong input name',
      [{ name: 'wrong', dataType: MODEL_INPUT.dataType, shape: [...MODEL_INPUT.shape] }],
    ],
    [
      'wrong input type',
      [{ name: MODEL_INPUT.name, dataType: 'uint8', shape: [...MODEL_INPUT.shape] }],
    ],
    [
      'wrong input shape',
      [{ name: MODEL_INPUT.name, dataType: MODEL_INPUT.dataType, shape: [1, 256, 256, 3] }],
    ],
  ])('rejects a %s', (_caseName, inputs) => {
    expect(validateModelContract(createMetadata({ inputs }))).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('Model input does not match'),
      }),
    );
  });

  it.each([
    ['missing output', []],
    [
      'wrong output name',
      [{ name: 'wrong', dataType: MODEL_OUTPUT.dataType, shape: [...MODEL_OUTPUT.shape] }],
    ],
    [
      'wrong output type',
      [{ name: MODEL_OUTPUT.name, dataType: 'uint8', shape: [...MODEL_OUTPUT.shape] }],
    ],
    [
      'wrong output shape',
      [{ name: MODEL_OUTPUT.name, dataType: MODEL_OUTPUT.dataType, shape: [1, 4] }],
    ],
  ])('rejects a %s', (_caseName, outputs) => {
    expect(validateModelContract(createMetadata({ outputs }))).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('Model output does not match'),
      }),
    );
  });
});
