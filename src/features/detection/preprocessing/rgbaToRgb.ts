import { PreprocessingError } from '@/features/detection/preprocessing/preprocessingErrors';

export function rgbaToRgb(
  rgbaPixels: ArrayLike<number>,
  width: number,
  height: number,
): Uint8Array {
  const pixelCount = width * height;
  const expectedRgbaLength = pixelCount * 4;

  if (rgbaPixels.length !== expectedRgbaLength) {
    throw new PreprocessingError(
      'channel-mismatch',
      `Expected ${expectedRgbaLength} RGBA values, received ${rgbaPixels.length}.`,
    );
  }

  const rgbPixels = new Uint8Array(pixelCount * 3);

  for (let sourceIndex = 0, targetIndex = 0; sourceIndex < rgbaPixels.length; sourceIndex += 4) {
    rgbPixels[targetIndex] = rgbaPixels[sourceIndex];
    rgbPixels[targetIndex + 1] = rgbaPixels[sourceIndex + 1];
    rgbPixels[targetIndex + 2] = rgbaPixels[sourceIndex + 2];
    targetIndex += 3;
  }

  return rgbPixels;
}
