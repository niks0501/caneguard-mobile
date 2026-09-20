import { useFocusEffect } from 'expo-router';
import { AppState, type AppStateStatus } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';

import { EMPTY_DATABASE, useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { getStorageErrorMessage, toStorageError } from '@/database/errors';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  MobileFieldValidationAssignmentsApiError,
} from '@/features/assignments/api/mobileFieldValidationAssignmentsApi';
import { listCachedFieldValidationAssignments } from '@/features/assignments/data/assignmentCacheRepository';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import { refreshFieldValidationAssignments } from '@/features/assignments/services/refreshFieldValidationAssignments';
import {
  beginOwnerCacheLoad,
  beginOwnerRefresh,
  getOwnerMobileDataStore,
  isFresh,
  setOwnerAssignments,
  subscribeOwnerMobileData,
} from '@/features/mobile-data/data/mobileDataStore';

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
    const applyCached = (assignments: FieldValidationAssignment[]) => {
      if (isCurrentSession(requestedSession)) {
        setState((current) => ({
          ...current,
          assignments,
          sessionKey,
        }));
      }
    };

    if (!force && isFresh(store.assignments)) {
      applyCached(store.assignments?.value ?? []);
      return true;
    }

    setState((current) => ({
      ...current,
      errorMessage: null,
      refreshing: true,
      sessionKey,
    }));

    try {
      await beginOwnerCacheLoad(store, 'assignments', async () => {
        const cached = await listCachedFieldValidationAssignments(
          database,
          requestedSession.user.uuid,
        );
        const fetchedAt = cached.reduce(
          (latest, assignment) => Math.max(latest, Date.parse(assignment.cachedAt)),
          0,
        );
        setOwnerAssignments(store, cached, fetchedAt);
        applyCached(cached);
      });
      if (!force && isFresh(store.assignments)) {
        applyCached(store.assignments?.value ?? []);
        setState((current) => ({ ...current, refreshing: false }));
        return true;
      }
    } catch {
      // A network refresh can still recover a cache read failure.
    }

    try {
      return await beginOwnerRefresh(store, 'assignments', async () => {
        const result = await refreshFieldValidationAssignments({
          database,
          ownerIdentity: requestedSession.user.uuid,
          token: requestedSession.token,
        });
        if (!isCurrentSession(requestedSession)) return false;
        setOwnerAssignments(store, result.assignments, result.fetchedAt);
        setState({
          assignments: result.assignments,
          capabilityUnavailable: false,
          errorMessage: null,
          lastSuccessfulAt: result.fetchedAt,
          refreshing: false,
          sessionKey,
        });
        return true;
      });
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
          : (store.assignments?.value.length ?? current.assignments.length)
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
  }, [authStatus, database, enabled, isCurrentSession, markSessionExpired, ownerStore, session, sessionKey]);

  useFocusEffect(
    useCallback(() => {
      if (enabled) void refresh({ force: false });
    }, [enabled, refresh]),
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

  const visibleState =
    state.sessionKey === sessionKey
      ? {
          ...state,
          assignments: ownerStore?.assignments?.value ?? state.assignments,
        }
      : {
          assignments: ownerStore?.assignments?.value ?? [],
          capabilityUnavailable: false,
          errorMessage: null,
          lastSuccessfulAt: null,
          refreshing: false,
          sessionKey,
        };

  return { ...visibleState, refresh };
}
