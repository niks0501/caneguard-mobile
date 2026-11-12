import { canReadFieldValidationAssignments } from '@/features/auth/capabilities';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';

import { EMPTY_DATABASE, useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { getStorageErrorMessage, toStorageError } from '@/database/errors';
import type { RefreshOutcome } from '@/features/activity/domain/refreshAll';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  MobileFieldValidationAssignmentsApiError,
} from '@/features/assignments/api/mobileFieldValidationAssignmentsApi';
import {
  listCachedFieldValidationAssignments,
  readCachedFieldValidationSkippedCount,
} from '@/features/assignments/data/assignmentCacheRepository';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import { prefetchOfficeMedia } from '@/features/assignments/services/officeMediaCache';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';
import { refreshFieldValidationAssignments } from '@/features/assignments/services/refreshFieldValidationAssignments';
import {
  beginOwnerCacheLoad,
  beginOwnerRefresh,
  getOwnerMobileDataStore,
  isFresh,
  setOwnerAssignments,
  setOwnerAssignmentsReadState,
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

function describeRefreshFailure(error: unknown, hasCachedAssignments: boolean): string {
  if (error instanceof MobileFieldValidationAssignmentsApiError) {
    if (error.code === 'MALFORMED_RESPONSE') return error.message;
    if (error.code === 'CAPABILITY_UNAVAILABLE') {
      return 'Visits are unavailable on this server. Showing the saved visit cache.';
    }
  }
  if (hasCachedAssignments) return "Couldn't refresh - showing saved visits.";
  if (error instanceof Error && error.message.includes('cache')) {
    return getStorageErrorMessage(
      toStorageError(
        error,
        'QUERY_FAILED',
        'Reading cached visits failed.',
      ),
    );
  }
  return "Couldn't refresh visits.";
}

export function useFieldValidationAssignments(enabled = true) {
  const database = useCaneGuardDatabase();
  const { markSessionExpired, session, status: authStatus } = useAuth();
  const canRead = canReadFieldValidationAssignments(session?.user);
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

  const refreshOutcome = useCallback(async (options?: { force?: boolean }): Promise<RefreshOutcome> => {
    const requestedSession = session;
    const force = options?.force !== false;
    if (
      !enabled ||
      !canRead ||
      authStatus !== 'authenticated' ||
      !requestedSession ||
      database === EMPTY_DATABASE ||
      !ownerStore
    ) {
      return 'skipped';
    }

    const store = ownerStore;
    const storeGeneration = store.generation;
    const isCurrentStore = () => store.generation === storeGeneration;
    const applyCached = (assignments: FieldValidationAssignment[]) => {
      if (isCurrentSession(requestedSession) && isCurrentStore()) {
        setState((current) => ({
          ...current,
          assignments,
          sessionKey,
        }));
      }
    };

    if (!force && store.assignmentsVerified && isFresh(store.assignments)) {
      applyCached(store.assignments?.value ?? []);
      return 'ok';
    }

    setOwnerAssignmentsReadState(store, { refreshing: true, failed: false });
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
        const cachedSkippedCount = await readCachedFieldValidationSkippedCount(
          database,
          requestedSession.user.uuid,
        );
        const fetchedAt = cached.reduce(
          (latest, assignment) => Math.max(latest, Date.parse(assignment.cachedAt)),
          0,
        );
        if (!isCurrentStore()) return;
        setOwnerAssignments(store, cached, fetchedAt, cachedSkippedCount);
        applyCached(cached);
      });
      if (!isCurrentStore()) return 'skipped';
      if (!force && store.assignmentsVerified && isFresh(store.assignments)) {
        applyCached(store.assignments?.value ?? []);
        setOwnerAssignmentsReadState(store, { refreshing: false, failed: false });
        setState((current) => ({ ...current, refreshing: false }));
        return 'ok';
      }
    } catch {
      // A network refresh can still recover a cache read failure.
    }

    try {
      return await beginOwnerRefresh<RefreshOutcome>(
        store,
        'assignments',
        `${requestedSession.user.uuid}:${requestedSession.token}`,
        async () => {
          const result = await refreshFieldValidationAssignments({
            database,
            ownerIdentity: requestedSession.user.uuid,
            token: requestedSession.token,
          });
          if (!isCurrentSession(requestedSession) || !isCurrentStore()) return 'skipped';
          setOwnerAssignments(
            store,
            result.assignments,
            result.fetchedAt,
            result.skippedCount,
          );
          setOwnerAssignmentsReadState(store, { refreshing: false, failed: false, verified: true });
          prefetchAfterDownload(requestedSession.user.uuid, requestedSession.token, result.assignments);
          setState({
            assignments: result.assignments,
            capabilityUnavailable: false,
            errorMessage: null,
            lastSuccessfulAt: result.fetchedAt,
            refreshing: false,
            sessionKey,
          });
          return 'ok';
        },
      );
    } catch (error: unknown) {
      if (!isCurrentSession(requestedSession) || !isCurrentStore()) return 'skipped';
      setOwnerAssignmentsReadState(store, { refreshing: false, failed: true });
      if (
        error instanceof MobileFieldValidationAssignmentsApiError &&
        error.code === 'AUTH_REQUIRED'
      ) {
        await markSessionExpired();
        return 'failed';
      }
      const capabilityUnavailable =
        error instanceof MobileFieldValidationAssignmentsApiError &&
        error.code === 'CAPABILITY_UNAVAILABLE';
      setState((current) => ({
        ...current,
        capabilityUnavailable,
        errorMessage: describeRefreshFailure(
          error,
          Boolean(store.assignments?.value.length ?? current.assignments.length),
        ),
        refreshing: false,
      }));
      return 'failed';
    }
  }, [authStatus, canRead, database, enabled, isCurrentSession, markSessionExpired, ownerStore, session, sessionKey]);

  const refresh = useCallback(
    async (options?: { force?: boolean }): Promise<boolean> =>
      (await refreshOutcome(options)) === 'ok',
    [refreshOutcome],
  );

  useEffect(() => {
    if (ownerStore && ownerStore.generation > 0) {
      void refresh({ force: false });
    }
  }, [ownerStore, ownerStore?.generation, refresh]);

  useFocusEffect(
    useCallback(() => {
      if (enabled) void refresh({ force: false });
    }, [enabled, refresh]),
  );

  useEffect(() => {
    mounted.current = true;
    let previousState: string | null = AppState.currentState ?? null;
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

  const assignmentsSnapshot = canRead ? ownerStore?.assignments ?? null : null;
  const visibleState =
    state.sessionKey === sessionKey
      ? {
          ...state,
          assignments: canRead
            ? assignmentsSnapshot?.value ?? state.assignments
            : [],
          skippedCount: canRead ? assignmentsSnapshot?.skippedCount ?? 0 : 0,
        }
      : {
          assignments: assignmentsSnapshot?.value ?? [],
          capabilityUnavailable: false,
          errorMessage: null,
          lastSuccessfulAt: null,
          refreshing: false,
          skippedCount: assignmentsSnapshot?.skippedCount ?? 0,
          sessionKey,
        };

  return {
    ...visibleState,
    ready: assignmentsSnapshot !== null && (ownerStore?.assignmentsVerified ?? false),
    failed: ownerStore?.assignmentsFailed ?? false,
    refreshing: ownerStore?.assignmentsRefreshing ?? visibleState.refreshing,
    canRead,
    refresh,
    refreshOutcome,
  };
}

/** Best-effort photo download after the records are saved; never blocks or fails the refresh. */
function prefetchAfterDownload(
  ownerIdentity: string,
  token: string,
  assignments: FieldValidationAssignment[],
): void {
  void (async () => {
    try {
      await prefetchOfficeMedia({ assignments, ownerIdentity, token });
      emitSyncRecordsChanged();
    } catch {
      // Photos stay online-only; the case card says so.
    }
  })();
}
