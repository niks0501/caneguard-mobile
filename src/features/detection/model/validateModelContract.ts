import { ACTIVE_MODEL, type ModelContract } from '@/features/detection/constants/modelContract';
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
  expected: { name: string; dataType: string; shape: readonly number[] },
) {
  return (
    actual.name === expected.name &&
    actual.dataType === expected.dataType &&
    actual.shape.length === expected.shape.length &&
    actual.shape.every((dimension, index) => dimension === expected.shape[index])
  );
}

export function validateModelContract(
  model: ModelMetadata,
  contract: ModelContract = ACTIVE_MODEL,
): InferenceError | null {
  if (model.inputs.length !== 1 || !tensorMatches(model.inputs[0], contract.input)) {
    return new InferenceError(
      'MODEL_CONTRACT_MISMATCH',
      `Model input does not match the Model ${contract.id.toUpperCase()} contract. Received: ${JSON.stringify(model.inputs)}`,
    );
  }

  if (model.outputs.length !== 1 || !tensorMatches(model.outputs[0], contract.output)) {
    return new InferenceError(
      'MODEL_CONTRACT_MISMATCH',
      `Model output does not match the Model ${contract.id.toUpperCase()} contract. Received: ${JSON.stringify(model.outputs)}`,
    );
  }

  return null;
}
