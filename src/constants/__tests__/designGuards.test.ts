import { Colors, Typography } from '@/constants/theme';

function relLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(color1: string, color2: string): number {
  const l1 = relLuminance(color1);
  const l2 = relLuminance(color2);
  const top = Math.max(l1, l2);
  const bottom = Math.min(l1, l2);
  return (top + 0.05) / (bottom + 0.05);
}

describe('Design spine static guards', () => {
  it('guarantees WCAG AA compliant contrast for semantic pairs in both light and dark themes', () => {
    for (const themeKey of ['light', 'dark'] as const) {
      const palette = Colors[themeKey];

      // Text contrast on background & surface
      expect(contrastRatio(palette.text, palette.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(palette.textSecondary, palette.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(palette.text, palette.surfaceElevated)).toBeGreaterThanOrEqual(4.5);

      // Status pairings on their background containers
      expect(contrastRatio(palette.success, palette.successBg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(palette.warning, palette.warningBg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(palette.danger, palette.dangerBg)).toBeGreaterThanOrEqual(4.5);

      // OnPrimary on primary button/badge
      expect(contrastRatio(palette.onPrimary, palette.primary)).toBeGreaterThanOrEqual(4.5);

      // Guide icon on warning background
      expect(contrastRatio(palette.guideIcon, palette.warningBg)).toBeGreaterThanOrEqual(4.5);

      // Disease state pills
      expect(contrastRatio(palette.healthy, palette.healthyBg)).toBeGreaterThanOrEqual(3.0);
      expect(contrastRatio(palette.smut, palette.smutBg)).toBeGreaterThanOrEqual(3.0);
      expect(contrastRatio(palette.mosaic, palette.mosaicBg)).toBeGreaterThanOrEqual(3.0);
      expect(contrastRatio(palette.rust, palette.rustBg)).toBeGreaterThanOrEqual(3.0);
    }
  });

  it('guarantees a 12px floor for all typography scale entries', () => {
    for (const value of Object.values(Typography)) {
      expect(value.fontSize).toBeGreaterThanOrEqual(12);
    }
  });
});
