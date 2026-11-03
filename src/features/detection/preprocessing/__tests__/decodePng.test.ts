import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

import { decodePng, inflateZlib } from '@/features/detection/preprocessing/decodePng';

const FIXTURES = join(__dirname, '../../../../../dev-assets/model-fixtures/v2-parity');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PNG } = require('pngjs') as { PNG: { sync: { read(b: Buffer): { width: number; height: number; data: Buffer } } } };

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
});
