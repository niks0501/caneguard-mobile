import { and, asc, eq } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { toStorageError } from '@/database/errors';
import {
  notificationSeenOutbox,
  type NotificationSeenRow,
  type NotificationSeenWaitReason,
} from '@/database/schema';

/**
 * Queue a Seen receipt. The first open wins: opening the same advice again
 * never moves `seen_at` later, and a receipt already waiting keeps its reason.
 */
export async function enqueueNotificationSeen(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  notificationIds: string[],
  seenAt: string,
): Promise<void> {
  if (notificationIds.length === 0) return;
  try {
    await database
      .insert(notificationSeenOutbox)
      .values(
        notificationIds.map((notificationId) => ({
          ownerIdentity,
          notificationId,
          seenAt,
        })),
      )
      .onConflictDoNothing();
  } catch (error: unknown) {
    throw toStorageError(error, 'UPDATE_FAILED', 'Saving the Seen receipt failed.');
  }
}

export async function listNotificationSeen(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): Promise<NotificationSeenRow[]> {
  try {
    return await database
      .select()
      .from(notificationSeenOutbox)
      .where(eq(notificationSeenOutbox.ownerIdentity, ownerIdentity))
      .orderBy(asc(notificationSeenOutbox.seenAt), asc(notificationSeenOutbox.notificationId));
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Reading the Seen receipts failed.');
  }
}

/** The office has the receipt; only now may the row go. */
export async function deleteNotificationSeen(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  notificationId: string,
): Promise<void> {
  try {
    await database
      .delete(notificationSeenOutbox)
      .where(ownerAndNotification(ownerIdentity, notificationId));
  } catch (error: unknown) {
    throw toStorageError(error, 'DELETE_FAILED', 'Clearing the Seen receipt failed.');
  }
}

/** Keep the receipt and name why it is still waiting. */
export async function recordNotificationSeenWait(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  notificationId: string,
  reason: NotificationSeenWaitReason,
  attemptedAt: string,
): Promise<void> {
  try {
    const [row] = await database
      .select()
      .from(notificationSeenOutbox)
      .where(ownerAndNotification(ownerIdentity, notificationId));
    if (!row) return;
    await database
      .update(notificationSeenOutbox)
      .set({
        waitReason: reason,
        attemptCount: row.attemptCount + 1,
        lastAttemptAt: attemptedAt,
      })
      .where(ownerAndNotification(ownerIdentity, notificationId));
  } catch (error: unknown) {
    throw toStorageError(error, 'UPDATE_FAILED', 'Updating the Seen receipt failed.');
  }
}

function ownerAndNotification(ownerIdentity: string, notificationId: string) {
  return and(
    eq(notificationSeenOutbox.ownerIdentity, ownerIdentity),
    eq(notificationSeenOutbox.notificationId, notificationId),
  );
}
