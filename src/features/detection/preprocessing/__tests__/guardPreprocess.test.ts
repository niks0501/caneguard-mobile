import { GUARD_V1 } from '@/features/detection/constants/guardContract';
import { preprocessGuardImage } from '@/features/detection/preprocessing/guardPreprocess';

const mockArrayBuffer = jest.fn<Promise<ArrayBuffer>, []>();

jest.mock('expo-file-system', () => ({
  File: function File() {
    return { arrayBuffer: () => mockArrayBuffer() };
  },
}));

const QUADRANTS = {
  topLeft: [220, 30, 30],
  topRight: [30, 200, 40],
  bottomLeft: [30, 40, 210],
  bottomRight: [230, 220, 30],
} as const;

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
  const { PNG } = require('pngjs') as {
    PNG: { sync: { write(value: { data: Uint8Array; width: number; height: number }): Buffer } };
  };
  const bytes = PNG.sync.write({ data: rgba, width, height });
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function setSource(rgba: Uint8Array, width: number, height: number): void {
  mockArrayBuffer.mockResolvedValueOnce(pngBytes(rgba, width, height));
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

describe('preprocessGuardImage', () => {
  beforeEach(() => mockArrayBuffer.mockReset());

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

  it('clamps bilinear edge samples instead of extrapolating below the first row', async () => {
    setSource(Uint8Array.from([20, 30, 40, 255, 220, 230, 240, 255]), 1, 2);
    const tensor = new Float32Array(await preprocessGuardImage('content://edge'));
    expect(pixel(tensor, 0, 0)).toEqual([20, 30, 40]);
    expect(pixel(tensor, 0, 223)).toEqual([220, 230, 240]);
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

  it('rejects transparent source PNG pixels before resizing', async () => {
    const { PNG } = require('pngjs') as {
      PNG: { sync: { write(value: { data: Uint8Array; width: number; height: number }): Buffer } };
    };
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
});
