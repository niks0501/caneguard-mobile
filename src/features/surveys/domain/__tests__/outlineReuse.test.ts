import type { FieldSurveyRow } from '@/database/schema';
import type { SurveyPolygon, SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';
import { outlineSourceId, reusableOutlines, waypointsFromOutline } from '@/features/surveys/domain/outlineReuse';

const at = '2026-01-01T00:00:00.000Z';
const square: SurveyWaypoint[] = [
  { latitude: 14, longitude: 121, accuracyMeters: 4, capturedAt: at, source: 'gps' },
  { latitude: 14, longitude: 121.002, accuracyMeters: 4, capturedAt: at, source: 'gps' },
  { latitude: 14.002, longitude: 121.002, accuracyMeters: 4, capturedAt: at, source: 'gps' },
  { latitude: 14.002, longitude: 121, accuracyMeters: 4, capturedAt: at, source: 'gps' },
];
const polygon: SurveyPolygon = {
  type: 'Polygon',
  coordinates: [[[121, 14], [121.002, 14], [121.002, 14.002], [121, 14.002], [121, 14]]],
};

function row(overrides: Partial<FieldSurveyRow>): FieldSurveyRow {
  return { clientUuid: 'a', label: null, remoteId: null, waypointsJson: JSON.stringify(square), ...overrides } as FieldSurveyRow;
}

describe('waypointsFromOutline', () => {
  // Intent: reusing an outline copies the plot corners as hand-placed points, without the closing repeat.
  it('turns a closed polygon into map-drawn plot points', () => {
    const waypoints = waypointsFromOutline(polygon, at);
    expect(waypoints).toHaveLength(4);
    expect(waypoints?.[0]).toEqual({ latitude: 14, longitude: 121, accuracyMeters: null, capturedAt: at, source: 'map' });
  });

  it('refuses a polygon that is not a usable plot', () => {
    expect(waypointsFromOutline({ type: 'Polygon', coordinates: [[[121, 14], [121.1, 14], [121, 14]]] }, at)).toBeNull();
    expect(waypointsFromOutline({ type: 'Polygon', coordinates: [] }, at)).toBeNull();
  });
});

describe('reusableOutlines', () => {
  // Intent: only the inspector's own measurable plots are offered, never the one being drawn, capped and in order.
  it('offers measurable earlier maps with their name, size and office id', () => {
    const outlines = reusableOutlines([
      row({ clientUuid: 'current' }),
      row({ clientUuid: 'named', label: ' North lot ', remoteId: '41' }),
      row({ clientUuid: 'broken', waypointsJson: 'not json' }),
      row({ clientUuid: 'tiny', waypointsJson: JSON.stringify(square.slice(0, 2)) }),
      row({ clientUuid: 'plain' }),
    ], 'current');

    expect(outlines.map((outline) => outline.clientUuid)).toEqual(['named', 'plain']);
    expect(outlines[0]).toMatchObject({ name: 'North lot', remoteId: '41', hectares: '4.78' });
    expect(outlines[1]).toMatchObject({ name: null, remoteId: null });
  });

  it('stops at the limit', () => {
    const rows = Array.from({ length: 9 }, (_, index) => row({ clientUuid: `m${index}` }));
    expect(reusableOutlines(rows, 'none')).toHaveLength(5);
    expect(reusableOutlines(rows, 'none', 2)).toHaveLength(2);
  });
});

describe('outlineSourceId', () => {
  it('reads the office id as a number only when it is a positive whole number', () => {
    expect(outlineSourceId('41')).toBe(41);
    expect(outlineSourceId('0')).toBeNull();
    expect(outlineSourceId('4.1')).toBeNull();
    expect(outlineSourceId('abc')).toBeNull();
    expect(outlineSourceId(null)).toBeNull();
  });
});
