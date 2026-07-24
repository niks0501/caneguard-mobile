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

  it('keeps usable images when Android omits optional type metadata', () => {
    const result: ImagePickerResult = {
      canceled: false,
      assets: [{ uri: 'content://leaf/2', width: 0, height: 0 }],
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
      message: 'That selection did not contain a usable local image. Please choose another photo.',
    });
  });
});
