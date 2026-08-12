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
import {
  subscribeSyncRecords,
} from '@/features/sync/services/syncEvents';
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
  const auth = useAuth();
  const session = auth.session;
  const sessionToken = session?.token;
  const submitterIdentity = session?.user.uuid;
  const authStatus = auth.status;
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSuccessfulSyncAt, setLastSuccessfulSyncAt] = useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const previousOnline = useRef<boolean | null>(null);
  const onlineRef = useRef<boolean | null>(null);
  const mounted = useRef(true);
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const refreshPendingCount = useCallback(async () => {
    const requestedToken = sessionToken;
    if (!submitterIdentity) {
      if (
        mounted.current &&
        isSameSession(sessionRef.current, requestedToken, submitterIdentity)
      ) {
        setPendingCount(0);
        setLastSuccessfulSyncAt(null);
      }
      return;
    }
    const [count, lastSyncedAt] = await Promise.all([
      countUnsyncedFieldReports(database, submitterIdentity),
      findLastSuccessfulFieldReportSyncAt(database, submitterIdentity),
    ]);
    if (
      mounted.current &&
      isSameSession(sessionRef.current, requestedToken, submitterIdentity)
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
        auth.status !== 'authenticated' ||
        !auth.session?.token ||
        onlineRef.current !== true
      ) {
        await refreshPendingCount();
        return null;
      }

      setIsSyncing(true);
      setErrorMessage(null);
      const initiatingSession = auth.session;
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
          await auth.markSessionExpired();
          return result;
        }
        if (result.synced > 0) {
          setLastSuccessfulSyncAt(new Date().toISOString());
        }
        if (result.failed > 0 && !result.authRequired) {
          setErrorMessage(
            `${result.failed} report${result.failed === 1 ? '' : 's'} still need attention.`,
          );
        }
        await refreshPendingCount();
        return result;
      } catch {
        if (isInitiatingSessionCurrent()) {
          setErrorMessage('CaneGuard could not process the pending upload queue.');
          await refreshPendingCount();
        }
        return null;
      } finally {
        if (mounted.current && isInitiatingSessionCurrent()) {
          setIsSyncing(false);
        }
      }
    },
    [auth, database, refreshPendingCount],
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
    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        setIsSyncing(false);
        setErrorMessage(null);
      }
    });
    return () => {
      active = false;
    };
  }, [sessionToken, submitterIdentity]);

  useEffect(() => {
    if (auth.status === 'authenticated') {
      previousOnline.current = null;
    }
  }, [auth.status]);

  useEffect(() => {
    mounted.current = true;
    const sessionToken = auth.session?.token;
    const submitterIdentity = auth.session?.user.uuid;
    if (!submitterIdentity) {
      void refreshPendingCount();
      return () => {
        mounted.current = false;
      };
    }
    const staleBefore = new Date(Date.now() - 5 * 60_000).toISOString();
    void resetStaleSyncingFieldReports(database, submitterIdentity, staleBefore)
      .then(() => {
        if (
          mounted.current &&
          isSameSession(sessionRef.current, sessionToken, submitterIdentity)
        ) {
          return refreshPendingCount();
        }
        return undefined;
      })
      .catch(() => {
        if (
          mounted.current &&
          isSameSession(sessionRef.current, sessionToken, submitterIdentity)
        ) {
          setErrorMessage('Interrupted uploads could not be recovered yet.');
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
        auth.status === 'authenticated'
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
    auth.session?.token,
    auth.session?.user.uuid,
    auth.status,
    database,
    refreshPendingCount,
    syncNow,
  ]);

  const value = useMemo<SyncContextValue>(
    () => ({
      errorMessage,
      isOnline,
      isSyncing,
      lastSuccessfulSyncAt,
      pendingCount,
      retryReport,
      syncNow,
    }),
    [
      errorMessage,
      isOnline,
      isSyncing,
      lastSuccessfulSyncAt,
      pendingCount,
      retryReport,
      syncNow,
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
