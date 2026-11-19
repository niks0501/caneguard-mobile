import { decode as decodeJpegBytes } from 'jpeg-js';
import { toByteArray } from 'base64-js';
import { File } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { GUARD_V1 } from '@/features/detection/constants/guardContract';
import { GuardError } from '@/features/detection/model/guardInference';
import { createInputTensor } from '@/features/detection/preprocessing/createInputTensor';
import { decodePng } from '@/features/detection/preprocessing/decodePng';
import { MAX_GUARD_IMAGE_PIXELS } from '@/features/detection/preprocessing/guardPreprocessLimits';
import { PreprocessingError } from '@/features/detection/preprocessing/preprocessingErrors';
import { rgbaToRgb } from '@/features/detection/preprocessing/rgbaToRgb';

const [, GUARD_HEIGHT, GUARD_WIDTH] = GUARD_V1.input.shape;
const MAX_SOURCE_BYTES = 128 * 1024 * 1024;

const tooLarge = (cause?: unknown): GuardError =>
  new GuardError('GUARD_INPUT_TOO_LARGE', 'The photo is too large to prepare safely.', cause);

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

type Dimensions = { width: number; height: number };

/** Cheap header peek: JPEG SOF, PNG IHDR or WebP chunk dimensions; null when unknown. */
function peekDimensions(bytes: Uint8Array): Dimensions | null {
  let width = 0;
  let height = 0;
  if (bytes.length >= 26 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) {
    width = readUint32(bytes, 16, false);
    height = readUint32(bytes, 20, false);
  } else if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 <= bytes.length && bytes[offset] === 0xff) {
      const marker = bytes[offset + 1];
      if (marker === 0xd9 || marker === 0xda) break;
      const isFrame =
        marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isFrame) {
        height = readUint16(bytes, offset + 5, false);
        width = readUint16(bytes, offset + 7, false);
        break;
      }
      offset += 2 + readUint16(bytes, offset + 2, false);
    }
  } else if (isWebp(bytes) && bytes.length >= 30) {
    const tag = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
    if (tag === 'VP8X') {
      width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
      height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
    } else if (tag === 'VP8L' && bytes[20] === 0x2f) {
      width = 1 + (bytes[21] | ((bytes[22] & 0x3f) << 8));
      height = 1 + ((bytes[22] >> 6) | (bytes[23] << 2) | ((bytes[24] & 0x0f) << 10));
    } else if (tag === 'VP8 ' && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
      width = readUint16(bytes, 26, true) & 0x3fff;
      height = readUint16(bytes, 28, true) & 0x3fff;
    }
  }
  return width > 0 && height > 0 ? { width, height } : null;
}

function isWebp(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 16 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  );
}

/** True when a WebP declares an alpha channel (VP8X flag, ALPH chunk or VP8L alpha bit). */
function webpHasAlpha(bytes: Uint8Array): boolean {
  const tag = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  if (tag === 'VP8X') return (bytes[20] & 0x10) !== 0;
  if (tag === 'VP8L') return bytes.length > 24 && bytes[20] === 0x2f && (bytes[24] & 0x10) !== 0;
  return false;
}

/**
 * WebP photos are converted by the platform image manipulator without resizing.
 * The base64 result is decoded in memory and the scratch file the call wrote is
 * deleted at once, even when decoding fails.
 */
async function manipulatorJpegBytes(sourceUri: string): Promise<Uint8Array> {
  let scratchUri: string | undefined;
  try {
    const converted = await manipulateAsync(sourceUri, [], {
      base64: true,
      compress: 1,
      format: SaveFormat.JPEG,
    });
    scratchUri = converted.uri;
    if (!converted.base64) throw new Error('The photo could not be converted.');
    const bytes = toByteArray(converted.base64);
    if (bytes.byteLength > MAX_SOURCE_BYTES) throw tooLarge();
    return bytes;
  } finally {
    if (scratchUri) {
      try {
        new File(scratchUri).delete();
      } catch {
        // Best effort: the cache directory is evicted by the OS regardless.
      }
    }
  }
}

async function readSourceImage(sourceUri: string): Promise<RgbImage> {
  let bytes: Uint8Array;
  try {
    const file = new File(sourceUri);
    const declaredSize = (file as unknown as { size?: unknown }).size;
    if (typeof declaredSize === 'number' && Number.isFinite(declaredSize) && declaredSize > MAX_SOURCE_BYTES) {
      throw tooLarge();
    }
    bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.byteLength > MAX_SOURCE_BYTES) {
      throw tooLarge();
    }
  } catch (error) {
    if (error instanceof GuardError) throw error;
    throw new GuardError(
      'GUARD_INPUT_INVALID',
      `The guard could not read the photo: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }

  try {
    const dimensions = peekDimensions(bytes);
    const pixels = dimensions ? dimensions.width * dimensions.height : 0;
      if (dimensions && pixels > MAX_GUARD_IMAGE_PIXELS) throw tooLarge();
    const webp = isWebp(bytes);
    const png = bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
    if (webp && webpHasAlpha(bytes)) {
      throw new Error('Transparent images are not supported. Please choose an opaque photo.');
    }
    if (webp) {
      bytes = await manipulatorJpegBytes(sourceUri);
      const convertedDimensions = peekDimensions(bytes);
      const convertedPixels = convertedDimensions ? convertedDimensions.width * convertedDimensions.height : 0;
      if (convertedDimensions && convertedPixels > MAX_GUARD_IMAGE_PIXELS) {
        throw tooLarge();
      }
    } else if (png) {
      const decoded = decodePng(bytes);
      return orientImage(
        { width: decoded.width, height: decoded.height, rgb: decoded.rgb },
        decoded.orientation,
      );
    }
    const jpeg = bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8;
    if (!jpeg) throw new Error('Only JPEG, PNG and WebP photos are supported by the guard.');
    const decoded = decodeJpegBytes(bytes, {
      useTArray: true,
      formatAsRGBA: true,
      tolerantDecoding: false,
      maxResolutionInMP: MAX_GUARD_IMAGE_PIXELS / 1_000_000,
      maxMemoryUsageInMB: 256,
    });
    return orientImage(
      { width: decoded.width, height: decoded.height, rgb: rgbaToRgb(decoded.data, decoded.width, decoded.height) },
      exifOrientation(bytes),
    );
  } catch (error) {
    if (error instanceof GuardError) throw error;
    if (error instanceof PreprocessingError && error.code === 'image-too-large') throw tooLarge(error);
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
