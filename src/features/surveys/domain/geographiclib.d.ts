declare module 'geographiclib-geodesic/geographiclib-geodesic.min.js' {
  interface PolygonArea {
    AddPoint(latitude: number, longitude: number): void;
    Compute(reverse: boolean, sign: boolean): { area?: number; number: number; perimeter: number };
  }
  interface GeodesicModel {
    Polygon(polyline?: boolean): PolygonArea;
  }
  const GeographicLib: { Geodesic: { WGS84: GeodesicModel } };
  export default GeographicLib;
}
