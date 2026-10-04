import fs from 'fs';
import path from 'path';

import { fieldGuideEntries } from '@/features/field-guide/constants/fieldGuideEntries';
import type { FieldGuideImage } from '@/features/field-guide/domain/fieldGuideTypes';

/**
 * The bundled photos are the only field-guide image data a build carries, so
 * this is where the interim drop's rules are checked against the files on disk
 * (`assets/images/field-guide/README.md`).
 *
 * The drop guide asks for a JPEG with a long edge of about 1200 px and
 * 100-300 KB. Measured on the seven files as dropped on main (2026-10-04):
 *
 * | file                | long edge | size   |
 * |---------------------|-----------|--------|
 * | `healthy/01-healthy`| 2048      | 256 KB |
 * | `mosaic/01-mosaic`  | 2048      | 336 KB |
 * | `rust/01-rust`      | 2048      | 319 KB |
 * | `smut/01-smut`      | 2048      | 268 KB |
 * | `smut/02-smut`      | 960       | 209 KB |
 * | `rssi/01-rssi`      | 2048      | 259 KB |
 * | `rssi/02-rssi`      | 2048      | 410 KB |
 *
 * Every file is a real JPEG above the floor, so none is degraded and none was
 * skipped; three sit above the guide's 300 KB ceiling and all but one are
 * longer than its 1200 px. The app already bundles an 8.9 MB model (pinned by
 * `src/features/detection/constants/__tests__/modelContract.test.ts`), so about
 * 2.1 MB of drop photos is not a material download, and these are the captain's
 * as-supplied files rather than a re-encode. The floors and ceilings below are
 * the hard regression limits that must never be crossed: a full-resolution
 * phone photo, a PNG or a screenshot fails here.
 */
const FIELD_GUIDE_ASSET_DIR = path.resolve(__dirname, '../../../../../assets/images/field-guide');
const REFERENCE_ASSET_DIR = path.resolve(__dirname, '../../../../../assets/images/sugarcane-diseases');
const MANIFEST_PATH = path.join(FIELD_GUIDE_ASSET_DIR, 'MANIFEST.csv');

const DROP_MIN_LONG_EDGE_PX = 600;
const DROP_MAX_LONG_EDGE_PX = 2048;
const DROP_MIN_BYTES = 50 * 1024;
const DROP_MAX_BYTES = 512 * 1024;

/** A dropped photo's provenance key is its path inside the drop folder. */
function isDropPhoto(image: FieldGuideImage): boolean {
  return image.assetKey.includes('/');
}

function assetPathFor(assetKey: string): string {
  return assetKey.includes('/')
    ? path.join(FIELD_GUIDE_ASSET_DIR, assetKey)
    : path.join(REFERENCE_ASSET_DIR, assetKey);
}

type JpegDimensions = { width: number; height: number };

/** Reads the frame size straight from the JPEG markers, without decoding. */
function jpegDimensions(bytes: Buffer): JpegDimensions {
  let offset = 2;

  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      throw new Error(`Not a JPEG marker at byte ${offset}`);
    }

    const marker = bytes[offset + 1];
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }

    const isFrameHeader =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isFrameHeader) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      };
    }

    offset += 2 + bytes.readUInt16BE(offset + 2);
  }

  throw new Error('No JPEG frame header found');
}

/** `MANIFEST.csv` as column-name keyed rows, skipping the header. */
function manifestRows(): Record<string, string>[] {
  const lines = fs
    .readFileSync(MANIFEST_PATH, 'utf8')
    .split('\n')
    .map((line) => line.replace(/\r$/, ''))
    .filter((line) => line.trim().length > 0);

  const columns = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const cells = line.split(',');
    return Object.fromEntries(columns.map((column, index) => [column, cells[index] ?? '']));
  });
}

const allPhotos = fieldGuideEntries.flatMap((entry) =>
  entry.images.map((image) => ({ entryId: entry.id, image })),
);
const dropPhotos = allPhotos.filter(({ image }) => isDropPhoto(image));

describe('field guide photo drop', () => {
  it('wires the seven dropped files one-to-one into the manifest', () => {
    const rows = manifestRows();

    expect(rows).toHaveLength(dropPhotos.length);
    expect(rows.map((row) => row.local_filename)).toEqual(
      dropPhotos.map(({ image }) => image.assetKey),
    );

    for (const { entryId, image } of dropPhotos) {
      const row = rows.find((candidate) => candidate.local_filename === image.assetKey);
      expect(row).toBeDefined();
      expect(row?.entry_id).toBe(entryId);
      expect(row?.subject).toBe(image.subject);
      // The drop README: status stays empty; "pending" is banned wording.
      expect(row?.status).toBe('');
      expect(row?.review_status).toBe('');
    }
  });

  it('ships every bundled field guide photo as a real JPEG file', () => {
    expect(allPhotos.length).toBeGreaterThan(0);

    for (const { image } of allPhotos) {
      const file = assetPathFor(image.assetKey);
      expect(fs.existsSync(file)).toBe(true);

      const bytes = fs.readFileSync(file);
      expect([...bytes.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);

      const { width, height } = jpegDimensions(bytes);
      expect(Math.max(width, height)).toBeGreaterThanOrEqual(DROP_MIN_LONG_EDGE_PX);
    }
  });

  it('keeps every dropped photo inside the hard drop ceilings', () => {
    for (const { image } of dropPhotos) {
      const file = assetPathFor(image.assetKey);
      const bytes = fs.readFileSync(file);
      const { width, height } = jpegDimensions(bytes);
      const longEdge = Math.max(width, height);

      expect(longEdge).toBeLessThanOrEqual(DROP_MAX_LONG_EDGE_PX);
      expect(bytes.length).toBeGreaterThanOrEqual(DROP_MIN_BYTES);
      expect(bytes.length).toBeLessThanOrEqual(DROP_MAX_BYTES);
    }
  });

  it('gives every bundled photo its own file and provenance key', () => {
    const keys = allPhotos.map(({ image }) => image.assetKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
