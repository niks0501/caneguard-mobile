declare module 'geographiclib-geodesic/geographiclib-geodesic.min.js' {
  interface PolygonArea {
    AddPoint(latitude: number, longitude: number): void;
    Compute(reverse: boolean, sign: boolean): { area?: number; number: number; perimeter: number };
  }
  interface GeodesicModel {
    Inverse(lat1: number, lon1: number, lat2: number, lon2: number): { s12?: number };
    Polygon(polyline?: boolean): PolygonArea;
  }
  const GeographicLib: { Geodesic: { WGS84: GeodesicModel } };
  export default GeographicLib;
}
