import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { decodeJpeg } from '@/features/detection/preprocessing/decodeJpeg';
import { PreprocessingError } from '@/features/detection/preprocessing/preprocessingErrors';
import { preprocessImage } from '@/features/detection/preprocessing/preprocessImage';

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('@/features/detection/preprocessing/decodeJpeg', () => ({
  decodeJpeg: jest.fn(),
}));

const mockManipulateAsync = manipulateAsync as jest.MockedFunction<typeof manipulateAsync>;
const mockDecodeJpeg = decodeJpeg as jest.MockedFunction<typeof decodeJpeg>;

function rgbaFixture(width = 224, height = 224): Uint8Array {
  const rgba = new Uint8Array(width * height * 4);

  for (let index = 0; index < rgba.length; index += 4) {
    rgba[index] = 10;
    rgba[index + 1] = 20;
    rgba[index + 2] = 30;
    rgba[index + 3] = 255;
  }

  return rgba;
}

describe('preprocessImage', () => {
  it('preserves aspect ratio, letterboxes, and returns an exact raw float32 tensor', async () => {
    mockManipulateAsync.mockResolvedValue({
      uri: 'file:///processed.jpg',
      width: 224,
      height: 224,
      base64: 'encoded-jpeg',
    });
    mockDecodeJpeg.mockReturnValue({
      data: rgbaFixture(),
      width: 224,
      height: 224,
    });

    const result = await preprocessImage('content://selected-leaf');

    expect(mockManipulateAsync).toHaveBeenCalledWith(
      'content://selected-leaf',
      [{ resize: { width: 224 } }],
      {
        base64: true,
        compress: 1,
        format: SaveFormat.JPEG,
      },
    );
    expect(result).toMatchObject({
      processedUri: 'file:///processed.jpg',
      width: 224,
      height: 224,
      channels: 3,
      dataType: 'float32',
      minValue: 10,
      maxValue: 30,
      meanValue: 20,
      letterbox: {
        resizedWidth: 224,
        resizedHeight: 224,
        paddingLeft: 0,
        paddingTop: 0,
      },
    });
    expect(result.inputBuffer.byteLength).toBe(602_112);
    expect(Array.from(new Float32Array(result.inputBuffer).slice(0, 6))).toEqual([
      10, 20, 30, 10, 20, 30,
    ]);
    expect(result.preprocessMs).toBeGreaterThanOrEqual(0);
  });

  it('resizes a portrait source to fit and centers its pixels in the padded tensor', async () => {
    mockManipulateAsync.mockResolvedValueOnce({
      uri: 'file:///portrait.jpg',
      width: 168,
      height: 224,
      base64: 'encoded-jpeg',
    });
    mockDecodeJpeg.mockReturnValueOnce({
      data: rgbaFixture(168, 224),
      width: 168,
      height: 224,
    });

    const result = await preprocessImage('content://portrait', {
      width: 3000,
      height: 4000,
    });
    const values = new Float32Array(result.inputBuffer);

    expect(mockManipulateAsync).toHaveBeenCalledWith(
      'content://portrait',
      [{ resize: { width: 168, height: 224 } }],
      {
        base64: true,
        compress: 1,
        format: SaveFormat.JPEG,
      },
    );
    expect(result.letterbox).toEqual({
      resizedWidth: 168,
      resizedHeight: 224,
      paddingLeft: 28,
      paddingTop: 0,
    });
    expect(Array.from(values.slice(0, 3))).toEqual([127.5, 127.5, 127.5]);
    expect(Array.from(values.slice((224 * 0 + 28) * 3, (224 * 0 + 29) * 3))).toEqual([
      10,
      20,
      30,
    ]);
    expect(result.minValue).toBe(10);
    expect(result.maxValue).toBe(127.5);
  });

  it('falls back to a height-only resize when unknown metadata reveals a portrait source', async () => {
    mockManipulateAsync
      .mockResolvedValueOnce({
        uri: 'file:///portrait-first-pass.jpg',
        width: 224,
        height: 597,
        base64: 'encoded-jpeg',
      })
      .mockResolvedValueOnce({
        uri: 'file:///portrait.jpg',
        width: 84,
        height: 224,
        base64: 'encoded-jpeg',
      });
    mockDecodeJpeg.mockReturnValueOnce({
      data: rgbaFixture(84, 224),
      width: 84,
      height: 224,
    });

    const result = await preprocessImage('content://unknown-dimensions');

    expect(mockManipulateAsync).toHaveBeenNthCalledWith(
      1,
      'content://unknown-dimensions',
      [{ resize: { width: 224 } }],
      {
        base64: true,
        compress: 1,
        format: SaveFormat.JPEG,
      },
    );
    expect(mockManipulateAsync).toHaveBeenNthCalledWith(
      2,
      'content://unknown-dimensions',
      [{ resize: { height: 224 } }],
      {
        base64: true,
        compress: 1,
        format: SaveFormat.JPEG,
      },
    );
    expect(result.letterbox).toEqual({
      resizedWidth: 84,
      resizedHeight: 224,
      paddingLeft: 70,
      paddingTop: 0,
    });
  });

  it('stops with typed errors when manipulation or decoded dimensions fail', async () => {
    mockManipulateAsync.mockRejectedValueOnce(new Error('native failure'));

    await expect(preprocessImage('content://broken')).rejects.toEqual(
      expect.objectContaining<Partial<PreprocessingError>>({
        code: 'image-manipulation-failed',
      }),
    );

    mockManipulateAsync.mockResolvedValueOnce({
      uri: 'file:///processed.jpg',
      width: 224,
      height: 224,
      base64: 'encoded-jpeg',
    });
    mockDecodeJpeg.mockReturnValueOnce({
      data: new Uint8Array(220 * 224 * 4),
      width: 220,
      height: 224,
    });

    await expect(preprocessImage('content://wrong-size')).rejects.toEqual(
      expect.objectContaining<Partial<PreprocessingError>>({ code: 'dimension-mismatch' }),
    );
  });
});
