import type { CaneGuardDatabase } from '@/database/database';
import type { NotificationSeenWaitReason } from '@/database/schema';
import {
  markMobileNotificationRead,
  markMobileNotificationSeen,
  MobileNotificationsApiError,
} from '@/features/notifications/api/mobileNotificationsApi';
import {
  deleteNotificationSeen,
  listNotificationSeen,
  recordNotificationSeenWait,
} from '@/features/notifications/data/notificationSeenRepository';

export interface SendNotificationSeenResult {
  sent: number;
  /** Receipts still queued, each with the reason it waits. */
  waiting: { notificationId: string; reason: NotificationSeenWaitReason }[];
  authRequired: boolean;
}

function waitReasonFor(error: unknown): NotificationSeenWaitReason {
  if (error instanceof MobileNotificationsApiError) {
    if (error.code === 'AUTH_REQUIRED') return 'sign_in_needed';
    if (error.code === 'NETWORK' || error.code === 'TIMEOUT') return 'no_connection';
  }
  return 'office_not_ready';
}

/**
 * Send every queued Seen for one owner, oldest first. A receipt leaves the
 * queue only when the office has it. A server without the Seen event falls
 * back to today's mark-read, which also acknowledges the advice there; a
 * failure of either keeps the receipt queued with a named reason. A lost
 * connection or an expired sign-in stops the run, since the rest would fail
 * the same way.
 */
export async function sendQueuedNotificationSeen(options: {
  database: CaneGuardDatabase;
  ownerIdentity: string;
  token: string;
  isCurrent?: () => boolean;
}): Promise<SendNotificationSeenResult> {
  const { database, ownerIdentity, token } = options;
  const result: SendNotificationSeenResult = { sent: 0, waiting: [], authRequired: false };
  const rows = await listNotificationSeen(database, ownerIdentity);

  for (const row of rows) {
    if (options.isCurrent && !options.isCurrent()) break;
    try {
      try {
        await markMobileNotificationSeen({
          id: row.notificationId,
          seenAt: row.seenAt,
          token,
        });
      } catch (error: unknown) {
        if (!(error instanceof MobileNotificationsApiError) || error.code !== 'CAPABILITY_UNAVAILABLE') {
          throw error;
        }
        await markMobileNotificationRead({ id: row.notificationId, token });
      }
      await deleteNotificationSeen(database, ownerIdentity, row.notificationId);
      result.sent += 1;
    } catch (error: unknown) {
      const reason = waitReasonFor(error);
      await recordNotificationSeenWait(
        database,
        ownerIdentity,
        row.notificationId,
        reason,
        new Date().toISOString(),
      );
      result.waiting.push({ notificationId: row.notificationId, reason });
      if (reason === 'sign_in_needed') {
        result.authRequired = true;
        break;
      }
      if (reason === 'no_connection') {
        // Everything after this one waits for the same reason.
        for (const rest of rows.slice(rows.indexOf(row) + 1)) {
          await recordNotificationSeenWait(
            database,
            ownerIdentity,
            rest.notificationId,
            reason,
            new Date().toISOString(),
          );
          result.waiting.push({ notificationId: rest.notificationId, reason });
        }
        break;
      }
    }
  }
  return result;
}
