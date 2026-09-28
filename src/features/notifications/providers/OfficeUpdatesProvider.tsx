import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
 * The provider reads the shared owner cache without its own focus refresh,
 * because Home, Activity, and the attention lifecycle already refresh it; the
 * mount-time cache read below matches the app-wide attention lifecycle so this
 * instance can still report load state to the panel.
 */
export function OfficeUpdatesProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const notifications = useMobileNotifications(true, false);
  const destinations = useNotificationDestinations(notifications.notifications);
  const { showToast } = useToast();
  const { markAllRead, markRead, refresh, unreadCount } = notifications;

  useEffect(() => {
    void refresh({ force: false });
  }, [refresh]);

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
