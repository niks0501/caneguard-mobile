import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';

export const FARMER_A = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
export const FARMER_B = '51214146-7439-48e0-aef4-d0e003f194b4';

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
      return { getAllSync: () => rows.map((row) => columns.map((column) => row[column.name])) };
    },
  } as unknown as SQLiteStatement;
}

/** An in-memory database with every migration applied, as the app's tests do elsewhere. */
export function openFarmerTestDatabase(): { database: CaneGuardDatabase; native: DatabaseSync } {
  const native = new DatabaseSync(':memory:');
  native.exec('PRAGMA foreign_keys = ON');
  for (const filename of readdirSync(join(process.cwd(), 'drizzle'))
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    native.exec(
      readFileSync(join(process.cwd(), 'drizzle', filename), 'utf8').replaceAll('--> statement-breakpoint', ''),
    );
  }
  const client = {
    prepareSync: (sql: string) => createStatementAdapter(native.prepare(sql)),
  } as unknown as SQLiteDatabase;
  return { database: drizzle(client, { schema }) as CaneGuardDatabase, native };
}

export function insertScan(
  database: CaneGuardDatabase,
  input: { id: string; owner: string; followsUpScanId?: string | null; label?: string; createdAt?: string },
): void {
  database
    .insert(schema.scanRecords)
    .values({
      id: input.id,
      ownerIdentity: input.owner,
      managedImageUri: `file:///documents/${input.id}.jpg`,
      imageMimeType: 'image/jpeg',
      submissionImageUri: `file:///documents/${input.id}-submit.jpg`,
      submissionImageMimeType: 'image/jpeg',
      imageSourceType: 'camera',
      predictedLabel: input.label ?? 'smut',
      confidence: 0.91,
      checklistConsistency: 'consistent',
      modelVersion: 'test',
      decisionSupportWording: 'test',
      preprocessMs: 1,
      inferenceMs: 1,
      totalMs: 2,
      followsUpScanId: input.followsUpScanId ?? null,
      createdAt: input.createdAt ?? '2026-11-26T01:00:00.000Z',
      updatedAt: input.createdAt ?? '2026-11-26T01:00:00.000Z',
    })
    .run();
}
