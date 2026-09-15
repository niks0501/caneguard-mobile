import { useCallback, useRef, useState } from 'react';

import {
  runRefreshAll,
  type RefreshAllResult,
  type RefreshAllTarget,
} from '@/features/activity/domain/refreshAll';

/**
 * One Refresh all scope for the Activity screen. The caller passes the eligible
 * subsystems at press time, and a second press while a refresh is in flight is
 * ignored.
 */
export function useRefreshAll() {
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<RefreshAllResult | null>(null);
  const inFlight = useRef(false);

  const refreshAll = useCallback(async (targets: RefreshAllTarget[]) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    try {
      setResult(await runRefreshAll(targets));
    } finally {
      inFlight.current = false;
      setRefreshing(false);
    }
  }, []);

  return { refreshAll, refreshing, result };
}
