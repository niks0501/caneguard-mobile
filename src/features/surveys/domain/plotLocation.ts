export interface PlotPoint {
  latitude: number;
  longitude: number;
}

/**
 * A phone fix can sit a little outside the true plot edge, so a location counts as "at" a plot
 * when it is inside it or within this many metres of it.
 */
export const PLOT_LOCATION_TOLERANCE_METERS = 25;

const METERS_PER_DEGREE_LATITUDE = 111_320;

function isInside(plot: PlotPoint[], point: PlotPoint): boolean {
  let inside = false;
  for (let index = 0, previous = plot.length - 1; index < plot.length; previous = index++) {
    const a = plot[index];
    const b = plot[previous];
    const crosses = (a.latitude > point.latitude) !== (b.latitude > point.latitude)
      && point.longitude < ((b.longitude - a.longitude) * (point.latitude - a.latitude)) / (b.latitude - a.latitude) + a.longitude;
    if (crosses) inside = !inside;
  }
  return inside;
}

/** Metres from a point to the nearest plot edge, measured on a flat local grid (fine at plot scale). */
function distanceToEdgeMeters(plot: PlotPoint[], point: PlotPoint): number {
  const metersPerDegreeLongitude = METERS_PER_DEGREE_LATITUDE * Math.cos((point.latitude * Math.PI) / 180);
  const toXY = (p: PlotPoint) => ({
    x: (p.longitude - point.longitude) * metersPerDegreeLongitude,
    y: (p.latitude - point.latitude) * METERS_PER_DEGREE_LATITUDE,
  });
  let nearest = Infinity;
  for (let index = 0; index < plot.length; index += 1) {
    const a = toXY(plot[index]);
    const b = toXY(plot[(index + 1) % plot.length]);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;
    // The point is the origin, so the closest spot on the edge is found by projecting the origin onto it.
    const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / lengthSquared));
    nearest = Math.min(nearest, Math.hypot(a.x + t * dx, a.y + t * dy));
  }
  return nearest;
}

/** Metres from a location to a plot: 0 inside it, otherwise the distance to its edge; null for a plot with under three points. */
export function distanceToPlotMeters(plot: PlotPoint[], point: PlotPoint): number | null {
  if (plot.length < 3) return null;
  return isInside(plot, point) ? 0 : distanceToEdgeMeters(plot, point);
}

/** True when the location is inside the plot or within the GPS tolerance of its edge. */
export function isAtPlot(plot: PlotPoint[], point: PlotPoint): boolean {
  const distance = distanceToPlotMeters(plot, point);
  return distance !== null && distance <= PLOT_LOCATION_TOLERANCE_METERS;
}
