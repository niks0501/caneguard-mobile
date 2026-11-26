import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { updateFarmerProfile } from '@/features/farmer-care/api/farmerCareApi';
import {
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
import { useSyncRecordsRevision } from '@/features/sync/hooks/useSyncRecordsRevision';

/** Guidance is downloaded at most this often on its own; opening Home never hammers the office. */
export const ADVISORY_REFRESH_INTERVAL_MS = 10 * 60_000;
const lastAdvisoryRefreshAt = new Map<string, number>();

export function resetAdvisoryRefreshClock(): void {
  lastAdvisoryRefreshAt.clear();
}

/** The farmer's own requests and downloaded guidance, kept current as they change. */
export function useFarmerCare() {
  const database = useCaneGuardDatabase();
  const { session, user } = useAuth();
  const revision = useSyncRecordsRevision();
  const ownerIdentity = user?.uuid ?? null;
  const token = session?.token ?? null;
  const isFarmer = user?.role === 'farmer' && ownerIdentity !== null;

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

  const syncNow = useCallback(
    async (options: { refreshAdvisories?: boolean } = {}) => {
      if (!isFarmer || !ownerIdentity || !token) return null;
      try {
        // A barangay chosen offline goes first, so the next guidance download is for the right place.
        await pushPendingHomeBarangay(ownerIdentity, token);
        const refreshAdvisories =
          options.refreshAdvisories === true &&
          Date.now() - (lastAdvisoryRefreshAt.get(ownerIdentity) ?? 0) >= ADVISORY_REFRESH_INTERVAL_MS;
        const result = await syncFarmerCare({ database, ownerIdentity, token, refreshAdvisories });
        if (refreshAdvisories && !result.held) lastAdvisoryRefreshAt.set(ownerIdentity, Date.now());
        if (result.homeBarangay) await adoptServerHomeBarangay(ownerIdentity, result.homeBarangay);
        return result;
      } catch {
        // A farmer's phone never shows a sync error: requests stay queued and guidance stays cached.
        return null;
      }
    },
    [database, isFarmer, ownerIdentity, token],
  );

  return { advisories, inquiries, isFarmer, ownerIdentity, syncNow };
}

/** Sends waiting requests and refreshes guidance when Home is shown or the app returns to the front. */
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
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncRef.current({ refreshAdvisories: true });
    });
    return () => subscription.remove();
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
    async (barangay: string | null): Promise<'saved' | 'local'> => {
      if (!ownerIdentity) return 'local';
      await writeHomeBarangay(ownerIdentity, { barangay, pushPending: true });
      setState({ barangay, pushPending: true, loaded: true });
      if (!token) return 'local';
      try {
        await updateFarmerProfile({ barangay }, token);
        await writeHomeBarangay(ownerIdentity, { barangay, pushPending: false });
        setState({ barangay, pushPending: false, loaded: true });
        void syncNow({ refreshAdvisories: true });
        return 'saved';
      } catch {
        return 'local';
      }
    },
    [ownerIdentity, syncNow, token],
  );

  // Anyone who is not a signed-in farmer has no home barangay to wait for.
  const current = isFarmer && ownerIdentity ? state : { barangay: null, pushPending: false, loaded: true };
  return { ...current, save };
}

function safely<T>(read: () => T, fallback: T): T {
  try {
    return read();
  } catch {
    return fallback;
  }
}

async function pushPendingHomeBarangay(ownerIdentity: string, token: string): Promise<void> {
  const stored = await readHomeBarangay(ownerIdentity);
  if (!stored.pushPending) return;
  try {
    await updateFarmerProfile({ barangay: stored.barangay }, token);
    await writeHomeBarangay(ownerIdentity, { barangay: stored.barangay, pushPending: false });
  } catch {
    // Still offline: it stays pending and goes with the next sync.
  }
}

/** A phone with no home barangay of its own takes the one the office already holds. */
async function adoptServerHomeBarangay(ownerIdentity: string, serverBarangay: string): Promise<void> {
  const stored = await readHomeBarangay(ownerIdentity);
  if (stored.barangay === null && !stored.pushPending) {
    await writeHomeBarangay(ownerIdentity, { barangay: serverBarangay, pushPending: false });
  }
}
