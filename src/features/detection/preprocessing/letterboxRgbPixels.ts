import { MODEL_INPUT } from '@/features/detection/constants/modelContract';
import { PreprocessingError } from '@/features/detection/preprocessing/preprocessingErrors';

const [, TARGET_HEIGHT, TARGET_WIDTH, TARGET_CHANNELS] = MODEL_INPUT.shape;

export interface LetterboxGeometry {
  resizedWidth: number;
  resizedHeight: number;
  paddingLeft: number;
  paddingTop: number;
}

/**
 * Computes the dimensions used to fit an image inside the model input without
 * changing its aspect ratio. The rounding matches the Pillow QA oracle.
 */
export function calculateAspectPreservingResize(
  sourceWidth: number,
  sourceHeight: number,
): { width: number; height: number } {
  if (
    !Number.isInteger(sourceWidth) ||
    !Number.isInteger(sourceHeight) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0
  ) {
    throw new PreprocessingError(
      'dimension-mismatch',
      `Image dimensions must be positive integers, received ${sourceWidth} × ${sourceHeight}.`,
    );
  }

  const scale = Math.min(TARGET_WIDTH / sourceWidth, TARGET_HEIGHT / sourceHeight);

  return {
    width: Math.max(1, Math.min(TARGET_WIDTH, roundTiesToEven(sourceWidth * scale))),
    height: Math.max(1, Math.min(TARGET_HEIGHT, roundTiesToEven(sourceHeight * scale))),
  };
}

function roundTiesToEven(value: number): number {
  const lower = Math.floor(value);
  const fraction = value - lower;
  if (fraction < 0.5) return lower;
  if (fraction > 0.5) return lower + 1;
  return lower % 2 === 0 ? lower : lower + 1;
}

export function createLetterboxGeometry(
  resizedWidth: number,
  resizedHeight: number,
): LetterboxGeometry {
  if (
    !Number.isInteger(resizedWidth) ||
    !Number.isInteger(resizedHeight) ||
    resizedWidth <= 0 ||
    resizedHeight <= 0 ||
    resizedWidth > TARGET_WIDTH ||
    resizedHeight > TARGET_HEIGHT
  ) {
    throw new PreprocessingError(
      'dimension-mismatch',
      `Resized image must fit inside ${TARGET_WIDTH} × ${TARGET_HEIGHT}, received ${resizedWidth} × ${resizedHeight}.`,
    );
  }

  return {
    resizedWidth,
    resizedHeight,
    paddingLeft: Math.floor((TARGET_WIDTH - resizedWidth) / 2),
    paddingTop: Math.floor((TARGET_HEIGHT - resizedHeight) / 2),
  };
}

/**
 * Places an already bilinear-resized RGB image into the centered model canvas.
 * Padding is float32 127.5 so it is not quantized to 127 or 128.
 */
export function letterboxRgbPixels(
  rgbPixels: ArrayLike<number>,
  resizedWidth: number,
  resizedHeight: number,
): { pixels: Float32Array; geometry: LetterboxGeometry } {
  const geometry = createLetterboxGeometry(resizedWidth, resizedHeight);
  const expectedElementCount = resizedWidth * resizedHeight * TARGET_CHANNELS;

  if (rgbPixels.length !== expectedElementCount) {
    throw new PreprocessingError(
      'element-count-mismatch',
      `Expected ${expectedElementCount} RGB values, received ${rgbPixels.length}.`,
    );
  }

  const pixels = new Float32Array(TARGET_WIDTH * TARGET_HEIGHT * TARGET_CHANNELS);
  pixels.fill(MODEL_INPUT.letterboxValue);

  for (let row = 0; row < resizedHeight; row += 1) {
    const sourceRowStart = row * resizedWidth * TARGET_CHANNELS;
    const targetRowStart =
      ((row + geometry.paddingTop) * TARGET_WIDTH + geometry.paddingLeft) *
      TARGET_CHANNELS;

    for (let column = 0; column < resizedWidth * TARGET_CHANNELS; column += 1) {
      pixels[targetRowStart + column] = rgbPixels[sourceRowStart + column];
    }
  }

  return { pixels, geometry };
}
