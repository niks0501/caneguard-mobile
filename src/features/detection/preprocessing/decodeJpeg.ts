import { toByteArray } from 'base64-js';
import { decode } from 'jpeg-js';

import { PreprocessingError } from '@/features/detection/preprocessing/preprocessingErrors';

export interface DecodedJpeg {
  data: Uint8Array;
  width: number;
  height: number;
}

export function decodeJpeg(base64: string): DecodedJpeg {
  if (!base64) {
    throw new PreprocessingError(
      'missing-encoded-image',
      'The image manipulator did not return encoded image data.',
    );
  }

  try {
    const jpegBytes = toByteArray(base64);
    const decoded = decode(jpegBytes, {
      useTArray: true,
      formatAsRGBA: true,
      tolerantDecoding: false,
      maxResolutionInMP: 1,
      maxMemoryUsageInMB: 32,
    });
    const expectedRgbaLength = decoded.width * decoded.height * 4;

    if (decoded.data.length !== expectedRgbaLength) {
      throw new PreprocessingError(
        'channel-mismatch',
        `Expected ${expectedRgbaLength} RGBA values, received ${decoded.data.length}.`,
      );
    }

    return decoded;
  } catch (error) {
    if (error instanceof PreprocessingError) {
      throw error;
    }

    throw new PreprocessingError(
      'jpeg-decode-failed',
      'The processed JPEG could not be decoded.',
      error,
    );
  }
}
