import { manipulateAsync } from 'expo-image-manipulator';

import { GUARD_V1 } from '@/features/detection/constants/guardContract';
import {
  guardTensorFromPng,
  preprocessGuardImage,
} from '@/features/detection/preprocessing/guardPreprocess';

const mockDelete = jest.fn();
const mockFile = jest.fn();
jest.mock('expo-file-system', () => ({
  Directory: function Directory() {
    return { exists: true, list: () => [] };
  },
  File: function File(this: unknown, ...args: unknown[]) {
    mockFile(...args);
    return { delete: mockDelete };
  },
  Paths: { cache: 'file:///cache' },
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { PNG: 'png' },
}));

const mockManipulate = manipulateAsync as jest.MockedFunction<typeof manipulateAsync>;

/** Self-created, non-photographic fixture: four solid quadrants (no licensed or private images). */
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

/** Nearest-neighbour stand-in for the native bilinear stretch; edges of solid blocks are not asserted. */
function stretchTo224(source: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(224 * 224 * 4);
  for (let y = 0; y < 224; y += 1) {
    for (let x = 0; x < 224; x += 1) {
      const sx = Math.min(width - 1, Math.floor((x / 224) * width));
      const sy = Math.min(height - 1, Math.floor((y / 224) * height));
      out.set(source.subarray((sy * width + sx) * 4, (sy * width + sx) * 4 + 4), (y * 224 + x) * 4);
    }
  }
  return out;
}

function pngBase64(rgba: Uint8Array, width = 224, height = 224): string {
  const { PNG } = require('pngjs') as {
    PNG: { sync: { write(value: { data: Uint8Array; width: number; height: number }): Buffer } };
  };
  return PNG.sync.write({ data: rgba, width, height }).toString('base64');
}

// PNG preserves the self-created solid-color fixture exactly.
const TOLERANCE = 0;

function pixel(tensor: Float32Array, x: number, y: number): number[] {
  const i = (y * 224 + x) * 3;
  return [tensor[i], tensor[i + 1], tensor[i + 2]];
}

describe('preprocessGuardImage', () => {
  beforeEach(() => {
    // A 320 x 180 landscape source: stretching must distort it to square, not pad it.
    const stretched = stretchTo224(quadrantSource(320, 180), 320, 180);
    mockManipulate.mockResolvedValue({
      uri: 'file:///guard.png',
      width: 224,
      height: 224,
      base64: pngBase64(stretched),
    });
  });

  // Proves: the guard tensor is 602112 bytes of float32 RGB in 0..255 with no outside normalization.
  it('builds a 602112-byte raw 0..255 float32 RGB tensor', async () => {
    const inputBuffer = await preprocessGuardImage('content://photo');
    expect(inputBuffer.byteLength).toBe(602112);
    expect(inputBuffer.byteLength).toBe(GUARD_V1.inputByteLength);
    const tensor = new Float32Array(inputBuffer);
    expect(tensor.length).toBe(224 * 224 * 3);
    const lowest = tensor.reduce((a, b) => Math.min(a, b), Infinity);
    const highest = tensor.reduce((a, b) => Math.max(a, b), -Infinity);
    expect(lowest).toBeGreaterThanOrEqual(0);
    expect(highest).toBeLessThanOrEqual(255);
    // x/127.5-1 would bound everything to [-1, 1]; raw pixels reach well above 1.
    expect(highest).toBeGreaterThan(200);
  });

  // Proves: direct stretch from the same source photo (one full-frame resize, no crop/pad/rotate/flip) with RGB order preserved.
  it('stretches the whole frame to 224 x 224 in RGB order with no letterbox', async () => {
    const inputBuffer = await preprocessGuardImage('content://photo');

    expect(mockManipulate).toHaveBeenCalledTimes(1);
    expect(mockManipulate).toHaveBeenCalledWith(
      'content://photo',
      [{ resize: { width: 224, height: 224 } }],
      { base64: true, format: 'png' },
    );

    const tensor = new Float32Array(inputBuffer);
    // Corner pixels belong to the four quadrants: a letterbox would leave 127.5 bands instead.
    const expectations: [number, number, readonly number[]][] = [
      [3, 3, QUADRANTS.topLeft],
      [220, 3, QUADRANTS.topRight],
      [3, 220, QUADRANTS.bottomLeft],
      [220, 220, QUADRANTS.bottomRight],
    ];
    for (const [x, y, expected] of expectations) {
      pixel(tensor, x, y).forEach((value, channel) => {
        expect(Math.abs(value - expected[channel])).toBeLessThanOrEqual(TOLERANCE);
      });
    }
    // Every row and column carries image content: no constant pad value anywhere on the border.
    for (let k = 0; k < 224; k += 1) {
      for (const [x, y] of [[k, 0], [k, 223], [0, k], [223, k]]) {
        expect(pixel(tensor, x, y)).not.toEqual([127.5, 127.5, 127.5]);
      }
    }
  });

  // Proves: a wrong decoded size, a missing image or an empty URI fails closed instead of producing a tensor.
  it('fails closed on bad manipulator output', async () => {
    mockManipulate.mockResolvedValueOnce({
      uri: 'file:///x.png',
      width: 224,
      height: 168,
      base64: pngBase64(quadrantSource(224, 168), 224, 168),
    });
    await expect(preprocessGuardImage('content://photo')).rejects.toMatchObject({
      code: 'GUARD_INPUT_INVALID',
    });
    mockManipulate.mockResolvedValueOnce({ uri: 'x', width: 224, height: 224 });
    await expect(preprocessGuardImage('content://photo')).rejects.toMatchObject({
      code: 'GUARD_INPUT_INVALID',
    });
    mockManipulate.mockRejectedValueOnce(new Error('file gone'));
    await expect(preprocessGuardImage('content://photo')).rejects.toMatchObject({
      code: 'GUARD_INPUT_INVALID',
    });
    await expect(preprocessGuardImage('  ')).rejects.toMatchObject({ code: 'GUARD_INPUT_INVALID' });
  });

  // Proves: the guard's scratch PNG is deleted after extraction, also when decoding fails (no extra photo copy is retained).
  it('deletes the scratch PNG on success and on failure', async () => {
    await preprocessGuardImage('content://photo');
    expect(mockFile).toHaveBeenCalledWith('file:///guard.png');
    expect(mockDelete).toHaveBeenCalledTimes(1);

    mockManipulate.mockResolvedValueOnce({ uri: 'file:///bad.png', width: 224, height: 224, base64: 'not-a-png' });
    await expect(preprocessGuardImage('content://photo')).rejects.toMatchObject({ code: 'GUARD_INPUT_INVALID' });
    expect(mockFile).toHaveBeenLastCalledWith('file:///bad.png');
    expect(mockDelete).toHaveBeenCalledTimes(2);
  });

  // Proves: the decode helper alone yields the exact 602112-byte tensor for a 224 x 224 PNG.
  it('guardTensorFromPng returns 602112 bytes for a 224 x 224 png', () => {
    expect(guardTensorFromPng(pngBase64(quadrantSource(224, 224))).byteLength).toBe(602112);
  });
});
