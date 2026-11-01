export type PhotoPanBounds = {
  x: number;
  y: number;
};

/**
 * Pan limits for a `contain`-fitted photo at the given zoom.
 *
 * The fitted image rect is derived from the measured viewport and the image's
 * natural size, so the limit is the overflow of the scaled image past the
 * viewport on each axis. It is never negative: a letterboxed photo cannot be
 * dragged away from its centred position at that zoom.
 */
export function photoPanBounds(
  scale: number,
  viewportWidth: number,
  viewportHeight: number,
  imageWidth: number,
  imageHeight: number,
): PhotoPanBounds {
  'worklet';
  if (
    scale <= 1 ||
    viewportWidth <= 0 ||
    viewportHeight <= 0 ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return { x: 0, y: 0 };
  }

  const fit = Math.min(viewportWidth / imageWidth, viewportHeight / imageHeight);
  return {
    x: Math.max(0, (scale * imageWidth * fit - viewportWidth) / 2),
    y: Math.max(0, (scale * imageHeight * fit - viewportHeight) / 2),
  };
}
