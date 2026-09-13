import {
  DetectionError,
  type DetectionErrorStage,
} from '@/features/detection/errors/detectionError';

export type InferenceErrorCode =
  | 'MODEL_NOT_READY'
  | 'MODEL_LOAD_FAILED'
  | 'MODEL_CONTRACT_MISMATCH'
  | 'INPUT_BUFFER_MISMATCH'
  | 'MODEL_RUN_FAILED'
  | 'OUTPUT_TENSOR_MISSING'
  | 'OUTPUT_SIZE_MISMATCH'
  | 'OUTPUT_VALUE_INVALID'
  | 'LABEL_MAPPING_FAILED';

function getInferenceStage(code: InferenceErrorCode): DetectionErrorStage {
  switch (code) {
    case 'MODEL_NOT_READY':
    case 'MODEL_LOAD_FAILED':
    case 'MODEL_CONTRACT_MISMATCH':
      return 'model-loading';
    case 'INPUT_BUFFER_MISMATCH':
      return 'tensor-creation';
    case 'MODEL_RUN_FAILED':
      return 'inference-execution';
    case 'OUTPUT_TENSOR_MISSING':
    case 'OUTPUT_SIZE_MISMATCH':
    case 'OUTPUT_VALUE_INVALID':
    case 'LABEL_MAPPING_FAILED':
      return 'output-interpretation';
  }
}

export class InferenceError extends DetectionError<InferenceErrorCode> {
  constructor(code: InferenceErrorCode, message: string, originalCause?: unknown) {
    super(getInferenceStage(code), code, message, originalCause);
    this.name = 'InferenceError';
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
    case 'MODEL_LOAD_FAILED':
      return 'The on-device model could not load. Restart the app. If the problem continues, rebuild the development app.';
    case 'MODEL_CONTRACT_MISMATCH':
      return 'This app and the bundled model are not compatible. Rebuild the app with the expected Model V1 asset.';
    case 'INPUT_BUFFER_MISMATCH':
      return 'The prepared image is not compatible with the model input. Replace the image or rebuild the app if the problem continues.';
    case 'MODEL_RUN_FAILED':
      return 'The on-device analysis could not finish. Please try again.';
    case 'OUTPUT_TENSOR_MISSING':
    case 'OUTPUT_SIZE_MISMATCH':
    case 'OUTPUT_VALUE_INVALID':
    case 'LABEL_MAPPING_FAILED':
      return 'The model output is not compatible with this app. Start a new scan or rebuild the app if the problem continues.';
  }
}
