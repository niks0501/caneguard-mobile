import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';
import {
  listCachedFieldValidationAssignments,
  replaceCachedFieldValidationAssignments,
} from '@/features/assignments/data/assignmentCacheRepository';
import type { FieldValidationAssignmentUpdate } from '@/features/assignments/domain/assignmentTypes';

function readMigration(filename: string): string {
  return readFileSync(join(process.cwd(), 'drizzle', filename), 'utf8').replaceAll('--> statement-breakpoint', '');
}

function openTestDatabase(): { database: CaneGuardDatabase; native: DatabaseSync } {
  const native = new DatabaseSync(':memory:');
  native.exec('PRAGMA foreign_keys = ON');
  for (const migration of [
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
  ]) native.exec(readMigration(migration));

  const client = {
    prepareSync(sql: string) {
      return createStatementAdapter(native.prepare(sql));
    },
  } as unknown as SQLiteDatabase;
  return { database: drizzle(client, { schema }) as CaneGuardDatabase, native };
}

function createStatementAdapter(statement: StatementSync): SQLiteStatement {
  function execute(params: unknown[]) {
    const result = statement.run(...(params as SQLInputValue[]));
    return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid), getAllSync: () => [], getFirstSync: () => null };
  }
  return {
    executeSync: (params: unknown[] = []) => execute(params),
    executeForRawResultSync: (params: unknown[] = []) => {
      const rows = statement.all(...(params as SQLInputValue[])) as Record<string, unknown>[];
      const columns = statement.columns();
      return { getAllSync: () => rows.map((row) => columns.map((column) => row[column.name])) };
    },
  } as unknown as SQLiteStatement;
}

const ASSIGNMENT: FieldValidationAssignmentUpdate = {
  id: '3fbd7f77-7d6b-4eb0-a1c7-b673f5a2f39f',
  reportUuid: '7e8c2e48-a2d4-4aca-9a50-9ca460fd7a7f',
  reportClientUuid: 'cf9023da-e23c-43cb-a3ae-08ec6e0f302e',
  referenceCode: 'CG-2026-0001',
  submitter: { uuid: '1ca4cd6e-ab57-4744-a8be-47a91271fd02', name: 'Ana Reporter' },
  assignee: { uuid: 'd4f4c3b8-4f27-49c7-9ec7-3ab7ea6fc91d', name: 'Mara Field Reporter' },
  submitterIsAssignee: false,
  targetVisitDate: '2026-08-20',
  fieldValidationState: 'assigned',
  assignedAt: '2026-08-13T12:00:00.000Z',
  updatedAt: '2026-08-13T12:00:00.000Z',
  case: {
    barangay: 'Mabini',
    province: 'Negros Occidental',
    municipality: 'Bago',
    farmerOrFarmOwnerName: 'Juan Dela Cruz',
    affectedAreaHectares: 12.5,
    affectedPortionPercent: 42.75,
    capturedAt: '2026-07-20T09:55:00.000Z',
    observedAt: '2026-07-20T09:58:00.000Z',
    submittedAt: '2026-07-20T10:00:00.000Z',
    predictedLabel: 'rust',
    confidence: 0.93,
  },
};

describe('field validation assignment cache', () => {
  it('stores a complete owner snapshot and removes assignments no longer owned', async () => {
    const { database, native } = openTestDatabase();

    await replaceCachedFieldValidationAssignments(database, 'owner-1', [ASSIGNMENT], '2026-08-13T12:05:00.000Z');
    await expect(listCachedFieldValidationAssignments(database, 'owner-1')).resolves.toEqual([
      expect.objectContaining({
        id: ASSIGNMENT.id,
        ownerIdentity: 'owner-1',
        referenceCode: 'CG-2026-0001',
        case: expect.objectContaining({ predictedLabel: 'rust' }),
        cachedAt: '2026-08-13T12:05:00.000Z',
      }),
    ]);

    await replaceCachedFieldValidationAssignments(database, 'owner-1', [], '2026-08-13T12:06:00.000Z');
    await expect(listCachedFieldValidationAssignments(database, 'owner-1')).resolves.toEqual([]);
    native.close();
  });

  it('keeps owner boundaries when another account receives the same server assignment', async () => {
    const { database, native } = openTestDatabase();
    await replaceCachedFieldValidationAssignments(database, 'owner-1', [ASSIGNMENT], '2026-08-13T12:05:00.000Z');
    await replaceCachedFieldValidationAssignments(database, 'owner-2', [{ ...ASSIGNMENT, assignee: { uuid: 'owner-2', name: 'Other Reporter' } }], '2026-08-13T12:06:00.000Z');

    await expect(listCachedFieldValidationAssignments(database, 'owner-1')).resolves.toEqual([
      expect.objectContaining({ ownerIdentity: 'owner-1', assignee: { uuid: ASSIGNMENT.assignee.uuid, name: ASSIGNMENT.assignee.name } }),
    ]);
    await expect(listCachedFieldValidationAssignments(database, 'owner-2')).resolves.toEqual([
      expect.objectContaining({ ownerIdentity: 'owner-2', assignee: { uuid: 'owner-2', name: 'Other Reporter' } }),
    ]);
    native.close();
  });
});
