import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';
import {
  countUnsyncedAerialAnalyses,
  deleteUnsentAerialAnalysis,
  enqueueAerialAnalysis,
  findAerialAnalysisById,
  findAerialAnalysisSyncCandidates,
  findLatestAerialAnalysisForAssignment,
  hasCoolingRetryableAerialAnalysis,
  markAerialAnalysisFailed,
  markAerialAnalysisPending,
  markAerialAnalysisSynced,
  markAerialAnalysisSyncing,
  requeueFailedAerialAnalyses,
} from '@/features/assignments/data/aerialAnalysisOutboxRepository';

const OWNER_A = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const OWNER_B = '51214146-7439-48e0-aef4-d0e003f194b4';
const ASSIGNMENT_ID = '01a04de2-280e-7140-bf56-3c98f98259d5';
const REPORT_UUID = '01a04ddc-9d08-70f7-9b43-ca247cea1a60';

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
      const rows = statement.all(...(params as SQLInputValue[])) as Record<string, unknown>[];
      const columns = statement.columns();
      return {
        getAllSync: () => rows.map((row) => columns.map((column) => row[column.name])),
      };
    },
  } as unknown as SQLiteStatement;
}

function openTestDatabase(): { database: CaneGuardDatabase; native: DatabaseSync } {
  const native = new DatabaseSync(':memory:');
  native.exec('PRAGMA foreign_keys = ON');
  for (const filename of readdirSync(join(process.cwd(), 'drizzle'))
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    const sql = readFileSync(join(process.cwd(), 'drizzle', filename), 'utf8').replaceAll(
      '--> statement-breakpoint',
      '',
    );
    native.exec(sql);
  }

  const client = {
    prepareSync: (sql: string) => createStatementAdapter(native.prepare(sql)),
  } as unknown as SQLiteDatabase;

  return {
    database: drizzle(client, { schema }) as CaneGuardDatabase,
    native,
  };
}

describe('aerialAnalysisOutboxRepository', () => {
  let database: CaneGuardDatabase;
  let native: DatabaseSync;

  beforeEach(() => {
    const opened = openTestDatabase();
    database = opened.database;
    native = opened.native;
  });

  afterEach(() => {
    native.close();
  });

  it('scopes outbox rows to owner and skips AERIAL_DISABLED during automatic retry selection', async () => {
    const uploadId = '11111111-1111-4111-8111-111111111111';
    await enqueueAerialAnalysis(database, {
      id: uploadId,
      ownerIdentity: OWNER_A,
      assignmentId: ASSIGNMENT_ID,
      reportUuid: REPORT_UUID,
      imageUri: `file:///documents/caneguard/aerial-uploads/${OWNER_A}/shot.jpg`,
      imageMimeType: 'image/jpeg',
      imageSizeBytes: 512_000,
      provenance: { basis: 'verified', verifiedAt: '2026-11-26T00:00:00.000Z' },
      createdAt: '2026-11-26T01:00:00.000Z',
    });

    await expect(countUnsyncedAerialAnalyses(database, OWNER_A)).resolves.toBe(1);
    await expect(countUnsyncedAerialAnalyses(database, OWNER_B)).resolves.toBe(0);
    await expect(findLatestAerialAnalysisForAssignment(database, OWNER_B, ASSIGNMENT_ID)).resolves.toBeNull();
    await expect(findAerialAnalysisById(database, uploadId, OWNER_B)).rejects.toThrow();

    expect(await markAerialAnalysisSyncing(database, uploadId, OWNER_A, '2026-11-26T01:05:00.000Z')).toBe(1);
    await markAerialAnalysisFailed(database, uploadId, OWNER_A, 'AERIAL_DISABLED', '2026-11-26T01:05:01.000Z');

    // AERIAL_DISABLED is neither auto-retried nor cooling for auto-retry.
    const candidates = await findAerialAnalysisSyncCandidates(database, OWNER_A, 10, {
      failedBefore: '2099-01-01T00:00:00.000Z',
      includeRetryableFailed: true,
    });
    expect(candidates).toEqual([]);
    await expect(
      hasCoolingRetryableAerialAnalysis(database, OWNER_A, '2020-01-01T00:00:00.000Z'),
    ).resolves.toBe(false);

    // Filtered batch requeue (Send all again) skips AERIAL_DISABLED unless explicitly manually retried.
    await expect(requeueFailedAerialAnalyses(database, OWNER_A, ['SERVER_ERROR'])).resolves.toBe(0);

    // Manual retry puts it back into pending and allows synced transition.
    expect(await markAerialAnalysisPending(database, uploadId, OWNER_A)).toBe(1);
    expect(await markAerialAnalysisSyncing(database, uploadId, OWNER_A, '2026-11-26T02:00:00.000Z')).toBe(1);
    expect(
      await markAerialAnalysisSynced(
        database,
        uploadId,
        OWNER_A,
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        '2026-11-26T02:00:02.000Z',
      ),
    ).toBe(1);
    await expect(countUnsyncedAerialAnalyses(database, OWNER_A)).resolves.toBe(0);
    await expect(deleteUnsentAerialAnalysis(database, uploadId, OWNER_A)).resolves.toBeNull();
  });

  it('deletes pending/failed queued upload only for owning user', async () => {
    const uploadId = '22222222-2222-4222-8222-222222222222';
    await enqueueAerialAnalysis(database, {
      id: uploadId,
      ownerIdentity: OWNER_A,
      assignmentId: ASSIGNMENT_ID,
      reportUuid: REPORT_UUID,
      imageUri: `file:///documents/caneguard/aerial-uploads/${OWNER_A}/shot.jpg`,
      imageMimeType: 'image/png',
      imageSizeBytes: 128_000,
      createdAt: '2026-11-26T01:00:00.000Z',
    });

    await expect(deleteUnsentAerialAnalysis(database, uploadId, OWNER_B)).resolves.toBeNull();
    const deleted = await deleteUnsentAerialAnalysis(database, uploadId, OWNER_A);
    expect(deleted?.id).toBe(uploadId);
    await expect(countUnsyncedAerialAnalyses(database, OWNER_A)).resolves.toBe(0);
  });
});
