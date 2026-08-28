import { useFocusEffect } from 'expo-router';
import { AppState, type AppStateStatus } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { getStorageErrorMessage, toStorageError } from '@/database/errors';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  MobileNotificationsApiError,
} from '@/features/notifications/api/mobileNotificationsApi';
import { listCachedMobileNotifications } from '@/features/notifications/data/notificationCacheRepository';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import { refreshMobileNotifications } from '@/features/notifications/services/refreshMobileNotifications';

interface MobileNotificationsState {
  capabilityUnavailable: boolean;
  errorMessage: string | null;
  lastSuccessfulAt: string | null;
  notifications: MobileNotification[];
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
    refreshing: false,
    sessionKey: null,
  });
  const sessionRef = useRef(session);
  const mounted = useRef(true);
  const sessionKey = session ? `${session.user.uuid}:${session.token}` : null;

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

  const refresh = useCallback(async () => {
    const requestedSession = session;
    if (!enabled || authStatus !== 'authenticated' || !requestedSession) return;

    setState((current) => ({
      ...current,
      errorMessage: null,
      refreshing: true,
      sessionKey,
    }));

    try {
      const cached = await listCachedMobileNotifications(
        database,
        requestedSession.user.uuid,
      );
      if (isCurrentSession(requestedSession)) {
        setState((current) => ({ ...current, notifications: cached, sessionKey }));
      }
    } catch {
      // A network refresh may still recover a cache read failure.
    }

    try {
      const result = await refreshMobileNotifications({
        database,
        ownerIdentity: requestedSession.user.uuid,
        token: requestedSession.token,
      });
      if (!isCurrentSession(requestedSession)) return;
      setState({
        capabilityUnavailable: false,
        errorMessage: null,
        lastSuccessfulAt: result.fetchedAt,
        notifications: result.notifications,
        refreshing: false,
        sessionKey,
      });
    } catch (error: unknown) {
      if (!isCurrentSession(requestedSession)) return;
      if (
        error instanceof MobileNotificationsApiError &&
        error.code === 'AUTH_REQUIRED'
      ) {
        await markSessionExpired();
        return;
      }
      const capabilityUnavailable =
        error instanceof MobileNotificationsApiError &&
        error.code === 'CAPABILITY_UNAVAILABLE';
      setState((current) => ({
        ...current,
        capabilityUnavailable,
        errorMessage: capabilityUnavailable
          ? 'Notifications are unavailable on this server. Showing saved attention items.'
          : current.notifications.length
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
    }
  }, [authStatus, database, enabled, isCurrentSession, markSessionExpired, session, sessionKey]);

  useFocusEffect(
    useCallback(() => {
      if (enabled && refreshOnFocus) void refresh();
    }, [enabled, refresh, refreshOnFocus]),
  );

  useEffect(() => {
    mounted.current = true;
    let previousState: AppStateStatus | null = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextState) => {
      const becameActive = nextState === 'active' && previousState !== 'active';
      previousState = nextState;
      if (becameActive) void refresh();
    });
    return () => {
      mounted.current = false;
      subscription.remove();
    };
  }, [refresh]);

  const visibleState = state.sessionKey === sessionKey
    ? state
    : {
        capabilityUnavailable: false,
        errorMessage: null,
        lastSuccessfulAt: null,
        notifications: [],
        refreshing: false,
        sessionKey,
      };

  return {
    ...visibleState,
    refresh,
    unreadCount: visibleState.notifications.filter((notification) => !notification.isRead).length,
  };
}
