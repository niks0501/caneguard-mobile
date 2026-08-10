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

  const refreshPendingCount = useCallback(async () => {
    const submitterIdentity = auth.session?.user.uuid;
    if (!submitterIdentity) {
      if (mounted.current) {
        setPendingCount(0);
        setLastSuccessfulSyncAt(null);
      }
      return;
    }
    const [count, lastSyncedAt] = await Promise.all([
      countUnsyncedFieldReports(database, submitterIdentity),
      findLastSuccessfulFieldReportSyncAt(database, submitterIdentity),
    ]);
    if (mounted.current) {
      setPendingCount(count);
      setLastSuccessfulSyncAt(lastSyncedAt);
    }
  }, [auth.session?.user.uuid, database]);

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
      try {
        const result = await syncPendingFieldReports({
          database,
          source,
          submitterIdentity: auth.session.user.uuid,
          token: auth.session.token,
        });
        if (result.authRequired) {
          await auth.markSessionExpired();
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
        setErrorMessage('CaneGuard could not process the pending upload queue.');
        await refreshPendingCount();
        return null;
      } finally {
        if (mounted.current) {
          setIsSyncing(false);
        }
      }
    },
    [auth, database, refreshPendingCount],
  );

  const retryReport = useCallback(
    async (reportId: string) => {
      if (auth.status !== 'authenticated' || !auth.session?.user.uuid) {
        return null;
      }
      await findFieldReportUploadRecord(
        database,
        reportId,
        auth.session.user.uuid,
      );
      await markFieldReportPending(database, reportId, auth.session.user.uuid);
      return syncNow('manual');
    },
    [auth.session?.user.uuid, auth.status, database, syncNow],
  );

  useEffect(() => {
    if (auth.status === 'authenticated') {
      previousOnline.current = null;
    }
  }, [auth.status]);

  useEffect(() => {
    mounted.current = true;
    const submitterIdentity = auth.session?.user.uuid;
    if (!submitterIdentity) {
      void refreshPendingCount();
      return () => {
        mounted.current = false;
      };
    }
    const staleBefore = new Date(Date.now() - 5 * 60_000).toISOString();
    void resetStaleSyncingFieldReports(database, submitterIdentity, staleBefore)
      .then(refreshPendingCount)
      .catch(() =>
        setErrorMessage('Interrupted uploads could not be recovered yet.'),
      );

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
