import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { MODEL_INPUT } from '@/features/detection/constants/modelContract';
import { createInputTensor } from '@/features/detection/preprocessing/createInputTensor';
import { decodeJpeg } from '@/features/detection/preprocessing/decodeJpeg';
import {
  asPreprocessingError,
  PreprocessingError,
} from '@/features/detection/preprocessing/preprocessingErrors';
import {
  calculateAspectPreservingResize,
  letterboxRgbPixels,
  type LetterboxGeometry,
} from '@/features/detection/preprocessing/letterboxRgbPixels';
import { rgbaToRgb } from '@/features/detection/preprocessing/rgbaToRgb';
import {
  assessImageQuality,
  type ImageQualityAssessment,
} from '@/features/detection/validation/assessImageQuality';

const [, EXPECTED_HEIGHT, EXPECTED_WIDTH, EXPECTED_CHANNELS] = MODEL_INPUT.shape;

export interface PreprocessingResult {
  processedUri: string;
  inputBuffer: ArrayBuffer;
  width: number;
  height: number;
  channels: number;
  dataType: typeof MODEL_INPUT.dataType;
  minValue: number;
  maxValue: number;
  meanValue: number;
  letterbox: LetterboxGeometry;
  qualityAssessment: ImageQualityAssessment;
  preprocessMs: number;
}

type SourceDimensions = {
  width: number | null;
  height: number | null;
};

type ManipulatedImage = Awaited<ReturnType<typeof manipulateAsync>>;

const SAVE_OPTIONS = {
  base64: true,
  compress: 1,
  format: SaveFormat.JPEG,
} as const;

function now(): number {
  return globalThis.performance?.now() ?? Date.now();
}

function hasUsableDimensions(
  dimensions: SourceDimensions,
): dimensions is { width: number; height: number } {
  const { width, height } = dimensions;
  return (
    typeof width === 'number' &&
    typeof height === 'number' &&
    Number.isInteger(width) &&
    Number.isInteger(height) &&
    width > 0 &&
    height > 0
  );
}

function getInitialResizeAction(sourceDimensions: SourceDimensions) {
  if (hasUsableDimensions(sourceDimensions)) {
    const size = calculateAspectPreservingResize(
      sourceDimensions.width,
      sourceDimensions.height,
    );
    return [{ resize: size }];
  }

  // Start with a width-only resize so landscape images fit immediately. The
  // overflow fallback below switches to height-only for portrait sources.
  return [{ resize: { width: EXPECTED_WIDTH } }];
}

async function resizeImageForModel(
  sourceUri: string,
  sourceDimensions: SourceDimensions,
): Promise<ManipulatedImage> {
  let processedImage = await manipulateAsync(
    sourceUri,
    getInitialResizeAction(sourceDimensions),
    SAVE_OPTIONS,
  );

  if (processedImage.width > EXPECTED_WIDTH || processedImage.height > EXPECTED_HEIGHT) {
    processedImage = await manipulateAsync(
      sourceUri,
      [
        {
          resize:
            processedImage.height > EXPECTED_HEIGHT
              ? { height: EXPECTED_HEIGHT }
              : { width: EXPECTED_WIDTH },
        },
      ],
      SAVE_OPTIONS,
    );
  }

  return processedImage;
}

export async function preprocessImage(
  sourceUri: string,
  sourceDimensions: {
    width: number | null;
    height: number | null;
  } = { width: null, height: null },
): Promise<PreprocessingResult> {
  if (!sourceUri.trim()) {
    throw new PreprocessingError('invalid-source-uri', 'A source image URI is required.');
  }

  const startedAt = now();

  try {
    const processedImage = await resizeImageForModel(sourceUri, sourceDimensions);

    if (
      processedImage.width <= 0 ||
      processedImage.height <= 0 ||
      processedImage.width > EXPECTED_WIDTH ||
      processedImage.height > EXPECTED_HEIGHT
    ) {
      throw new PreprocessingError(
        'dimension-mismatch',
        `The aspect-preserving resize must fit inside ${EXPECTED_WIDTH} × ${EXPECTED_HEIGHT}, received ${processedImage.width} × ${processedImage.height}.`,
      );
    }

    const decodedImage = decodeJpeg(processedImage.base64 ?? '');

    if (
      decodedImage.width !== processedImage.width ||
      decodedImage.height !== processedImage.height
    ) {
      throw new PreprocessingError(
        'dimension-mismatch',
        `Decoded JPEG was ${decodedImage.width} × ${decodedImage.height}; expected ${processedImage.width} × ${processedImage.height}.`,
      );
    }

    const rgbPixels = rgbaToRgb(decodedImage.data, decodedImage.width, decodedImage.height);
    const qualityAssessment = assessImageQuality(rgbPixels, sourceDimensions);
    const letterboxed = letterboxRgbPixels(
      rgbPixels,
      decodedImage.width,
      decodedImage.height,
    );
    const tensor = createInputTensor(
      letterboxed.pixels,
      EXPECTED_WIDTH,
      EXPECTED_HEIGHT,
    );

    return {
      processedUri: processedImage.uri,
      inputBuffer: tensor.inputBuffer,
      width: EXPECTED_WIDTH,
      height: EXPECTED_HEIGHT,
      channels: EXPECTED_CHANNELS,
      dataType: MODEL_INPUT.dataType,
      minValue: tensor.minValue,
      maxValue: tensor.maxValue,
      meanValue: tensor.meanValue,
      letterbox: letterboxed.geometry,
      qualityAssessment,
      preprocessMs: now() - startedAt,
    };
  } catch (error) {
    throw asPreprocessingError(error);
  }
}
