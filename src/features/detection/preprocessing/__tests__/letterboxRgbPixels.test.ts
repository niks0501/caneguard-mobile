import {
  calculateAspectPreservingResize,
  createLetterboxGeometry,
  letterboxRgbPixels,
} from '@/features/detection/preprocessing/letterboxRgbPixels';

const CHANNELS = 3;

function pixelIndex(x: number, y: number): number {
  return (y * 224 + x) * CHANNELS;
}

describe('letterbox preprocessing geometry', () => {
  it.each([
    [3000, 4000, { width: 168, height: 224 }],
    [1589, 2116, { width: 168, height: 224 }],
    [448, 800, { width: 125, height: 224 }],
    [224, 224, { width: 224, height: 224 }],
  ])('fits %s × %s without stretching', (width, height, expected) => {
    expect(calculateAspectPreservingResize(width, height)).toEqual(expected);
  });

  it('centers resized RGB pixels and fills both sides with float32 127.5', () => {
    const geometry = createLetterboxGeometry(2, 1);
    const source = new Uint8Array([10, 20, 30, 40, 50, 60]);
    const result = letterboxRgbPixels(source, 2, 1);
    const values = result.pixels;

    expect(geometry).toEqual({
      resizedWidth: 2,
      resizedHeight: 1,
      paddingLeft: 111,
      paddingTop: 111,
    });
    expect(result.geometry).toEqual(geometry);
    expect(Array.from(values.slice(0, 6))).toEqual([127.5, 127.5, 127.5, 127.5, 127.5, 127.5]);
    expect(Array.from(values.slice(pixelIndex(111, 111), pixelIndex(113, 111)))).toEqual([
      10,
      20,
      30,
      40,
      50,
      60,
    ]);
    expect(Array.from(values.slice(pixelIndex(113, 111), pixelIndex(114, 111)))).toEqual([
      127.5,
      127.5,
      127.5,
    ]);
  });
});
