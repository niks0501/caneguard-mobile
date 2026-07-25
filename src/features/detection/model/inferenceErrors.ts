export type InferenceErrorCode =
  | 'MODEL_NOT_READY'
  | 'INPUT_BUFFER_MISMATCH'
  | 'MODEL_RUN_FAILED'
  | 'OUTPUT_TENSOR_MISSING'
  | 'OUTPUT_SIZE_MISMATCH'
  | 'OUTPUT_VALUE_INVALID'
  | 'LABEL_MAPPING_FAILED';

export class InferenceError extends Error {
  readonly code: InferenceErrorCode;
  readonly originalCause: unknown;

  constructor(code: InferenceErrorCode, message: string, originalCause?: unknown) {
    super(message);
    this.name = 'InferenceError';
    this.code = code;
    this.originalCause = originalCause;
  }
}

export function asInferenceError(error: unknown): InferenceError {
  if (error instanceof InferenceError) {
    return error;
  }

  const detail = error instanceof Error ? error.message : String(error);

  return new InferenceError(
    'MODEL_RUN_FAILED',
    `TensorFlow Lite inference failed: ${detail}`,
    error,
  );
}

export function getInferenceErrorMessage(error: unknown): string {
  const inferenceError = asInferenceError(error);

  switch (inferenceError.code) {
    case 'MODEL_NOT_READY':
      return 'The on-device model is not ready yet. Please wait and try again.';
    case 'INPUT_BUFFER_MISMATCH':
      return 'The prepared image did not match the model input. Please retry the scan.';
    case 'MODEL_RUN_FAILED':
      return 'The on-device analysis could not finish. Please try again.';
    case 'OUTPUT_TENSOR_MISSING':
    case 'OUTPUT_SIZE_MISMATCH':
    case 'OUTPUT_VALUE_INVALID':
    case 'LABEL_MAPPING_FAILED':
      return 'The model returned an invalid result. Please retry the scan.';
  }
}
