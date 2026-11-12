import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';

import { EMPTY_DATABASE, useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { getStorageErrorMessage, toStorageError } from '@/database/errors';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { net } from '@/features/net/reconnectCoordinator';
import {
  markAllMobileNotificationsRead,
  markMobileNotificationRead,
  MobileNotificationsApiError,
} from '@/features/notifications/api/mobileNotificationsApi';
import {
  listCachedMobileNotifications,
  markAllCachedMobileNotificationsRead,
  markCachedMobileNotificationRead,
} from '@/features/notifications/data/notificationCacheRepository';
import { enqueueNotificationSeen } from '@/features/notifications/data/notificationSeenRepository';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import { sendQueuedNotificationSeen } from '@/features/notifications/services/sendNotificationSeen';
import {
  registerDownloadStep,
  requestDownloadRun,
} from '@/features/mobile-data/services/downloadCoordinator';
import { refreshMobileNotifications } from '@/features/notifications/services/refreshMobileNotifications';
import {
  beginOwnerCacheLoad,
  beginOwnerRefresh,
  getOwnerMobileDataStore,
  isFresh,
  setOwnerNotifications,
  subscribeOwnerMobileData,
} from '@/features/mobile-data/data/mobileDataStore';

interface MobileNotificationsState {
  capabilityUnavailable: boolean;
  errorMessage: string | null;
  lastSuccessfulAt: string | null;
  notifications: MobileNotification[];
  partial: boolean;
  readActionError: string | null;
  refreshing: boolean;
  sessionKey: string | null;
}

export function useMobileNotifications(enabled = true, refreshOnFocus = true) {
  const database = useCaneGuardDatabase();
  const { markSessionExpired, session, status: authStatus } = useAuth();
  const [state, setState] = useState<MobileNotificationsState>({
    capabilityUnavailable: false,
    errorMessage: null,
    lastSuccessfulAt: null,
    notifications: [],
    partial: false,
    readActionError: null,
    refreshing: false,
    sessionKey: null,
  });
  const sessionRef = useRef(session);
  const mounted = useRef(true);
  const sessionKey = session ? `${session.user.uuid}:${session.token}` : null;
  const ownerStore =
    session && database !== EMPTY_DATABASE
      ? getOwnerMobileDataStore(database, session.user.uuid)
      : null;
  const [, setStoreRevision] = useState(0);

  useEffect(() => {
    if (!ownerStore) return;
    return subscribeOwnerMobileData(ownerStore, () => setStoreRevision((value) => value + 1));
  }, [ownerStore]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const isCurrentSession = useCallback(
    (requestedSession: typeof session) =>
      mounted.current &&
      requestedSession?.token === sessionRef.current?.token &&
      requestedSession?.user.uuid === sessionRef.current?.user.uuid,
    [],
  );

  const refresh = useCallback(async (options?: { force?: boolean }): Promise<boolean> => {
    const requestedSession = session;
    const force = options?.force !== false;
    if (
      !enabled ||
      authStatus !== 'authenticated' ||
      !requestedSession ||
      database === EMPTY_DATABASE ||
      !ownerStore
    ) {
      return false;
    }

    const store = ownerStore;
    const storeGeneration = store.generation;
    const isCurrentStore = () => store.generation === storeGeneration;
    const applyCached = (notifications: MobileNotification[]) => {
      if (isCurrentSession(requestedSession) && isCurrentStore()) {
        setState((current) => ({ ...current, notifications, sessionKey }));
      }
    };

    if (!force && isFresh(store.notifications)) {
      applyCached(store.notifications?.value ?? []);
      return true;
    }

    setState((current) => ({
      ...current,
      errorMessage: null,
      partial: false,
      refreshing: true,
      sessionKey,
    }));

    try {
      await beginOwnerCacheLoad(store, 'notifications', async () => {
        const cached = await listCachedMobileNotifications(
          database,
          requestedSession.user.uuid,
        );
        const fetchedAt = cached.reduce(
          (latest, notification) => Math.max(latest, Date.parse(notification.cachedAt)),
          0,
        );
        if (!isCurrentStore()) return;
        setOwnerNotifications(store, cached, fetchedAt);
        applyCached(cached);
      });
      if (!isCurrentStore()) return false;
      if (!force && isFresh(store.notifications)) {
        applyCached(store.notifications?.value ?? []);
        setState((current) => ({ ...current, refreshing: false }));
        return true;
      }
    } catch {
      // A network refresh may still recover a cache read failure.
    }

    try {
      return await beginOwnerRefresh(
        store,
        'notifications',
        `${requestedSession.user.uuid}:${requestedSession.token}`,
        async () => {
          const result = await refreshMobileNotifications({
            database,
            ownerIdentity: requestedSession.user.uuid,
            token: requestedSession.token,
          });
          if (!isCurrentSession(requestedSession) || !isCurrentStore()) return false;
          setOwnerNotifications(store, result.notifications, result.fetchedAt);
          setState({
            capabilityUnavailable: false,
            errorMessage: null,
            lastSuccessfulAt: result.fetchedAt,
            notifications: result.notifications,
            partial: result.partial,
            readActionError: null,
            refreshing: false,
            sessionKey,
          });
          return true;
        },
      );
    } catch (error: unknown) {
      if (!isCurrentSession(requestedSession) || !isCurrentStore()) return false;
      if (
        error instanceof MobileNotificationsApiError &&
        error.code === 'AUTH_REQUIRED'
      ) {
        await markSessionExpired();
        return false;
      }
      const capabilityUnavailable =
        error instanceof MobileNotificationsApiError &&
        error.code === 'CAPABILITY_UNAVAILABLE';
      setState((current) => ({
        ...current,
        capabilityUnavailable,
        errorMessage: capabilityUnavailable
          ? 'Notifications are unavailable on this server. Showing saved attention items.'
          : (store.notifications?.value.length ?? current.notifications.length)
            ? "Couldn't refresh - showing saved attention items."
            : error instanceof Error && error.message.includes('cache')
              ? getStorageErrorMessage(
                  toStorageError(
                    error,
                    'QUERY_FAILED',
                    'Reading cached notifications failed.',
                  ),
                )
              : "Couldn't refresh notifications.",
        refreshing: false,
      }));
      return false;
    }
  }, [authStatus, database, enabled, isCurrentSession, markSessionExpired, ownerStore, session, sessionKey]);

  /**
   * Send the queued Seen receipts. Best effort: whatever cannot go stays queued
   * with its wait reason and is tried again on the next run.
   */
  const flushSeen = useCallback(async () => {
    const requestedSession = session;
    if (!enabled || authStatus !== 'authenticated' || !requestedSession || database === EMPTY_DATABASE) {
      return;
    }
    try {
      const result = await sendQueuedNotificationSeen({
        database,
        ownerIdentity: requestedSession.user.uuid,
        token: requestedSession.token,
        isCurrent: () => isCurrentSession(requestedSession),
      });
      if (result.authRequired && isCurrentSession(requestedSession)) await markSessionExpired();
    } catch {
      // The receipts are still queued; the next run tries again.
    }
  }, [authStatus, database, enabled, isCurrentSession, markSessionExpired, session]);

  useEffect(
    () =>
      registerDownloadStep('updates', async () => {
        // Receipts go first so the refreshed feed already reflects them.
        await flushSeen();
        return refresh({ force: false });
      }),
    [flushSeen, refresh],
  );

  useEffect(() => {
    if (ownerStore && ownerStore.generation > 0) {
      requestDownloadRun();
    }
  }, [ownerStore, ownerStore?.generation, refresh]);

  useFocusEffect(
    useCallback(() => {
      if (enabled && refreshOnFocus) requestDownloadRun();
    }, [enabled, refreshOnFocus]),
  );

  // Back online, the coordinator's Download step calls this feed's own refresh.
  useEffect(
    () => net.registerDownload(() => {
      void refresh({ force: false });
    }),
    [refresh],
  );

  useEffect(() => {
    mounted.current = true;
    let previousState: string | null = AppState.currentState ?? null;
    const subscription = AppState.addEventListener('change', (nextState) => {
      const becameActive = nextState === 'active' && previousState !== 'active';
      previousState = nextState;
      if (becameActive) requestDownloadRun();
    });
    return () => {
      mounted.current = false;
      subscription.remove();
    };
  }, []);

  /**
   * Opening advice is a Seen of its own. The receipt is saved on the phone
   * first, so it survives going offline; the update shows as read at once and
   * the receipt is sent now or when the phone is back online.
   */
  const recordSeen = useCallback(
    async (notificationIds: string[]) => {
      const requestedSession = session;
      const requestedStoreGeneration = ownerStore?.generation;
      if (!requestedSession || notificationIds.length === 0) return;
      const seenAt = new Date().toISOString();
      try {
        await enqueueNotificationSeen(
          database,
          requestedSession.user.uuid,
          notificationIds,
          seenAt,
        );
      } catch {
        if (!isCurrentSession(requestedSession)) return;
        setState((current) => ({
          ...current,
          readActionError: "Couldn't save that you saw this update. Open it again to retry.",
        }));
        return;
      }
      if (
        isCurrentSession(requestedSession) &&
        ownerStore?.generation === requestedStoreGeneration
      ) {
        const ids = new Set(notificationIds);
        try {
          for (const id of ids) {
            await markCachedMobileNotificationRead(
              database,
              requestedSession.user.uuid,
              id,
              seenAt,
            );
          }
        } catch {
          // The cache catches up with the next refresh; the receipt is already saved.
        }
        const notifications = (ownerStore?.notifications?.value ?? []).map((notification) =>
          ids.has(notification.id) && !notification.isRead
            ? { ...notification, isRead: true, readAt: seenAt }
            : notification,
        );
        if (ownerStore) {
          setOwnerNotifications(ownerStore, notifications, ownerStore.notifications?.fetchedAt ?? Date.now());
        }
        setState((current) => ({ ...current, readActionError: null, notifications }));
      }
      await flushSeen();
    },
    [database, flushSeen, isCurrentSession, ownerStore, session],
  );

  const markRead = useCallback(
    async (notificationId: string) => {
      const requestedSession = session;
      const requestedStoreGeneration = ownerStore?.generation;
      if (!enabled || authStatus !== 'authenticated' || !requestedSession) return;

      const opened = ownerStore?.notifications?.value.find(
        (notification) => notification.id === notificationId,
      );
      if (opened?.advisory) {
        await recordSeen([notificationId]);
        return;
      }

      try {
        const result = await markMobileNotificationRead({
          id: notificationId,
          token: requestedSession.token,
        });
        if (
          !isCurrentSession(requestedSession) ||
          ownerStore?.generation !== requestedStoreGeneration
        ) return;
        const readAt = result.notification.readAt ?? new Date().toISOString();
        await markCachedMobileNotificationRead(
          database,
          requestedSession.user.uuid,
          notificationId,
          readAt,
        );
        const notifications = (ownerStore?.notifications?.value ?? []).map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true, readAt }
            : notification,
        );
        if (ownerStore) {
          setOwnerNotifications(ownerStore, notifications, ownerStore.notifications?.fetchedAt ?? Date.now());
        }
        setState((current) => ({ ...current, readActionError: null, notifications }));
      } catch (error: unknown) {
        if (!isCurrentSession(requestedSession)) return;
        if (
          error instanceof MobileNotificationsApiError &&
          error.code === 'AUTH_REQUIRED'
        ) {
          await markSessionExpired();
          return;
        }
        setState((current) => ({
          ...current,
          readActionError:
            "Couldn't mark this update as read. It is still unread.",
        }));
      }
    },
    [authStatus, database, enabled, isCurrentSession, markSessionExpired, ownerStore, recordSeen, session],
  );

  const markAllRead = useCallback(async () => {
    const requestedSession = session;
    const requestedStoreGeneration = ownerStore?.generation;
    if (!enabled || authStatus !== 'authenticated' || !requestedSession) return;

    // Mark-all counts as Seen for every unread advice update.
    const unreadAdvice = (ownerStore?.notifications?.value ?? [])
      .filter((notification) => notification.advisory && !notification.isRead)
      .map((notification) => notification.id);
    if (unreadAdvice.length > 0) {
      try {
        await enqueueNotificationSeen(
          database,
          requestedSession.user.uuid,
          unreadAdvice,
          new Date().toISOString(),
        );
      } catch {
        if (!isCurrentSession(requestedSession)) return;
        setState((current) => ({
          ...current,
          readActionError: "Couldn't mark every update as read. Unread items remain.",
        }));
        return;
      }
      await flushSeen();
    }

    try {
      await markAllMobileNotificationsRead({ token: requestedSession.token });
      if (
        !isCurrentSession(requestedSession) ||
        ownerStore?.generation !== requestedStoreGeneration
      ) return;
      const readAt = new Date().toISOString();
      await markAllCachedMobileNotificationsRead(
        database,
        requestedSession.user.uuid,
        readAt,
      );
      const notifications = (ownerStore?.notifications?.value ?? []).map((notification) =>
        notification.isRead ? notification : { ...notification, isRead: true, readAt },
      );
      if (ownerStore) {
        setOwnerNotifications(ownerStore, notifications, ownerStore.notifications?.fetchedAt ?? Date.now());
      }
      setState((current) => ({ ...current, readActionError: null, notifications }));
    } catch (error: unknown) {
      if (!isCurrentSession(requestedSession)) return;
      if (
        error instanceof MobileNotificationsApiError &&
        error.code === 'AUTH_REQUIRED'
      ) {
        await markSessionExpired();
        return;
      }
      setState((current) => ({
        ...current,
        readActionError: "Couldn't mark every update as read. Unread items remain.",
      }));
    }
  }, [authStatus, database, enabled, flushSeen, isCurrentSession, markSessionExpired, ownerStore, session]);

  const visibleState = state.sessionKey === sessionKey
    ? {
        ...state,
        notifications: ownerStore?.notifications?.value ?? state.notifications,
      }
    : {
        capabilityUnavailable: false,
        errorMessage: null,
        lastSuccessfulAt: null,
        notifications: ownerStore?.notifications?.value ?? [],
        partial: false,
        readActionError: null,
        refreshing: false,
        sessionKey,
      };

  return {
    ...visibleState,
    markAllRead,
    markRead,
    refresh,
    unreadCount: visibleState.notifications.filter((notification) => !notification.isRead).length,
  };
}
