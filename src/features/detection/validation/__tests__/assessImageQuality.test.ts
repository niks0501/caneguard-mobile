import { assessImageQuality } from '@/features/detection/validation/assessImageQuality';

function rgbPixels(luminances: readonly number[]): Uint8Array {
  return Uint8Array.from(
    luminances.flatMap((value) => [value, value, value]),
  );
}

describe('assessImageQuality', () => {
  it('returns luminance metrics without warnings for a usable image', () => {
    const assessment = assessImageQuality(
      rgbPixels([60, 100, 140, 180, 200]),
      { width: 1920, height: 1080 },
    );

    expect(assessment.warnings).toEqual([]);
    expect(assessment.meanLuminance).toBeCloseTo(136);
    expect(assessment.luminanceStandardDeviation).toBeGreaterThan(25);
  });

  it('warns about low resolution independently of pixel values', () => {
    const assessment = assessImageQuality(
      rgbPixels([40, 100, 160, 220]),
      { width: 448, height: 800 },
    );

    expect(assessment.warnings).toEqual(['low-resolution']);
  });

  it.each([
    ['dark', 20, ['too-dark', 'low-contrast']],
    ['bright', 240, ['too-bright', 'low-contrast']],
    ['flat', 120, ['low-contrast']],
  ])('flags a %s image', (_name, value, warnings) => {
    const assessment = assessImageQuality(
      rgbPixels([value, value, value, value]),
      { width: 1024, height: 768 },
    );

    expect(assessment.warnings).toEqual(warnings);
  });

  it('does not invent a resolution warning when source dimensions are unavailable', () => {
    const assessment = assessImageQuality(
      rgbPixels([40, 100, 160, 220]),
      { width: null, height: null },
    );

    expect(assessment.warnings).not.toContain('low-resolution');
  });
});
