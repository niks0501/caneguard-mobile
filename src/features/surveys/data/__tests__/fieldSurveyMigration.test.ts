import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

describe('field survey affected-area migration', () => {
  it('preserves existing plot survey rows while adding optional affected-area provenance columns', () => {
    const database = new DatabaseSync(':memory:');
    database.exec(readFileSync('drizzle/0019_add_field_surveys.sql', 'utf8').replaceAll('--> statement-breakpoint', ''));
    database.prepare(`
      INSERT INTO field_surveys (
        client_uuid, owner_identity, district_code, waypoints_json, polygon_json,
        area_sqm, captured_at, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'legacy-survey', 'owner-1', 'D-01', '[]', '{"type":"Polygon","coordinates":[]}',
      1250, '2026-10-01T12:00:00.000Z', 'pending', '2026-10-01T12:00:00.000Z', '2026-10-01T12:00:00.000Z',
    );

    for (const migration of ['0021_field_survey_affected_areas.sql', '0022_peaceful_titania.sql', '0023_affected_area_waypoints.sql', '0024_active_affected_waypoints.sql']) {
      database.exec(readFileSync(`drizzle/${migration}`, 'utf8').replaceAll('--> statement-breakpoint', ''));
    }

    expect(database.prepare('SELECT client_uuid, polygon_json, area_sqm, affected_area_polygons_json, affected_area_sqm, measurement_provenance_json, affected_area_waypoints_json, active_affected_waypoints_json FROM field_surveys WHERE client_uuid = ?').get('legacy-survey')).toEqual({
      client_uuid: 'legacy-survey',
      polygon_json: '{"type":"Polygon","coordinates":[]}',
      area_sqm: 1250,
      affected_area_polygons_json: null,
      affected_area_sqm: null,
      measurement_provenance_json: null,
      affected_area_waypoints_json: null,
      active_affected_waypoints_json: null,
    });
    database.close();
  });
});
