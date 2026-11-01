import { Colors } from '@/constants/theme';

function luminance(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const channel = (start: number) => {
    const c = parseInt(hex.slice(start, start + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('Phase 0 legibility contrast', () => {
  it.each(['light', 'dark'] as const)('keeps secondary text at 4.5:1 on every surface in %s', (mode) => {
    const palette = Colors[mode];
    for (const surface of [palette.background, palette.surface, palette.surfaceMuted, palette.surfaceElevated]) {
      expect(contrast(palette.textSecondary, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(['light', 'dark'] as const)('keeps rust and mosaic pill text at 4.5:1 in %s', (mode) => {
    const palette = Colors[mode];
    expect(contrast(palette.rust, palette.rustBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette.mosaic, palette.mosaicBg)).toBeGreaterThanOrEqual(4.5);
  });
});
