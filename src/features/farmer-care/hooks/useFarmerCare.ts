import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { updateFarmerProfile } from '@/features/farmer-care/api/farmerCareApi';
import {
  deleteCachedFarmerAdvisoriesForOwner,
  findFarmerInquiryForChain,
  listFarmerAdvisories,
  listFarmerInquiries,
  resolveScanChainId,
} from '@/features/farmer-care/data/farmerCareRepository';
import {
  readHomeBarangay,
  writeHomeBarangay,
  type HomeBarangayState,
} from '@/features/farmer-care/data/homeBarangayStorage';
import { syncFarmerCare } from '@/features/farmer-care/services/syncFarmerCare';
import { net } from '@/features/net/reconnectCoordinator';
import { NASUGBU_BARANGAYS } from '@/features/reports/referenceData/nasugbuSeed';
import { ApiHttpError } from '@/features/shared/api/apiClient';
import { useSyncRecordsRevision } from '@/features/sync/hooks/useSyncRecordsRevision';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';

/** Guidance is downloaded at most this often on its own; opening Home never hammers the office. */
export const ADVISORY_REFRESH_INTERVAL_MS = 10 * 60_000;
const lastAdvisoryRefreshAt = new Map<string, number>();

export function resetAdvisoryRefreshClock(): void {
  lastAdvisoryRefreshAt.clear();
}

export function isSupportedFarmerBarangay(value: string | null): boolean {
  return value !== null && NASUGBU_BARANGAYS.includes(value);
}

/** The farmer's own requests and downloaded guidance, kept current as they change. */
export function useFarmerCare() {
  const database = useCaneGuardDatabase();
  const { session, user } = useAuth();
  const revision = useSyncRecordsRevision();
  const ownerIdentity = user?.uuid ?? null;
  const token = session?.token ?? null;
  const isFarmer = user?.role === 'farmer' && ownerIdentity !== null;
  const [refreshingAdvisories, setRefreshingAdvisories] = useState(false);

  // The care feature is an extra: a failed local read shows nothing rather than breaking Home or a saved scan.
  const inquiries = useMemo(
    () => (isFarmer && ownerIdentity ? safely(() => listFarmerInquiries(database, ownerIdentity), []) : []),
    // `revision` is the invalidation signal: any repository write bumps it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [database, isFarmer, ownerIdentity, revision],
  );
  const advisories = useMemo(
    () => (isFarmer && ownerIdentity ? safely(() => listFarmerAdvisories(database, ownerIdentity), []) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [database, isFarmer, ownerIdentity, revision],
  );

  const lastAdvisoryRefreshedAt = useMemo(() => {
    if (!isFarmer || !ownerIdentity) return null;
    const inMemoryMs = lastAdvisoryRefreshAt.get(ownerIdentity) ?? null;
    let latestMs = inMemoryMs ?? 0;
    for (const item of advisories) {
      if (!item.downloadedAt) continue;
      const parsed = Date.parse(item.downloadedAt);
      if (!Number.isNaN(parsed) && parsed > latestMs) {
        latestMs = parsed;
      }
    }
    return latestMs > 0 ? new Date(latestMs).toISOString() : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advisories, isFarmer, ownerIdentity, revision]);

  const syncNow = useCallback(
    async (options: { refreshAdvisories?: boolean; forceAdvisories?: boolean } = {}) => {
      if (!isFarmer || !ownerIdentity || !token) return null;
      const shouldStartSpinner = options.refreshAdvisories === true;
      let spinnerStarted = false;
      try {
        // A barangay chosen offline goes first, so the next guidance download is for the right place.
        const pushedPendingBarangay = await pushPendingHomeBarangay(ownerIdentity, token);
        const refreshAdvisories =
          options.refreshAdvisories === true &&
          (options.forceAdvisories === true ||
            pushedPendingBarangay ||
            Date.now() - (lastAdvisoryRefreshAt.get(ownerIdentity) ?? 0) >= ADVISORY_REFRESH_INTERVAL_MS);
        if (shouldStartSpinner && refreshAdvisories) {
          spinnerStarted = true;
          setRefreshingAdvisories(true);
        }
        const result = await syncFarmerCare({ database, ownerIdentity, token, refreshAdvisories });
        // Stamp the 10-minute cooldown only when guidance actually downloaded.
        if (refreshAdvisories && result.advisoriesRefreshed) {
          lastAdvisoryRefreshAt.set(ownerIdentity, Date.now());
          emitSyncRecordsChanged();
        }
        if (result.advisoriesRefreshed && result.homeBarangay) {
          await adoptServerHomeBarangay(ownerIdentity, result.homeBarangay);
        }
        return result;
      } catch {
        // A farmer's phone never shows a sync error: requests stay queued and guidance stays cached.
        return null;
      } finally {
        if (spinnerStarted) {
          setRefreshingAdvisories(false);
        }
      }
    },
    [database, isFarmer, ownerIdentity, token],
  );

  return {
    advisories,
    inquiries,
    isFarmer,
    lastAdvisoryRefreshedAt,
    ownerIdentity,
    refreshingAdvisories,
    syncNow,
  };
}

/**
 * Sends waiting requests and refreshes guidance when Home is shown, the app
 * returns to the front, or the phone reconnects after being offline.
 */
export function useFarmerCareAutoSync(): void {
  const { isFarmer, syncNow } = useFarmerCare();
  const syncRef = useRef(syncNow);
  useEffect(() => {
    syncRef.current = syncNow;
  }, [syncNow]);

  useFocusEffect(
    useCallback(() => {
      if (isFarmer) void syncRef.current({ refreshAdvisories: true });
    }, [isFarmer]),
  );
  useEffect(() => {
    if (!isFarmer) return undefined;
    // Participate in the single shared ReconnectCoordinator so offline->online
    // transitions and foreground resumes both refresh guidance without extra listeners.
    const release = net.acquire();
    const unregister = net.registerDownload(() => syncRef.current({ refreshAdvisories: true }));
    return () => {
      unregister();
      release();
    };
  }, [isFarmer]);
}

/** The request for this scan's plant (the whole Check Again chain), if the farmer made one. */
export function useInquiryForScan(scanId: string | null) {
  const { inquiries, isFarmer, ownerIdentity } = useFarmerCare();
  const database = useCaneGuardDatabase();
  return useMemo(() => {
    if (!isFarmer || !ownerIdentity || !scanId) return null;
    return safely(() => {
      const chainId = resolveScanChainId(database, ownerIdentity, scanId);
      if (!chainId) return null;
      return inquiries.find((item) => item.scanChainId === chainId) ?? findFarmerInquiryForChain(database, ownerIdentity, chainId);
    }, null);
  }, [database, inquiries, isFarmer, ownerIdentity, scanId]);
}

/** The farmer's home barangay: remembered on the phone and told to the office when there is signal. */
export function useHomeBarangay() {
  const database = useCaneGuardDatabase();
  const { ownerIdentity, isFarmer, syncNow } = useFarmerCare();
  const { session } = useAuth();
  const token = session?.token ?? null;
  const [state, setState] = useState<(HomeBarangayState & { loaded: boolean })>({
    barangay: null,
    pushPending: false,
    loaded: false,
  });
  const revision = useSyncRecordsRevision();

  useEffect(() => {
    let cancelled = false;
    if (!isFarmer || !ownerIdentity) return undefined;
    void readHomeBarangay(ownerIdentity).then((value) => {
      if (!cancelled) setState({ ...value, loaded: true });
    });
    return () => {
      cancelled = true;
    };
  }, [isFarmer, ownerIdentity, revision]);

  const save = useCallback(
    async (
      rawBarangay: string | null,
      options: { syncAfter?: boolean } = {},
    ): Promise<'saved' | 'local' | 'invalid'> => {
      if (!ownerIdentity) return 'local';
      const barangay = typeof rawBarangay === 'string' ? rawBarangay.trim() || null : null;
      if (barangay !== null && !isSupportedFarmerBarangay(barangay)) {
        return 'invalid';
      }

      const previous = await readHomeBarangay(ownerIdentity);
      const changedBarangay = previous.barangay !== barangay;

      await writeHomeBarangay(ownerIdentity, { barangay, pushPending: true });
      setState({ barangay, pushPending: true, loaded: true });

      if (changedBarangay) {
        // Clear old barangay guidance immediately so outdated broadcasts never linger offline.
        safely(() => deleteCachedFarmerAdvisoriesForOwner(database, ownerIdentity), 0);
        lastAdvisoryRefreshAt.delete(ownerIdentity);
      }
      emitSyncRecordsChanged();

      if (!token) return 'local';
      try {
        await updateFarmerProfile({ barangay }, token);
        await writeHomeBarangay(ownerIdentity, { barangay, pushPending: false });
        setState({ barangay, pushPending: false, loaded: true });
        emitSyncRecordsChanged();
        if (options.syncAfter !== false) {
          void syncNow({ refreshAdvisories: true, forceAdvisories: true });
        }
        return 'saved';
      } catch (error: unknown) {
        if (error instanceof ApiHttpError && error.status === 422) {
          // Server rejected the barangay value: restore previous state rather than retrying 422 forever.
          const reverted = { barangay: previous.barangay, pushPending: false };
          await writeHomeBarangay(ownerIdentity, reverted);
          setState({ ...reverted, loaded: true });
          emitSyncRecordsChanged();
          return 'invalid';
        }
        return 'local';
      }
    },
    [database, ownerIdentity, syncNow, token],
  );

  // Anyone who is not a signed-in farmer has no home barangay to wait for.
  const current = isFarmer && ownerIdentity ? state : { barangay: null, pushPending: false, loaded: true };
  const unsupported = current.barangay !== null && !isSupportedFarmerBarangay(current.barangay);
  return { ...current, unsupported, save };
}

function safely<T>(read: () => T, fallback: T): T {
  try {
    return read();
  } catch {
    return fallback;
  }
}

async function pushPendingHomeBarangay(ownerIdentity: string, token: string): Promise<boolean> {
  const stored = await readHomeBarangay(ownerIdentity);
  if (!stored.pushPending) return false;
  if (stored.barangay !== null && !isSupportedFarmerBarangay(stored.barangay)) {
    // Drop pending flag on legacy unsupported values so HomeBarangayRow can prompt recovery.
    await writeHomeBarangay(ownerIdentity, { barangay: stored.barangay, pushPending: false });
    emitSyncRecordsChanged();
    return false;
  }
  try {
    await updateFarmerProfile({ barangay: stored.barangay }, token);
    await writeHomeBarangay(ownerIdentity, { barangay: stored.barangay, pushPending: false });
    emitSyncRecordsChanged();
    return true;
  } catch (error: unknown) {
    if (error instanceof ApiHttpError && error.status === 422) {
      await writeHomeBarangay(ownerIdentity, { barangay: stored.barangay, pushPending: false });
      emitSyncRecordsChanged();
    }
    // Otherwise still offline: it stays pending and goes with the next sync.
    return false;
  }
}

/** A phone with no pending local override adopts the supported home barangay held by the office. */
async function adoptServerHomeBarangay(ownerIdentity: string, serverBarangay: string): Promise<void> {
  if (!isSupportedFarmerBarangay(serverBarangay)) return;
  const stored = await readHomeBarangay(ownerIdentity);
  if (!stored.pushPending && stored.barangay !== serverBarangay) {
    await writeHomeBarangay(ownerIdentity, { barangay: serverBarangay, pushPending: false });
    emitSyncRecordsChanged();
  }
}
