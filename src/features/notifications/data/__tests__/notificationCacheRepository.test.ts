import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';
import {
  listCachedMobileNotifications,
  markAllCachedMobileNotificationsRead,
  markCachedMobileNotificationRead,
  replaceCachedMobileNotifications,
} from '@/features/notifications/data/notificationCacheRepository';
import type { MobileNotificationUpdate } from '@/features/notifications/domain/notificationTypes';

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
    '0010_numerous_princess_powerful.sql',
    '0011_tidy_meteorite.sql',
    '0012_dapper_sumo.sql',
    '0013_v1_local_scan_migration.sql',
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

const NOTIFICATION: MobileNotificationUpdate = {
  id: '4e04321c-a879-423f-875d-4cdce5e028a6',
  eventType: 'field_validation_assigned',
  title: 'Field validation assigned',
  message: 'A field validation assignment is ready.',
  caseUuid: '7e8c2e48-a2d4-4aca-9a50-9ca460fd7a7f',
  referenceCode: 'CG-2026-0001',
  assignmentUuid: '3fbd7f77-7d6b-4eb0-a1c7-b673f5a2f39f',
  isRead: false,
  readAt: null,
  createdAt: '2026-08-13T12:00:00.000Z',
};

describe('mobile notification cache', () => {
  it('replaces one owner snapshot and preserves account boundaries', async () => {
    const { database, native } = openTestDatabase();

    await replaceCachedMobileNotifications(database, 'owner-1', [NOTIFICATION], '2026-08-13T12:05:00.000Z');
    await expect(listCachedMobileNotifications(database, 'owner-1')).resolves.toEqual([
      expect.objectContaining({
        id: NOTIFICATION.id,
        ownerIdentity: 'owner-1',
        eventType: NOTIFICATION.eventType,
        isRead: false,
        cachedAt: '2026-08-13T12:05:00.000Z',
      }),
    ]);

    await replaceCachedMobileNotifications(database, 'owner-2', [{ ...NOTIFICATION, id: '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f' }], '2026-08-13T12:06:00.000Z');
    await replaceCachedMobileNotifications(database, 'owner-1', [], '2026-08-13T12:07:00.000Z');

    await expect(listCachedMobileNotifications(database, 'owner-1')).resolves.toEqual([]);
    await expect(listCachedMobileNotifications(database, 'owner-2')).resolves.toHaveLength(1);
    native.close();
  });
  it('marks one owner-scoped notification as read and refuses another owner', async () => {
    const { database, native } = openTestDatabase();
    const otherId = '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f';
    await replaceCachedMobileNotifications(database, 'owner-1', [NOTIFICATION], '2026-08-13T12:05:00.000Z');
    await replaceCachedMobileNotifications(database, 'owner-2', [{ ...NOTIFICATION, id: otherId }], '2026-08-13T12:06:00.000Z');

    await expect(
      markCachedMobileNotificationRead(database, 'owner-1', otherId, '2026-08-13T12:10:00.000Z'),
    ).resolves.toBe(false);
    await expect(
      markCachedMobileNotificationRead(database, 'owner-2', otherId, '2026-08-13T12:10:00.000Z'),
    ).resolves.toBe(true);

    const ownerOne = await listCachedMobileNotifications(database, 'owner-1');
    const ownerTwo = await listCachedMobileNotifications(database, 'owner-2');
    expect(ownerOne[0]).toMatchObject({ isRead: false, readAt: null });
    expect(ownerTwo[0]).toMatchObject({
      isRead: true,
      readAt: '2026-08-13T12:10:00.000Z',
    });
    native.close();
  });

  it('marks every unread row for one owner and leaves read rows untouched', async () => {
    const { database, native } = openTestDatabase();
    const second = { ...NOTIFICATION, id: '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f' };
    await replaceCachedMobileNotifications(database, 'owner-1', [NOTIFICATION, second], '2026-08-13T12:05:00.000Z');
    await markCachedMobileNotificationRead(database, 'owner-1', NOTIFICATION.id, '2026-08-13T12:08:00.000Z');

    await expect(
      markAllCachedMobileNotificationsRead(database, 'owner-1', '2026-08-13T12:12:00.000Z'),
    ).resolves.toBe(1);

    const rows = await listCachedMobileNotifications(database, 'owner-1');
    expect(rows.every((row) => row.isRead)).toBe(true);
    expect(rows.find((row) => row.id === NOTIFICATION.id)?.readAt).toBe(
      '2026-08-13T12:08:00.000Z',
    );
    await expect(
      markAllCachedMobileNotificationsRead(database, 'owner-1', '2026-08-13T12:13:00.000Z'),
    ).resolves.toBe(0);
    native.close();
  });

  it('rejects an invalid read timestamp', async () => {
    const { database, native } = openTestDatabase();
    await replaceCachedMobileNotifications(database, 'owner-1', [NOTIFICATION], '2026-08-13T12:05:00.000Z');

    await expect(
      markCachedMobileNotificationRead(database, 'owner-1', NOTIFICATION.id, 'not-a-date'),
    ).rejects.toMatchObject({ code: 'UPDATE_FAILED' });
    native.close();
  });
});
