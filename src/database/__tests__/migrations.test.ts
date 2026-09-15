import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { LEGACY_UNASSIGNED_OWNER_IDENTITY } from '@/database/ownerIdentity';
import migrationBundle from '../../../drizzle/migrations';

const migration0 = readMigration('0000_complex_johnny_blaze.sql');
const migration1 = readMigration('0001_loving_amazoness.sql');
const migration2 = readMigration('0002_talented_kat_farrell.sql');
const migration3 = readMigration('0003_careful_marauders.sql');
const migration4 = readMigration('0004_sour_namora.sql');
const migration5 = readMigration('0005_tricky_the_santerians.sql');
const migration6 = readMigration('0006_curvy_piledriver.sql');
const migration7 = readMigration('0007_familiar_old_lace.sql');
const migration8 = readMigration('0008_field_validation_assignments.sql');
const migration9 = readMigration('0009_scope_field_validation_assignment_cache_by_owner.sql');
const migration10 = readMigration('0010_numerous_princess_powerful.sql');
const migration11 = readMigration('0011_tidy_meteorite.sql');
const migration12 = readMigration('0012_dapper_sumo.sql');
const migration13 = readMigration('0013_v1_local_scan_migration.sql');
const migration14 = readMigration('0014_safe_songbird.sql');
const migrationJournal = migrationBundle.journal;

function readMigration(filename: string): string {
  return readFileSync(join(process.cwd(), 'drizzle', filename), 'utf8').replaceAll(
    '--> statement-breakpoint',
    '',
  );
}

function openDatabase(): DatabaseSync {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON');
  return database;
}

function applyLatest(database: DatabaseSync): void {
  database.exec(migration0);
  database.exec(migration1);
  database.exec(migration2);
  database.exec(migration3);
  database.exec(migration4);
  database.exec(migration5);
  database.exec(migration6);
  database.exec(migration7);
  database.exec(migration8);
  database.exec(migration9);
  database.exec(migration10);
  database.exec(migration11);
  database.exec(migration12);
  database.exec(migration13);
}

function insertScanRecord(
  database: DatabaseSync,
  id = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
): void {
  database
    .prepare(`
      INSERT INTO scan_records (
        id, managed_image_uri, image_source_type, predicted_label, confidence,
        checklist_consistency, model_version, preprocess_ms, inference_ms,
        total_ms, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      id,
      `file:///caneguard/scan-images/${id}.jpg`,
      'camera',
      'rust',
      0.8,
      'consistent',
      'v0.1-baseline',
      5,
      8,
      13,
      '2026-07-25T00:00:00.000Z',
      '2026-07-25T00:00:00.000Z',
    );
}

describe('CaneGuard database migrations', () => {
  it('initializes an empty database with the required tables and indexes', () => {
    const database = openDatabase();

    applyLatest(database);

    const tables = database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all()
      .map((row) => row.name);
    const indexes = database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'scan_records_%' ORDER BY name",
      )
      .all()
      .map((row) => row.name);

    expect(tables).toEqual([
      'compatibility_probe',
      'field_reports',
      'field_validation_assignments',
      'field_validation_completions',
      'notifications_cache',
      'scan_class_scores',
      'scan_quality_warnings',
      'scan_records',
      'scan_symptoms',
    ]);
    expect(indexes).toEqual([
      'scan_records_barangay_created_at_idx',
      'scan_records_created_at_idx',
      'scan_records_label_created_at_idx',
      'scan_records_owner_created_at_idx',
      'scan_records_remote_id_unique',
      'scan_records_sync_created_at_idx',
    ]);

    database.close();
  });

  it('adds Field Reports without changing existing scan evidence', () => {
    const database = openDatabase();
    database.exec(migration0);
    database.exec(migration1);
    insertScanRecord(database);

    const scanBefore = database
      .prepare(
        `SELECT id, managed_image_uri, image_source_type, predicted_label,
                confidence, checklist_consistency, reported_severity, barangay,
                model_version, preprocess_ms, inference_ms, total_ms, sync_status,
                remote_id, sync_attempt_count, last_sync_error_code,
                last_sync_attempt_at, last_synced_at, created_at, updated_at
           FROM scan_records WHERE id = ?`,
      )
      .get('2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2');

    database.exec(migration2);

    expect(
      database
        .prepare(
          `SELECT id, managed_image_uri, image_source_type, predicted_label,
                  confidence, checklist_consistency, reported_severity, barangay,
                  model_version, preprocess_ms, inference_ms, total_ms, sync_status,
                  remote_id, sync_attempt_count, last_sync_error_code,
                  last_sync_attempt_at, last_synced_at, created_at, updated_at
             FROM scan_records WHERE id = ?`,
        )
        .get('2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2'),
    ).toEqual(scanBefore);
    database.exec(migration7);
    expect(
      database
        .prepare(
          `SELECT id, managed_image_uri, image_source_type, predicted_label,
                  confidence, checklist_consistency, reported_severity, barangay,
                  model_version, preprocess_ms, inference_ms, total_ms, sync_status,
                  remote_id, sync_attempt_count, last_sync_error_code,
                  last_sync_attempt_at, last_synced_at, created_at, updated_at
             FROM scan_records WHERE id = ?`,
        )
        .get('2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2'),
    ).toEqual(scanBefore);
    expect(
      database
        .prepare(
          'SELECT submission_image_uri, submission_image_mime_type, submission_image_size_bytes FROM scan_records',
        )
        .get(),
    ).toEqual({
      submission_image_uri: null,
      submission_image_mime_type: null,
      submission_image_size_bytes: null,
    });
    expect(
      database.prepare('SELECT count(*) AS count FROM field_reports').get(),
    ).toEqual({ count: 0 });
    database.close();
  });

  it('quarantines pre-owner scan rows instead of assigning them to a future account', () => {
    const database = openDatabase();
    database.exec(migration0);
    database.exec(migration1);
    insertScanRecord(database);
    database.exec(migration2);
    database.exec(migration3);
    database.exec(migration4);
    database.exec(migration5);
    database.exec(migration6);
    database.exec(migration7);
    database.exec(migration8);
    database.exec(migration9);
    database.exec(migration10);
    database.exec(migration11);
    database.exec(migration12);

    expect(
      database.prepare('SELECT owner_identity FROM scan_records').get(),
    ).toEqual({ owner_identity: LEGACY_UNASSIGNED_OWNER_IDENTITY });
    database.close();
  });

  it('removes unsynchronized V0 scans and local reports while preserving synchronized server evidence', () => {
    const database = openDatabase();
    database.exec(migration0);
    database.exec(migration1);
    database.exec(migration2);
    database.exec(migration3);
    database.exec(migration4);
    database.exec(migration5);
    database.exec(migration6);
    database.exec(migration7);
    database.exec(migration8);
    database.exec(migration9);
    database.exec(migration10);
    database.exec(migration11);
    database.exec(migration12);

    const scanIds = {
      scanOnly: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
      draft: 'c863a5af-e9ad-44fe-a0dc-73f9d3436cac',
      pending: '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e',
      failed: 'd4f6c5e6-9c02-4d4e-8e8b-42e0c85df0fb',
      synchronized: '51214146-7439-48e0-aef4-d0e003f194b4',
    } as const;
    for (const id of Object.values(scanIds)) {
      insertScanRecord(database, id);
    }
    const timestamp = '2026-08-10T01:00:00.000Z';
    const report = database.prepare(`
      INSERT INTO field_reports (
        id, scan_record_id, authoring_state, observed_at, sync_status,
        remote_id, last_synced_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    report.run('report-draft', scanIds.draft, 'draft', timestamp, 'local_only', null, null, timestamp, timestamp);
    report.run('report-pending', scanIds.pending, 'finalized', timestamp, 'pending', null, null, timestamp, timestamp);
    report.run('report-failed', scanIds.failed, 'finalized', timestamp, 'failed', null, null, timestamp, timestamp);
    report.run('report-synced', scanIds.synchronized, 'finalized', timestamp, 'synced', 'remote-84', timestamp, timestamp, timestamp);

    database.exec(migration13);

    expect(
      database.prepare('SELECT id FROM scan_records ORDER BY id').all(),
    ).toEqual([{ id: scanIds.synchronized }]);
    expect(
      database.prepare('SELECT id, scan_record_id, sync_status, remote_id FROM field_reports').all(),
    ).toEqual([
      {
        id: 'report-synced',
        scan_record_id: scanIds.synchronized,
        sync_status: 'synced',
        remote_id: 'remote-84',
      },
    ]);
    expect(
      database.prepare('SELECT decision_support_wording FROM scan_records').get(),
    ).toEqual({
      decision_support_wording: 'Possible result only. This output does not confirm a disease.',
    });
    database.close();
  });

  it('adds GPS outcome provenance without changing existing Draft data', () => {
    const database = openDatabase();
    database.exec(migration0);
    database.exec(migration1);
    database.exec(migration2);
    insertScanRecord(database);
    database
      .prepare(`
        INSERT INTO field_reports (
          id, scan_record_id, farmer_or_farm_owner_name, barangay,
          submitter_identity, submitter_role, observed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e',
        '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
        'Maria Santos',
        'Lumbangan',
        'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17',
        'field_reporter',
        '2026-07-25T00:00:00.000Z',
        '2026-08-10T01:00:00.000Z',
        '2026-08-10T01:05:00.000Z',
      );

    database.exec(migration3);

    const reportBefore = database
      .prepare('SELECT * FROM field_reports WHERE id = ?')
      .get('7ea3e6f0-b893-4fd3-b414-0b797e62ec8e');
    if (!reportBefore) {
      throw new Error('Expected the seeded Field Report before migration 4.');
    }

    database.exec(migration4);

    expect(
      database
        .prepare(`
          SELECT farmer_or_farm_owner_name, barangay, submitter_identity,
                 gps_capture_outcome, gps_outcome_recorded_at,
                 authority_status_raw, authority_feedback, authority_updated_at
          FROM field_reports
        `)
        .get(),
    ).toEqual({
      farmer_or_farm_owner_name: 'Maria Santos',
      barangay: 'Lumbangan',
      submitter_identity: 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17',
      gps_capture_outcome: null,
      gps_outcome_recorded_at: null,
      authority_status_raw: null,
      authority_feedback: null,
      authority_updated_at: null,
    });
    const reportAfter = database
      .prepare('SELECT * FROM field_reports WHERE id = ?')
      .get('7ea3e6f0-b893-4fd3-b414-0b797e62ec8e');
    if (!reportAfter) {
      throw new Error('Expected the seeded Field Report after migration 4.');
    }
    for (const key of Object.keys(reportBefore)) {
      expect(reportAfter[key]).toEqual(reportBefore[key]);
    }
    database.close();
  });

  it('enforces the zero-or-one Field Report relationship', () => {
    const database = openDatabase();
    applyLatest(database);
    insertScanRecord(database);

    const insertReport = database.prepare(`
      INSERT INTO field_reports (
        id, scan_record_id, observed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?)
    `);
    const timestamp = '2026-07-25T00:00:00.000Z';

    expect(() =>
      insertReport.run(
        '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e',
        'missing-scan',
        timestamp,
        timestamp,
        timestamp,
      ),
    ).toThrow();

    insertReport.run(
      '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e',
      '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
      timestamp,
      timestamp,
      timestamp,
    );

    expect(() =>
      insertReport.run(
        '51214146-7439-48e0-aef4-d0e003f194b4',
        '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
        timestamp,
        timestamp,
        timestamp,
      ),
    ).toThrow();
    expect(
      database
        .prepare(
          'SELECT id, scan_record_id, authoring_state, sync_status FROM field_reports',
        )
        .get(),
    ).toEqual({
      id: '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e',
      scan_record_id: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
      authoring_state: 'draft',
      sync_status: 'local_only',
    });
    database.close();
  });

  it('upgrades the Phase 0 database without deleting its seeded probe', () => {
    const database = openDatabase();
    database.exec(migration0);
    database
      .prepare('INSERT INTO compatibility_probe (id, created_at) VALUES (?, ?)')
      .run(1, '2026-07-25T00:00:00.000Z');

    database.exec(migration1);

    expect(
      database.prepare('SELECT id, created_at FROM compatibility_probe').get(),
    ).toEqual({
      id: 1,
      created_at: '2026-07-25T00:00:00.000Z',
    });
    expect(
      database
        .prepare(
          "SELECT count(*) AS count FROM sqlite_master WHERE type = 'table' AND name = 'scan_records'",
        )
        .get(),
    ).toEqual({ count: 1 });

    database.close();
  });

  it('enforces value constraints and cascades child rows', () => {
    const database = openDatabase();
    applyLatest(database);

    const insertRecord = database.prepare(`
      INSERT INTO scan_records (
        id, managed_image_uri, image_source_type, predicted_label, confidence,
        checklist_consistency, model_version, preprocess_ms, inference_ms,
        total_ms, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const values = [
      '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
      'file:///caneguard/scan-images/2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2.jpg',
      'camera',
      'rust',
      0.8,
      'consistent',
      'v0.1-baseline',
      5,
      8,
      13,
      '2026-07-25T00:00:00.000Z',
      '2026-07-25T00:00:00.000Z',
    ] as const;

    insertRecord.run(...values);
    database
      .prepare(
        'INSERT INTO scan_class_scores (scan_record_id, label, score) VALUES (?, ?, ?)',
      )
      .run(values[0], 'rust', 0.8);

    expect(() =>
      insertRecord.run(
        values[0],
        values[1],
        values[2],
        values[3],
        1.1,
        values[5],
        values[6],
        values[7],
        values[8],
        values[9],
        values[10],
        values[11],
      ),
    ).toThrow();

    database.prepare('DELETE FROM scan_records WHERE id = ?').run(values[0]);

    expect(
      database.prepare('SELECT count(*) AS count FROM scan_class_scores').get(),
    ).toEqual({ count: 0 });
    database.close();
  });

  it('keeps the bundled migration module aligned with the journal and SQL files', () => {
    const consumedMigrations = migrationJournal.entries.map((entry) => {
      const key = `m${String(entry.idx).padStart(4, '0')}`;
      const sql = migrationBundle.migrations[key];

      expect(typeof sql).toBe('string');
      return {
        sql: sql.replaceAll('--> statement-breakpoint', ''),
        tag: entry.tag,
      };
    });

    expect(consumedMigrations.map(({ tag }) => tag)).toEqual([
      '0000_complex_johnny_blaze',
      '0001_loving_amazoness',
      '0002_talented_kat_farrell',
      '0003_careful_marauders',
      '0004_sour_namora',
      '0005_tricky_the_santerians',
      '0006_curvy_piledriver',
      '0007_familiar_old_lace',
      '0008_field_validation_assignments',
      '0009_scope_field_validation_assignment_cache_by_owner',
      '0010_numerous_princess_powerful',
      '0011_tidy_meteorite',
      '0012_dapper_sumo',
      '0013_v1_local_scan_migration',
      '0014_safe_songbird',
    ]);
    expect(Object.keys(migrationBundle.migrations)).toEqual([
      'm0000',
      'm0001',
      'm0002',
      'm0003',
      'm0004',
      'm0005',
      'm0006',
      'm0007',
      'm0008',
      'm0009',
      'm0010',
      'm0011',
      'm0012',
      'm0013',
      'm0014',
    ]);
    expect(consumedMigrations.map(({ sql }) => sql)).toEqual([
      migration0,
      migration1,
      migration2,
      migration3,
      migration4,
      migration5,
      migration6,
      migration7,
      migration8,
      migration9,
      migration10,
      migration11,
      migration12,
      migration13,
      migration14,
    ]);
  });
});
