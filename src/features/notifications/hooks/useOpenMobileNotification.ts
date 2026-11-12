import { router } from 'expo-router';
import { useCallback, useRef } from 'react';

import { useToast } from '@/components/ui/Toast';
import { OFFICE_UPDATE_NOT_ON_PHONE, OFFICE_UPDATE_STILL_OPENING } from '@/constants/copy';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import {
  notificationDestinationRoute,
  type NotificationDestination,
} from '@/features/notifications/services/resolveNotificationDestination';

/**
 * One way to open an office update from a list: acknowledge it, close the
 * surface that showed it, then open its detail or its destination.
 *
 * While a notification with no detail of its own is still resolving (no
 * destination yet), a tap neither marks it read nor closes the surface: it
 * shows a toast so the update is not consumed without opening anything. A
 * resolved update whose case is not on this phone is acknowledged but left
 * open with a toast that says where the case lives, so no tap ends in a silent
 * no-op.
 *
 * Acknowledgment is best effort: a failed read mutation never blocks the
 * inspector from opening the destination or the detail view.
 */
export function useOpenMobileNotification({
  destinations,
  markRead,
  onClose,
  resolveAgain,
}: {
  destinations: Map<string, NotificationDestination>;
  markRead: (notificationId: string) => Promise<void>;
  onClose: () => void;
  /** Looks the destination up again after one visits download; used for a case not on this phone. */
  resolveAgain?: (notification: MobileNotification) => Promise<NotificationDestination>;
}) {
  const { showToast } = useToast();
  const resolving = useRef(new Set<string>());

  return useCallback(
    async (notification: MobileNotification) => {
      let destination = destinations.get(notification.id);
      const hasDetail = Boolean(notification.content || notification.advisory);

      if (
        !hasDetail &&
        destination?.kind === 'unavailable' &&
        resolveAgain &&
        !resolving.current.has(notification.id)
      ) {
        resolving.current.add(notification.id);
        try {
          destination = await resolveAgain(notification);
        } catch {
          // Keep the unavailable answer; the toast below still explains it.
        } finally {
          resolving.current.delete(notification.id);
        }
      }
      const openable = hasDetail || (destination && destination.kind !== 'unavailable');

      if (!hasDetail && !destination) {
        showToast(OFFICE_UPDATE_STILL_OPENING, 'info');
        return;
      }

      void markRead(notification.id);
      if (!openable) {
        showToast(OFFICE_UPDATE_NOT_ON_PHONE, 'info');
        return;
      }
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
    [destinations, markRead, onClose, resolveAgain, showToast],
  );
}
