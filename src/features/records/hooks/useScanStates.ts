import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { listScanThreadRows } from '@/features/records/data/scanRecordRepository';
import {
  buildFarmerScanStates,
  type FarmerScanState,
} from '@/features/records/domain/scanState';
import { useSyncRecordsRefresh } from '@/features/sync/hooks/useSyncRecordsRevision';

const NO_STATES: ReadonlyMap<string, FarmerScanState> = new Map();

/** Computed My Scans state for each of the signed-in farmer's saved scans. */
export function useFarmerScanStates(): ReadonlyMap<string, FarmerScanState> {
  const database = useCaneGuardDatabase();
  const { user } = useAuth();
  const ownerIdentity = user?.uuid ?? null;
  const [states, setStates] = useState<ReadonlyMap<string, FarmerScanState>>(NO_STATES);

  const refresh = useCallback(async () => {
    if (!ownerIdentity) {
      setStates(NO_STATES);
      return;
    }
    try {
      setStates(buildFarmerScanStates(await listScanThreadRows(database, ownerIdentity)));
    } catch {
      // A card without a state shows no chip; the list reports its own errors.
      setStates(NO_STATES);
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

  return states;
}
