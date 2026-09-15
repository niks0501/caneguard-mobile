import { useEffect, useRef, useState } from 'react';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import {
  resolveNotificationDestination,
  type NotificationDestination,
} from '@/features/notifications/services/resolveNotificationDestination';

/**
 * Resolve where each cached notification can actually take the signed-in
 * inspector on this device. Resolution is owner-scoped: a notification whose
 * case is not stored here stays explicitly non-actionable instead of opening an
 * unrelated screen.
 */
export function useNotificationDestinations(
  notifications: MobileNotification[],
): Map<string, NotificationDestination> {
  const database = useCaneGuardDatabase();
  const { user } = useAuth();
  const ownerIdentity = user?.uuid ?? null;
  const [destinations, setDestinations] = useState<
    Map<string, NotificationDestination>
  >(() => new Map());
  const notificationsRef = useRef(notifications);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const identityKey = notifications
    .map(
      (notification) =>
        `${notification.id}:${notification.caseUuid ?? ''}:${notification.referenceCode ?? ''}:${notification.assignmentUuid ?? ''}`,
    )
    .join('|');

  useEffect(() => {
    let cancelled = false;

    if (!ownerIdentity) {
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      const entries = await Promise.all(
        notificationsRef.current.map(async (notification) => {
          try {
            return [
              notification.id,
              await resolveNotificationDestination(
                database,
                ownerIdentity,
                notification,
              ),
            ] as const;
          } catch {
            return [
              notification.id,
              { kind: 'unavailable' } as NotificationDestination,
            ] as const;
          }
        }),
      );
      if (!cancelled) {
        setDestinations(new Map(entries));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [database, identityKey, ownerIdentity]);

  return ownerIdentity ? destinations : EMPTY_DESTINATIONS;
}

const EMPTY_DESTINATIONS: Map<string, NotificationDestination> = new Map();
