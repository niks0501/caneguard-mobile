import type { CaneGuardDatabase } from '@/database/database';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import {
  findCachedFieldValidationAssignment,
  findCachedFieldValidationAssignmentForCase,
} from '@/features/assignments/data/assignmentCacheRepository';
import { findScanRecordIdForCase } from '@/features/reports/data/fieldReportRepository';

export type NotificationDestination =
  | { kind: 'assignment'; assignmentId: string }
  | { kind: 'field_report'; scanRecordId: string }
  | { kind: 'field_survey'; surveyId: string }
  | { kind: 'unavailable' };

/**
 * Resolve where a notification can actually take an inspector on this device.
 *
 * An assignment notification is actionable only when the assignment exists in
 * this owner's local cache. Reporters can receive the same office update as an
 * assignee, so an unknown assignment UUID falls back to the owner's cached
 * office-case assignment for that case, and then to their local Field Report,
 * instead of advertising a dead assignment route. A case that was never stored
 * on this device (or was removed) resolves to `unavailable`.
 *
 * When `fetchVisitsOnMiss` is given, an unknown case downloads visits once and
 * looks again before settling on `unavailable`, so a new visit that has not been
 * downloaded yet still opens.
 */
export async function resolveNotificationDestination(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  notification: Pick<
    MobileNotification,
    'assignmentUuid' | 'caseUuid' | 'referenceCode'
  >,
  options?: { fetchVisitsOnMiss?: () => Promise<void> },
): Promise<NotificationDestination> {
  const destination = await lookupNotificationDestination(
    database,
    ownerIdentity,
    notification,
  );
  if (destination.kind !== 'unavailable' || !options?.fetchVisitsOnMiss) {
    return destination;
  }
  try {
    await options.fetchVisitsOnMiss();
  } catch {
    return destination;
  }
  return lookupNotificationDestination(database, ownerIdentity, notification);
}

async function lookupNotificationDestination(
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

  // Office-born cases have no Field Report on this phone; their notification may
  // carry only the case, so match the cached office-case assignment by case.
  const caseAssignment = await findCachedFieldValidationAssignmentForCase(
    database,
    ownerIdentity,
    { caseUuid: notification.caseUuid, referenceCode: notification.referenceCode },
  );
  if (caseAssignment) {
    return { kind: 'assignment', assignmentId: caseAssignment.id };
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
  | { pathname: '/field-survey'; params: { surveyId: string } }
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
  if (destination.kind === 'field_survey') {
    return {
      pathname: '/field-survey',
      params: { surveyId: destination.surveyId },
    };
  }
  return null;
}
