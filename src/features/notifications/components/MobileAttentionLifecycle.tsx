import { useEffect } from 'react';

import { useMobileNotifications } from '@/features/notifications/hooks/useMobileNotifications';

/**
 * Keep the attention cache current even when the user opens Home first.
 * Mobile intentionally uses REST refreshes only; this component never opens a
 * Reverb or WebSocket connection.
 */
export function MobileAttentionLifecycle() {
  const { refresh } = useMobileNotifications(true, false);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return null;
}
