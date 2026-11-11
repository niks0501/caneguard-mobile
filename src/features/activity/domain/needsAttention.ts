import { NAMING, OFFICE_UPDATE_NOT_ON_PHONE } from '@/constants/copy';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import {
  assignmentDueMeta,
  bucketForVisit,
  compareVisits,
  isActiveFieldValidationAssignment,
  type TodayVisitBucket,
} from '@/features/assignments/domain/todayVisits';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import { UPLOAD_FAILED_META, type SyncTone } from '@/features/sync/utils/syncStatusCopy';
import type { NotificationDestination } from '@/features/notifications/services/resolveNotificationDestination';

export type NeedsAttentionKind = 'assignment' | 'notification' | 'upload';

export interface NeedsAttentionItem {
  /** Visit urgency, set on assignment items only. */
  bucket?: TodayVisitBucket;
  destination: NotificationDestination | null;
  id: string;
  kind: NeedsAttentionKind;
  message: string;
  meta: string;
  /** Where the visit is (barangay), set on assignment items only. */
  place?: string;
  /** The case reference, set on assignment items only. */
  referenceCode?: string;
  title: string;
  /** How loud this item may be: ordinary work whispers, overdue work is a note. */
  tone?: SyncTone;
}

export interface NeedsAttentionSummary {
  hiddenCount: number;
  items: NeedsAttentionItem[];
  total: number;
}

export const NEEDS_ATTENTION_ROW_LIMIT = 3;

/**
 * Home shows fewer rows than Activity and hands off with a single "See all"
 * line, so the work-first card never grows into a second inbox.
 */
export const HOME_ATTENTION_ROW_LIMIT = 2;

/**
 * Whether tapping an item can lead anywhere on this device. One definition, so
 * the Home button and the Home rows never disagree about what is tappable.
 */
export function isActionableAttentionItem(item: NeedsAttentionItem): boolean {
  return Boolean(item.destination && item.destination.kind !== 'unavailable');
}

/**
 * The item the single Home button acts on: the first one that can actually be
 * opened. Null when every item is informational.
 */
export function firstActionableAttentionItem(
  items: readonly NeedsAttentionItem[],
): NeedsAttentionItem | null {
  return items.find(isActionableAttentionItem) ?? null;
}

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
            ? OFFICE_UPDATE_NOT_ON_PHONE
            : notification.referenceCode ?? 'Case activity',
        title: notification.title,
        tone: 'whisper' as const,
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
    .map((assignment): NeedsAttentionItem => {
      const bucket = bucketForVisit(assignment, input.today);
      return {
        bucket,
        destination: { kind: 'assignment' as const, assignmentId: assignment.id },
        id: `assignment-${assignment.id}`,
        kind: 'assignment' as const,
        message: `${assignment.case.barangay} · submitted by ${assignment.submitter.name}`,
        meta: assignmentDueMeta(assignment, input.today),
        place: assignment.case.barangay,
        referenceCode: assignment.referenceCode,
        title: `${NAMING.visit} for ${assignment.referenceCode}`,
        tone: bucket === 'overdue' ? 'note' : 'whisper',
      };
    });
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
      tone: failed ? 'note' : 'whisper',
    },
  ];
}
