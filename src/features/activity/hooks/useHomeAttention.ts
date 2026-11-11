import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { useUnfinishedDrafts } from '@/features/activity/hooks/useUnfinishedDrafts';
import {
  buildNeedsAttention,
  type NeedsAttentionItem,
} from '@/features/activity/domain/needsAttention';
import { useFieldValidationAssignments } from '@/features/assignments/hooks/useFieldValidationAssignments';
import { getLocalDateKey } from '@/features/assignments/domain/todayVisits';
import { useMobileNotifications } from '@/features/notifications/hooks/useMobileNotifications';
import { useNotificationDestinations } from '@/features/notifications/hooks/useNotificationDestinations';

export interface HomeAttention {
  /** Unfinished drafts, active assignments and unread office updates, ordered by immediacy. */
  items: NeedsAttentionItem[];
  /** Marks an office update as read; best effort, never blocks navigation. */
  markRead: (notificationId: string) => Promise<void>;
  total: number;
}

/**
 * The work that is waiting for the inspector, for the Home card.
 *
 * Every source is an owner-scoped local cache that refreshes on focus, so the
 * card paints from cache immediately and still works with no connectivity.
 * Upload work is deliberately excluded: the Home sync line already reports it,
 * and the same pending upload must never appear twice on one screen.
 */
export function useHomeAttention(): HomeAttention {
  const assignments = useFieldValidationAssignments();
  const notifications = useMobileNotifications();
  const destinations = useNotificationDestinations(notifications.notifications);
  const [today, setToday] = useState(getLocalDateKey);
  const drafts = useUnfinishedDrafts();

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = setTimeout(
      () => setToday(getLocalDateKey()),
      nextMidnight.getTime() - now.getTime(),
    );
    return () => clearTimeout(timer);
  }, [today]);

  useEffect(() => {
    let previousState: string | null = AppState.currentState ?? null;
    const subscription = AppState.addEventListener('change', (nextState) => {
      const becameActive = nextState === 'active' && previousState !== 'active';
      previousState = nextState;
      if (becameActive) setToday(getLocalDateKey());
    });
    return () => subscription.remove();
  }, []);

  const items = useMemo(
    () =>
      buildNeedsAttention({
        assignments: assignments.assignments,
        destinations,
        drafts,
        notifications: notifications.notifications,
        pendingUploadCount: 0,
        syncErrorMessage: null,
        today,
      }).items,
    [assignments.assignments, destinations, drafts, notifications.notifications, today],
  );

  return {
    items,
    markRead: notifications.markRead,
    total: items.length,
  };
}
