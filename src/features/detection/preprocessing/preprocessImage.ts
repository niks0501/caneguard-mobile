import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { MODEL_INPUT } from '@/features/detection/constants/modelContract';
import { createInputTensor } from '@/features/detection/preprocessing/createInputTensor';
import { decodeJpeg } from '@/features/detection/preprocessing/decodeJpeg';
import {
  asPreprocessingError,
  PreprocessingError,
} from '@/features/detection/preprocessing/preprocessingErrors';
import { rgbaToRgb } from '@/features/detection/preprocessing/rgbaToRgb';

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
  preprocessMs: number;
}

function now(): number {
  return globalThis.performance?.now() ?? Date.now();
}

export async function preprocessImage(sourceUri: string): Promise<PreprocessingResult> {
  if (!sourceUri.trim()) {
    throw new PreprocessingError('invalid-source-uri', 'A source image URI is required.');
  }

  const startedAt = now();

  try {
    const processedImage = await manipulateAsync(
      sourceUri,
      [
        {
          resize: {
            width: EXPECTED_WIDTH,
            height: EXPECTED_HEIGHT,
          },
        },
      ],
      {
        base64: true,
        compress: 1,
        format: SaveFormat.JPEG,
      },
    );

    if (processedImage.width !== EXPECTED_WIDTH || processedImage.height !== EXPECTED_HEIGHT) {
      throw new PreprocessingError(
        'dimension-mismatch',
        `Expected ${EXPECTED_WIDTH} × ${EXPECTED_HEIGHT}, received ${processedImage.width} × ${processedImage.height}.`,
      );
    }

    const decodedImage = decodeJpeg(processedImage.base64 ?? '');

    if (decodedImage.width !== EXPECTED_WIDTH || decodedImage.height !== EXPECTED_HEIGHT) {
      throw new PreprocessingError(
        'dimension-mismatch',
        `Decoded JPEG was ${decodedImage.width} × ${decodedImage.height}; expected ${EXPECTED_WIDTH} × ${EXPECTED_HEIGHT}.`,
      );
    }

    const rgbPixels = rgbaToRgb(decodedImage.data, decodedImage.width, decodedImage.height);
    const tensor = createInputTensor(rgbPixels, decodedImage.width, decodedImage.height);

    return {
      processedUri: processedImage.uri,
      inputBuffer: tensor.inputBuffer,
      width: decodedImage.width,
      height: decodedImage.height,
      channels: EXPECTED_CHANNELS,
      dataType: MODEL_INPUT.dataType,
      minValue: tensor.minValue,
      maxValue: tensor.maxValue,
      meanValue: tensor.meanValue,
      preprocessMs: now() - startedAt,
    };
  } catch (error) {
    throw asPreprocessingError(error);
  }
}
