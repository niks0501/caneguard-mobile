import { GUARD_V1 } from '@/features/detection/constants/guardContract';
import { GuardError } from '@/features/detection/model/guardInference';

type TensorMetadata = {
  name?: string;
  dataType: string;
  shape: readonly number[];
};

export type GuardMetadata = {
  inputs: readonly TensorMetadata[];
  outputs: readonly TensorMetadata[];
};

function matches(
  actual: TensorMetadata,
  expected: { dataType: string; shape: readonly number[] },
): boolean {
  return (
    actual.dataType === expected.dataType &&
    actual.shape.length === expected.shape.length &&
    actual.shape.every((dimension, index) => dimension === expected.shape[index])
  );
}

/**
 * Verifies the loaded model's real tensor metadata against the Guard V1
 * contract: one [1,224,224,3] float32 input and one [1,1] float32 output. Tensor
 * names are read from the model, never assumed from V2, so they are not pinned.
 */
export function validateGuardContract(model: GuardMetadata): GuardError | null {
  if (model.inputs.length !== 1 || !matches(model.inputs[0], GUARD_V1.input)) {
    return new GuardError(
      'GUARD_CONTRACT_MISMATCH',
      `Guard input does not match the Guard V1 contract. Received: ${JSON.stringify(model.inputs)}`,
    );
  }
  if (model.outputs.length !== 1 || !matches(model.outputs[0], GUARD_V1.output)) {
    return new GuardError(
      'GUARD_CONTRACT_MISMATCH',
      `Guard output does not match the Guard V1 contract. Received: ${JSON.stringify(model.outputs)}`,
    );
  }
  return null;
}
