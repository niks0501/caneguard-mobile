import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const migration0 = readMigration('0000_complex_johnny_blaze.sql');
const migration1 = readMigration('0001_loving_amazoness.sql');
const migrationJournal = JSON.parse(
  readFileSync(join(process.cwd(), 'drizzle', 'meta', '_journal.json'), 'utf8'),
) as { entries: { tag: string }[] };

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
      'scan_class_scores',
      'scan_quality_warnings',
      'scan_records',
      'scan_symptoms',
    ]);
    expect(indexes).toEqual([
      'scan_records_barangay_created_at_idx',
      'scan_records_created_at_idx',
      'scan_records_label_created_at_idx',
      'scan_records_remote_id_unique',
      'scan_records_sync_created_at_idx',
    ]);

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
    const bundleSource = readFileSync(
      join(process.cwd(), 'drizzle', 'migrations.js'),
      'utf8',
    );
    const tags = migrationJournal.entries.map((entry) => entry.tag);

    expect(tags).toEqual([
      '0000_complex_johnny_blaze',
      '0001_loving_amazoness',
    ]);
    for (const [index, tag] of tags.entries()) {
      expect(bundleSource).toContain(`import m000${index} from './${tag}.sql'`);
      expect(bundleSource).toContain(`m000${index}`);
      expect(readMigration(`${tag}.sql`).length).toBeGreaterThan(100);
    }
  });
});
