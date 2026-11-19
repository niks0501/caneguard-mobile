import { decode as decodeJpegBytes } from 'jpeg-js';
import { File } from 'expo-file-system';

import { GUARD_V1 } from '@/features/detection/constants/guardContract';
import { GuardError } from '@/features/detection/model/guardInference';
import { createInputTensor } from '@/features/detection/preprocessing/createInputTensor';
import { decodePng } from '@/features/detection/preprocessing/decodePng';
import { rgbaToRgb } from '@/features/detection/preprocessing/rgbaToRgb';

const [, GUARD_HEIGHT, GUARD_WIDTH] = GUARD_V1.input.shape;
const MAX_SOURCE_BYTES = 128 * 1024 * 1024;

type RgbImage = {
  width: number;
  height: number;
  rgb: Uint8Array;
};

function readUint16(bytes: Uint8Array, offset: number, littleEndian: boolean): number {
  return littleEndian
    ? bytes[offset] | (bytes[offset + 1] << 8)
    : (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint32(bytes: Uint8Array, offset: number, littleEndian: boolean): number {
  return littleEndian
    ? (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0
    : ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

function exifOrientation(bytes: Uint8Array): number {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;
  let offset = 2;
  while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1];
    offset += 2;
    if (marker === 0xd9 || marker === 0xda) break;
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    if (length < 2 || offset + length > bytes.length) break;
    if (marker === 0xe1 && length >= 8) {
      const exif = offset + 2;
      if (
        bytes[exif] === 0x45 && bytes[exif + 1] === 0x78 && bytes[exif + 2] === 0x69 &&
        bytes[exif + 3] === 0x66 && bytes[exif + 4] === 0 && bytes[exif + 5] === 0
      ) {
        const tiff = exif + 6;
        const littleEndian = bytes[tiff] === 0x49 && bytes[tiff + 1] === 0x49;
        const bigEndian = bytes[tiff] === 0x4d && bytes[tiff + 1] === 0x4d;
        if (!littleEndian && !bigEndian) return 1;
        if (readUint16(bytes, tiff + 2, littleEndian) !== 42) return 1;
        const ifd = tiff + readUint32(bytes, tiff + 4, littleEndian);
        if (ifd + 2 > bytes.length) return 1;
        const entries = readUint16(bytes, ifd, littleEndian);
        for (let index = 0; index < entries; index += 1) {
          const entry = ifd + 2 + index * 12;
          if (entry + 12 > bytes.length) return 1;
          if (readUint16(bytes, entry, littleEndian) !== 0x0112) continue;
          const type = readUint16(bytes, entry + 2, littleEndian);
          const count = readUint32(bytes, entry + 4, littleEndian);
          if (type === 3 && count >= 1) {
            const value = readUint16(bytes, entry + 8, littleEndian);
            return value >= 1 && value <= 8 ? value : 1;
          }
        }
      }
    }
    offset += length;
  }
  return 1;
}

function orientImage(image: RgbImage, orientation: number): RgbImage {
  if (orientation === 1) return image;
  const rotated = orientation >= 5 && orientation <= 8;
  const width = rotated ? image.height : image.width;
  const height = rotated ? image.width : image.height;
  const rgb = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sourceX = x;
      let sourceY = y;
      switch (orientation) {
        case 2: sourceX = image.width - 1 - x; break;
        case 3: sourceX = image.width - 1 - x; sourceY = image.height - 1 - y; break;
        case 4: sourceY = image.height - 1 - y; break;
        case 5: sourceX = y; sourceY = x; break;
        case 6: sourceX = y; sourceY = image.height - 1 - x; break;
        case 7: sourceX = image.width - 1 - y; sourceY = image.height - 1 - x; break;
        case 8: sourceX = image.width - 1 - y; sourceY = x; break;
        default: break;
      }
      const source = (sourceY * image.width + sourceX) * 3;
      const target = (y * width + x) * 3;
      rgb[target] = image.rgb[source];
      rgb[target + 1] = image.rgb[source + 1];
      rgb[target + 2] = image.rgb[source + 2];
    }
  }
  return { width, height, rgb };
}

function resizeBilinear(image: RgbImage, width: number, height: number): Uint8Array {
  const output = new Uint8Array(width * height * 3);
  const scaleX = image.width / width;
  const scaleY = image.height / height;
  for (let y = 0; y < height; y += 1) {
    const sourceY = Math.max(0, Math.min(image.height - 1, (y + 0.5) * scaleY - 0.5));
    const y0 = Math.max(0, Math.floor(sourceY));
    const y1 = Math.min(image.height - 1, y0 + 1);
    const fy = sourceY - y0;
    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.max(0, Math.min(image.width - 1, (x + 0.5) * scaleX - 0.5));
      const x0 = Math.max(0, Math.floor(sourceX));
      const x1 = Math.min(image.width - 1, x0 + 1);
      const fx = sourceX - x0;
      const target = (y * width + x) * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        const topLeft = image.rgb[(y0 * image.width + x0) * 3 + channel];
        const topRight = image.rgb[(y0 * image.width + x1) * 3 + channel];
        const bottomLeft = image.rgb[(y1 * image.width + x0) * 3 + channel];
        const bottomRight = image.rgb[(y1 * image.width + x1) * 3 + channel];
        const top = topLeft + (topRight - topLeft) * fx;
        const bottom = bottomLeft + (bottomRight - bottomLeft) * fx;
        output[target + channel] = Math.round(top + (bottom - top) * fy);
      }
    }
  }
  return output;
}

async function readSourceImage(sourceUri: string): Promise<RgbImage> {
  let bytes: Uint8Array;
  try {
    const file = new File(sourceUri);
    const declaredSize = (file as unknown as { size?: unknown }).size;
    if (typeof declaredSize === 'number' && Number.isFinite(declaredSize) && declaredSize > MAX_SOURCE_BYTES) {
      throw new Error('The photo is too large to prepare safely.');
    }
    bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.byteLength > MAX_SOURCE_BYTES) {
      throw new Error('The photo is too large to prepare safely.');
    }
  } catch (error) {
    throw new GuardError(
      'GUARD_INPUT_INVALID',
      `The guard could not read the photo: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }

  try {
    const png = bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
    if (png) {
      const decoded = decodePng(bytes);
      return orientImage(
        { width: decoded.width, height: decoded.height, rgb: decoded.rgb },
        decoded.orientation,
      );
    }
    const jpeg = bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8;
    if (!jpeg) throw new Error('Only JPEG and PNG photos are supported by the guard.');
    const decoded = decodeJpegBytes(bytes, {
      useTArray: true,
      formatAsRGBA: true,
      tolerantDecoding: false,
      maxResolutionInMP: 16,
      maxMemoryUsageInMB: 128,
    });
    return orientImage(
      { width: decoded.width, height: decoded.height, rgb: rgbaToRgb(decoded.data, decoded.width, decoded.height) },
      exifOrientation(bytes),
    );
  } catch (error) {
    if (error instanceof GuardError) throw error;
    throw new GuardError(
      'GUARD_INPUT_INVALID',
      `The guard could not decode the photo: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
}

export function guardTensorFromRgb(rgb: Uint8Array, width: number, height: number): ArrayBuffer {
  const { inputBuffer } = createInputTensor(rgb, width, height);
  if (inputBuffer.byteLength !== GUARD_V1.inputByteLength) {
    throw new GuardError(
      'GUARD_INPUT_INVALID',
      `Guard tensor is ${inputBuffer.byteLength} bytes, expected ${GUARD_V1.inputByteLength}.`,
    );
  }
  return inputBuffer;
}

export async function preprocessGuardImage(sourceUri: string): Promise<ArrayBuffer> {
  if (!sourceUri.trim()) {
    throw new GuardError('GUARD_INPUT_INVALID', 'A source image URI is required for the guard.');
  }
  const source = await readSourceImage(sourceUri);
  const resized = resizeBilinear(source, GUARD_WIDTH, GUARD_HEIGHT);
  return guardTensorFromRgb(resized, GUARD_WIDTH, GUARD_HEIGHT);
}
