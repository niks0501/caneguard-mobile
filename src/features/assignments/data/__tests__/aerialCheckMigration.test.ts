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
import type {
  FieldValidationAssignmentUpdate,
  OfficeAerialCheck,
} from '@/features/assignments/domain/assignmentTypes';

function readMigration(filename: string): string {
  return readFileSync(join(process.cwd(), 'drizzle', filename), 'utf8').replaceAll(
    '--> statement-breakpoint',
    '',
  );
}

const PRE_AERIAL_MIGRATIONS = [
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
  '0014_safe_songbird.sql',
  '0015_sour_riptide.sql',
  '0016_nervous_gateway.sql',
  '0030_field_validation_snapshot_skipped.sql',
  '0031_gorgeous_ben_grimm.sql',
  '0032_office_case_projection.sql',
  '0034_authority_workflow_status.sql',
  '0035_authority_status_redownload.sql',
] as const;

function adapt(statement: StatementSync): SQLiteStatement {
  return {
    executeSync: (params: unknown[] = []) => {
      const result = statement.run(...(params as SQLInputValue[]));
      return {
        changes: Number(result.changes),
        lastInsertRowId: Number(result.lastInsertRowid),
        getAllSync: () => [],
        getFirstSync: () => null,
      };
    },
    executeForRawResultSync: (params: unknown[] = []) => {
      const rows = statement.all(...(params as SQLInputValue[])) as Record<string, unknown>[];
      const columns = statement.columns();
      return { getAllSync: () => rows.map((row) => columns.map((column) => row[column.name])) };
    },
  } as unknown as SQLiteStatement;
}

describe('aerial check migration and cache persistence', () => {
  it('clears only the assignments sync checkpoint version when 0040 lands', () => {
    const native = new DatabaseSync(':memory:');
    for (const file of PRE_AERIAL_MIGRATIONS) native.exec(readMigration(file));

    const insertCheckpoint = native.prepare(`
      INSERT INTO sync_checkpoints (
        owner_identity, feed, version, total, truncated, page_count, sync_before, fetched_at
      ) VALUES (?, ?, ?, 2, 0, 1, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z')
    `);
    insertCheckpoint.run('owner-1', 'assignments', 'v-before-aerial');
    insertCheckpoint.run('owner-1', 'notifications', 'v-notifications');

    native.exec(readMigration('0040_aerial_check_brief.sql'));

    expect(
      native.prepare('SELECT feed, version FROM sync_checkpoints ORDER BY feed').all(),
    ).toEqual([
      { feed: 'assignments', version: null },
      { feed: 'notifications', version: 'v-notifications' },
    ]);
    native.close();
  });

  it('persists and reads back aerialCheck on cached assignments', async () => {
    const native = new DatabaseSync(':memory:');
    for (const file of [...PRE_AERIAL_MIGRATIONS, '0040_aerial_check_brief.sql']) {
      native.exec(readMigration(file));
    }
    const client = {
      prepareSync: (sql: string) => adapt(native.prepare(sql)),
    } as unknown as SQLiteDatabase;
    const database = drizzle(client, { schema }) as CaneGuardDatabase;

    const aerialCheck: OfficeAerialCheck = {
      uuid: '0195b3c4-7f10-7000-8000-000000000001',
      enoughCanopy: true,
      abnormalCanopyPercent: 21.5,
      canopyCoveragePercent: 78.2,
      modelVersion: 'aerial-v3',
      createdAt: '2026-11-26T04:15:00.000Z',
      preview: { contentType: 'image/jpeg', bytes: 185_000 },
      overlay: { contentType: 'image/jpeg', bytes: 204_000 },
    };

    const assignment: FieldValidationAssignmentUpdate = {
      id: '3fbd7f77-7d6b-4eb0-a1c7-b673f5a2f39f',
      reportUuid: '7e8c2e48-a2d4-4aca-9a50-9ca460fd7a7f',
      reportClientUuid: 'cf9023da-e23c-43cb-a3ae-08ec6e0f302e',
      referenceCode: 'CG-2026-0099',
      submitter: { uuid: '1ca4cd6e-ab57-4744-a8be-47a91271fd02', name: 'Ana Reporter' },
      assignee: { uuid: 'd4f4c3b8-4f27-49c7-9ec7-3ab7ea6fc91d', name: 'Mara Field Reporter' },
      submitterIsAssignee: false,
      targetVisitDate: '2026-11-28',
      fieldValidationState: 'assigned',
      assignedAt: '2026-11-26T00:00:00.000Z',
      updatedAt: '2026-11-26T00:00:00.000Z',
      case: {
        barangay: 'Mabini',
        province: 'Negros Occidental',
        municipality: 'Bago',
        farmerOrFarmOwnerName: 'Juan Dela Cruz',
        affectedAreaHectares: 1.5,
        affectedPortionPercent: 20,
        capturedAt: '2026-11-25T09:55:00.000Z',
        observedAt: '2026-11-25T09:58:00.000Z',
        submittedAt: '2026-11-25T10:00:00.000Z',
        predictedLabel: 'rust',
        confidence: 0.9,
      },
      previousVisit: null,
      officeCase: null,
      aerialCheck,
    };

    await replaceCachedFieldValidationAssignments(
      database,
      'owner-1',
      [assignment],
      '2026-11-26T05:00:00.000Z',
    );
    const rows = await listCachedFieldValidationAssignments(database, 'owner-1');
    expect(rows).toHaveLength(1);
    expect(rows[0].aerialCheck).toEqual(aerialCheck);
    native.close();
  });
});
