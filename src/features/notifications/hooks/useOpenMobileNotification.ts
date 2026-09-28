import { router } from 'expo-router';
import { useCallback } from 'react';

import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import {
  notificationDestinationRoute,
  type NotificationDestination,
} from '@/features/notifications/services/resolveNotificationDestination';

/**
 * One way to open an office update from a list: acknowledge it, close the
 * surface that showed it, then open its detail or its destination.
 *
 * Acknowledgment is best effort: a failed read mutation never blocks the
 * inspector from opening the destination or the detail view.
 */
export function useOpenMobileNotification({
  destinations,
  markRead,
  onClose,
}: {
  destinations: Map<string, NotificationDestination>;
  markRead: (notificationId: string) => Promise<void>;
  onClose: () => void;
}) {
  return useCallback(
    (notification: MobileNotification) => {
      const destination = destinations.get(notification.id);
      const hasDetail = Boolean(notification.content || notification.advisory);
      if (!hasDetail && (!destination || destination.kind === 'unavailable')) return;

      void markRead(notification.id);
      onClose();

      if (hasDetail) {
        router.push({
          pathname: '/notification-details',
          params: { id: notification.id },
        } as never);
        return;
      }

      const route = destination ? notificationDestinationRoute(destination) : null;
      if (route) {
        router.push(route as never);
      }
    },
    [destinations, markRead, onClose],
  );
}
