import type { CaneGuardDatabase } from '@/database/database';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import { findScanRecordIdForCase } from '@/features/reports/data/fieldReportRepository';

export type NotificationDestination =
  | { kind: 'assignment'; assignmentId: string }
  | { kind: 'field_report'; scanRecordId: string }
  | { kind: 'unavailable' };

/**
 * Resolve where a notification can actually take an inspector on this device.
 *
 * An assignment notification always wins because the assignment route carries
 * its own owner-scoped server cache. Case and report notifications resolve to a
 * Field Report owned by the signed-in inspector; a case that was never stored on
 * this device (or was removed) resolves to `unavailable` so the surface never
 * advertises navigation it cannot perform.
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
    return { kind: 'assignment', assignmentId };
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
