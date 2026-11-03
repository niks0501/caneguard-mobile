import { PreprocessingError } from '@/features/detection/preprocessing/preprocessingErrors';

/**
 * Minimal dependency-free PNG decoder for the V2 parity fixtures: 8-bit RGB,
 * non-interlaced. It returns the exact stored pixels (no resize, no re-encode,
 * no color management) as interleaved RGB.
 */
export interface DecodedPng {
  width: number;
  height: number;
  rgb: Uint8Array;
}

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

function fail(message: string): never {
  throw new PreprocessingError('png-decode-failed', message);
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

function buildHuffman(lengths: readonly number[]): Huffman {
  const counts = new Array<number>(16).fill(0);
  for (const length of lengths) counts[length] += 1;
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

/** RFC 1950/1951 inflate of a zlib stream. */
export function inflateZlib(input: Uint8Array): Uint8Array {
  if (input.length < 6 || (input[0] & 0x0f) !== 8) fail('Unsupported zlib stream.');
  let position = 2;
  let bitBuffer = 0;
  let bitCount = 0;
  let out = new Uint8Array(Math.max(1024, input.length * 4));
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
    if (outLength + extra > out.length) {
      const grown = new Uint8Array(Math.max(out.length * 2, outLength + extra));
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
      position += 4;
      if (position + length > input.length) fail('Truncated stored block.');
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
          } else {
            repeat = 11 + readBits(7);
          }
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

export function decodePng(bytes: Uint8Array): DecodedPng {
  if (bytes.length < 33 || PNG_SIGNATURE.some((value, i) => bytes[i] !== value)) {
    fail('Not a PNG file.');
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width = 0;
  let height = 0;
  const idat: Uint8Array[] = [];
  let offset = 8;

  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === 'IHDR') {
      width = view.getUint32(offset - 12 - length + 8);
      height = view.getUint32(offset - 12 - length + 12);
      const [bitDepth, colorType, , , interlace] = data.subarray(8, 13);
      if (bitDepth !== 8 || colorType !== 2 || interlace !== 0) {
        fail('Only 8-bit non-interlaced RGB PNGs are supported.');
      }
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  if (width <= 0 || height <= 0 || idat.length === 0) fail('Incomplete PNG.');

  const compressed = new Uint8Array(idat.reduce((sum, chunk) => sum + chunk.length, 0));
  let cursor = 0;
  for (const chunk of idat) {
    compressed.set(chunk, cursor);
    cursor += chunk.length;
  }

  const raw = inflateZlib(compressed);
  const stride = width * 3;
  if (raw.length < (stride + 1) * height) fail('PNG pixel data is truncated.');

  const pixels = new Uint8Array(stride * height);
  for (let row = 0; row < height; row += 1) {
    const filter = raw[row * (stride + 1)];
    const source = row * (stride + 1) + 1;
    const target = row * stride;
    for (let i = 0; i < stride; i += 1) {
      const left = i >= 3 ? pixels[target + i - 3] : 0;
      const up = row > 0 ? pixels[target - stride + i] : 0;
      const upLeft = row > 0 && i >= 3 ? pixels[target - stride + i - 3] : 0;
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

  return { width, height, rgb: pixels };
}
