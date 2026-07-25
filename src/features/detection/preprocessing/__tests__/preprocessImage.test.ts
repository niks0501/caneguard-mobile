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

function rgbaFixture(): Uint8Array {
  const rgba = new Uint8Array(224 * 224 * 4);

  for (let index = 0; index < rgba.length; index += 4) {
    rgba[index] = 10;
    rgba[index + 1] = 20;
    rgba[index + 2] = 30;
    rgba[index + 3] = 255;
  }

  return rgba;
}

describe('preprocessImage', () => {
  it('stretches to 224 × 224 and returns an exact raw float32 tensor', async () => {
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
      [{ resize: { width: 224, height: 224 } }],
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
    });
    expect(result.inputBuffer.byteLength).toBe(602_112);
    expect(Array.from(new Float32Array(result.inputBuffer).slice(0, 6))).toEqual([
      10, 20, 30, 10, 20, 30,
    ]);
    expect(result.preprocessMs).toBeGreaterThanOrEqual(0);
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
