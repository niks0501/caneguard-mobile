import type {
  ImagePickerErrorResult,
  ImagePickerResult,
} from 'expo-image-picker';

import { readPickerOutcome } from '@/features/detection/imagePicker/readPickerOutcome';

describe('readPickerOutcome', () => {
  it('preserves cancellation as a no-op outcome', () => {
    const result: ImagePickerResult = { canceled: true, assets: null };

    expect(readPickerOutcome(result, 'gallery')).toEqual({ kind: 'canceled' });
  });

  it('turns a picker error into a recoverable user message', () => {
    const result: ImagePickerErrorResult = {
      code: 'E_PICKER',
      message: 'native implementation detail',
    };

    expect(readPickerOutcome(result, 'camera')).toEqual({
      kind: 'error',
      stage: 'image-acquisition',
      code: 'PICKER_FAILED',
      message: 'The image picker could not finish. Please try choosing the image again.',
    });
  });

  it.each(['content://leaf/1', 'file:///cache/leaf.jpg', 'ph://asset/1', 'blob:leaf'])(
    'accepts a usable local image URI: %s',
    (uri) => {
      const result: ImagePickerResult = {
        canceled: false,
        assets: [
          {
            uri: `  ${uri}  `,
            width: 1920,
            height: 1080,
            type: 'image',
            mimeType: 'image/jpeg',
          },
        ],
      };

      expect(readPickerOutcome(result, 'gallery')).toEqual({
        kind: 'selected',
        image: {
          sourceUri: uri,
          sourceWidth: 1920,
          sourceHeight: 1080,
          sourceType: 'gallery',
        },
      });
    },
  );

  it.each([
    ['JPEG', 'image/jpeg', 'leaf.jpeg'],
    ['JPG', 'image/jpeg', 'leaf.JPG'],
    ['JPG MIME alias', 'image/jpg', 'leaf.jpg'],
    ['PNG', 'image/png', 'leaf.png'],
    ['WebP', 'image/webp', 'leaf.webp'],
  ])('accepts a supported %s format from its filename', (_label, mimeType, fileName) => {
    const result: ImagePickerResult = {
      canceled: false,
      assets: [
        {
          uri: 'content://leaf/2',
          fileName,
          width: 0,
          height: 0,
          type: null,
          mimeType,
        },
      ],
    };

    expect(readPickerOutcome(result, 'camera')).toEqual({
      kind: 'selected',
      image: {
        sourceUri: 'content://leaf/2',
        sourceWidth: null,
        sourceHeight: null,
        sourceType: 'camera',
      },
    });
  });

  it('keeps a supported image when Android omits its MIME and generic type metadata', () => {
    const result: ImagePickerResult = {
      canceled: false,
      assets: [{ uri: 'content://leaf/3', fileName: 'leaf.webp', width: 0, height: 0 }],
    };

    expect(readPickerOutcome(result, 'camera')).toEqual({
      kind: 'selected',
      image: {
        sourceUri: 'content://leaf/3',
        sourceWidth: null,
        sourceHeight: null,
        sourceType: 'camera',
      },
    });
  });

  it.each([
    ['HEIC', 'image/heic', 'leaf.heic'],
    ['HEIF', 'image/heif', 'leaf.heif'],
    ['AVIF', 'image/avif', 'leaf.avif'],
    ['GIF', 'image/gif', 'leaf.gif'],
  ])('rejects a new %s selection before analysis', (_label, mimeType, fileName) => {
    const result: ImagePickerResult = {
      canceled: false,
      assets: [
        {
          uri: 'content://leaf/unsupported',
          fileName,
          width: 1920,
          height: 1080,
          type: 'image',
          mimeType,
        },
      ],
    };

    expect(readPickerOutcome(result, 'gallery')).toEqual({
      kind: 'error',
      stage: 'image-acquisition',
      code: 'UNSUPPORTED_IMAGE_FORMAT',
      message: 'Unsupported image format. Please choose a JPEG, PNG, or WebP image.',
    });
  });

  it.each([
    [
      'a supported MIME type paired with an HEIC filename',
      { uri: 'content://leaf/inconsistent-1', fileName: 'leaf.heic', mimeType: 'image/jpeg' },
    ],
    [
      'an HEIF MIME type paired with a JPG filename',
      { uri: 'content://leaf/inconsistent-2', fileName: 'leaf.jpg', mimeType: 'image/heif' },
    ],
    [
      'a GIF URI with no MIME type',
      { uri: 'content://leaf/leaf.gif', fileName: null, mimeType: undefined },
    ],
    [
      'an image with no format evidence',
      { uri: 'content://leaf/unknown', fileName: null, mimeType: undefined },
    ],
  ])('rejects %s without weakening the format allowlist', (_caseName, assetMetadata) => {
    const result: ImagePickerResult = {
      canceled: false,
      assets: [
        {
          ...assetMetadata,
          width: 100,
          height: 100,
          type: 'image',
        },
      ],
    };

    expect(readPickerOutcome(result, 'gallery')).toEqual({
      kind: 'error',
      stage: 'image-acquisition',
      code: 'UNSUPPORTED_IMAGE_FORMAT',
      message: 'Unsupported image format. Please choose a JPEG, PNG, or WebP image.',
    });
  });

  it.each([
    ['missing asset', []],
    [
      'remote URI',
      [{ uri: 'https://example.com/leaf.jpg', width: 100, height: 100, type: 'image' }],
    ],
    [
      'video asset',
      [{ uri: 'file:///leaf.mp4', width: 100, height: 100, type: 'video' }],
    ],
    [
      'non-image MIME type',
      [
        {
          uri: 'file:///leaf.txt',
          width: 100,
          height: 100,
          type: 'image',
          mimeType: 'text/plain',
        },
      ],
    ],
  ])('rejects a %s', (_caseName, assets) => {
    const result = { canceled: false, assets } as ImagePickerResult;

    expect(readPickerOutcome(result, 'gallery')).toEqual({
      kind: 'error',
      stage: 'image-acquisition',
      code: 'INVALID_IMAGE_URI',
      message: 'That selection did not contain a usable local image. Please choose another photo.',
    });
  });
});
