import { and, asc, eq } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
import { mobileNotifications } from '@/database/schema';
import type {
  MobileNotification,
  MobileNotificationUpdate,
} from '@/features/notifications/domain/notificationTypes';

type ConfirmedReadMap = Map<string, Map<string, string>>;
const confirmedReads = new WeakMap<CaneGuardDatabase, ConfirmedReadMap>();

export async function listCachedMobileNotifications(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): Promise<MobileNotification[]> {
  const owner = requireOwner(ownerIdentity);
  try {
    const rows = await database
      .select()
      .from(mobileNotifications)
      .where(eq(mobileNotifications.ownerIdentity, owner))
      .orderBy(asc(mobileNotifications.createdAt), asc(mobileNotifications.id));
    return rows.map(toNotification);
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'QUERY_FAILED',
      'Reading cached notifications failed.',
    );
  }
}

/**
 * Replace one owner's complete server snapshot only after every feed page has
 * validated. A failed refresh therefore leaves the last known state intact.
 */
export async function replaceCachedMobileNotifications(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  updates: MobileNotificationUpdate[],
  cachedAt: string,
): Promise<void> {
  const owner = requireOwner(ownerIdentity);
  if (!cachedAt || Number.isNaN(Date.parse(cachedAt))) {
    throw new StorageError('UPDATE_FAILED', 'The notification cache timestamp is invalid.');
  }

  try {
    database.transaction((transaction) => {
      transaction
        .delete(mobileNotifications)
        .where(eq(mobileNotifications.ownerIdentity, owner))
        .run();

      for (const update of updates) {
        transaction
          .insert(mobileNotifications)
          .values(toRow(applyConfirmedRead(database, owner, update), owner, cachedAt))
          .run();
      }
    });
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'UPDATE_FAILED',
      'Updating cached notifications failed.',
    );
  }
}

/**
 * Apply a confirmed server acknowledgment to one owner-scoped cached row.
 * Returns true only when the row belonged to this owner and was updated.
 */
export async function markCachedMobileNotificationRead(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  notificationId: string,
  readAt: string,
): Promise<boolean> {
  const owner = requireOwner(ownerIdentity);
  if (!readAt || Number.isNaN(Date.parse(readAt))) {
    throw new StorageError('UPDATE_FAILED', 'The notification read timestamp is invalid.');
  }

  // The API mutation is confirmed before this helper runs. Record the
  // tombstone before yielding to SQLite so an older in-flight feed GET cannot
  // restore this notification as unread.
  rememberConfirmedRead(database, owner, notificationId, readAt);

  try {
    const result = await database
      .update(mobileNotifications)
      .set({ isRead: true, readAt })
      .where(
        and(
          eq(mobileNotifications.ownerIdentity, owner),
          eq(mobileNotifications.id, notificationId),
        ),
      );
    return result.changes > 0;
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'UPDATE_FAILED',
      'Updating the cached notification failed.',
    );
  }
}

/** Mark every unread cached row for one owner as read; returns rows changed. */
export async function markAllCachedMobileNotificationsRead(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  readAt: string,
): Promise<number> {
  const owner = requireOwner(ownerIdentity);
  if (!readAt || Number.isNaN(Date.parse(readAt))) {
    throw new StorageError('UPDATE_FAILED', 'The notification read timestamp is invalid.');
  }

  try {
    const unreadRows = await database
      .select({ id: mobileNotifications.id })
      .from(mobileNotifications)
      .where(
        and(
          eq(mobileNotifications.ownerIdentity, owner),
          eq(mobileNotifications.isRead, false),
        ),
      );
    for (const row of unreadRows) {
      rememberConfirmedRead(database, owner, row.id, readAt);
    }

    const result = await database
      .update(mobileNotifications)
      .set({ isRead: true, readAt })
      .where(
        and(
          eq(mobileNotifications.ownerIdentity, owner),
          eq(mobileNotifications.isRead, false),
        ),
      );
    return result.changes;
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'UPDATE_FAILED',
      'Updating cached notifications failed.',
    );
  }
}

function applyConfirmedRead(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  update: MobileNotificationUpdate,
): MobileNotificationUpdate {
  const readAt = confirmedReads.get(database)?.get(ownerIdentity)?.get(update.id);
  return readAt ? { ...update, isRead: true, readAt } : update;
}

function rememberConfirmedRead(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  notificationId: string,
  readAt: string,
): void {
  let owners = confirmedReads.get(database);
  if (!owners) {
    owners = new Map();
    confirmedReads.set(database, owners);
  }
  let notifications = owners.get(ownerIdentity);
  if (!notifications) {
    notifications = new Map();
    owners.set(ownerIdentity, notifications);
  }
  notifications.set(notificationId, readAt);
}

function toRow(
  update: MobileNotificationUpdate,
  ownerIdentity: string,
  cachedAt: string,
): typeof mobileNotifications.$inferInsert {
  return {
    id: update.id,
    ownerIdentity,
    eventType: update.eventType,
    title: update.title,
    message: update.message,
    caseUuid: update.caseUuid,
    referenceCode: update.referenceCode,
    assignmentUuid: update.assignmentUuid,
    isRead: update.isRead,
    readAt: update.readAt,
    createdAt: update.createdAt,
    cachedAt,
  };
}

function toNotification(
  row: typeof mobileNotifications.$inferSelect,
): MobileNotification {
  return {
    id: row.id,
    ownerIdentity: row.ownerIdentity,
    eventType: row.eventType,
    title: row.title,
    message: row.message,
    caseUuid: row.caseUuid,
    referenceCode: row.referenceCode,
    assignmentUuid: row.assignmentUuid,
    isRead: row.isRead,
    readAt: row.readAt,
    createdAt: row.createdAt,
    cachedAt: row.cachedAt,
  };
}

function requireOwner(value: string): string {
  const owner = value.trim();
  if (!owner) {
    throw new StorageError('UPDATE_FAILED', 'The notification cache owner is invalid.');
  }
  return owner;
}
