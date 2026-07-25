import {
  MODEL_INPUT,
  MODEL_OUTPUT,
} from '@/features/detection/constants/modelContract';
import { InferenceError } from '@/features/detection/model/inferenceErrors';

type TensorMetadata = {
  name: string;
  dataType: string;
  shape: readonly number[];
};

export type ModelMetadata = {
  inputs: readonly TensorMetadata[];
  outputs: readonly TensorMetadata[];
};

function tensorMatches(
  actual: TensorMetadata,
  expected: typeof MODEL_INPUT | typeof MODEL_OUTPUT,
) {
  return (
    actual.name === expected.name &&
    actual.dataType === expected.dataType &&
    actual.shape.length === expected.shape.length &&
    actual.shape.every((dimension, index) => dimension === expected.shape[index])
  );
}

export function validateModelContract(model: ModelMetadata): InferenceError | null {
  if (model.inputs.length !== 1 || !tensorMatches(model.inputs[0], MODEL_INPUT)) {
    return new InferenceError(
      'MODEL_CONTRACT_MISMATCH',
      `Model input does not match the Model v0 contract. Received: ${JSON.stringify(model.inputs)}`,
    );
  }

  if (model.outputs.length !== 1 || !tensorMatches(model.outputs[0], MODEL_OUTPUT)) {
    return new InferenceError(
      'MODEL_CONTRACT_MISMATCH',
      `Model output does not match the Model v0 contract. Received: ${JSON.stringify(model.outputs)}`,
    );
  }

  return null;
}
