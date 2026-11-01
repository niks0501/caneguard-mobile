import { photoPanBounds } from '@/features/field-guide/domain/photoPanBounds';

describe('photoPanBounds', () => {
  const VIEWPORT_WIDTH = 360;
  const VIEWPORT_HEIGHT = 436;

  it('clamps the letterboxed axis to the contain-fitted image, not the viewport', () => {
    // A 1080x1440 photo fits 327 points wide in this viewport and fills its
    // height. At 2x the image only tolerates (654 - 360) / 2 = 147 points of
    // horizontal travel; the viewport width alone would wrongly allow 180.
    const bounds = photoPanBounds(2, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, 1080, 1440);
    expect(bounds.x).toBeCloseTo(147);
    expect(bounds.y).toBeCloseTo(218);
  });

  it('keeps the fitted axis exact at every zoom level', () => {
    const bounds = photoPanBounds(4, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, 1080, 1440);
    expect(bounds.x).toBeCloseTo(474);
    expect(bounds.y).toBeCloseTo(654);
  });

  it('does not allow travel while the whole photo fits without overflow', () => {
    expect(photoPanBounds(1, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, 1080, 1440)).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('returns zero bounds before the viewport or image size is known', () => {
    expect(photoPanBounds(2, 0, VIEWPORT_HEIGHT, 1080, 1440)).toEqual({ x: 0, y: 0 });
    expect(photoPanBounds(2, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, 0, 0)).toEqual({ x: 0, y: 0 });
  });
});
