import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import type { PropsWithChildren } from 'react';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { purgeExpiredLocalData } from '@/database/localDataLifecycle';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  countUnsyncedFieldValidationCompletions,
  findLastSuccessfulFieldValidationCompletionSyncAt,
  markFieldValidationCompletionPending,
  resetStaleSyncingFieldValidationCompletions,
} from '@/features/assignments/data/fieldValidationCompletionRepository';
import { syncPendingFieldValidationCompletions } from '@/features/assignments/services/syncPendingFieldValidationCompletions';
import type { MobileSession } from '@/features/auth/types';
import {
  countUnsyncedFieldReports,
  findFieldReportUploadRecord,
  findLastSuccessfulFieldReportSyncAt,
  markFieldReportPending,
  resetStaleSyncingFieldReports,
  SYNC_RETRY_COOLDOWN_MS,
} from '@/features/reports/data/fieldReportSyncRepository';
import { subscribeSyncRecords } from '@/features/sync/services/syncEvents';
import {
  syncPendingFieldReports,
  type SyncBatchResult,
  type SyncTriggerSource,
} from '@/features/sync/services/syncPendingFieldReports';
import { countUnsyncedFieldSurveys, findLastSuccessfulFieldSurveySyncAt, resetStaleSyncingFieldSurveys } from '@/features/surveys/data/fieldSurveySyncRepository';
import { syncPendingFieldSurveys } from '@/features/surveys/services/syncPendingFieldSurveys';

export type ApiReachability = 'unknown' | 'available' | 'unavailable';

interface SyncContextValue {
  apiReachability: ApiReachability;
  errorMessage: string | null;
  isOnline: boolean | null;
  isSyncing: boolean;
  lastSuccessfulSyncAt: string | null;
  pendingCount: number;
  pendingReportsCount: number;
  pendingSurveysCount: number;
  pendingCompletionsCount: number;
  retryReport: (reportId: string) => Promise<SyncBatchResult | null>;
  retryFieldValidationCompletion: (completionId: string) => Promise<SyncBatchResult | null>;
  syncNow: (source?: SyncTriggerSource) => Promise<SyncBatchResult | null>;
}

export const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: PropsWithChildren) {
  const database = useCaneGuardDatabase();
  const {
    markSessionExpired,
    session,
    status: authStatus,
  } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [syncState, setSyncState] = useState<{
    apiReachability: ApiReachability;
    errorMessage: string | null;
    isSyncing: boolean;
    sessionKey: string | null;
  }>({
    apiReachability: 'unknown',
    errorMessage: null,
    isSyncing: false,
    sessionKey: null,
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [pendingCompletionsCount, setPendingCompletionsCount] = useState(0);
  const [pendingSurveysCount, setPendingSurveysCount] = useState(0);
  const [lastSuccessfulSyncAt, setLastSuccessfulSyncAt] = useState<string | null>(
    null,
  );
  const previousOnline = useRef<boolean | null>(null);
  const onlineRef = useRef<boolean | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const mounted = useRef(true);
  const sessionToken = session?.token;
  const submitterIdentity = session?.user.uuid;
  const sessionKey = session ? `${session.token}:${session.user.uuid}` : null;
  const sessionRef = useRef<MobileSession | null>(session);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerSessionKey = useRef<string | null>(null);
  const syncNowRef = useRef<
    ((source?: SyncTriggerSource) => Promise<SyncBatchResult | null>) | null
  >(null);

  const clearRetryTimer = useCallback(() => {
    if (retryTimer.current !== null) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
    retryTimerSessionKey.current = null;
  }, []);

  const scheduleRetryTimer = useCallback(() => {
    if (
      retryTimer.current !== null ||
      onlineRef.current !== true ||
      appStateRef.current !== 'active' ||
      !sessionKey
    ) {
      return;
    }
    retryTimerSessionKey.current = sessionKey;
    retryTimer.current = setTimeout(() => {
      const scheduledSessionKey = retryTimerSessionKey.current;
      retryTimer.current = null;
      retryTimerSessionKey.current = null;
      if (
        mounted.current &&
        onlineRef.current === true &&
        appStateRef.current === 'active' &&
        scheduledSessionKey === getSessionKey(sessionRef.current)
      ) {
        void syncNowRef.current?.('retry-timer');
      }
    }, SYNC_RETRY_COOLDOWN_MS);
  }, [sessionKey]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => () => clearRetryTimer(), [clearRetryTimer, sessionKey]);

  const refreshPendingCount = useCallback(async () => {
    const requestedToken = sessionToken;
    const requestedSubmitterIdentity = submitterIdentity;
    if (!requestedSubmitterIdentity) {
      if (
        mounted.current &&
        isSameSession(
          sessionRef.current,
          requestedToken,
          requestedSubmitterIdentity,
        )
      ) {
        setPendingCount(0);
        setPendingReportsCount(0);
        setPendingSurveysCount(0);
        setPendingCompletionsCount(0);
        setLastSuccessfulSyncAt(null);
      }
      return;
    }

    const [reportCount, surveyCount, completionCount, reportLastSyncedAt, surveyLastSyncedAt, completionLastSyncedAt] =
      await Promise.all([
        countUnsyncedFieldReports(database, requestedSubmitterIdentity),
        countUnsyncedFieldSurveys(database, requestedSubmitterIdentity),
        countUnsyncedFieldValidationCompletions(database, requestedSubmitterIdentity),
        findLastSuccessfulFieldReportSyncAt(database, requestedSubmitterIdentity),
        findLastSuccessfulFieldSurveySyncAt(database, requestedSubmitterIdentity),
        findLastSuccessfulFieldValidationCompletionSyncAt(database, requestedSubmitterIdentity),
      ]);
    const lastSyncedAt = latestTimestamp(latestTimestamp(reportLastSyncedAt, surveyLastSyncedAt), completionLastSyncedAt);
    if (
      mounted.current &&
      isSameSession(
        sessionRef.current,
        requestedToken,
        requestedSubmitterIdentity,
      )
    ) {
      setPendingCount(reportCount + surveyCount + completionCount);
      setPendingReportsCount(reportCount);
      setPendingSurveysCount(surveyCount);
      setPendingCompletionsCount(completionCount);
      setLastSuccessfulSyncAt(lastSyncedAt);
    }
  }, [database, sessionToken, submitterIdentity]);

  const syncNow = useCallback(
    async (
      source: SyncTriggerSource = 'manual',
    ): Promise<SyncBatchResult | null> => {
      if (source !== 'retry-timer') {
        clearRetryTimer();
      }
      if (
        authStatus !== 'authenticated' ||
        !sessionToken ||
        onlineRef.current !== true
      ) {
        await refreshPendingCount();
        return null;
      }

      const initiatingSession = session;
      if (!initiatingSession) {
        await refreshPendingCount();
        return null;
      }

      setSyncState((current) => ({
        ...current,
        errorMessage: null,
        isSyncing: true,
        sessionKey,
      }));
      const isInitiatingSessionCurrent = () =>
        sessionRef.current?.token === initiatingSession.token &&
        sessionRef.current?.user.uuid === initiatingSession.user.uuid;
      try {
        const reportResult = await syncPendingFieldReports({
          database,
          source,
          submitterIdentity: initiatingSession.user.uuid,
          token: initiatingSession.token,
        });
        const surveyResult = await syncPendingFieldSurveys({
          database,
          source,
          ownerIdentity: initiatingSession.user.uuid,
          token: initiatingSession.token,
        });
        const completionResult = await syncPendingFieldValidationCompletions({
          database,
          source,
          ownerIdentity: initiatingSession.user.uuid,
          token: initiatingSession.token,
        });
        const result = mergeSyncBatchResults(reportResult, surveyResult, completionResult);
        if (!isInitiatingSessionCurrent()) {
          return result;
        }
        const observedApiReachability = inferApiReachability(result);
        if (observedApiReachability) {
          setSyncState((current) => ({
            ...current,
            apiReachability: observedApiReachability,
          }));
        }
        if (result.authRequired) {
          clearRetryTimer();
          await markSessionExpired();
          return result;
        }
        if (result.haltReason === 'transient-blocker') {
          scheduleRetryTimer();
        } else {
          clearRetryTimer();
        }
        if (result.synced > 0) {
          setLastSuccessfulSyncAt(new Date().toISOString());
        }
        if (result.failed > 0 && !result.authRequired) {
          setSyncState((current) => ({
            ...current,
            errorMessage:
              result.haltReason === 'transient-blocker'
                ? 'Waiting to send. Will try again automatically.'
                : `${result.failed} report${result.failed === 1 ? '' : 's'} still need attention.`,
            isSyncing: true,
            sessionKey,
          }));
        }
        await refreshPendingCount();
        return result;
      } catch {
        if (isInitiatingSessionCurrent()) {
          setSyncState((current) => ({
            ...current,
            errorMessage: 'CaneGuard could not send the saved reports.',
            isSyncing: true,
            sessionKey,
          }));
          await refreshPendingCount();
        }
        return null;
      } finally {
        if (mounted.current && isInitiatingSessionCurrent()) {
          setSyncState((current) => ({ ...current, isSyncing: false }));
        }
      }
    },
    [
      authStatus,
      clearRetryTimer,
      database,
      markSessionExpired,
      refreshPendingCount,
      scheduleRetryTimer,
      session,
      sessionKey,
      sessionToken,
    ],
  );

  useEffect(() => {
    syncNowRef.current = syncNow;
  }, [syncNow]);

  const retryReport = useCallback(
    async (reportId: string) => {
      if (authStatus !== 'authenticated' || !submitterIdentity) {
        return null;
      }
      await findFieldReportUploadRecord(database, reportId, submitterIdentity);
      await markFieldReportPending(database, reportId, submitterIdentity);
      return syncNow('manual');
    },
    [authStatus, database, submitterIdentity, syncNow],
  );

  const retryFieldValidationCompletion = useCallback(
    async (completionId: string) => {
      if (authStatus !== 'authenticated' || !submitterIdentity) {
        return null;
      }
      await markFieldValidationCompletionPending(
        database,
        completionId,
        submitterIdentity,
      );
      return syncNow('manual');
    },
    [authStatus, database, submitterIdentity, syncNow],
  );

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        setSyncState({
          apiReachability: 'unknown',
          errorMessage: null,
          isSyncing: false,
          sessionKey,
        });
      }
    });
    return () => {
      active = false;
    };
  }, [sessionKey]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      previousOnline.current = null;
    }
  }, [authStatus]);

  useEffect(() => {
    mounted.current = true;
    if (!submitterIdentity) {
      const cancelDeferredCount = scheduleAfterFirstPaint(() => {
        if (mounted.current) {
          void refreshPendingCount();
        }
      });
      return () => {
        mounted.current = false;
        cancelDeferredCount();
      };
    }

    const requestedToken = sessionToken;
    const requestedSubmitterIdentity = submitterIdentity;
    // Housekeeping, not first-paint data: the purge and the stale-sync resets
    // only have to finish before the first sync attempt. Running them here kept
    // four database jobs on the cold-start critical path beside the database
    // migration, the auth restore and the first Home queries.
    const cancelDeferredWork = scheduleAfterFirstPaint(() => {
      const staleBefore = new Date(Date.now() - 5 * 60_000).toISOString();
      void purgeExpiredLocalData(
        database,
        requestedSubmitterIdentity,
      ).catch(() => undefined);
      void Promise.all([
        resetStaleSyncingFieldReports(
          database,
          requestedSubmitterIdentity,
          staleBefore,
        ),
        resetStaleSyncingFieldValidationCompletions(
          database,
          requestedSubmitterIdentity,
          staleBefore,
        ),
        Promise.resolve().then(() => resetStaleSyncingFieldSurveys(database, requestedSubmitterIdentity, staleBefore)),
      ])
        .then(() => {
          if (
            mounted.current &&
            isSameSession(
              sessionRef.current,
              requestedToken,
              requestedSubmitterIdentity,
            )
          ) {
            return refreshPendingCount();
          }
          return undefined;
        })
        .catch(() => {
          if (
            mounted.current &&
            isSameSession(
              sessionRef.current,
              requestedToken,
              requestedSubmitterIdentity,
            )
          ) {
            setSyncState((current) => ({
              ...current,
              errorMessage: 'Interrupted uploads could not be recovered yet.',
              isSyncing: false,
              sessionKey,
            }));
          }
        });
    });

    const unsubscribeRecords = subscribeSyncRecords(() => {
      void refreshPendingCount();
    });
    const unsubscribeNetwork = NetInfo.addEventListener((state) => {
      const online = isNetworkOnline(state);
      onlineRef.current = online;
      setIsOnline(online);
      if (!online) {
        clearRetryTimer();
      }
      if (previousOnline.current === false && online) {
        void syncNow('network-restored');
      } else if (
        previousOnline.current === null &&
        online &&
        authStatus === 'authenticated'
      ) {
        void syncNow('startup');
      }
      previousOnline.current = online;
    });
    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextState) => {
        appStateRef.current = nextState;
        if (nextState !== 'active') {
          clearRetryTimer();
        }
        if (nextState === 'active') {
          void NetInfo.fetch().then((state) => {
            const online = isNetworkOnline(state);
            onlineRef.current = online;
            setIsOnline(online);
            if (!online) {
              clearRetryTimer();
            }
            previousOnline.current = online;
            if (online) {
              void syncNow('resume');
            }
          });
        }
      },
    );

    return () => {
      mounted.current = false;
      cancelDeferredWork();
      unsubscribeRecords();
      unsubscribeNetwork();
      appStateSubscription.remove();
    };
  }, [
    authStatus,
    database,
    refreshPendingCount,
    sessionKey,
    sessionToken,
    submitterIdentity,
    syncNow,
    clearRetryTimer,
  ]);

  const value = useMemo<SyncContextValue>(
    () => ({
      apiReachability:
        syncState.sessionKey === sessionKey
          ? syncState.apiReachability
          : 'unknown',
      errorMessage:
        syncState.sessionKey === sessionKey ? syncState.errorMessage : null,
      isOnline,
      isSyncing:
        syncState.sessionKey === sessionKey ? syncState.isSyncing : false,
      lastSuccessfulSyncAt,
      pendingCount,
      pendingReportsCount,
      pendingSurveysCount,
      pendingCompletionsCount,
      retryFieldValidationCompletion,
      retryReport,
      syncNow,
    }),
    [
      isOnline,
      lastSuccessfulSyncAt,
      pendingCount,
      pendingReportsCount,
      pendingSurveysCount,
      pendingCompletionsCount,
      retryFieldValidationCompletion,
      retryReport,
      sessionKey,
      syncNow,
      syncState.apiReachability,
      syncState.errorMessage,
      syncState.isSyncing,
      syncState.sessionKey,
    ],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

function mergeSyncBatchResults(...batches: SyncBatchResult[]): SyncBatchResult {
  const haltReason = batches.some((batch) => batch.haltReason === 'auth-required')
    ? 'auth-required'
    : batches.some((batch) => batch.haltReason === 'transient-blocker')
      ? 'transient-blocker'
      : batches.some((batch) => batch.haltReason === 'run-limit')
        ? 'run-limit'
        : batches.find((batch) => batch.haltReason)?.haltReason ?? null;
  return {
    attempted: batches.reduce((total, batch) => total + batch.attempted, 0),
    authRequired: batches.some((batch) => batch.authRequired),
    failed: batches.reduce((total, batch) => total + batch.failed, 0),
    haltReason,
    results: batches.flatMap((batch) => batch.results),
    source: batches[0]?.source ?? 'manual',
    synced: batches.reduce((total, batch) => total + batch.synced, 0),
  };
}

function latestTimestamp(first: string | null, second: string | null): string | null {
  if (!first) return second;
  if (!second) return first;
  return Date.parse(first) >= Date.parse(second) ? first : second;
}

function isNetworkOnline(state: NetInfoState): boolean {
  return state.isConnected === true && state.isInternetReachable !== false;
}

/**
 * Infers service availability from the last sync attempt without replacing the
 * separate phone-network signal used for offline gating.
 */
function inferApiReachability(
  result: SyncBatchResult,
): ApiReachability | null {
  let observation: ApiReachability | null = null;

  for (const syncResult of result.results) {
    if (syncResult.status === 'synced') {
      observation = 'available';
      continue;
    }
    if (syncResult.status !== 'failed') {
      continue;
    }

    switch (syncResult.error.code) {
      case 'NETWORK_UNAVAILABLE':
      case 'NETWORK_REQUEST_FAILED':
      case 'SERVER_ERROR':
        observation = 'unavailable';
        break;
      case 'AUTH_REQUIRED':
      case 'API_VALIDATION_FAILED':
      case 'API_FORBIDDEN':
      case 'API_RATE_LIMITED':
        observation = 'available';
        break;
      default:
        break;
    }
  }

  return observation;
}

function getSessionKey(session: MobileSession | null): string | null {
  return session ? `${session.token}:${session.user.uuid}` : null;
}

/**
 * Runs `work` once the first frame is out. `requestIdleCallback` is the
 * scheduler React Native points at instead of `InteractionManager`, and the
 * timer fallback keeps the behaviour defined in environments without it (the
 * Jest test runner, for one). Returns a cancel function for effect cleanup.
 */
function scheduleAfterFirstPaint(work: () => void): () => void {
  const requestIdle = (
    globalThis as {
      requestIdleCallback?: (callback: () => void) => number;
      cancelIdleCallback?: (handle: number) => void;
    }
  );

  if (typeof requestIdle.requestIdleCallback === 'function') {
    const handle = requestIdle.requestIdleCallback(work);
    return () => {
      if (typeof requestIdle.cancelIdleCallback === 'function') {
        requestIdle.cancelIdleCallback(handle);
      }
    };
  }

  const timer = setTimeout(work, 0);
  return () => clearTimeout(timer);
}

function isSameSession(
  session: MobileSession | null,
  token: string | undefined,
  submitterIdentity: string | undefined,
): boolean {
  if (!token || !submitterIdentity) {
    return session === null;
  }
  return (
    session?.token === token && session?.user.uuid === submitterIdentity
  );
}
