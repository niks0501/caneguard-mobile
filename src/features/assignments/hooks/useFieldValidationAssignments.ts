import { useFocusEffect } from 'expo-router';
import { AppState, type AppStateStatus } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { getStorageErrorMessage, toStorageError } from '@/database/errors';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  MobileFieldValidationAssignmentsApiError,
} from '@/features/assignments/api/mobileFieldValidationAssignmentsApi';
import { listCachedFieldValidationAssignments } from '@/features/assignments/data/assignmentCacheRepository';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import { refreshFieldValidationAssignments } from '@/features/assignments/services/refreshFieldValidationAssignments';

interface AssignmentState {
  assignments: FieldValidationAssignment[];
  capabilityUnavailable: boolean;
  errorMessage: string | null;
  lastSuccessfulAt: string | null;
  refreshing: boolean;
  sessionKey: string | null;
}

export function useFieldValidationAssignments(enabled = true) {
  const database = useCaneGuardDatabase();
  const { markSessionExpired, session, status: authStatus } = useAuth();
  const [state, setState] = useState<AssignmentState>({
    assignments: [],
    capabilityUnavailable: false,
    errorMessage: null,
    lastSuccessfulAt: null,
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

  const refresh = useCallback(async (): Promise<boolean> => {
    const requestedSession = session;
    if (!enabled || authStatus !== 'authenticated' || !requestedSession) return false;

    setState((current) => ({
      ...current,
      errorMessage: null,
      refreshing: true,
      sessionKey,
    }));

    try {
      const cached = await listCachedFieldValidationAssignments(
        database,
        requestedSession.user.uuid,
      );
      if (isCurrentSession(requestedSession)) {
        setState((current) => ({
          ...current,
          assignments: cached,
          sessionKey,
        }));
      }
    } catch {
      // A network refresh can still recover a cache read failure.
    }

    try {
      const result = await refreshFieldValidationAssignments({
        database,
        ownerIdentity: requestedSession.user.uuid,
        token: requestedSession.token,
      });
      if (!isCurrentSession(requestedSession)) return false;
      setState({
        assignments: result.assignments,
        capabilityUnavailable: false,
        errorMessage: null,
        lastSuccessfulAt: result.fetchedAt,
        refreshing: false,
        sessionKey,
      });
      return true;
    } catch (error: unknown) {
      if (!isCurrentSession(requestedSession)) return false;
      if (
        error instanceof MobileFieldValidationAssignmentsApiError &&
        error.code === 'AUTH_REQUIRED'
      ) {
        await markSessionExpired();
        return false;
      }
      const capabilityUnavailable =
        error instanceof MobileFieldValidationAssignmentsApiError &&
        error.code === 'CAPABILITY_UNAVAILABLE';
      setState((current) => ({
        ...current,
        capabilityUnavailable,
        errorMessage: capabilityUnavailable
          ? 'Field validation assignments are unavailable on this server. Showing the saved assignment cache.'
          : current.assignments.length
            ? "Couldn't refresh - showing saved assignments."
            : error instanceof Error && error.message.includes('cache')
              ? getStorageErrorMessage(
                  toStorageError(
                    error,
                    'QUERY_FAILED',
                    'Reading cached field validation assignments failed.',
                  ),
                )
              : "Couldn't refresh field validation assignments.",
        refreshing: false,
      }));
      return false;
    }
  }, [authStatus, database, enabled, isCurrentSession, markSessionExpired, session, sessionKey]);

  useFocusEffect(
    useCallback(() => {
      if (enabled) void refresh();
    }, [enabled, refresh]),
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

  const visibleState =
    state.sessionKey === sessionKey
      ? state
      : {
          assignments: [],
          capabilityUnavailable: false,
          errorMessage: null,
          lastSuccessfulAt: null,
          refreshing: false,
          sessionKey,
        };

  return { ...visibleState, refresh };
}
