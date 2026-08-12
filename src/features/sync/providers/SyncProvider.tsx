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
import type { MobileSession } from '@/features/auth/types';
import {
  countUnsyncedFieldReports,
  findFieldReportUploadRecord,
  findLastSuccessfulFieldReportSyncAt,
  markFieldReportPending,
  resetStaleSyncingFieldReports,
} from '@/features/reports/data/fieldReportSyncRepository';
import { subscribeSyncRecords } from '@/features/sync/services/syncEvents';
import {
  syncPendingFieldReports,
  type SyncBatchResult,
  type SyncTriggerSource,
} from '@/features/sync/services/syncPendingFieldReports';

interface SyncContextValue {
  errorMessage: string | null;
  isOnline: boolean | null;
  isSyncing: boolean;
  lastSuccessfulSyncAt: string | null;
  pendingCount: number;
  retryReport: (reportId: string) => Promise<SyncBatchResult | null>;
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
    errorMessage: string | null;
    isSyncing: boolean;
    sessionKey: string | null;
  }>({ errorMessage: null, isSyncing: false, sessionKey: null });
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSuccessfulSyncAt, setLastSuccessfulSyncAt] = useState<string | null>(
    null,
  );
  const previousOnline = useRef<boolean | null>(null);
  const onlineRef = useRef<boolean | null>(null);
  const mounted = useRef(true);
  const sessionToken = session?.token;
  const submitterIdentity = session?.user.uuid;
  const sessionKey = session ? `${session.token}:${session.user.uuid}` : null;
  const sessionRef = useRef<MobileSession | null>(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

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

    const [count, lastSyncedAt] = await Promise.all([
      countUnsyncedFieldReports(database, requestedSubmitterIdentity),
      findLastSuccessfulFieldReportSyncAt(database, requestedSubmitterIdentity),
    ]);
    if (
      mounted.current &&
      isSameSession(
        sessionRef.current,
        requestedToken,
        requestedSubmitterIdentity,
      )
    ) {
      setPendingCount(count);
      setLastSuccessfulSyncAt(lastSyncedAt);
    }
  }, [database, sessionToken, submitterIdentity]);

  const syncNow = useCallback(
    async (
      source: SyncTriggerSource = 'manual',
    ): Promise<SyncBatchResult | null> => {
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

      setSyncState({ errorMessage: null, isSyncing: true, sessionKey });
      const isInitiatingSessionCurrent = () =>
        sessionRef.current?.token === initiatingSession.token &&
        sessionRef.current?.user.uuid === initiatingSession.user.uuid;
      try {
        const result = await syncPendingFieldReports({
          database,
          source,
          submitterIdentity: initiatingSession.user.uuid,
          token: initiatingSession.token,
        });
        if (!isInitiatingSessionCurrent()) {
          return result;
        }
        if (result.authRequired) {
          await markSessionExpired();
          return result;
        }
        if (result.synced > 0) {
          setLastSuccessfulSyncAt(new Date().toISOString());
        }
        if (result.failed > 0 && !result.authRequired) {
          setSyncState({
            errorMessage: `${result.failed} report${result.failed === 1 ? '' : 's'} still need attention.`,
            isSyncing: true,
            sessionKey,
          });
        }
        await refreshPendingCount();
        return result;
      } catch {
        if (isInitiatingSessionCurrent()) {
          setSyncState({
            errorMessage: 'CaneGuard could not process the pending upload queue.',
            isSyncing: true,
            sessionKey,
          });
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
      database,
      markSessionExpired,
      refreshPendingCount,
      session,
      sessionKey,
      sessionToken,
    ],
  );

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

    const staleBefore = new Date(Date.now() - 5 * 60_000).toISOString();
    void resetStaleSyncingFieldReports(database, submitterIdentity, staleBefore)
      .then(() => refreshPendingCount())
      .catch(() => {
        if (
          mounted.current &&
          isSameSession(sessionRef.current, sessionToken, submitterIdentity)
        ) {
          setSyncState({
            errorMessage: 'Interrupted uploads could not be recovered yet.',
            isSyncing: false,
            sessionKey,
          });
        }
      });

    const unsubscribeRecords = subscribeSyncRecords(() => {
      void refreshPendingCount();
    });
    const unsubscribeNetwork = NetInfo.addEventListener((state) => {
      const online = isNetworkOnline(state);
      onlineRef.current = online;
      setIsOnline(online);
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
        if (nextState === 'active') {
          void NetInfo.fetch().then((state) => {
            const online = isNetworkOnline(state);
            onlineRef.current = online;
            setIsOnline(online);
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
  ]);

  const value = useMemo<SyncContextValue>(
    () => ({
      errorMessage:
        syncState.sessionKey === sessionKey ? syncState.errorMessage : null,
      isOnline,
      isSyncing:
        syncState.sessionKey === sessionKey ? syncState.isSyncing : false,
      lastSuccessfulSyncAt,
      pendingCount,
      retryReport,
      syncNow,
    }),
    [
      isOnline,
      lastSuccessfulSyncAt,
      pendingCount,
      retryReport,
      sessionKey,
      syncNow,
      syncState.errorMessage,
      syncState.isSyncing,
      syncState.sessionKey,
    ],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

function isNetworkOnline(state: NetInfoState): boolean {
  return state.isConnected === true && state.isInternetReachable !== false;
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
