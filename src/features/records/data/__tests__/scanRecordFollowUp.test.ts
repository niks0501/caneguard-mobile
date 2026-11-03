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
import {
  deleteScanRecordById,
  findScanRecordById,
  listScanCheckHistory,
} from '@/features/records/data/scanRecordRepository';
import { insertScanRecord } from '@/features/records/data/scanRecordWriteRepository';
import type { SaveCompletedScanInput } from '@/features/records/domain/recordTypes';
import {
  getManagedScanImageDirectory,
} from '@/features/records/services/scanImageStorage';

const RECORD_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const SECOND_RECORD_ID = 'c863a5af-e9ad-44fe-a0dc-73f9d3436cac';
const THIRD_RECORD_ID = '8d1b5f0e-3f55-4a43-9c58-1d3a0f6d9b21';
const SUBMITTER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const OTHER_SUBMITTER_ID = '51214146-7439-48e0-aef4-d0e003f194b4';
const MANAGED_ROOT = getManagedScanImageDirectory(SUBMITTER_ID).uri;

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
  native.exec(readMigration('0002_talented_kat_farrell.sql'));
  native.exec(readMigration('0003_careful_marauders.sql'));
  native.exec(readMigration('0004_sour_namora.sql'));
  native.exec(readMigration('0005_tricky_the_santerians.sql'));
  native.exec(readMigration('0006_curvy_piledriver.sql'));
  native.exec(readMigration('0007_familiar_old_lace.sql'));
  native.exec(readMigration('0012_dapper_sumo.sql'));
  native.exec(readMigration('0013_v1_local_scan_migration.sql'));
  native.exec(readMigration('0026_scan_follow_up_check.sql'));
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
    ownerIdentity: SUBMITTER_ID,
    managedImageUri: `${MANAGED_ROOT}/${RECORD_ID}.jpg`,
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
      { label: 'smut', score: 0 },
    ],
    symptoms: ['rust'],
    checklistConsistency: 'consistent',
    reportedSeverity: 'Moderate',
    qualityWarnings: ['too-dark'],
    barangay: 'Wawa',
    decisionSupportWording: 'Possible result only. This output does not confirm a disease.',
    modelVersion: 'v1.0-mobilenetv2',
    preprocessMs: 4.25,
    inferenceMs: 8.5,
    totalMs: 12.75,
    createdAt: '2026-07-25T05:30:00.000Z',
    updatedAt: '2026-07-25T05:30:00.000Z',
    ...overrides,
  };
}


const OTHER_MANAGED_ROOT = getManagedScanImageDirectory(OTHER_SUBMITTER_ID).uri;

const OTHER_RECORD_ID = '0b9f3c1a-52d1-4f3a-8f9e-6b2d7f4a1c33';

describe('Check Again follow-up records', () => {
  it('round-trips the link and personal note and lists the checks oldest first', async () => {
    const { database, native } = openTestDatabase();
    await insertScanRecord(database, validInput());
    await insertScanRecord(
      database,
      validInput({
        id: THIRD_RECORD_ID,
        managedImageUri: `${MANAGED_ROOT}/${THIRD_RECORD_ID}.jpg`,
        createdAt: '2026-08-10T05:30:00.000Z',
        updatedAt: '2026-08-10T05:30:00.000Z',
        followsUpScanId: RECORD_ID,
        personalNote: 'New leaves look lighter near the tip.',
      }),
    );
    await insertScanRecord(
      database,
      validInput({
        id: SECOND_RECORD_ID,
        managedImageUri: `${MANAGED_ROOT}/${SECOND_RECORD_ID}.jpg`,
        createdAt: '2026-08-01T05:30:00.000Z',
        updatedAt: '2026-08-01T05:30:00.000Z',
        followsUpScanId: RECORD_ID,
      }),
    );

    const followUp = await findScanRecordById(database, THIRD_RECORD_ID, SUBMITTER_ID);
    expect(followUp.followsUpScanId).toBe(RECORD_ID);
    expect(followUp.personalNote).toBe('New leaves look lighter near the tip.');
    const original = await findScanRecordById(database, RECORD_ID, SUBMITTER_ID);
    expect(original.followsUpScanId).toBeNull();
    expect(original.personalNote).toBeNull();

    // The same history is reachable from the original and from any follow-up.
    for (const fromId of [RECORD_ID, THIRD_RECORD_ID]) {
      const history = await listScanCheckHistory(database, fromId, SUBMITTER_ID);
      expect(history.map((item) => [item.id, item.isOriginal])).toEqual([
        [RECORD_ID, true],
        [SECOND_RECORD_ID, false],
        [THIRD_RECORD_ID, false],
      ]);
    }
    native.close();
  });

  it('rejects a link to a scan that is missing, owned by someone else, or itself a follow-up', async () => {
    const { database, native } = openTestDatabase();
    await insertScanRecord(
      database,
      validInput({
        id: OTHER_RECORD_ID,
        ownerIdentity: OTHER_SUBMITTER_ID,
        managedImageUri: `${OTHER_MANAGED_ROOT}/${OTHER_RECORD_ID}.jpg`,
      }),
    );
    await insertScanRecord(database, validInput());
    await insertScanRecord(
      database,
      validInput({
        id: SECOND_RECORD_ID,
        managedImageUri: `${MANAGED_ROOT}/${SECOND_RECORD_ID}.jpg`,
        followsUpScanId: RECORD_ID,
      }),
    );

    const followUp = (followsUpScanId: string) =>
      insertScanRecord(
        database,
        validInput({
          id: THIRD_RECORD_ID,
          managedImageUri: `${MANAGED_ROOT}/${THIRD_RECORD_ID}.jpg`,
          followsUpScanId,
        }),
      );

    await expect(followUp(OTHER_RECORD_ID)).rejects.toMatchObject({
      code: 'INVALID_SCAN_RECORD',
    });
    await expect(followUp('4f2d9a60-1b7c-4e58-9d3a-5c8e1a7b2f90')).rejects.toMatchObject({
      code: 'INVALID_SCAN_RECORD',
    });
    await expect(followUp(SECOND_RECORD_ID)).rejects.toMatchObject({
      code: 'INVALID_SCAN_RECORD',
    });
    expect(
      native.prepare('SELECT count(*) AS n FROM scan_records WHERE id = ?').get(THIRD_RECORD_ID),
    ).toEqual({ n: 0 });
    // The other account cannot read this account's history either.
    await expect(
      listScanCheckHistory(database, RECORD_ID, OTHER_SUBMITTER_ID),
    ).rejects.toMatchObject({ code: 'RECORD_NOT_FOUND' });
    native.close();
  });

  it('keeps a follow-up, unlinked, when the original is deleted', async () => {
    const { database, native } = openTestDatabase();
    await insertScanRecord(database, validInput());
    await insertScanRecord(
      database,
      validInput({
        id: SECOND_RECORD_ID,
        managedImageUri: `${MANAGED_ROOT}/${SECOND_RECORD_ID}.jpg`,
        followsUpScanId: RECORD_ID,
        personalNote: 'Still the same.',
      }),
    );

    await deleteScanRecordById(database, RECORD_ID, SUBMITTER_ID);

    const survivor = await findScanRecordById(database, SECOND_RECORD_ID, SUBMITTER_ID);
    expect(survivor.followsUpScanId).toBeNull();
    expect(survivor.personalNote).toBe('Still the same.');
    await expect(
      listScanCheckHistory(database, SECOND_RECORD_ID, SUBMITTER_ID),
    ).resolves.toHaveLength(1);
    native.close();
  });
});
