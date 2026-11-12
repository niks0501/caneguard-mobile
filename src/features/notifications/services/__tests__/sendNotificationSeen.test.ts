import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';
import {
  markMobileNotificationRead,
  markMobileNotificationSeen,
  MobileNotificationsApiError,
} from '@/features/notifications/api/mobileNotificationsApi';
import {
  enqueueNotificationSeen,
  listNotificationSeen,
} from '@/features/notifications/data/notificationSeenRepository';
import { sendQueuedNotificationSeen } from '@/features/notifications/services/sendNotificationSeen';

jest.mock('@/features/notifications/api/mobileNotificationsApi', () => ({
  MobileNotificationsApiError: class MobileNotificationsApiError extends Error {
    readonly code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
  markMobileNotificationRead: jest.fn(),
  markMobileNotificationSeen: jest.fn(),
}));

const sendSeen = jest.mocked(markMobileNotificationSeen);
const sendRead = jest.mocked(markMobileNotificationRead);

function openDatabase(): CaneGuardDatabase {
  const native = new DatabaseSync(':memory:');
  native.exec(
    readFileSync(join(process.cwd(), 'drizzle', '0033_notification_seen_outbox.sql'), 'utf8')
      .replaceAll('--> statement-breakpoint', ''),
  );
  const adapter = (statement: StatementSync) =>
    ({
      executeSync: (params: unknown[] = []) => {
        const result = statement.run(...(params as SQLInputValue[]));
        return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid), getAllSync: () => [], getFirstSync: () => null };
      },
      executeForRawResultSync: (params: unknown[] = []) => {
        const rows = statement.all(...(params as SQLInputValue[])) as Record<string, unknown>[];
        const columns = statement.columns();
        return { getAllSync: () => rows.map((row) => columns.map((column) => row[column.name])) };
      },
    }) as unknown as SQLiteStatement;
  const client = { prepareSync: (sql: string) => adapter(native.prepare(sql)) } as unknown as SQLiteDatabase;
  return drizzle(client, { schema }) as CaneGuardDatabase;
}

const OWNER = 'owner-1';
const FIRST = '4e04321c-a879-423f-875d-4cdce5e028a6';
const SECOND = '5f15432d-b98a-534f-986e-5dece6f139b7';
const SEEN_AT = '2026-11-12T08:00:00.000Z';

describe('queued Seen receipts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('keeps the first open time when the same advice is opened again', async () => {
    const database = openDatabase();
    await enqueueNotificationSeen(database, OWNER, [FIRST], SEEN_AT);
    await enqueueNotificationSeen(database, OWNER, [FIRST], '2026-11-12T09:00:00.000Z');

    await expect(listNotificationSeen(database, OWNER)).resolves.toEqual([
      expect.objectContaining({ notificationId: FIRST, seenAt: SEEN_AT }),
    ]);
  });

  it('sends the receipt with the time it was opened and clears it once the office has it', async () => {
    const database = openDatabase();
    await enqueueNotificationSeen(database, OWNER, [FIRST], SEEN_AT);
    sendSeen.mockResolvedValue(undefined);

    const result = await sendQueuedNotificationSeen({ database, ownerIdentity: OWNER, token: 't' });

    expect(sendSeen).toHaveBeenCalledWith({ id: FIRST, seenAt: SEEN_AT, token: 't' });
    expect(result).toMatchObject({ sent: 1, waiting: [] });
    await expect(listNotificationSeen(database, OWNER)).resolves.toEqual([]);
  });

  it('keeps every receipt queued with the reason no_connection while offline', async () => {
    const database = openDatabase();
    await enqueueNotificationSeen(database, OWNER, [FIRST, SECOND], SEEN_AT);
    sendSeen.mockRejectedValue(new MobileNotificationsApiError('NETWORK', 'offline'));

    const result = await sendQueuedNotificationSeen({ database, ownerIdentity: OWNER, token: 't' });

    expect(result.sent).toBe(0);
    expect(result.waiting.map((item) => item.reason)).toEqual(['no_connection', 'no_connection']);
    const rows = await listNotificationSeen(database, OWNER);
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.waitReason === 'no_connection' && row.attemptCount === 1)).toBe(true);
  });

  it('sends a receipt that waited offline once the phone is back online', async () => {
    const database = openDatabase();
    await enqueueNotificationSeen(database, OWNER, [FIRST], SEEN_AT);
    sendSeen.mockRejectedValueOnce(new MobileNotificationsApiError('TIMEOUT', 'slow'));
    await sendQueuedNotificationSeen({ database, ownerIdentity: OWNER, token: 't' });
    sendSeen.mockResolvedValueOnce(undefined);

    const result = await sendQueuedNotificationSeen({ database, ownerIdentity: OWNER, token: 't' });

    expect(result.sent).toBe(1);
    await expect(listNotificationSeen(database, OWNER)).resolves.toEqual([]);
  });

  it('falls back to mark-read when the server has no Seen event yet', async () => {
    const database = openDatabase();
    await enqueueNotificationSeen(database, OWNER, [FIRST], SEEN_AT);
    sendSeen.mockRejectedValue(new MobileNotificationsApiError('CAPABILITY_UNAVAILABLE', 'no'));
    sendRead.mockResolvedValue({} as never);

    const result = await sendQueuedNotificationSeen({ database, ownerIdentity: OWNER, token: 't' });

    expect(sendRead).toHaveBeenCalledWith({ id: FIRST, token: 't' });
    expect(result.sent).toBe(1);
    await expect(listNotificationSeen(database, OWNER)).resolves.toEqual([]);
  });

  it('never drops a receipt the office refuses: it stays queued as office_not_ready', async () => {
    const database = openDatabase();
    await enqueueNotificationSeen(database, OWNER, [FIRST], SEEN_AT);
    sendSeen.mockRejectedValue(new MobileNotificationsApiError('CAPABILITY_UNAVAILABLE', 'no'));
    sendRead.mockRejectedValue(new MobileNotificationsApiError('CAPABILITY_UNAVAILABLE', 'no'));

    const result = await sendQueuedNotificationSeen({ database, ownerIdentity: OWNER, token: 't' });

    expect(result.waiting).toEqual([{ notificationId: FIRST, reason: 'office_not_ready' }]);
    await expect(listNotificationSeen(database, OWNER)).resolves.toEqual([
      expect.objectContaining({ waitReason: 'office_not_ready' }),
    ]);
  });

  it('stops on an expired sign-in and keeps the receipts queued as sign_in_needed', async () => {
    const database = openDatabase();
    await enqueueNotificationSeen(database, OWNER, [FIRST, SECOND], SEEN_AT);
    sendSeen.mockRejectedValue(new MobileNotificationsApiError('AUTH_REQUIRED', 'expired'));

    const result = await sendQueuedNotificationSeen({ database, ownerIdentity: OWNER, token: 't' });

    expect(result.authRequired).toBe(true);
    expect(sendSeen).toHaveBeenCalledTimes(1);
    await expect(listNotificationSeen(database, OWNER)).resolves.toHaveLength(2);
  });

  it("never sends another account's receipts", async () => {
    const database = openDatabase();
    await enqueueNotificationSeen(database, 'owner-2', [FIRST], SEEN_AT);

    await sendQueuedNotificationSeen({ database, ownerIdentity: OWNER, token: 't' });

    expect(sendSeen).not.toHaveBeenCalled();
  });
});
