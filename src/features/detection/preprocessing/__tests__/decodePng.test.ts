import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

import { decodePng, inflateZlib } from '@/features/detection/preprocessing/decodePng';

const FIXTURES = join(__dirname, '../../../../../dev-assets/model-fixtures/v2-parity');
const IHDR_COLOR_TYPE_INDEX = 8 + 4 + 4 + 9;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PNG } = require('pngjs') as {
  PNG: {
    sync: {
      read(b: Buffer): { width: number; height: number; data: Buffer };
      write(value: { width: number; height: number; data: Buffer }): Buffer;
    };
  };
};

function rgbPng(red: number, green: number, blue: number): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const result = Buffer.alloc(12 + data.length);
    result.writeUInt32BE(data.length, 0);
    result.write(type, 4, 'ascii');
    data.copy(result, 8);
    return result;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.from([0, red, green, blue]);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

describe('decodePng', () => {
  const files = readdirSync(FIXTURES).filter((f) => f.endsWith('.png'));

  it('finds the nine V2 parity fixtures', () => {
    expect(files).toHaveLength(9);
  });

  it.each(files)('decodes %s to the exact RGB pixels', (file) => {
    const bytes = readFileSync(join(FIXTURES, file));
    const decoded = decodePng(new Uint8Array(bytes));
    const reference = PNG.sync.read(bytes);
    expect([decoded.width, decoded.height]).toEqual([224, 224]);
    const rgb = Buffer.alloc(224 * 224 * 3);
    for (let i = 0, j = 0; i < reference.data.length; i += 4, j += 3) {
      reference.data.copy(rgb, j, i, i + 3);
    }
    expect(createHash('sha256').update(decoded.rgb).digest('hex')).toBe(
      createHash('sha256').update(rgb).digest('hex'),
    );
  });

  it('inflates zlib data and rejects non-PNG bytes', () => {
    const payload = Buffer.from('caneguard '.repeat(500));
    expect(Buffer.from(inflateZlib(new Uint8Array(deflateSync(payload))))).toEqual(payload);
    expect(() => decodePng(new Uint8Array(40))).toThrow(/Not a PNG/);
  });

  it('rejects PNGs whose IHDR colour type is not RGB or RGBA', () => {
    const bytes = Buffer.from(readFileSync(join(FIXTURES, files[0])));
    expect(bytes[IHDR_COLOR_TYPE_INDEX]).toBe(2);
    bytes[IHDR_COLOR_TYPE_INDEX] = 3;
    expect(() => decodePng(new Uint8Array(bytes))).toThrow(/Unsupported PNG/);
  });

  it('rejects transparent pixels instead of discarding alpha', () => {
    const bytes = PNG.sync.write({
      width: 1,
      height: 1,
      data: Buffer.from([20, 30, 40, 0]),
    });
    expect(() => decodePng(new Uint8Array(bytes))).toThrow(/Transparent PNGs/);
  });

  it('allows an unused RGB transparency key', () => {
    const source = rgbPng(20, 30, 40);
    const chunk = Buffer.alloc(18);
    chunk.writeUInt32BE(6, 0);
    chunk.write('tRNS', 4, 'ascii');
    chunk.writeUInt16BE(200, 8);
    chunk.writeUInt16BE(200, 10);
    chunk.writeUInt16BE(200, 12);
    const idat = source.indexOf(Buffer.from('IDAT')) - 4;
    const bytes = Buffer.concat([source.subarray(0, idat), chunk, source.subarray(idat)]);
    expect(decodePng(new Uint8Array(bytes)).rgb).toEqual(Uint8Array.from([20, 30, 40]));
  });

  it('rejects a pixel matching an RGB transparency key', () => {
    const source = rgbPng(20, 30, 40);
    const chunk = Buffer.alloc(18);
    chunk.writeUInt32BE(6, 0);
    chunk.write('tRNS', 4, 'ascii');
    chunk.writeUInt16BE(20, 8);
    chunk.writeUInt16BE(30, 10);
    chunk.writeUInt16BE(40, 12);
    const idat = source.indexOf(Buffer.from('IDAT')) - 4;
    const bytes = Buffer.concat([source.subarray(0, idat), chunk, source.subarray(idat)]);
    expect(() => decodePng(new Uint8Array(bytes))).toThrow(/Transparent PNGs/);
  });

  it('rejects oversized dimensions before inflating pixel data', () => {
    const bytes = Buffer.from(readFileSync(join(FIXTURES, files[0])));
    bytes.writeUInt32BE(5000, 16);
    bytes.writeUInt32BE(4000, 20);
    expect(() => decodePng(new Uint8Array(bytes))).toThrow(/safety limit/);
  });
});
