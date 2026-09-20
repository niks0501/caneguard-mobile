import { useMemo } from 'react';

import {
  buildNeedsAttention,
  type NeedsAttentionItem,
} from '@/features/activity/domain/needsAttention';
import { useFieldValidationAssignments } from '@/features/assignments/hooks/useFieldValidationAssignments';
import { getLocalDateKey } from '@/features/assignments/domain/todayVisits';
import { useMobileNotifications } from '@/features/notifications/hooks/useMobileNotifications';
import { useNotificationDestinations } from '@/features/notifications/hooks/useNotificationDestinations';

export interface HomeAttention {
  /** Active assignments and unread office updates, ordered by immediacy. */
  items: NeedsAttentionItem[];
  /** Marks an office update as read; best effort, never blocks navigation. */
  markRead: (notificationId: string) => Promise<void>;
  total: number;
}

/**
 * The work that is waiting for the inspector, for the Home card.
 *
 * Both sources are owner-scoped local caches that refresh on focus, so the card
 * paints from cache immediately and still works with no connectivity. Upload
 * work is deliberately excluded: the Home sync row already reports it, and the
 * same pending upload must never appear twice on one screen.
 */
export function useHomeAttention(): HomeAttention {
  const assignments = useFieldValidationAssignments();
  const notifications = useMobileNotifications();
  const destinations = useNotificationDestinations(notifications.notifications);

  const items = useMemo(
    () =>
      buildNeedsAttention({
        assignments: assignments.assignments,
        destinations,
        notifications: notifications.notifications,
        pendingUploadCount: 0,
        syncErrorMessage: null,
        today: getLocalDateKey(),
      }).items,
    [assignments.assignments, destinations, notifications.notifications],
  );

  return {
    items,
    markRead: notifications.markRead,
    total: items.length,
  };
}
