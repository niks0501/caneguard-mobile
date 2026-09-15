import type { CaneGuardDatabase } from '@/database/database';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import { findCachedFieldValidationAssignment } from '@/features/assignments/data/assignmentCacheRepository';
import { findScanRecordIdForCase } from '@/features/reports/data/fieldReportRepository';

export type NotificationDestination =
  | { kind: 'assignment'; assignmentId: string }
  | { kind: 'field_report'; scanRecordId: string }
  | { kind: 'unavailable' };

/**
 * Resolve where a notification can actually take an inspector on this device.
 *
 * An assignment notification is actionable only when the assignment exists in
 * this owner's local cache. Reporters can receive the same office update as an
 * assignee, so an unknown assignment UUID falls through to the owner's local
 * Field Report instead of advertising a dead assignment route. A case that was
 * never stored on this device (or was removed) resolves to `unavailable`.
 */
export async function resolveNotificationDestination(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  notification: Pick<
    MobileNotification,
    'assignmentUuid' | 'caseUuid' | 'referenceCode'
  >,
): Promise<NotificationDestination> {
  const assignmentId = notification.assignmentUuid?.trim();
  if (assignmentId) {
    const cachedAssignment = await findCachedFieldValidationAssignment(
      database,
      ownerIdentity,
      assignmentId,
    );
    if (cachedAssignment) {
      return { kind: 'assignment', assignmentId };
    }
  }

  const scanRecordId = await findScanRecordIdForCase(database, ownerIdentity, {
    caseUuid: notification.caseUuid,
    referenceCode: notification.referenceCode,
  });

  return scanRecordId
    ? { kind: 'field_report', scanRecordId }
    : { kind: 'unavailable' };
}

export function notificationDestinationRoute(
  destination: NotificationDestination,
):
  | { pathname: '/field-validation'; params: { assignmentId: string } }
  | { pathname: '/field-report'; params: { scanRecordId: string } }
  | null {
  if (destination.kind === 'assignment') {
    return {
      pathname: '/field-validation',
      params: { assignmentId: destination.assignmentId },
    };
  }
  if (destination.kind === 'field_report') {
    return {
      pathname: '/field-report',
      params: { scanRecordId: destination.scanRecordId },
    };
  }
  return null;
}
