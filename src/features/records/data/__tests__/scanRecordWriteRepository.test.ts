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
import { insertScanRecord } from '@/features/records/data/scanRecordWriteRepository';
import type { SaveCompletedScanInput } from '@/features/records/domain/recordTypes';

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
});
