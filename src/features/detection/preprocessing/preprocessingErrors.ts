import {
  DetectionError,
  type DetectionErrorStage,
} from '@/features/detection/errors/detectionError';

export type PreprocessingErrorCode =
  | 'invalid-source-uri'
  | 'image-manipulation-failed'
  | 'missing-encoded-image'
  | 'jpeg-decode-failed'
  | 'dimension-mismatch'
  | 'channel-mismatch'
  | 'element-count-mismatch'
  | 'byte-length-mismatch'
  | 'invalid-tensor-value';

function getPreprocessingStage(
  code: PreprocessingErrorCode,
): DetectionErrorStage {
  switch (code) {
    case 'invalid-source-uri':
      return 'image-acquisition';
    case 'image-manipulation-failed':
      return 'image-manipulation';
    case 'missing-encoded-image':
    case 'jpeg-decode-failed':
    case 'dimension-mismatch':
    case 'channel-mismatch':
      return 'image-decoding';
    case 'element-count-mismatch':
    case 'byte-length-mismatch':
    case 'invalid-tensor-value':
      return 'tensor-creation';
  }
}

export class PreprocessingError extends DetectionError<PreprocessingErrorCode> {
  constructor(code: PreprocessingErrorCode, message: string, cause?: unknown) {
    super(getPreprocessingStage(code), code, message, cause);
    this.name = 'PreprocessingError';
  }
}

export function asPreprocessingError(error: unknown): PreprocessingError {
  if (error instanceof PreprocessingError) {
    return error;
  }

  return new PreprocessingError(
    'image-manipulation-failed',
    'The selected image could not be prepared for analysis.',
    error,
  );
}

export function getPreprocessingErrorMessage(error: unknown): string {
  const preprocessingError = asPreprocessingError(error);

  switch (preprocessingError.code) {
    case 'invalid-source-uri':
      return 'The selected image is unavailable. Please replace it and try again.';
    case 'image-manipulation-failed':
    case 'missing-encoded-image':
      return 'The selected image could not be resized. Please replace it and try again.';
    case 'jpeg-decode-failed':
    case 'dimension-mismatch':
    case 'channel-mismatch':
      return 'The resized image could not be decoded correctly. Please replace it and try again.';
    case 'element-count-mismatch':
    case 'byte-length-mismatch':
    case 'invalid-tensor-value':
      return 'The image did not produce a valid model input. Please replace it and try again.';
  }
}
