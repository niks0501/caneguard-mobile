import { useFocusEffect } from 'expo-router';
import { AppState, type AppStateStatus } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';

import { EMPTY_DATABASE, useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { getStorageErrorMessage, toStorageError } from '@/database/errors';
import { useAuth } from '@/features/auth/hooks/useAuth';
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
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
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
    const applyCached = (notifications: MobileNotification[]) => {
      if (isCurrentSession(requestedSession)) {
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
        setOwnerNotifications(store, cached, fetchedAt);
        applyCached(cached);
      });
      if (!force && isFresh(store.notifications)) {
        applyCached(store.notifications?.value ?? []);
        setState((current) => ({ ...current, refreshing: false }));
        return true;
      }
    } catch {
      // A network refresh may still recover a cache read failure.
    }

    try {
      return await beginOwnerRefresh(store, 'notifications', async () => {
        const result = await refreshMobileNotifications({
          database,
          ownerIdentity: requestedSession.user.uuid,
          token: requestedSession.token,
        });
        if (!isCurrentSession(requestedSession)) return false;
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
      });
    } catch (error: unknown) {
      if (!isCurrentSession(requestedSession)) return false;
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

  useFocusEffect(
    useCallback(() => {
      if (enabled && refreshOnFocus) void refresh({ force: false });
    }, [enabled, refresh, refreshOnFocus]),
  );

  useEffect(() => {
    mounted.current = true;
    let previousState: AppStateStatus | null = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextState) => {
      const becameActive = nextState === 'active' && previousState !== 'active';
      previousState = nextState;
      if (becameActive) void refresh({ force: false });
    });
    return () => {
      mounted.current = false;
      subscription.remove();
    };
  }, [refresh]);

  const markRead = useCallback(
    async (notificationId: string) => {
      const requestedSession = session;
      if (!enabled || authStatus !== 'authenticated' || !requestedSession) return;

      try {
        const result = await markMobileNotificationRead({
          id: notificationId,
          token: requestedSession.token,
        });
        if (!isCurrentSession(requestedSession)) return;
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
    [authStatus, database, enabled, isCurrentSession, markSessionExpired, ownerStore, session],
  );

  const markAllRead = useCallback(async () => {
    const requestedSession = session;
    if (!enabled || authStatus !== 'authenticated' || !requestedSession) return;

    try {
      await markAllMobileNotificationsRead({ token: requestedSession.token });
      if (!isCurrentSession(requestedSession)) return;
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
  }, [authStatus, database, enabled, isCurrentSession, markSessionExpired, ownerStore, session]);

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
