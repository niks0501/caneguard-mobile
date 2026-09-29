import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useToast } from '@/components/ui/Toast';
import { OFFICE_UPDATES_MARKED_READ } from '@/constants/copy';
import { OfficeUpdatesPanel } from '@/features/notifications/components/OfficeUpdatesPanel';
import { useMobileNotifications } from '@/features/notifications/hooks/useMobileNotifications';
import { useNotificationDestinations } from '@/features/notifications/hooks/useNotificationDestinations';
import { useOpenMobileNotification } from '@/features/notifications/hooks/useOpenMobileNotification';

export interface OfficeUpdatesContextValue {
  close: () => void;
  isOpen: boolean;
  open: () => void;
  unreadCount: number;
}

const OfficeUpdatesContext = createContext<OfficeUpdatesContextValue>({
  close: () => {},
  isOpen: false,
  open: () => {},
  unreadCount: 0,
});

export function useOfficeUpdates(): OfficeUpdatesContextValue {
  return useContext(OfficeUpdatesContext);
}

/**
 * Owns the one floating office-updates panel and the unread count that the
 * Home pill and the Activity tab both read. The panel is rendered here so the
 * whole app shares one instance: tapping the Home pill or the Activity bell
 * opens the same surface over the current screen, and nothing is added to the
 * page behind it.
 *
 * The provider reads the shared owner cache without its own focus refresh and
 * without a mount refresh: the attention lifecycle and the Home screen already
 * start that read, and the owner store keeps them from turning into repeated
 * requests, so a third entry point on cold start only cost a duplicate cache
 * read and a duplicate state write.
 */
export function OfficeUpdatesProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const notifications = useMobileNotifications(true, false);
  // The panel is the only consumer of the resolved destinations, and it is
  // closed most of the session, so the resolution waits for the first open
  // instead of running on cold start beside the Home attention card.
  const destinations = useNotificationDestinations(notifications.notifications, isOpen);
  const { showToast } = useToast();
  const { markAllRead, markRead, unreadCount } = notifications;

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const markAllReadWithConfirmation = useCallback(() => {
    void markAllRead();
    showToast(OFFICE_UPDATES_MARKED_READ, 'info');
  }, [markAllRead, showToast]);

  const openNotification = useOpenMobileNotification({
    destinations,
    markRead,
    onClose: close,
  });

  const value = useMemo(
    () => ({ close, isOpen, open, unreadCount }),
    [close, isOpen, open, unreadCount],
  );

  return (
    <OfficeUpdatesContext.Provider value={value}>
      {children}
      <OfficeUpdatesPanel
        destinations={destinations}
        errorMessage={notifications.errorMessage}
        notifications={notifications.notifications}
        onClose={close}
        onMarkAllRead={markAllReadWithConfirmation}
        onNotificationPress={openNotification}
        partial={notifications.partial}
        readActionError={notifications.readActionError}
        unreadCount={unreadCount}
        visible={isOpen}
      />
    </OfficeUpdatesContext.Provider>
  );
}
