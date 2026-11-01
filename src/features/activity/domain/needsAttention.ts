import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import {
  assignmentDueMeta,
  compareVisits,
  isActiveFieldValidationAssignment,
} from '@/features/assignments/domain/todayVisits';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import type { SyncTone } from '@/features/sync/utils/syncStatusCopy';
import type { NotificationDestination } from '@/features/notifications/services/resolveNotificationDestination';

export type NeedsAttentionKind = 'assignment' | 'notification' | 'upload';

export interface NeedsAttentionItem {
  destination: NotificationDestination | null;
  id: string;
  kind: NeedsAttentionKind;
  message: string;
  meta: string;
  title: string;
}

export interface NeedsAttentionSummary {
  hiddenCount: number;
  items: NeedsAttentionItem[];
  total: number;
}

/**
 * Voice for an attention row: a failed upload is Stop, an overdue visit is a
 * Note, and everything else (unread updates, waiting uploads, upcoming visits)
 * whispers in ink.
 */
export function getAttentionTone(item: NeedsAttentionItem): SyncTone {
  if (item.kind === 'upload') {
    return item.meta === UPLOAD_FAILED_META ? 'stop' : 'whisper';
  }
  return item.kind === 'assignment' && item.meta.startsWith('Visit was due')
    ? 'note'
    : 'whisper';
}

const UPLOAD_FAILED_META = 'Could not send';

export const NEEDS_ATTENTION_ROW_LIMIT = 3;

/**
 * Home shows fewer rows than Activity and hands off with a single "See all"
 * line, so the work-first card never grows into a second inbox.
 */
export const HOME_ATTENTION_ROW_LIMIT = 2;

/**
 * Build the Needs Attention block: unread office updates, active/due field
 * assignments, and report upload work, ordered by immediacy. The presenter caps
 * the detailed rows and offers expansion for the rest.
 */
export function buildNeedsAttention(input: {
  assignments: FieldValidationAssignment[];
  destinations: Map<string, NotificationDestination>;
  notifications: MobileNotification[];
  pendingUploadCount: number;
  pendingReportsCount?: number;
  pendingCompletionsCount?: number;
  syncErrorMessage: string | null;
  today: string;
}): NeedsAttentionSummary {
  const items: NeedsAttentionItem[] = [
    ...unreadNotificationItems(input),
    ...assignmentItems(input),
    ...uploadItems(input),
  ];

  return {
    items,
    total: items.length,
    hiddenCount: Math.max(items.length - NEEDS_ATTENTION_ROW_LIMIT, 0),
  };
}

function unreadNotificationItems(input: {
  destinations: Map<string, NotificationDestination>;
  notifications: MobileNotification[];
}): NeedsAttentionItem[] {
  return [...input.notifications]
    .filter((notification) => !notification.isRead)
    .sort(
      (first, second) =>
        Date.parse(second.createdAt ?? '') - Date.parse(first.createdAt ?? '') ||
        second.id.localeCompare(first.id),
    )
    .map((notification) => {
      const destination = input.destinations.get(notification.id) ?? {
        kind: 'unavailable' as const,
      };
      return {
        destination,
        id: `notification-${notification.id}`,
        kind: 'notification' as const,
        message: notification.message,
        meta:
          destination.kind === 'unavailable'
            ? 'This case is not stored on this device'
            : notification.referenceCode ?? 'Case activity',
        title: notification.title,
      };
    });
}

function assignmentItems(input: {
  assignments: FieldValidationAssignment[];
  today: string;
}): NeedsAttentionItem[] {
  return input.assignments
    .filter((assignment) =>
      isActiveFieldValidationAssignment(assignment),
    )
    .sort(compareVisits)
    .map((assignment) => ({
      destination: { kind: 'assignment' as const, assignmentId: assignment.id },
      id: `assignment-${assignment.id}`,
      kind: 'assignment' as const,
      message: `${assignment.case.barangay} · submitted by ${assignment.submitter.name}`,
      meta: assignmentDueMeta(assignment, input.today),
      title: `Field visit for ${assignment.referenceCode}`,
    }));
}

function uploadItems(input: {
  pendingUploadCount: number;
  pendingReportsCount?: number;
  pendingCompletionsCount?: number;
  syncErrorMessage: string | null;
}): NeedsAttentionItem[] {
  if (input.pendingUploadCount <= 0) {
    return [];
  }
  const failed = Boolean(input.syncErrorMessage);
  const reportsCount = input.pendingReportsCount ?? input.pendingUploadCount;
  const completionsCount = input.pendingCompletionsCount ?? 0;
  let nounPhrase = `${input.pendingUploadCount} ${input.pendingUploadCount === 1 ? 'report' : 'reports'}`;
  if (completionsCount > 0 && reportsCount === 0) {
    nounPhrase = `${completionsCount} ${completionsCount === 1 ? 'field visit' : 'field visits'}`;
  } else if (completionsCount > 0 && reportsCount > 0) {
    nounPhrase = `${input.pendingUploadCount} ${input.pendingUploadCount === 1 ? 'item' : 'items'}`;
  }
  return [
    {
      destination: null,
      id: 'upload-pending',
      kind: 'upload',
      message: failed
        ? input.syncErrorMessage ??
          'Some items could not be sent yet. They stay saved on this device.'
        : completionsCount > 0 && reportsCount === 0
          ? 'Completed field visits saved on this device are waiting to send.'
          : 'Reports saved on this device are waiting to send.',
      meta: failed ? UPLOAD_FAILED_META : 'Waiting to send',
      title: `${nounPhrase} waiting to send`,
    },
  ];
}
