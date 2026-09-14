import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';
import {
  countUnsyncedFieldValidationCompletions,
  findFieldValidationCompletion,
  markFieldValidationCompletionFailed,
  markFieldValidationCompletionPending,
  markFieldValidationCompletionSynced,
  markFieldValidationCompletionSyncing,
  saveFieldValidationCompletion,
} from '@/features/assignments/data/fieldValidationCompletionRepository';
import type { SaveFieldValidationCompletionInput } from '@/features/assignments/domain/fieldValidationCompletionTypes';

const OWNER = 'd4f4c3b8-4f27-49c7-9ec7-3ab7ea6fc91d';
const ASSIGNMENT = '01a04de2-280e-7140-bf56-3c98f98259d5';
const REPORT = '01a04ddc-9d08-70f7-9b43-ca247cea1a60';
const COMPLETION = '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f';

function migration(filename: string): string {
  return readFileSync(join(process.cwd(), 'drizzle', filename), 'utf8').replaceAll('--> statement-breakpoint', '');
}

function openDatabase(): { database: CaneGuardDatabase; native: DatabaseSync } {
  const native = new DatabaseSync(':memory:');
  native.exec('PRAGMA foreign_keys = ON');
  for (const filename of [
    '0000_complex_johnny_blaze.sql',
    '0001_loving_amazoness.sql',
    '0002_talented_kat_farrell.sql',
    '0003_careful_marauders.sql',
    '0004_sour_namora.sql',
    '0005_tricky_the_santerians.sql',
    '0006_curvy_piledriver.sql',
    '0007_familiar_old_lace.sql',
    '0008_field_validation_assignments.sql',
    '0009_scope_field_validation_assignment_cache_by_owner.sql',
    '0010_numerous_princess_powerful.sql',
    '0011_tidy_meteorite.sql',
    '0012_dapper_sumo.sql',
    '0013_v1_local_scan_migration.sql',
  ]) native.exec(migration(filename));
  return { database: createDatabase(native), native };
}

function createDatabase(native: DatabaseSync): CaneGuardDatabase {
  const client = {
    prepareSync(sql: string) {
      return statementAdapter(native.prepare(sql));
    },
  } as unknown as SQLiteDatabase;
  return drizzle(client, { schema }) as CaneGuardDatabase;
}

function statementAdapter(statement: StatementSync): SQLiteStatement {
  const execute = (params: unknown[]) => {
    const result = statement.run(...(params as SQLInputValue[]));
    return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid), getAllSync: () => [], getFirstSync: () => null };
  };
  return {
    executeSync: (params: unknown[] = []) => execute(params),
    executeForRawResultSync: (params: unknown[] = []) => {
      const rows = statement.all(...(params as SQLInputValue[])) as Record<string, unknown>[];
      const columns = statement.columns();
      return { getAllSync: () => rows.map((row) => columns.map((column) => row[column.name])) };
    },
  } as unknown as SQLiteStatement;
}

function input(overrides: Partial<SaveFieldValidationCompletionInput> = {}): SaveFieldValidationCompletionInput {
  return {
    id: COMPLETION,
    ownerIdentity: OWNER,
    assignmentId: ASSIGNMENT,
    reportUuid: REPORT,
    fieldObservation: 'Fresh leaves show rust-like lesions.',
    fieldFinding: 'Evidence was recorded for office review.',
    actionTaken: 'Provided field guidance and recorded the visit.',
    visitedAt: '2026-09-02T04:05:06.123Z',
    gpsOutcome: 'low_accuracy',
    gpsAttemptedAt: '2026-09-02T04:05:01.123Z',
    gpsLatitude: 14.0667,
    gpsLongitude: 120.6319,
    gpsAccuracy: 38,
    freshPhotoUri: null,
    freshPhotoMimeType: null,
    freshPhotoSizeBytes: null,
    ...overrides,
  };
}

describe('field validation completion repository', () => {
  it('persists all evidence and reloads it after a database restart', async () => {
    const first = openDatabase();
    await expect(saveFieldValidationCompletion(first.database, input())).resolves.toMatchObject({
      id: COMPLETION,
      syncStatus: 'pending',
      fieldObservation: 'Fresh leaves show rust-like lesions.',
      gpsOutcome: 'low_accuracy',
    });
    // A new repository connection represents the app reopening SQLite after a
    // restart; the row remains in the durable database.
    const second = createDatabase(first.native);
    await expect(findFieldValidationCompletion(second, OWNER, ASSIGNMENT)).resolves.toMatchObject({
      id: COMPLETION,
      fieldFinding: 'Evidence was recorded for office review.',
    });
    first.native.close();
  });

  it('retains evidence through failure and marks it synced only after a successful retry', async () => {
    const { database, native } = openDatabase();
    await saveFieldValidationCompletion(database, input({ gpsOutcome: 'unavailable', gpsLatitude: null, gpsLongitude: null, gpsAccuracy: null }));
    await markFieldValidationCompletionSyncing(database, COMPLETION, OWNER, '2026-09-02T04:06:00.123Z');
    await markFieldValidationCompletionFailed(database, COMPLETION, OWNER, 'NETWORK_REQUEST_FAILED', '2026-09-02T04:06:01.123Z');
    await expect(countUnsyncedFieldValidationCompletions(database, OWNER)).resolves.toBe(1);
    await markFieldValidationCompletionPending(database, COMPLETION, OWNER);
    await markFieldValidationCompletionSyncing(database, COMPLETION, OWNER, '2026-09-02T04:07:00.123Z');
    await markFieldValidationCompletionSynced(database, COMPLETION, OWNER, 'server-completion-uuid', '2026-09-02T04:07:01.123Z');

    await expect(findFieldValidationCompletion(database, OWNER, ASSIGNMENT)).resolves.toMatchObject({
      fieldObservation: 'Fresh leaves show rust-like lesions.',
      gpsOutcome: 'unavailable',
      syncStatus: 'synced',
      remoteId: 'server-completion-uuid',
    });
    await expect(countUnsyncedFieldValidationCompletions(database, OWNER)).resolves.toBe(0);
    native.close();
  });
});
