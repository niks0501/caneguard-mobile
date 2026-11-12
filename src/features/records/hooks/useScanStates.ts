import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

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
  status: 'loading' | 'ready' | 'error';
  refresh: () => Promise<void>;
};

const NO_SCANS: Omit<FarmerScans, 'refresh'> = {
  states: NO_STATES,
  threads: NO_THREADS,
  status: 'loading',
};

/** Computed state and plant grouping for each of the signed-in farmer's saved scans. */
export function useFarmerScans(): FarmerScans {
  const database = useCaneGuardDatabase();
  const { user } = useAuth();
  const ownerIdentity = user?.uuid ?? null;
  const [scans, setScans] = useState<Omit<FarmerScans, 'refresh'>>(NO_SCANS);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    if (!ownerIdentity) {
      setScans({ ...NO_SCANS, status: 'ready' });
      return;
    }
    setScans({ ...NO_SCANS, status: 'loading' });
    try {
      const rows = await listScanThreadRows(database, ownerIdentity);
      if (currentRequestId !== requestId.current) return;
      setScans({
        states: buildFarmerScanStates(rows),
        threads: buildFarmerScanThreads(rows),
        status: 'ready',
      });
    } catch {
      if (currentRequestId !== requestId.current) return;
      setScans({ states: NO_STATES, threads: NO_THREADS, status: 'error' });
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

  return { ...scans, refresh };
}

