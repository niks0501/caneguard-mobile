import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { performance } from 'node:perf_hooks';

const RECORD_COUNT = 5_000;
const migrationFiles = [
  '0000_complex_johnny_blaze.sql',
  '0001_loving_amazoness.sql',
];

function readMigration(filename) {
  return readFileSync(join(process.cwd(), 'drizzle', filename), 'utf8').replaceAll(
    '--> statement-breakpoint',
    '',
  );
}

function measure(operation) {
  const startedAt = performance.now();
  const value = operation();
  return { durationMs: performance.now() - startedAt, value };
}

const database = new DatabaseSync(':memory:');
database.exec('PRAGMA foreign_keys = ON');

const migration = measure(() => {
  for (const filename of migrationFiles) {
    database.exec(readMigration(filename));
  }
});

const insertRecord = database.prepare(`
  INSERT INTO scan_records (
    id, managed_image_uri, image_mime_type, image_size_bytes,
    image_source_type, source_width, source_height, predicted_label,
    confidence, checklist_consistency, reported_severity, barangay,
    model_version, preprocess_ms, inference_ms, total_ms, sync_status,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertScore = database.prepare(`
  INSERT INTO scan_class_scores (scan_record_id, label, score)
  VALUES (?, ?, ?)
`);
const insertSymptom = database.prepare(`
  INSERT INTO scan_symptoms (scan_record_id, symptom_key)
  VALUES (?, ?)
`);
const insertWarning = database.prepare(`
  INSERT INTO scan_quality_warnings (scan_record_id, warning_key)
  VALUES (?, ?)
`);

const seed = measure(() => {
  database.exec('BEGIN');
  try {
    for (let index = 0; index < RECORD_COUNT; index += 1) {
      const id = `2b4666c0-ad10-4d0d-a233-${index.toString(16).padStart(12, '0')}`;
      const predictedLabel = ['healthy', 'mosaic', 'rust'][index % 3];
      const confidence = 0.35 + (index % 61) / 100;
      const timestamp = new Date(
        Date.UTC(2024, 0, 1) + index * 60_000,
      ).toISOString();

      insertRecord.run(
        id,
        `file:///documents/caneguard/scan-images/${id}.jpg`,
        'image/jpeg',
        250_000 + (index % 100_000),
        index % 2 ? 'camera' : 'gallery',
        1280,
        960,
        predictedLabel,
        confidence,
        index % 4 ? 'consistent' : 'not-enough-information',
        index % 5 ? 'Mild' : null,
        index % 7 ? null : `Barangay ${index % 25}`,
        'v0.1-baseline',
        4.25,
        8.5,
        12.75,
        'local_only',
        timestamp,
        timestamp,
      );
      insertScore.run(id, 'healthy', predictedLabel === 'healthy' ? confidence : 0.1);
      insertScore.run(id, 'mosaic', predictedLabel === 'mosaic' ? confidence : 0.1);
      insertScore.run(id, 'rust', predictedLabel === 'rust' ? confidence : 0.1);
      if (index % 4) {
        insertSymptom.run(id, predictedLabel === 'healthy' ? 'none' : predictedLabel);
      }
      if (index % 5 === 0) {
        insertWarning.run(id, 'too-dark');
      }
    }
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
});

const page = measure(() =>
  database
    .prepare(`
      SELECT id, managed_image_uri, predicted_label, confidence, barangay,
             sync_status, created_at
      FROM scan_records
      ORDER BY created_at DESC
      LIMIT 50
    `)
    .all(),
);

const report = measure(() => {
  const totals = database
    .prepare(`
      SELECT
        count(*) AS total_saved_scans,
        sum(CASE WHEN predicted_label = 'healthy' THEN 1 ELSE 0 END) AS healthy,
        sum(CASE WHEN predicted_label <> 'healthy' THEN 1 ELSE 0 END) AS possible_disease,
        sum(CASE WHEN sync_status = 'local_only' THEN 1 ELSE 0 END) AS local_only,
        sum(CASE WHEN confidence < 0.5 THEN 1 ELSE 0 END) AS low_score
      FROM scan_records
    `)
    .get();
  const grouped = database
    .prepare(`
      SELECT predicted_label, count(*) AS count
      FROM scan_records
      GROUP BY predicted_label
      ORDER BY count DESC, predicted_label ASC
    `)
    .all();
  return { totals, grouped };
});

const saveTransaction = measure(() => {
  const id = '2b4666c0-ad10-4d0d-a233-ffffffffffff';
  const timestamp = new Date().toISOString();
  database.exec('BEGIN');
  try {
    insertRecord.run(
      id,
      `file:///documents/caneguard/scan-images/${id}.jpg`,
      'image/jpeg',
      300_000,
      'camera',
      1280,
      960,
      'rust',
      0.82,
      'consistent',
      'Moderate',
      null,
      'v0.1-baseline',
      4.25,
      8.5,
      12.75,
      'local_only',
      timestamp,
      timestamp,
    );
    insertScore.run(id, 'healthy', 0.05);
    insertScore.run(id, 'mosaic', 0.13);
    insertScore.run(id, 'rust', 0.82);
    insertSymptom.run(id, 'rust');
    insertWarning.run(id, 'too-dark');
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
});

const pagePlan = database
  .prepare(`
    EXPLAIN QUERY PLAN
    SELECT id FROM scan_records
    ORDER BY created_at DESC
    LIMIT 50
  `)
  .all();

const result = {
  environment: {
    runtime: process.version,
    sqlite: database.prepare('SELECT sqlite_version() AS version').get().version,
    storage: 'in-memory Node SQLite; not Android or Expo SQLite',
  },
  fixture: {
    records: RECORD_COUNT,
    classScores: RECORD_COUNT * 3,
    mixedSymptoms: true,
    mixedQualityWarnings: true,
    mixedBarangay: true,
  },
  measurementsMs: {
    migrations: Number(migration.durationMs.toFixed(3)),
    seed: Number(seed.durationMs.toFixed(3)),
    firstPage50: Number(page.durationMs.toFixed(3)),
    reportAggregates: Number(report.durationMs.toFixed(3)),
    saveDatabaseTransactionOnly: Number(saveTransaction.durationMs.toFixed(3)),
  },
  assertions: {
    firstPageRows: page.value.length,
    totalRecordsBeforeSave: report.value.totals.total_saved_scans,
    groupedLabels: report.value.grouped,
    foreignKeysEnabled:
      database.prepare('PRAGMA foreign_keys').get().foreign_keys === 1,
  },
  queryPlan: pagePlan,
};

if (
  result.assertions.firstPageRows !== 50 ||
  result.assertions.totalRecordsBeforeSave !== RECORD_COUNT ||
  !result.assertions.foreignKeysEnabled ||
  !result.queryPlan.some((step) =>
    String(step.detail).includes('scan_records_created_at_idx'),
  )
) {
  throw new Error('The storage performance fixture failed its integrity checks.');
}

console.log(JSON.stringify(result, null, 2));
database.close();
