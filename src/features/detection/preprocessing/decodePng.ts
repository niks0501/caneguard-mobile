import { PreprocessingError } from '@/features/detection/preprocessing/preprocessingErrors';
import {
  MAX_GUARD_WORKING_BYTES,
  MAX_GUARD_IMAGE_PIXELS,
  MAX_PNG_DECODE_BYTES,
} from '@/features/detection/preprocessing/guardPreprocessLimits';

export interface DecodedPng {
  width: number;
  height: number;
  rgb: Uint8Array;
  orientation: number;
}

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const ADAM7 = [
  [0, 0, 8, 8],
  [4, 0, 8, 8],
  [0, 4, 4, 8],
  [2, 0, 4, 4],
  [0, 2, 2, 4],
  [1, 0, 2, 2],
  [0, 1, 1, 2],
] as const;

function fail(
  message: string,
  code: 'png-decode-failed' | 'image-too-large' = 'png-decode-failed',
): never {
  throw new PreprocessingError(code, message);
}

const LENGTH_BASE = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67,
  83, 99, 115, 131, 163, 195, 227, 258,
];
const LENGTH_EXTRA = [
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5,
  5, 5, 0,
];
const DIST_BASE = [
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513,
  769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577,
];
const DIST_EXTRA = [
  0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11,
  11, 12, 12, 13, 13,
];
const CODE_LENGTH_ORDER = [
  16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15,
];

type Huffman = { counts: number[]; symbols: number[] };

type PngTransparency = {
  gray: number | null;
  rgb: readonly [number, number, number] | null;
  palette: Uint8Array | null;
};

function buildHuffman(lengths: readonly number[]): Huffman {
  const counts = new Array<number>(16).fill(0);
  for (const length of lengths) {
    if (length < 0 || length > 15) fail('Invalid Huffman code length.');
    counts[length] += 1;
  }
  counts[0] = 0;
  const offsets = new Array<number>(16).fill(0);
  for (let length = 1; length < 16; length += 1) {
    offsets[length] = offsets[length - 1] + counts[length - 1];
  }
  const symbols = new Array<number>(lengths.length).fill(0);
  lengths.forEach((length, symbol) => {
    if (length !== 0) symbols[offsets[length]++] = symbol;
  });
  return { counts, symbols };
}

let FIXED_LITERALS: Huffman | null = null;
let FIXED_DISTANCES: Huffman | null = null;

function fixedTables(): [Huffman, Huffman] {
  if (!FIXED_LITERALS || !FIXED_DISTANCES) {
    const lengths = new Array<number>(288).fill(8);
    for (let i = 144; i < 256; i += 1) lengths[i] = 9;
    for (let i = 256; i < 280; i += 1) lengths[i] = 7;
    FIXED_LITERALS = buildHuffman(lengths);
    FIXED_DISTANCES = buildHuffman(new Array<number>(30).fill(5));
  }
  return [FIXED_LITERALS, FIXED_DISTANCES];
}

export function inflateZlib(
  input: Uint8Array,
  maxOutputBytes = MAX_PNG_DECODE_BYTES,
  initialOutputBytes?: number,
): Uint8Array {
  if (input.length < 6 || (input[0] & 0x0f) !== 8) fail('Unsupported zlib stream.');
  let position = 2;
  let bitBuffer = 0;
  let bitCount = 0;
  const initialCapacity = initialOutputBytes ?? Math.min(maxOutputBytes, Math.max(1024, input.length * 4));
  if (initialCapacity < 0 || initialCapacity > maxOutputBytes) {
    fail('PNG decompressed data exceeds the safety limit.', 'image-too-large');
  }
  let out = new Uint8Array(initialCapacity);
  let outLength = 0;

  const readBits = (count: number): number => {
    while (bitCount < count) {
      if (position >= input.length) fail('Unexpected end of compressed data.');
      bitBuffer |= input[position++] << bitCount;
      bitCount += 8;
    }
    const value = bitBuffer & ((1 << count) - 1);
    bitBuffer >>>= count;
    bitCount -= count;
    return value;
  };

  const decodeSymbol = (table: Huffman): number => {
    let code = 0;
    let first = 0;
    let index = 0;
    for (let length = 1; length < 16; length += 1) {
      code |= readBits(1);
      const count = table.counts[length];
      if (code - count < first) return table.symbols[index + (code - first)];
      index += count;
      first += count;
      first <<= 1;
      code <<= 1;
    }
    return fail('Invalid Huffman code.');
  };

  const ensure = (extra: number) => {
    if (extra < 0 || outLength > maxOutputBytes - extra) fail('PNG decompressed data exceeds the safety limit.');
    if (outLength + extra > out.length) {
      const grown = new Uint8Array(Math.min(maxOutputBytes, Math.max(out.length * 2, outLength + extra)));
      grown.set(out);
      out = grown;
    }
  };

  let finalBlock = false;
  while (!finalBlock) {
    finalBlock = readBits(1) === 1;
    const type = readBits(2);

    if (type === 0) {
      bitBuffer = 0;
      bitCount = 0;
      if (position + 4 > input.length) fail('Truncated stored block.');
      const length = input[position] | (input[position + 1] << 8);
      const inverse = input[position + 2] | (input[position + 3] << 8);
      position += 4;
      if ((length ^ inverse) !== 0xffff || position + length > input.length) fail('Truncated stored block.');
      ensure(length);
      out.set(input.subarray(position, position + length), outLength);
      outLength += length;
      position += length;
      continue;
    }

    let literals: Huffman;
    let distances: Huffman;
    if (type === 1) {
      [literals, distances] = fixedTables();
    } else if (type === 2) {
      const literalCount = readBits(5) + 257;
      const distanceCount = readBits(5) + 1;
      const codeLengthCount = readBits(4) + 4;
      const codeLengths = new Array<number>(19).fill(0);
      for (let i = 0; i < codeLengthCount; i += 1) {
        codeLengths[CODE_LENGTH_ORDER[i]] = readBits(3);
      }
      const codeLengthTable = buildHuffman(codeLengths);
      const lengths: number[] = [];
      while (lengths.length < literalCount + distanceCount) {
        const symbol = decodeSymbol(codeLengthTable);
        if (symbol < 16) {
          lengths.push(symbol);
        } else {
          let repeat: number;
          let value = 0;
          if (symbol === 16) {
            if (lengths.length === 0) fail('Invalid repeat code.');
            value = lengths[lengths.length - 1];
            repeat = 3 + readBits(2);
          } else if (symbol === 17) {
            repeat = 3 + readBits(3);
          } else if (symbol === 18) {
            repeat = 11 + readBits(7);
          } else {
            fail('Invalid code-length symbol.');
          }
          if (lengths.length + repeat > literalCount + distanceCount) fail('Invalid code-length repeat.');
          for (let i = 0; i < repeat; i += 1) lengths.push(value);
        }
      }
      literals = buildHuffman(lengths.slice(0, literalCount));
      distances = buildHuffman(lengths.slice(literalCount));
    } else {
      return fail('Invalid deflate block type.');
    }

    for (;;) {
      const symbol = decodeSymbol(literals);
      if (symbol < 256) {
        ensure(1);
        out[outLength++] = symbol;
      } else if (symbol === 256) {
        break;
      } else {
        const lengthIndex = symbol - 257;
        if (lengthIndex >= LENGTH_BASE.length) fail('Invalid length symbol.');
        const length = LENGTH_BASE[lengthIndex] + readBits(LENGTH_EXTRA[lengthIndex]);
        const distanceSymbol = decodeSymbol(distances);
        if (distanceSymbol >= DIST_BASE.length) fail('Invalid distance symbol.');
        const distance = DIST_BASE[distanceSymbol] + readBits(DIST_EXTRA[distanceSymbol]);
        if (distance > outLength) fail('Distance exceeds output.');
        ensure(length);
        for (let i = 0; i < length; i += 1) {
          out[outLength] = out[outLength - distance];
          outLength += 1;
        }
      }
    }
  }

  return out.subarray(0, outLength);
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

function readTiffOrientation(bytes: Uint8Array): number {
  if (bytes.length < 14) return 1;
  const littleEndian = bytes[0] === 0x49 && bytes[1] === 0x49;
  const bigEndian = bytes[0] === 0x4d && bytes[1] === 0x4d;
  if (!littleEndian && !bigEndian) return 1;
  const read16 = (offset: number) => littleEndian
    ? bytes[offset] | (bytes[offset + 1] << 8)
    : (bytes[offset] << 8) | bytes[offset + 1];
  const read32 = (offset: number) => littleEndian
    ? (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0
    : ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
  if (read16(2) !== 42) return 1;
  const ifd = read32(4);
  if (ifd + 2 > bytes.length) return 1;
  const entries = read16(ifd);
  for (let index = 0; index < entries; index += 1) {
    const entry = ifd + 2 + index * 12;
    if (entry + 12 > bytes.length) return 1;
    if (read16(entry) !== 0x0112 || read16(entry + 2) !== 3 || read32(entry + 4) < 1) continue;
    const value = read16(entry + 8);
    return value >= 1 && value <= 8 ? value : 1;
  }
  return 1;
}

function allowedBitDepth(colorType: number, bitDepth: number): boolean {
  if (colorType === 0) return [1, 2, 4, 8, 16].includes(bitDepth);
  if (colorType === 3) return [1, 2, 4, 8].includes(bitDepth);
  return bitDepth === 8 || bitDepth === 16;
}

function channelsFor(colorType: number): number {
  switch (colorType) {
    case 0: return 1;
    case 2: return 3;
    case 3: return 1;
    case 4: return 2;
    case 6: return 4;
    default: return 0;
  }
}

function passSize(size: number, start: number, step: number): number {
  return size <= start ? 0 : Math.floor((size - start + step - 1) / step);
}

function unfilterRows(raw: Uint8Array, offset: number, rowBytes: number, rows: number, bytesPerPixel: number): {
  pixels: Uint8Array;
  nextOffset: number;
} {
  const required = rows * (rowBytes + 1);
  if (offset > raw.length - required) fail('PNG pixel data is truncated.');
  const pixels = new Uint8Array(rows * rowBytes);
  for (let row = 0; row < rows; row += 1) {
    const filter = raw[offset++];
    const source = offset;
    const target = row * rowBytes;
    offset += rowBytes;
    for (let i = 0; i < rowBytes; i += 1) {
      const left = i >= bytesPerPixel ? pixels[target + i - bytesPerPixel] : 0;
      const up = row > 0 ? pixels[target - rowBytes + i] : 0;
      const upLeft = row > 0 && i >= bytesPerPixel ? pixels[target - rowBytes + i - bytesPerPixel] : 0;
      let predictor: number;
      switch (filter) {
        case 0: predictor = 0; break;
        case 1: predictor = left; break;
        case 2: predictor = up; break;
        case 3: predictor = (left + up) >> 1; break;
        case 4: predictor = paeth(left, up, upLeft); break;
        default: return fail(`Unknown PNG filter ${filter}.`);
      }
      pixels[target + i] = (raw[source + i] + predictor) & 0xff;
    }
  }
  return { pixels, nextOffset: offset };
}

function rawSample(row: Uint8Array, x: number, channel: number, channels: number, bitDepth: number): number {
  if (bitDepth === 8) return row[x * channels + channel];
  if (bitDepth === 16) {
    const index = (x * channels + channel) * 2;
    return (row[index] << 8) | row[index + 1];
  }
  const bit = (x * channels + channel) * bitDepth;
  return (row[bit >> 3] >> (8 - bitDepth - (bit & 7))) & ((1 << bitDepth) - 1);
}

function sample(row: Uint8Array, x: number, channel: number, channels: number, bitDepth: number): number {
  const value = rawSample(row, x, channel, channels, bitDepth);
  return bitDepth === 16
    ? Math.round(value * 255 / 65535)
    : bitDepth === 8
      ? value
      : Math.round(value * 255 / ((1 << bitDepth) - 1));
}

function writePixel(
  row: Uint8Array,
  x: number,
  target: Uint8Array,
  targetIndex: number,
  colorType: number,
  bitDepth: number,
  channels: number,
  palette: Uint8Array | null,
  transparency: PngTransparency,
): void {
  let red: number;
  let green: number;
  let blue: number;
  let alpha = 255;
  if (colorType === 0) {
    const gray = rawSample(row, x, 0, channels, bitDepth);
    red = green = blue = sample(row, x, 0, channels, bitDepth);
    if (transparency.gray !== null && gray === transparency.gray) alpha = 0;
  } else if (colorType === 2) {
    const rawRed = rawSample(row, x, 0, channels, bitDepth);
    const rawGreen = rawSample(row, x, 1, channels, bitDepth);
    const rawBlue = rawSample(row, x, 2, channels, bitDepth);
    red = sample(row, x, 0, channels, bitDepth);
    green = sample(row, x, 1, channels, bitDepth);
    blue = sample(row, x, 2, channels, bitDepth);
    if (transparency.rgb && rawRed === transparency.rgb[0] && rawGreen === transparency.rgb[1] && rawBlue === transparency.rgb[2]) {
      alpha = 0;
    }
  } else if (colorType === 3) {
    const index = rawSample(row, x, 0, 1, bitDepth);
    if (!palette || index * 3 + 2 >= palette.length) fail('PNG palette index is out of range.');
    red = palette[index * 3];
    green = palette[index * 3 + 1];
    blue = palette[index * 3 + 2];
    if (transparency.palette && index < transparency.palette.length) alpha = transparency.palette[index];
  } else if (colorType === 4) {
    red = green = blue = sample(row, x, 0, channels, bitDepth);
    alpha = rawSample(row, x, 1, channels, bitDepth) === (bitDepth === 16 ? 65535 : 255) ? 255 : 0;
  } else {
    red = sample(row, x, 0, channels, bitDepth);
    green = sample(row, x, 1, channels, bitDepth);
    blue = sample(row, x, 2, channels, bitDepth);
    alpha = rawSample(row, x, 3, channels, bitDepth) === (bitDepth === 16 ? 65535 : 255) ? 255 : 0;
  }
  if (alpha !== 255) fail('Transparent PNGs are not supported.');
  target[targetIndex] = red;
  target[targetIndex + 1] = green;
  target[targetIndex + 2] = blue;
}

export function decodePng(bytes: Uint8Array): DecodedPng {
  if (bytes.length < 33 || PNG_SIGNATURE.some((value, index) => bytes[index] !== value)) {
    fail('Not a PNG file.');
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = -1;
  let interlace = 0;
  let palette: Uint8Array | null = null;
  let orientation = 1;
  const transparency: PngTransparency = { gray: null, rgb: null, palette: null };
  const idat: Uint8Array[] = [];
  let offset = 8;

  while (offset < bytes.length) {
    if (offset > bytes.length - 12) fail('Truncated PNG chunk.');
    const length = view.getUint32(offset);
    if (length > bytes.length - offset - 12) fail('Truncated PNG chunk.');
    const typeOffset = offset + 4;
    const type = String.fromCharCode(...bytes.subarray(typeOffset, typeOffset + 4));
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === 'IHDR') {
      if (length !== 13) fail('Invalid PNG header.');
      width = view.getUint32(typeOffset + 4);
      height = view.getUint32(typeOffset + 8);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
      if (
        !width ||
        !height ||
        width > MAX_GUARD_IMAGE_PIXELS ||
        height > MAX_GUARD_IMAGE_PIXELS ||
        width * height > MAX_GUARD_IMAGE_PIXELS
      ) {
        fail('PNG dimensions exceed the safety limit.', 'image-too-large');
      }
      if (!allowedBitDepth(colorType, bitDepth) || channelsFor(colorType) === 0 || (interlace !== 0 && interlace !== 1)) {
        fail('Unsupported PNG colour, bit depth, or interlace mode.');
      }
    } else if (type === 'PLTE') {
      if (length === 0 || length % 3 !== 0 || length > 768) fail('Invalid PNG palette.');
      palette = data;
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'tRNS') {
      if (colorType === 0 && length === 2) {
        transparency.gray = (data[0] << 8) | data[1];
      } else if (colorType === 2 && length === 6) {
        transparency.rgb = [
          (data[0] << 8) | data[1],
          (data[2] << 8) | data[3],
          (data[4] << 8) | data[5],
        ];
      } else if (colorType === 3 && length <= 256) {
        transparency.palette = data;
      } else {
        fail('Invalid PNG transparency data.');
      }
    } else if (type === 'eXIf') {
      const hasExifHeader = data.length >= 6 &&
        data[0] === 0x45 && data[1] === 0x78 && data[2] === 0x69 &&
        data[3] === 0x66 && data[4] === 0 && data[5] === 0;
      orientation = readTiffOrientation(data.subarray(hasExifHeader ? 6 : 0));
    } else if (type === 'IEND') {
      break;
    }
  }

  const channels = channelsFor(colorType);
  if (width <= 0 || height <= 0 || channels === 0 || idat.length === 0) fail('Incomplete PNG.');
  if (colorType === 3 && !palette) fail('PNG palette is missing.');

  const bitsPerPixel = channels * bitDepth;
  const bytesPerPixel = Math.max(1, Math.ceil(bitsPerPixel / 8));
  const passes = interlace === 0 ? [[0, 0, 1, 1]] as const : ADAM7;
  let expectedRawBytes = 0;
  let expectedDecodedBytes = 0;
  for (const [startX, startY, stepX, stepY] of passes) {
    const passWidth = passSize(width, startX, stepX);
    const passHeight = passSize(height, startY, stepY);
    if (passWidth === 0 || passHeight === 0) continue;
    const rowBytes = Math.ceil(passWidth * bitsPerPixel / 8);
    expectedRawBytes += passHeight * (rowBytes + 1);
    expectedDecodedBytes += passHeight * rowBytes;
  }
  const expectedRgbBytes = width * height * 3;
  const rotatedRgbBytes = orientation === 1 ? 0 : expectedRgbBytes;
  const compressedLength = idat.reduce((sum, chunk) => sum + chunk.length, 0);
  const decodedWorkingBytes =
    expectedRawBytes + expectedDecodedBytes + expectedRgbBytes + rotatedRgbBytes;
  if (
    decodedWorkingBytes > MAX_PNG_DECODE_BYTES ||
    bytes.byteLength + compressedLength + expectedRawBytes + expectedDecodedBytes +
      expectedRgbBytes + rotatedRgbBytes > MAX_GUARD_WORKING_BYTES
  ) {
    fail('PNG working set exceeds the safety limit.', 'image-too-large');
  }

  const compressed = new Uint8Array(compressedLength);
  let cursor = 0;
  for (const chunk of idat) {
    compressed.set(chunk, cursor);
    cursor += chunk.length;
  }

  const pixels = new Uint8Array(expectedRgbBytes);
  const raw = inflateZlib(compressed, expectedRawBytes, expectedRawBytes);
  let rawOffset = 0;

  const decodePass = (startX: number, startY: number, stepX: number, stepY: number) => {
    const passWidth = passSize(width, startX, stepX);
    const passHeight = passSize(height, startY, stepY);
    if (passWidth === 0 || passHeight === 0) return;
    const rowBytes = Math.ceil(passWidth * bitsPerPixel / 8);
    const decoded = unfilterRows(raw, rawOffset, rowBytes, passHeight, bytesPerPixel);
    rawOffset = decoded.nextOffset;
    for (let y = 0; y < passHeight; y += 1) {
      const row = decoded.pixels.subarray(y * rowBytes, (y + 1) * rowBytes);
      for (let x = 0; x < passWidth; x += 1) {
        const outputIndex = ((startY + y * stepY) * width + startX + x * stepX) * 3;
        writePixel(row, x, pixels, outputIndex, colorType, bitDepth, channels, palette, transparency);
      }
    }
  };

  if (interlace === 0) {
    decodePass(0, 0, 1, 1);
  } else {
    for (const [startX, startY, stepX, stepY] of ADAM7) {
      decodePass(startX, startY, stepX, stepY);
    }
  }
  if (rawOffset > raw.length) fail('PNG pixel data is truncated.');
  return { width, height, rgb: pixels, orientation };
}
