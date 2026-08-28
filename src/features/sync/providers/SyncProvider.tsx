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

export type ApiReachability = 'unknown' | 'available' | 'unavailable';

interface SyncContextValue {
  apiReachability: ApiReachability;
  errorMessage: string | null;
  isOnline: boolean | null;
  isSyncing: boolean;
  lastSuccessfulSyncAt: string | null;
  pendingCount: number;
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
        setLastSuccessfulSyncAt(null);
      }
      return;
    }

    const [reportCount, completionCount, reportLastSyncedAt, completionLastSyncedAt] =
      await Promise.all([
        countUnsyncedFieldReports(database, requestedSubmitterIdentity),
        countUnsyncedFieldValidationCompletions(database, requestedSubmitterIdentity),
        findLastSuccessfulFieldReportSyncAt(database, requestedSubmitterIdentity),
        findLastSuccessfulFieldValidationCompletionSyncAt(database, requestedSubmitterIdentity),
      ]);
    const lastSyncedAt = latestTimestamp(reportLastSyncedAt, completionLastSyncedAt);
    if (
      mounted.current &&
      isSameSession(
        sessionRef.current,
        requestedToken,
        requestedSubmitterIdentity,
      )
    ) {
      setPendingCount(reportCount + completionCount);
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
        const completionResult = await syncPendingFieldValidationCompletions({
          database,
          source,
          ownerIdentity: initiatingSession.user.uuid,
          token: initiatingSession.token,
        });
        const result = mergeSyncBatchResults(reportResult, completionResult);
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
                ? 'Waiting to sync. Will retry automatically.'
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
            errorMessage: 'CaneGuard could not process the pending upload queue.',
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
      void refreshPendingCount();
      return () => {
        mounted.current = false;
      };
    }

    const requestedToken = sessionToken;
    const requestedSubmitterIdentity = submitterIdentity;
    const staleBefore = new Date(Date.now() - 5 * 60_000).toISOString();
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
      retryFieldValidationCompletion,
      retryReport,
      syncNow,
    }),
    [
      isOnline,
      lastSuccessfulSyncAt,
      pendingCount,
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

function mergeSyncBatchResults(
  reports: SyncBatchResult,
  completions: SyncBatchResult,
): SyncBatchResult {
  return {
    attempted: reports.attempted + completions.attempted,
    authRequired: reports.authRequired || completions.authRequired,
    failed: reports.failed + completions.failed,
    haltReason:
      reports.haltReason === 'auth-required' || completions.haltReason === 'auth-required'
        ? 'auth-required'
        : reports.haltReason === 'transient-blocker' || completions.haltReason === 'transient-blocker'
          ? 'transient-blocker'
          : reports.haltReason === 'run-limit' || completions.haltReason === 'run-limit'
            ? 'run-limit'
            : reports.haltReason ?? completions.haltReason,
    results: [...reports.results, ...completions.results],
    source: reports.source,
    synced: reports.synced + completions.synced,
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
