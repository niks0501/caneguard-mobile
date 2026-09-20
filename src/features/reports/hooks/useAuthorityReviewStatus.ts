import { useFocusEffect } from 'expo-router';
import { AppState, type AppStateStatus } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  ReportStatusesApiError,
} from '@/features/reports/api/mobileReportStatusesApi';
import { hasStaleAuthorityReviewCache } from '@/features/reports/data/fieldReportReviewRepository';
import { refreshAuthorityReviewStatus } from '@/features/reports/services/refreshAuthorityReviewStatus';

const STALE_AFTER_MS = 45_000;

interface AuthorityReviewStatusState {
  capabilityUnavailable: boolean;
  errorMessage: string | null;
  lastSuccessfulAt: string | null;
  refreshing: boolean;
  sessionKey: string | null;
}

export function useAuthorityReviewStatus(enabled = true) {
  const database = useCaneGuardDatabase();
  const { markSessionExpired, session, status: authStatus } = useAuth();
  const [state, setState] = useState<AuthorityReviewStatusState>({
    capabilityUnavailable: false,
    errorMessage: null,
    lastSuccessfulAt: null,
    refreshing: false,
    sessionKey: null,
  });
  const sessionRef = useRef(session);
  const mounted = useRef(true);
  const sessionKey = session
    ? `${session.user.uuid}:${session.token}`
    : null;

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

  const refresh = useCallback(async (_options?: { force?: boolean }): Promise<boolean> => {
    const requestedSession = session;
    if (!enabled || authStatus !== 'authenticated' || !requestedSession) {
      return false;
    }

    setState((current) => ({
      ...current,
      errorMessage: null,
      refreshing: true,
      sessionKey,
    }));
    try {
      const result = await refreshAuthorityReviewStatus({
        database,
        submitterIdentity: requestedSession.user.uuid,
        token: requestedSession.token,
      });
      if (!isCurrentSession(requestedSession)) {
        return false;
      }
      setState({
        capabilityUnavailable: false,
        errorMessage: null,
        lastSuccessfulAt: result.fetchedAt,
        refreshing: false,
        sessionKey,
      });
      return true;
    } catch (error: unknown) {
      if (!isCurrentSession(requestedSession)) {
        return false;
      }
      if (
        error instanceof ReportStatusesApiError &&
        error.code === 'AUTH_REQUIRED'
      ) {
        await markSessionExpired();
        return false;
      }
      const capabilityUnavailable =
        error instanceof ReportStatusesApiError &&
        error.code === 'CAPABILITY_UNAVAILABLE';
      setState((current) => ({
        ...current,
        capabilityUnavailable,
        errorMessage: capabilityUnavailable
          ? 'Authority review status is unavailable on this server. Your saved report and synchronization status are unchanged.'
          : current.lastSuccessfulAt
            ? 'Couldn’t refresh—showing the last update.'
            : 'Couldn’t refresh authority review status. Your saved report and synchronization status are unchanged.',
        refreshing: false,
      }));
      return false;
    }
  }, [
    authStatus,
    database,
    enabled,
    isCurrentSession,
    markSessionExpired,
    session,
    sessionKey,
  ]);

  const refreshIfStale = useCallback(async () => {
    if (!enabled || authStatus !== 'authenticated' || !session) {
      return;
    }
    try {
      const staleBefore = new Date(Date.now() - STALE_AFTER_MS).toISOString();
      if (
        await hasStaleAuthorityReviewCache(
          database,
          session.user.uuid,
          staleBefore,
        )
      ) {
        await refresh();
      }
    } catch {
      if (isCurrentSession(session)) {
        setState((current) => ({
          ...current,
          errorMessage: current.lastSuccessfulAt
            ? 'Couldn’t refresh—showing the last update.'
            : 'Couldn’t read authority review cache state. Your saved report and synchronization status are unchanged.',
          refreshing: false,
          sessionKey,
        }));
      }
    }
  }, [
    authStatus,
    database,
    enabled,
    isCurrentSession,
    refresh,
    session,
    sessionKey,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (enabled) {
        void refreshIfStale();
      }
    }, [enabled, refreshIfStale]),
  );

  useEffect(() => {
    mounted.current = true;
    let previousState: AppStateStatus | null = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextState) => {
      const becameActive =
        nextState === 'active' && previousState !== 'active';
      previousState = nextState;
      if (becameActive) {
        void refreshIfStale();
      }
    });
    return () => {
      mounted.current = false;
      subscription.remove();
    };
  }, [refreshIfStale]);

  const visibleState =
    state.sessionKey === sessionKey
      ? state
      : {
          capabilityUnavailable: false,
          errorMessage: null,
          lastSuccessfulAt: null,
          refreshing: false,
          sessionKey,
        };

  return {
    ...visibleState,
    refresh,
  };
}
