import type {
  ImagePickerErrorResult,
  ImagePickerResult,
} from 'expo-image-picker';

import type { ScanSourceType } from '@/features/detection/types';

type SupportedImageFormat = 'jpeg' | 'png' | 'webp';
type ImageFormatEvidence = SupportedImageFormat | 'unsupported' | null;

const MIME_TO_FORMAT: Readonly<Record<string, SupportedImageFormat>> = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const EXTENSION_TO_FORMAT: Readonly<Record<string, SupportedImageFormat>> = {
  jpeg: 'jpeg',
  jpg: 'jpeg',
  png: 'png',
  webp: 'webp',
};

const UNSUPPORTED_IMAGE_FORMAT_MESSAGE =
  'Unsupported image format. Please choose a JPEG, PNG, or WebP image.';

export type PickerOutcome =
  | { kind: 'canceled' }
  | {
      kind: 'error';
      stage: 'image-acquisition';
      code: 'PICKER_FAILED' | 'INVALID_IMAGE_URI' | 'UNSUPPORTED_IMAGE_FORMAT';
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
  const normalizedMimeType = normalizeMimeType(asset?.mimeType);
  const hasImageMimeType = !normalizedMimeType || normalizedMimeType.startsWith('image/');

  if (!asset || !uri || !hasLocalUri || !isKnownImage || !hasImageMimeType) {
    return {
      kind: 'error',
      stage: 'image-acquisition',
      code: 'INVALID_IMAGE_URI',
      message: 'That selection did not contain a usable local image. Please choose another photo.',
    };
  }

  if (!hasSupportedImageFormat({
    fileName: asset.fileName,
    mimeType: normalizedMimeType,
    uri,
  })) {
    return {
      kind: 'error',
      stage: 'image-acquisition',
      code: 'UNSUPPORTED_IMAGE_FORMAT',
      message: UNSUPPORTED_IMAGE_FORMAT_MESSAGE,
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

function hasSupportedImageFormat(input: {
  fileName?: string | null;
  mimeType: string | null;
  uri: string;
}): boolean {
  const evidence = [
    readMimeTypeFormat(input.mimeType),
    readExtensionFormat(input.fileName),
    readExtensionFormat(input.uri),
  ].filter((format): format is Exclude<ImageFormatEvidence, null> => format !== null);

  if (evidence.length === 0 || evidence.includes('unsupported')) {
    return false;
  }

  return evidence.every((format) => format === evidence[0]);
}

function readMimeTypeFormat(mimeType: string | null): ImageFormatEvidence {
  if (!mimeType) {
    return null;
  }

  return MIME_TO_FORMAT[mimeType] ?? 'unsupported';
}

function readExtensionFormat(value: string | null | undefined): ImageFormatEvidence {
  const extension = readExtension(value);
  if (!extension) {
    return null;
  }

  return EXTENSION_TO_FORMAT[extension] ?? 'unsupported';
}

function readExtension(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const path = value.trim().split(/[?#]/, 1)[0];
  const fileName = path.slice(path.lastIndexOf('/') + 1);
  const match = /^.+\.([a-z0-9]+)$/i.exec(fileName);
  return match?.[1].toLowerCase() ?? null;
}

function normalizeMimeType(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const mimeType = value.split(';', 1)[0].trim().toLowerCase();
  return mimeType || null;
}
