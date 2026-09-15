import { useCallback, useRef, useState } from 'react';

import {
  runRefreshAll,
  type RefreshAllResult,
  type RefreshAllTarget,
} from '@/features/activity/domain/refreshAll';

/**
 * One Refresh all scope for the Activity screen. Targets are read through a ref
 * so the returned callback stays stable across renders and a second press while
 * a refresh is in flight is ignored.
 */
export function useRefreshAll(buildTargets: () => RefreshAllTarget[]) {
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<RefreshAllResult | null>(null);
  const inFlight = useRef(false);
  const buildTargetsRef = useRef(buildTargets);

  buildTargetsRef.current = buildTargets;

  const refreshAll = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    try {
      setResult(await runRefreshAll(buildTargetsRef.current()));
    } finally {
      inFlight.current = false;
      setRefreshing(false);
    }
  }, []);

  return { refreshAll, refreshing, result };
}
