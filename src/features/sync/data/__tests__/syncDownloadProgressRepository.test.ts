import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError } from '@/database/errors';
import * as schema from '@/database/schema';
import { createSyncDownloadProgressStore } from '@/features/sync/data/syncDownloadProgressRepository';

function openDatabase(): { database: CaneGuardDatabase; native: DatabaseSync } {
  const native = new DatabaseSync(':memory:');
  native.exec('PRAGMA foreign_keys = ON');
  for (const migration of readdirSync('drizzle').filter((file) => file.endsWith('.sql')).sort()) {
    native.exec(
      readFileSync(`drizzle/${migration}`, 'utf8').replaceAll('--> statement-breakpoint', ''),
    );
  }
  const client = {
    prepareSync(sql: string) {
      const statement = native.prepare(sql);
      return {
        executeSync(params: unknown[] = []) {
          const result = statement.run(...(params as SQLInputValue[]));
          return {
            changes: Number(result.changes),
            lastInsertRowId: Number(result.lastInsertRowid),
            getAllSync: () => [],
            getFirstSync: () => null,
          };
        },
        executeForRawResultSync(params: unknown[] = []) {
          const rows = statement.all(...(params as SQLInputValue[])) as Record<string, unknown>[];
          const columns = statement.columns();
          return { getAllSync: () => rows.map((row) => columns.map((column) => row[column.name])) };
        },
      } as unknown as SQLiteStatement;
    },
  } as unknown as SQLiteDatabase;
  return { database: drizzle(client, { schema }) as CaneGuardDatabase, native };
}

describe('sync download progress store', () => {
  it('returns the stored pages only to the owner and feed that saved them', async () => {
    const { database, native } = openDatabase();
    await createSyncDownloadProgressStore(database, 'owner-1', 'authority_status').save(
      '{"nextPath":"/page-2"}',
    );

    await expect(
      createSyncDownloadProgressStore(database, 'owner-1', 'authority_status').read(),
    ).resolves.toBe('{"nextPath":"/page-2"}');
    await expect(
      createSyncDownloadProgressStore(database, 'owner-2', 'authority_status').read(),
    ).resolves.toBeNull();
    await expect(
      createSyncDownloadProgressStore(database, 'owner-1', 'notifications').read(),
    ).resolves.toBeNull();
    native.close();
  });

  it('replaces the stored pages with the latest continuation', async () => {
    const { database, native } = openDatabase();
    const store = createSyncDownloadProgressStore(database, 'owner-1', 'authority_status');

    await store.save('{"nextPath":"/page-2"}');
    await store.save('{"nextPath":"/page-3"}');

    await expect(store.read()).resolves.toBe('{"nextPath":"/page-3"}');
    native.close();
  });

  it('clears only the progress it was scoped to', async () => {
    const { database, native } = openDatabase();
    const first = createSyncDownloadProgressStore(database, 'owner-1', 'authority_status');
    const second = createSyncDownloadProgressStore(database, 'owner-2', 'authority_status');
    await first.save('{"nextPath":"/page-2"}');
    await second.save('{"nextPath":"/page-2"}');

    await first.clear();

    await expect(first.read()).resolves.toBeNull();
    await expect(second.read()).resolves.toBe('{"nextPath":"/page-2"}');
    native.close();
  });

  it('refuses an owner that cannot scope stored pages', async () => {
    const { database, native } = openDatabase();

    expect(() => createSyncDownloadProgressStore(database, '   ', 'authority_status')).toThrow(
      StorageError,
    );
    native.close();
  });
});
