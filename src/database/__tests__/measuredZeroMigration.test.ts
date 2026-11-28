import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import migrationBundle from '../../../drizzle/migrations';

const SCAN_IDS = ['2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2', '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e', '51214146-7439-48e0-aef4-d0e003f194b4'];
const OWNER = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const STAMP = '2026-08-10T01:00:00.000Z';

function sql(filename: string): string {
  return readFileSync(join(process.cwd(), 'drizzle', filename), 'utf8').replaceAll('--> statement-breakpoint', '');
}

function migrateThrough042(): DatabaseSync {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON');
  for (const entry of migrationBundle.journal.entries) {
    if (entry.idx > 42) break;
    database.exec(migrationBundle.migrations[`m${String(entry.idx).padStart(4, '0')}`].replaceAll('--> statement-breakpoint', ''));
  }
  const insertScan = database.prepare(`
    INSERT INTO scan_records (
      id, owner_identity, managed_image_uri, image_source_type, predicted_label, confidence,
      checklist_consistency, model_version, preprocess_ms, inference_ms, total_ms, source_width, source_height, created_at, updated_at
    ) VALUES (?, ?, ?, 'camera', 'rust', 0.8, 'consistent', 'v1.0-mobilenetv2', 5, 8, 13, 1200, 900, ?, ?)
  `);
  for (const id of SCAN_IDS) insertScan.run(id, OWNER, `file:///caneguard/scan-images/${id}.jpg`, STAMP, STAMP);
  return database;
}

describe('measured-zero and plot-area migration (0043)', () => {
  // AC-6: older stored rows survive the table rebuild, read as before, and gain empty new columns.
  it('keeps existing report and survey rows intact and adds empty plot and measurement columns', () => {
    const database = migrateThrough042();
    const insertReport = database.prepare(`
      INSERT INTO field_reports (
        id, scan_record_id, authoring_state, submitter_identity, submitter_role, barangay, farmer_or_farm_owner_name,
        affected_area_hectares, affected_area_measurement, affected_portion_percent, affected_portion_measurement,
        field_survey_client_uuid, sync_status, remote_id, observed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'field_reporter', 'Wawa', 'Maria Santos', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    // Measured, legacy (no provenance) and not-measured rows, one of them a synced report.
    insertReport.run('report-measured', SCAN_IDS[0], 'draft', OWNER, 1.25, 'measured', 40, 'measured', 'survey-1', 'local_only', null, STAMP, STAMP, STAMP);
    insertReport.run('report-legacy', SCAN_IDS[1], 'draft', OWNER, 2, null, null, null, null, 'local_only', null, STAMP, STAMP, STAMP);
    insertReport.run('report-synced', SCAN_IDS[2], 'finalized', OWNER, null, 'not_measured', null, 'not_measured', null, 'synced', 'remote-9', STAMP, STAMP, STAMP);
    database.prepare(`
      INSERT INTO field_surveys (client_uuid, owner_identity, district_code, waypoints_json, polygon_json, area_sqm,
        affected_area_polygons_json, affected_area_sqm, captured_at, status, created_at, updated_at)
      VALUES ('survey-1', ?, 'D-01', '[]', '{"type":"Polygon","coordinates":[]}', 12003, '[]', 0, ?, 'pending', ?, ?)
    `).run(OWNER, STAMP, STAMP, STAMP);
    const before = database.prepare('SELECT * FROM field_reports ORDER BY id').all();

    database.exec(sql('0043_measured_zero_plot_area.sql'));

    const after = database.prepare('SELECT * FROM field_reports ORDER BY id').all() as Record<string, unknown>[];
    expect(after).toHaveLength(3);
    // Every earlier column keeps its value; the two new columns start empty.
    after.forEach((row, index) => {
      const { plot_area_hectares: plot, plot_area_measurement: plotMeasurement, ...rest } = row;
      expect(plot).toBeNull();
      expect(plotMeasurement).toBeNull();
      expect(rest).toEqual(before[index]);
    });
    // An older stored 0 for a plot-only survey is left exactly as it was; the app reads it as not measured.
    expect(database.prepare('SELECT affected_area_sqm, affected_area_measurement FROM field_surveys').get()).toEqual({
      affected_area_sqm: 0,
      affected_area_measurement: null,
    });
    // The rebuilt table keeps its indexes and the scan link.
    const indexes = (database.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'field_reports'").all() as { name: string }[]).map(({ name }) => name);
    expect(indexes).toEqual(expect.arrayContaining(['field_reports_scan_record_id_unique', 'field_reports_remote_id_unique', 'field_reports_authority_reference_code_idx']));
    database.close();
  });

  // AC-4(b): a measured zero is storable; the other measurement rules still hold.
  it('accepts a measured zero affected area and still refuses a negative one or an unpaired plot area', () => {
    const database = migrateThrough042();
    database.exec(sql('0043_measured_zero_plot_area.sql'));
    database.prepare(`INSERT INTO field_reports (id, scan_record_id, observed_at, created_at, updated_at) VALUES ('r1', ?, ?, ?, ?)`).run(SCAN_IDS[0], STAMP, STAMP, STAMP);
    const update = database.prepare('UPDATE field_reports SET affected_area_hectares = ?, affected_area_measurement = ? WHERE id = ?');

    expect(() => update.run(0, 'measured', 'r1')).not.toThrow();
    expect(() => update.run(0.004, 'measured', 'r1')).not.toThrow();
    expect(database.prepare('SELECT affected_area_hectares FROM field_reports WHERE id = ?').get('r1')).toEqual({ affected_area_hectares: 0.004 });
    expect(() => update.run(-0.1, 'measured', 'r1')).toThrow(/CHECK constraint failed/);
    // Not measured still means no number, even 0.
    expect(() => update.run(0, 'not_measured', 'r1')).toThrow(/CHECK constraint failed/);

    const plot = database.prepare('UPDATE field_reports SET plot_area_hectares = ?, plot_area_measurement = ? WHERE id = ?');
    expect(() => plot.run(1.2, 'measured', 'r1')).not.toThrow();
    expect(() => plot.run(0, 'measured', 'r1')).toThrow(/CHECK constraint failed/);
    expect(() => plot.run(1.2, 'not_measured', 'r1')).toThrow(/CHECK constraint failed/);
    expect(() => plot.run(null, 'measured', 'r1')).toThrow(/CHECK constraint failed/);
    database.close();
  });

  it('deleting a scan still removes its report after the rebuild', () => {
    const database = migrateThrough042();
    database.exec(sql('0043_measured_zero_plot_area.sql'));
    database.prepare(`INSERT INTO field_reports (id, scan_record_id, observed_at, created_at, updated_at) VALUES ('r1', ?, ?, ?, ?)`).run(SCAN_IDS[0], STAMP, STAMP, STAMP);
    database.prepare('DELETE FROM scan_records WHERE id = ?').run(SCAN_IDS[0]);
    expect(database.prepare('SELECT COUNT(*) AS n FROM field_reports').get()).toEqual({ n: 0 });
    database.close();
  });
});
