import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DatabaseSync,
  type SQLInputValue,
  type StatementSync,
} from 'node:sqlite';

import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';
import { StorageError } from '@/database/errors';
import {
  deleteScanRecordById,
  findScanRecordById,
  listManagedImageUris,
  listScanRecords,
} from '@/features/records/data/scanRecordRepository';
import { insertScanRecord } from '@/features/records/data/scanRecordWriteRepository';
import type { SaveCompletedScanInput } from '@/features/records/domain/recordTypes';
import { getLocalReportSummary } from '@/features/reports/data/reportRepository';

const RECORD_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';

function readMigration(filename: string): string {
  return readFileSync(join(process.cwd(), 'drizzle', filename), 'utf8').replaceAll(
    '--> statement-breakpoint',
    '',
  );
}

function openTestDatabase(): {
  database: CaneGuardDatabase;
  native: DatabaseSync;
} {
  const native = new DatabaseSync(':memory:');
  native.exec('PRAGMA foreign_keys = ON');
  native.exec(readMigration('0000_complex_johnny_blaze.sql'));
  native.exec(readMigration('0001_loving_amazoness.sql'));
  const client = {
    prepareSync(sql: string) {
      return createStatementAdapter(native.prepare(sql));
    },
  } as unknown as SQLiteDatabase;

  return {
    database: drizzle(client, { schema }) as CaneGuardDatabase,
    native,
  };
}

function createStatementAdapter(statement: StatementSync): SQLiteStatement {
  function execute(params: unknown[]) {
    const result = statement.run(...(params as SQLInputValue[]));
    return {
      changes: Number(result.changes),
      lastInsertRowId: Number(result.lastInsertRowid),
      getAllSync: () => [],
      getFirstSync: () => null,
    };
  }

  return {
    executeSync: (params: unknown[] = []) => execute(params),
    executeForRawResultSync: (params: unknown[] = []) => {
      const rows = statement.all(
        ...(params as SQLInputValue[]),
      ) as Record<string, unknown>[];
      const columns = statement.columns();
      return {
        getAllSync: () =>
          rows.map((row) => columns.map((column) => row[column.name])),
      };
    },
  } as unknown as SQLiteStatement;
}

function validInput(
  overrides: Partial<SaveCompletedScanInput> = {},
): SaveCompletedScanInput {
  return {
    id: RECORD_ID,
    managedImageUri: `file:///documents/caneguard/scan-images/${RECORD_ID}.jpg`,
    imageMimeType: 'image/jpeg',
    imageSizeBytes: 4096,
    imageSourceType: 'camera',
    sourceWidth: 1200,
    sourceHeight: 900,
    predictedLabel: 'rust',
    confidence: 0.82,
    classScores: [
      { label: 'healthy', score: 0.05 },
      { label: 'mosaic', score: 0.13 },
      { label: 'rust', score: 0.82 },
    ],
    symptoms: ['rust'],
    checklistConsistency: 'consistent',
    reportedSeverity: 'Moderate',
    qualityWarnings: ['too-dark'],
    barangay: null,
    modelVersion: 'v0.1-baseline',
    preprocessMs: 4.25,
    inferenceMs: 8.5,
    totalMs: 12.75,
    createdAt: '2026-07-25T05:30:00.000Z',
    updatedAt: '2026-07-25T05:30:00.000Z',
    ...overrides,
  };
}

describe('scan record write repository', () => {
  it('commits the parent, all scores, and optional observations atomically', async () => {
    const { database, native } = openTestDatabase();

    await expect(insertScanRecord(database, validInput())).resolves.toEqual({
      id: RECORD_ID,
    });

    expect(
      native
        .prepare(
          `SELECT predicted_label, confidence, barangay, sync_status,
                  remote_id, sync_attempt_count, created_at
             FROM scan_records WHERE id = ?`,
        )
        .get(RECORD_ID),
    ).toEqual({
      predicted_label: 'rust',
      confidence: 0.82,
      barangay: null,
      sync_status: 'local_only',
      remote_id: null,
      sync_attempt_count: 0,
      created_at: '2026-07-25T05:30:00.000Z',
    });
    expect(
      native
        .prepare(
          'SELECT label, score FROM scan_class_scores WHERE scan_record_id = ? ORDER BY label',
        )
        .all(RECORD_ID),
    ).toEqual([
      { label: 'healthy', score: 0.05 },
      { label: 'mosaic', score: 0.13 },
      { label: 'rust', score: 0.82 },
    ]);
    expect(
      native
        .prepare(
          'SELECT symptom_key FROM scan_symptoms WHERE scan_record_id = ?',
        )
        .all(RECORD_ID),
    ).toEqual([{ symptom_key: 'rust' }]);
    expect(
      native
        .prepare(
          'SELECT warning_key FROM scan_quality_warnings WHERE scan_record_id = ?',
        )
        .all(RECORD_ID),
    ).toEqual([{ warning_key: 'too-dark' }]);
    native.close();
  });

  it('rolls back the parent when a child insert fails', async () => {
    const { database, native } = openTestDatabase();
    native.exec(`
      CREATE TRIGGER reject_score
      BEFORE INSERT ON scan_class_scores
      BEGIN
        SELECT RAISE(FAIL, 'forced child failure');
      END
    `);

    await expect(insertScanRecord(database, validInput())).rejects.toMatchObject<
      Partial<StorageError>
    >({ code: 'SAVE_TRANSACTION_FAILED' });
    expect(
      native.prepare('SELECT count(*) AS count FROM scan_records').get(),
    ).toEqual({ count: 0 });
    native.close();
  });

  it('commits a valid record when optional symptoms and warnings are empty', async () => {
    const { database, native } = openTestDatabase();

    await insertScanRecord(
      database,
      validInput({
        symptoms: [],
        qualityWarnings: [],
        reportedSeverity: null,
        checklistConsistency: 'not-enough-information',
      }),
    );

    expect(
      native.prepare('SELECT count(*) AS count FROM scan_records').get(),
    ).toEqual({ count: 1 });
    expect(
      native.prepare('SELECT count(*) AS count FROM scan_symptoms').get(),
    ).toEqual({ count: 0 });
    expect(
      native.prepare('SELECT count(*) AS count FROM scan_quality_warnings').get(),
    ).toEqual({ count: 0 });
    native.close();
  });

  it('maps a repeated stable identifier to a duplicate-record error', async () => {
    const { database, native } = openTestDatabase();
    await insertScanRecord(database, validInput());

    await expect(insertScanRecord(database, validInput())).rejects.toMatchObject<
      Partial<StorageError>
    >({ code: 'DUPLICATE_RECORD' });
    expect(
      native.prepare('SELECT count(*) AS count FROM scan_records').get(),
    ).toEqual({ count: 1 });
    native.close();
  });

  it('lists lightweight records newest-first with pagination and SQL filters', async () => {
    const { database, native } = openTestDatabase();

    for (let index = 0; index < 30; index += 1) {
      const id = `2b4666c0-ad10-4d0d-a233-${index.toString(16).padStart(12, '0')}`;
      const label = (['healthy', 'mosaic', 'rust'] as const)[index % 3];
      const day = String((index % 28) + 1).padStart(2, '0');
      await insertScanRecord(
        database,
        validInput({
          id,
          managedImageUri: `file:///documents/caneguard/scan-images/${id}.jpg`,
          predictedLabel: label,
          confidence: 0.5 + index / 100,
          barangay: index === 10 ? 'Wawa' : null,
          createdAt: `2026-07-${day}T05:30:00.000Z`,
          updatedAt: `2026-07-${day}T05:30:00.000Z`,
        }),
      );
    }

    const firstPage = await listScanRecords(database, { limit: 10 });
    const secondPage = await listScanRecords(database, {
      limit: 10,
      offset: 10,
    });
    const rust = await listScanRecords(database, {
      predictedLabel: 'rust',
      limit: 100,
    });
    const searched = await listScanRecords(database, {
      search: 'WaWa',
      limit: 100,
    });
    const barangay = await listScanRecords(database, {
      barangay: 'awa',
      limit: 100,
    });
    const ranged = await listScanRecords(database, {
      dateRange: {
        from: '2026-07-20T00:00:00.000Z',
        to: '2026-07-22T23:59:59.999Z',
      },
      limit: 100,
    });

    expect(firstPage).toHaveLength(10);
    expect(firstPage[0].createdAt >= firstPage[1].createdAt).toBe(true);
    expect(
      new Set([...firstPage, ...secondPage].map((row) => row.id)).size,
    ).toBe(20);
    expect(rust).toHaveLength(10);
    expect(rust.every((row) => row.predictedLabel === 'rust')).toBe(true);
    expect(searched).toHaveLength(1);
    expect(searched[0].barangay).toBe('Wawa');
    expect(barangay).toHaveLength(1);
    expect(ranged.map((row) => row.createdAt.slice(8, 10)).sort()).toEqual([
      '20',
      '21',
      '22',
    ]);

    native
      .prepare("UPDATE scan_records SET sync_status = 'failed' WHERE id = ?")
      .run(
        '2b4666c0-ad10-4d0d-a233-000000000010',
      );
    await expect(
      listScanRecords(database, { syncStatus: 'failed', limit: 100 }),
    ).resolves.toHaveLength(1);
    native.close();
  });

  it('loads full details independently and deletes children by cascade', async () => {
    const { database, native } = openTestDatabase();
    await insertScanRecord(database, validInput());

    await expect(findScanRecordById(database, RECORD_ID)).resolves.toMatchObject({
      id: RECORD_ID,
      predictedLabel: 'rust',
      classScores: [
        { label: 'healthy', score: 0.05 },
        { label: 'mosaic', score: 0.13 },
        { label: 'rust', score: 0.82 },
      ],
      symptoms: ['rust'],
      qualityWarnings: ['too-dark'],
    });
    await expect(listManagedImageUris(database)).resolves.toEqual([
      `file:///documents/caneguard/scan-images/${RECORD_ID}.jpg`,
    ]);
    await expect(deleteScanRecordById(database, RECORD_ID)).resolves.toEqual({
      managedImageUri: `file:///documents/caneguard/scan-images/${RECORD_ID}.jpg`,
    });

    for (const table of [
      'scan_records',
      'scan_class_scores',
      'scan_symptoms',
      'scan_quality_warnings',
    ]) {
      expect(
        native.prepare(`SELECT count(*) AS count FROM ${table}`).get(),
      ).toEqual({ count: 0 });
    }
    await expect(findScanRecordById(database, RECORD_ID)).rejects.toMatchObject({
      code: 'RECORD_NOT_FOUND',
    });
    native.close();
  });

  it('calculates report aggregates in SQL with date-range and recent limits', async () => {
    const { database, native } = openTestDatabase();
    const fixtures = [
      ['healthy', 0.9, '2026-07-01T00:00:00.000Z'],
      ['mosaic', 0.4, '2026-07-02T00:00:00.000Z'],
      ['rust', 0.49, '2026-07-03T00:00:00.000Z'],
      ['rust', 0.8, '2026-07-04T00:00:00.000Z'],
      ['healthy', 0.3, '2026-06-30T00:00:00.000Z'],
    ] as const;

    for (let index = 0; index < fixtures.length; index += 1) {
      const [predictedLabel, confidence, createdAt] = fixtures[index];
      const id = `2b4666c0-ad10-4d0d-a233-${index.toString(16).padStart(12, '0')}`;
      await insertScanRecord(
        database,
        validInput({
          id,
          managedImageUri: `file:///documents/caneguard/scan-images/${id}.jpg`,
          predictedLabel,
          confidence,
          createdAt,
          updatedAt: createdAt,
        }),
      );
    }
    native
      .prepare("UPDATE scan_records SET sync_status = 'failed' WHERE created_at = ?")
      .run('2026-07-04T00:00:00.000Z');

    await expect(
      getLocalReportSummary(database, { recentLimit: 3 }),
    ).resolves.toMatchObject({
      totalSavedScans: 5,
      healthyPredictions: 2,
      possibleDiseasePredictions: 3,
      localOnlyRecords: 4,
      lowScorePredictions: 3,
      recordsByLabel: [
        { label: 'healthy', count: 2 },
        { label: 'rust', count: 2 },
        { label: 'mosaic', count: 1 },
      ],
      recentRecords: [
        expect.objectContaining({ createdAt: '2026-07-04T00:00:00.000Z' }),
        expect.objectContaining({ createdAt: '2026-07-03T00:00:00.000Z' }),
        expect.objectContaining({ createdAt: '2026-07-02T00:00:00.000Z' }),
      ],
    });

    await expect(
      getLocalReportSummary(database, {
        dateRange: {
          from: '2026-07-01T00:00:00.000Z',
          to: '2026-07-31T23:59:59.999Z',
        },
      }),
    ).resolves.toMatchObject({
      totalSavedScans: 4,
      healthyPredictions: 1,
      possibleDiseasePredictions: 3,
      localOnlyRecords: 3,
      lowScorePredictions: 2,
    });

    await deleteScanRecordById(
      database,
      '2b4666c0-ad10-4d0d-a233-000000000003',
    );
    await expect(getLocalReportSummary(database)).resolves.toMatchObject({
      totalSavedScans: 4,
      possibleDiseasePredictions: 2,
      localOnlyRecords: 4,
    });
    native.close();
  });

  it('returns zeroed report aggregates for an empty database', async () => {
    const { database, native } = openTestDatabase();

    await expect(getLocalReportSummary(database)).resolves.toEqual({
      totalSavedScans: 0,
      healthyPredictions: 0,
      possibleDiseasePredictions: 0,
      localOnlyRecords: 0,
      lowScorePredictions: 0,
      recordsByLabel: [],
      recentRecords: [],
    });
    native.close();
  });
});
