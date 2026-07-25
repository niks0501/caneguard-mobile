import type {
  ImagePickerErrorResult,
  ImagePickerResult,
} from 'expo-image-picker';

import type { ScanSourceType } from '@/features/detection/types';

export type PickerOutcome =
  | { kind: 'canceled' }
  | {
      kind: 'error';
      stage: 'image-acquisition';
      code: 'PICKER_FAILED' | 'INVALID_IMAGE_URI';
      message: string;
    }
  | {
      kind: 'selected';
      image: {
        sourceUri: string;
        sourceWidth: number | null;
        sourceHeight: number | null;
        sourceType: ScanSourceType;
      };
    };

export function readPickerOutcome(
  result: ImagePickerResult | ImagePickerErrorResult,
  sourceType: ScanSourceType,
): PickerOutcome {
  if ('code' in result) {
    return {
      kind: 'error',
      stage: 'image-acquisition',
      code: 'PICKER_FAILED',
      message: 'The image picker could not finish. Please try choosing the image again.',
    };
  }

  if (result.canceled) {
    return { kind: 'canceled' };
  }

  const asset = result.assets[0];
  const uri = asset?.uri?.trim();
  const hasLocalUri = uri ? /^(content|file|ph|blob):/i.test(uri) : false;
  const isKnownImage = !asset?.type || asset.type === 'image';
  const hasImageMimeType = !asset?.mimeType || asset.mimeType.toLowerCase().startsWith('image/');

  if (!asset || !uri || !hasLocalUri || !isKnownImage || !hasImageMimeType) {
    return {
      kind: 'error',
      stage: 'image-acquisition',
      code: 'INVALID_IMAGE_URI',
      message: 'That selection did not contain a usable local image. Please choose another photo.',
    };
  }

  return {
    kind: 'selected',
    image: {
      sourceUri: uri,
      sourceWidth: asset.width > 0 ? asset.width : null,
      sourceHeight: asset.height > 0 ? asset.height : null,
      sourceType,
    },
  };
}
