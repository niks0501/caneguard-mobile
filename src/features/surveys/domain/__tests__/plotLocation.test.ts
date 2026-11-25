import { distanceToPlotMeters, isAtPlot, PLOT_LOCATION_TOLERANCE_METERS } from '@/features/surveys/domain/plotLocation';

// About 222 m square: 0.002 degrees of latitude is ~222.6 m, and of longitude ~216 m at 14 N.
const plot = [
  { latitude: 14, longitude: 121 },
  { latitude: 14, longitude: 121.002 },
  { latitude: 14.002, longitude: 121.002 },
  { latitude: 14.002, longitude: 121 },
];

describe('plot location', () => {
  // Intent: a location inside the plot is at the plot, whatever its tolerance.
  it('measures zero inside the plot', () => {
    expect(distanceToPlotMeters(plot, { latitude: 14.001, longitude: 121.001 })).toBe(0);
    expect(isAtPlot(plot, { latitude: 14.001, longitude: 121.001 })).toBe(true);
  });

  // Intent: outside, the distance is to the nearest edge, in metres: 0.001 degrees of latitude is ~111 m.
  it('measures the distance to the nearest edge from outside', () => {
    const north = distanceToPlotMeters(plot, { latitude: 14.003, longitude: 121.001 });
    expect(north).toBeGreaterThan(110);
    expect(north).toBeLessThan(113);
    const corner = distanceToPlotMeters(plot, { latitude: 14.003, longitude: 121.003 });
    expect(corner).toBeGreaterThan(north as number);
  });

  // Intent: GPS noise just outside the edge still counts as at the plot, but a different field does not.
  it('allows GPS noise near the edge and refuses a different field', () => {
    const justOutside = { latitude: 14.002 + 10 / 111_320, longitude: 121.001 };
    expect(isAtPlot(plot, justOutside)).toBe(true);
    const beyond = { latitude: 14.002 + (PLOT_LOCATION_TOLERANCE_METERS + 15) / 111_320, longitude: 121.001 };
    expect(isAtPlot(plot, beyond)).toBe(false);
    expect(isAtPlot(plot, { latitude: 14.2, longitude: 121.2 })).toBe(false);
  });

  it('has no answer for a plot with fewer than three points', () => {
    expect(distanceToPlotMeters(plot.slice(0, 2), { latitude: 14, longitude: 121 })).toBeNull();
    expect(isAtPlot([], { latitude: 14, longitude: 121 })).toBe(false);
  });
});
