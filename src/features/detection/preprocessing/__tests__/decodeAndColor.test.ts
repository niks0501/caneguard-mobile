import { fromByteArray } from 'base64-js';
import { encode } from 'jpeg-js';

import { decodeJpeg } from '@/features/detection/preprocessing/decodeJpeg';
import { PreprocessingError } from '@/features/detection/preprocessing/preprocessingErrors';
import { rgbaToRgb } from '@/features/detection/preprocessing/rgbaToRgb';

describe('JPEG decoding and RGB conversion', () => {
  it('decodes a JPEG to RGBA and removes alpha without reordering RGB', () => {
    const jpeg = encode(
      {
        width: 2,
        height: 1,
        data: new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]),
      },
      100,
    );
    const decoded = decodeJpeg(fromByteArray(jpeg.data));
    const rgb = rgbaToRgb(decoded.data, decoded.width, decoded.height);

    expect(decoded).toMatchObject({ width: 2, height: 1 });
    expect(decoded.data).toHaveLength(8);
    expect(rgb).toHaveLength(6);
    expect(rgb[0]).toBeGreaterThan(rgb[1]);
    expect(rgb[0]).toBeGreaterThan(rgb[2]);
    expect(rgb[4]).toBeGreaterThan(rgb[3]);
    expect(rgb[4]).toBeGreaterThan(rgb[5]);
  });

  it('returns typed errors for unreadable JPEG data and invalid channel counts', () => {
    expect(() => decodeJpeg('not-valid-base64')).toThrow(
      expect.objectContaining<Partial<PreprocessingError>>({ code: 'jpeg-decode-failed' }),
    );
    expect(() => rgbaToRgb(new Uint8Array(7), 2, 1)).toThrow(
      expect.objectContaining<Partial<PreprocessingError>>({ code: 'channel-mismatch' }),
    );
  });
});
