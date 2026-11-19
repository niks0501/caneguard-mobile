import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { GUARD_V1 } from '@/features/detection/constants/guardContract';
import { manipulateAsync } from 'expo-image-manipulator';
import { decode as decodeJpeg, encode } from 'jpeg-js';

import { preprocessGuardImage } from '@/features/detection/preprocessing/guardPreprocess';
import { decodePng } from '@/features/detection/preprocessing/decodePng';

const mockArrayBuffer = jest.fn<Promise<ArrayBuffer>, []>();
const mockDelete = jest.fn();
const mockFileUri = jest.fn();

jest.mock('expo-file-system', () => ({
  File: function File(uri: string) {
    mockFileUri(uri);
    return { arrayBuffer: () => mockArrayBuffer(), delete: () => mockDelete(uri) };
  },
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' },
}));
jest.mock('jpeg-js', () => {
  const actual = jest.requireActual('jpeg-js') as typeof import('jpeg-js');
  return { ...actual, decode: jest.fn(actual.decode) };
});
jest.mock('@/features/detection/preprocessing/decodePng', () => {
  const actual = jest.requireActual('@/features/detection/preprocessing/decodePng') as typeof import('@/features/detection/preprocessing/decodePng');
  return { ...actual, decodePng: jest.fn(actual.decodePng) };
});
const mockManipulate = manipulateAsync as jest.MockedFunction<typeof manipulateAsync>;
const mockJpegDecode = jest.mocked(decodeJpeg);
const mockDecodePng = jest.mocked(decodePng);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PNG } = require('pngjs') as {
  PNG: { sync: { write(value: { data: Uint8Array; width: number; height: number }): Buffer } };
};
const GUARD_FIXTURES = join(process.cwd(), 'qa/guard-v1');

const QUADRANTS = {
  topLeft: [220, 30, 30],
  topRight: [30, 200, 40],
  bottomLeft: [30, 40, 210],
  bottomRight: [230, 220, 30],
} as const;

const FFMPEG_JPEG_LANDMARK_TOLERANCE = 24;
const FFMPEG_JPEG_LANDMARKS = [
  { x: 45, y: 45, rgb: [105, 176, 76] },
  { x: 179, y: 45, rgb: [138, 140, 71] },
  { x: 45, y: 179, rgb: [82, 189, 105] },
  { x: 179, y: 179, rgb: [85, 113, 58] },
  { x: 112, y: 112, rgb: [97, 185, 64] },
] as const;

function quadrantSource(width: number, height: number): Uint8Array {
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const colour =
        y < height / 2
          ? x < width / 2 ? QUADRANTS.topLeft : QUADRANTS.topRight
          : x < width / 2 ? QUADRANTS.bottomLeft : QUADRANTS.bottomRight;
      const i = (y * width + x) * 4;
      rgba[i] = colour[0];
      rgba[i + 1] = colour[1];
      rgba[i + 2] = colour[2];
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}

function pngBytes(rgba: Uint8Array, width: number, height: number): ArrayBuffer {
  const bytes = PNG.sync.write({ data: rgba, width, height });
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function setSource(rgba: Uint8Array, width: number, height: number): void {
  mockArrayBuffer.mockResolvedValueOnce(pngBytes(rgba, width, height));
}

function jpegDeclaring(width: number, height: number): ArrayBuffer {
  const bytes = Buffer.from(encode({ data: quadrantSource(8, 8), width: 8, height: 8 }, 100).data);
  const sof = bytes.indexOf(Buffer.from([0xff, 0xc0]));
  bytes.writeUInt16BE(height, sof + 5);
  bytes.writeUInt16BE(width, sof + 7);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function pngDeclaring(width: number, height: number): ArrayBuffer {
  const bytes = Buffer.from(pngBytes(quadrantSource(8, 8), 8, 8));
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function pngWithOrientation(rgba: Uint8Array, width: number, height: number, orientation: number): ArrayBuffer {
  const source = Buffer.from(pngBytes(rgba, width, height));
  const exif = Buffer.alloc(26);
  exif.write('II', 0, 'ascii');
  exif.writeUInt16LE(42, 2);
  exif.writeUInt32LE(8, 4);
  exif.writeUInt16LE(1, 8);
  exif.writeUInt16LE(0x0112, 10);
  exif.writeUInt16LE(3, 12);
  exif.writeUInt32LE(1, 14);
  exif.writeUInt16LE(orientation, 18);
  const chunk = Buffer.alloc(12 + exif.length);
  chunk.writeUInt32BE(exif.length, 0);
  chunk.write('eXIf', 4, 'ascii');
  exif.copy(chunk, 8);
  const idat = source.indexOf(Buffer.from('IDAT')) - 4;
  const result = Buffer.concat([source.subarray(0, idat), chunk, source.subarray(idat)]);
  return result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength) as ArrayBuffer;
}

function pixel(tensor: Float32Array, x: number, y: number): number[] {
  const i = (y * 224 + x) * 3;
  return [tensor[i], tensor[i + 1], tensor[i + 2]];
}

function expectJpegLandmarks(tensor: Float32Array): void {
  for (const landmark of FFMPEG_JPEG_LANDMARKS) {
    const actual = pixel(tensor, landmark.x, landmark.y);
    for (let channel = 0; channel < 3; channel += 1) {
      expect(Math.abs(actual[channel] - landmark.rgb[channel])).toBeLessThanOrEqual(
        FFMPEG_JPEG_LANDMARK_TOLERANCE,
      );
    }
  }
}

describe('preprocessGuardImage', () => {
  beforeEach(() => {
    mockArrayBuffer.mockReset();
    mockManipulate.mockReset();
    mockDelete.mockReset();
    mockFileUri.mockReset();
    mockJpegDecode.mockClear();
    mockDecodePng.mockClear();
  });

  it('builds a 602112-byte raw 0..255 float32 RGB tensor', async () => {
    setSource(quadrantSource(320, 180), 320, 180);
    const inputBuffer = await preprocessGuardImage('content://photo');
    expect(inputBuffer.byteLength).toBe(GUARD_V1.inputByteLength);
    const tensor = new Float32Array(inputBuffer);
    expect(tensor.length).toBe(224 * 224 * 3);
    const lowest = tensor.reduce((value, current) => Math.min(value, current), Infinity);
    const highest = tensor.reduce((value, current) => Math.max(value, current), -Infinity);
    expect(lowest).toBeGreaterThanOrEqual(0);
    expect(highest).toBeLessThanOrEqual(255);
    expect(highest).toBeGreaterThan(200);
  });

  it('applies direct bilinear stretch in RGB order without a disk derivative', async () => {
    setSource(quadrantSource(320, 180), 320, 180);
    const inputBuffer = await preprocessGuardImage('content://photo');
    const tensor = new Float32Array(inputBuffer);
    expect(pixel(tensor, 3, 3)).toEqual(QUADRANTS.topLeft);
    expect(pixel(tensor, 220, 3)).toEqual(QUADRANTS.topRight);
    expect(pixel(tensor, 3, 220)).toEqual(QUADRANTS.bottomLeft);
    expect(pixel(tensor, 220, 220)).toEqual(QUADRANTS.bottomRight);
    expect(mockArrayBuffer).toHaveBeenCalledTimes(1);
  });

  it('clamps bilinear edge samples and matches the independent midpoint', async () => {
    setSource(Uint8Array.from([20, 30, 40, 255, 220, 230, 240, 255]), 1, 2);
    let tensor = new Float32Array(await preprocessGuardImage('content://edge'));
    expect(pixel(tensor, 0, 0)).toEqual([20, 30, 40]);
    expect(pixel(tensor, 0, 223)).toEqual([220, 230, 240]);

    setSource(Uint8Array.from([0, 0, 0, 255, 100, 100, 100, 255]), 2, 1);
    tensor = new Float32Array(await preprocessGuardImage('content://midpoint'));
    expect(pixel(tensor, 112, 0)).toEqual([50, 50, 50]);
  });

  it('applies PNG EXIF orientation before the direct stretch', async () => {
    const source = Uint8Array.from([
      220, 30, 30, 255,
      30, 40, 220, 255,
    ]);
    mockArrayBuffer.mockResolvedValueOnce(pngWithOrientation(source, 2, 1, 6));
    const tensor = new Float32Array(await preprocessGuardImage('content://oriented-png'));
    expect(pixel(tensor, 0, 0)).toEqual([220, 30, 30]);
    expect(pixel(tensor, 0, 223)).toEqual([30, 40, 220]);
  });

  it('matches independent RGB landmarks for upright and EXIF-rotated JPEGs', async () => {
    const upright = readFileSync(join(GUARD_FIXTURES, 'cane-like-accept.jpg'));
    const rotated = readFileSync(join(GUARD_FIXTURES, 'cane-like-exif-rotated.jpg'));
    const toArrayBuffer = (bytes: Buffer): ArrayBuffer =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    mockArrayBuffer
      .mockResolvedValueOnce(toArrayBuffer(upright))
      .mockResolvedValueOnce(toArrayBuffer(rotated));

    const uprightTensor = new Float32Array(await preprocessGuardImage('content://upright.jpg'));
    const rotatedTensor = new Float32Array(await preprocessGuardImage('content://rotated.jpg'));

    expectJpegLandmarks(uprightTensor);
    expectJpegLandmarks(rotatedTensor);
  });

  it('passes a 6000x4000 JPEG to the in-memory decoder without an intermediate resize', async () => {
    mockArrayBuffer.mockResolvedValueOnce(jpegDeclaring(6000, 4000));
    mockJpegDecode.mockReturnValueOnce({
      data: quadrantSource(224, 224),
      width: 224,
      height: 224,
    } as ReturnType<typeof decodeJpeg>);

    const input = await preprocessGuardImage('content://large.jpg');

    expect(input.byteLength).toBe(GUARD_V1.inputByteLength);
    expect(mockJpegDecode).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      expect.objectContaining({ maxResolutionInMP: 24, maxMemoryUsageInMB: 256 }),
    );
    expect(mockManipulate).not.toHaveBeenCalled();
  });

  it('passes a 6000x4000 PNG to the in-memory decoder without an intermediate conversion', async () => {
    mockArrayBuffer.mockResolvedValueOnce(pngDeclaring(6000, 4000));
    mockDecodePng.mockReturnValueOnce({
      width: 224,
      height: 224,
      rgb: new Uint8Array(224 * 224 * 3),
      orientation: 1,
    });

    const input = await preprocessGuardImage('content://large.png');

    expect(input.byteLength).toBe(GUARD_V1.inputByteLength);
    expect(mockDecodePng).toHaveBeenCalledTimes(1);
    expect(mockManipulate).not.toHaveBeenCalled();
  });

  it('reports the PNG decoder memory limit as an actionable size failure', async () => {
    const source = Buffer.from(pngDeclaring(6000, 4000));
    source[24] = 16;
    source[25] = 6;
    mockArrayBuffer.mockResolvedValueOnce(
      source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength) as ArrayBuffer,
    );

    await expect(preprocessGuardImage('content://large-16bit.png')).rejects.toMatchObject({
      code: 'GUARD_INPUT_TOO_LARGE',
    });
    expect(mockManipulate).not.toHaveBeenCalled();
  });

  it('rejects transparent source PNG pixels before resizing', async () => {
    const bytes = PNG.sync.write({ data: Uint8Array.from([20, 30, 40, 0]), width: 1, height: 1 });
    mockArrayBuffer.mockResolvedValueOnce(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    );
    await expect(preprocessGuardImage('content://transparent')).rejects.toMatchObject({
      code: 'GUARD_INPUT_INVALID',
    });
  });

  it('fails closed on unreadable, unsupported, and empty sources', async () => {
    mockArrayBuffer.mockRejectedValueOnce(new Error('file gone'));
    await expect(preprocessGuardImage('content://broken')).rejects.toMatchObject({ code: 'GUARD_INPUT_INVALID' });
    const unsupported = Uint8Array.from([0, 1, 2, 3]).buffer;
    mockArrayBuffer.mockResolvedValueOnce(unsupported);
    await expect(preprocessGuardImage('content://webp')).rejects.toMatchObject({ code: 'GUARD_INPUT_INVALID' });
    await expect(preprocessGuardImage('  ')).rejects.toMatchObject({ code: 'GUARD_INPUT_INVALID' });
  });

  describe('WebP uploads (converted by the platform manipulator)', () => {
    const webpHeader = (tag: string, flagsOrBytes: number[] = []): ArrayBuffer => {
      const bytes = new Uint8Array(32);
      bytes.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50], 0);
      bytes.set(Array.from(tag, (c) => c.charCodeAt(0)), 12);
      bytes.set(flagsOrBytes, 20);
      return bytes.buffer;
    };
    const jpegBase64 = (): string =>
      Buffer.from(encode({ data: quadrantSource(224, 224), width: 224, height: 224 }, 100).data).toString('base64');

    beforeEach(() => {
      mockManipulate.mockReset();
      mockDelete.mockReset();
      mockFileUri.mockReset();
    });

    // Proves: an opaque WebP is delegated without resize and its scratch file is deleted.
    it('delegates an opaque WebP without resizing and deletes the scratch file', async () => {
      mockArrayBuffer.mockResolvedValueOnce(webpHeader('VP8 '));
      mockManipulate.mockResolvedValueOnce({
        uri: 'file:///cache/converted.jpg', width: 224, height: 224, base64: jpegBase64(),
      } as Awaited<ReturnType<typeof manipulateAsync>>);
      const tensor = new Float32Array(await preprocessGuardImage('content://photo.webp'));
      expect(tensor.byteLength).toBe(GUARD_V1.inputByteLength / 4 * 4);
      expect(mockManipulate).toHaveBeenCalledWith('content://photo.webp', [], {
        base64: true, compress: 1, format: 'jpeg',
      });
      expect(mockDelete).toHaveBeenCalledWith('file:///cache/converted.jpg');
    });

    // Proves: transparent WebP (VP8X alpha flag, VP8L alpha bit) is refused before conversion, like transparent PNG.
    it.each([
      ['VP8X alpha flag', webpHeader('VP8X', [0x10])],
      ['VP8L alpha bit', webpHeader('VP8L', [0x2f, 0, 0, 0, 0x10])],
    ])('refuses transparent WebP (%s)', async (_name, bytes) => {
      mockArrayBuffer.mockResolvedValueOnce(bytes);
      await expect(preprocessGuardImage('content://alpha.webp')).rejects.toMatchObject({
        code: 'GUARD_INPUT_INVALID',
      });
      expect(mockManipulate).not.toHaveBeenCalled();
    });

    // Proves: a photo beyond any safe size is refused before conversion with the dedicated too-large fault.
    it('refuses an absurdly large photo before conversion', async () => {
      mockArrayBuffer.mockResolvedValueOnce(jpegDeclaring(30000, 20000));
      await expect(preprocessGuardImage('content://huge.jpg')).rejects.toMatchObject({
        code: 'GUARD_INPUT_TOO_LARGE',
      });
      expect(mockManipulate).not.toHaveBeenCalled();
    });

    // Proves: a failed conversion is a guard fault, never a pass.
    it('fails closed when the conversion fails', async () => {
      mockArrayBuffer.mockResolvedValueOnce(webpHeader('VP8 '));
      mockManipulate.mockRejectedValueOnce(new Error('cannot decode'));
      await expect(preprocessGuardImage('content://bad.webp')).rejects.toMatchObject({
        code: 'GUARD_INPUT_INVALID',
      });
    });
  });
});
