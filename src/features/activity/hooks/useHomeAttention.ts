import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { useUnfinishedDrafts } from '@/features/activity/hooks/useUnfinishedDrafts';
import {
  buildNeedsAttention,
  type NeedsAttentionItem,
} from '@/features/activity/domain/needsAttention';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import { useFieldValidationAssignments } from '@/features/assignments/hooks/useFieldValidationAssignments';
import { usePhoneCompletionSnapshot } from '@/features/assignments/hooks/usePhoneCompletionStates';
import { getLocalDateKey, selectTodayVisits } from '@/features/assignments/domain/todayVisits';
import { useMobileNotifications } from '@/features/notifications/hooks/useMobileNotifications';
import { useNotificationDestinations } from '@/features/notifications/hooks/useNotificationDestinations';

const NO_VISITS: FieldValidationAssignment[] = [];

export interface HomeAttention {
  /** Unfinished drafts, visits still owed on this phone and unread office updates, ordered by immediacy. */
  items: NeedsAttentionItem[];
  /** Marks an office update as read; best effort, never blocks navigation. */
  markRead: (notificationId: string) => Promise<void>;
  total: number;
  /** True when a saved-visit read failed. */
  visitsCheckFailed: boolean;
  /** True while saved-visit state has not been established yet. */
  visitsCheckPending: boolean;
}

/**
 * The work that is waiting for the inspector, for the Home card.
 *
 * Every source is an owner-scoped local cache that refreshes on focus, so the
 * card paints from cache immediately and still works with no connectivity.
 * A visit already saved on this phone is finished work, even while the cached
 * assignment still says active, so it is never counted, listed or offered as
 * the next visit. No visit work is derived until the saved visits for the
 * signed-in account have been read, so a completed visit never flashes back.
 * Upload work is deliberately excluded: the Home sync line already reports it,
 * and the same pending upload must never appear twice on one screen.
 */
export function useHomeAttention(): HomeAttention {
  const assignments = useFieldValidationAssignments();
  const completions = usePhoneCompletionSnapshot();
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

  const visits = useMemo(
    () =>
      completions.ready
        ? selectTodayVisits(assignments.assignments, new Set(completions.states.keys()))
        : NO_VISITS,
    [assignments.assignments, completions],
  );

  const items = useMemo(
    () =>
      buildNeedsAttention({
        assignments: visits,
        destinations,
        drafts,
        notifications: notifications.notifications,
        pendingUploadCount: 0,
        syncErrorMessage: null,
        today,
      }).items,
    [destinations, drafts, notifications.notifications, today, visits],
  );

  return {
    items,
    markRead: notifications.markRead,
    total: items.length,
    visitsCheckFailed: assignments.failed || completions.failed,
    visitsCheckPending:
      !assignments.failed && !completions.failed &&
      (!assignments.ready || !completions.ready),
  };
}
