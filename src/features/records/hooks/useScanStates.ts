import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { listScanThreadRows } from '@/features/records/data/scanRecordRepository';
import {
  buildFarmerScanStates,
  buildFarmerScanThreads,
  type FarmerScanState,
  type FarmerScanThread,
} from '@/features/records/domain/scanState';
import { useSyncRecordsRefresh } from '@/features/sync/hooks/useSyncRecordsRevision';

const NO_STATES: ReadonlyMap<string, FarmerScanState> = new Map();
const NO_THREADS: ReadonlyMap<string, FarmerScanThread> = new Map();

type FarmerScans = {
  states: ReadonlyMap<string, FarmerScanState>;
  threads: ReadonlyMap<string, FarmerScanThread>;
};

const NO_SCANS: FarmerScans = { states: NO_STATES, threads: NO_THREADS };

/** Computed state and plant grouping for each of the signed-in farmer's saved scans. */
export function useFarmerScans(): FarmerScans {
  const database = useCaneGuardDatabase();
  const { user } = useAuth();
  const ownerIdentity = user?.uuid ?? null;
  const [scans, setScans] = useState<FarmerScans>(NO_SCANS);

  const refresh = useCallback(async () => {
    if (!ownerIdentity) {
      setScans(NO_SCANS);
      return;
    }
    try {
      const rows = await listScanThreadRows(database, ownerIdentity);
      setScans({ states: buildFarmerScanStates(rows), threads: buildFarmerScanThreads(rows) });
    } catch {
      // A card without a state shows no chip; the list reports its own errors.
      setScans(NO_SCANS);
    }
  }, [database, ownerIdentity]);
  useSyncRecordsRefresh(() => {
    void refresh();
  });

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return scans;
}

/** Computed My Scans state for each of the signed-in farmer's saved scans. */
export function useFarmerScanStates(): ReadonlyMap<string, FarmerScanState> {
  return useFarmerScans().states;
}
