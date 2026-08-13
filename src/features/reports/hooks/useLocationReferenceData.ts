import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { SEED_LOCATION_REFERENCE_DATA } from '@/features/reports/referenceData/nasugbuSeed';
import {
  resolveLocationReferenceData,
  type ReferenceDataResolution,
} from '@/features/reports/referenceData/referenceDataService';
import type {
  LocationReferenceData,
  LocationReferenceDataSource,
} from '@/features/reports/referenceData/referenceDataTypes';

interface ReferenceDataState {
  data: LocationReferenceData;
  source: LocationReferenceDataSource;
  /** True until the first cache/network resolution completes. */
  loading: boolean;
  /** True while a background refresh is in flight. */
  refreshing: boolean;
  errorMessage: string | null;
}

/**
 * Provides the cached region and barangay lists (D2/D3).
 *
 * The pickers always render: the state starts on the seeded fallback list,
 * then resolves from the offline cache, and finally refreshes from the
 * backend (with ETag change detection) whenever this device is online.
 */
export function useLocationReferenceData(): ReferenceDataState & {
  refresh: () => Promise<void>;
} {
  const [state, setState] = useState<ReferenceDataState>({
    data: SEED_LOCATION_REFERENCE_DATA,
    source: 'seed',
    loading: true,
    refreshing: false,
    errorMessage: null,
  });
  const mounted = useRef(true);
  const inFlight = useRef<Promise<ReferenceDataResolution> | null>(null);

  const applyResolution = useCallback((resolution: ReferenceDataResolution) => {
    if (!mounted.current) {
      return;
    }
    setState((current) => ({
      data: resolution.data,
      source: resolution.source,
      loading: false,
      refreshing: false,
      errorMessage: resolution.errorMessage,
    }));
  }, []);

  const refresh = useCallback(async () => {
    if (inFlight.current) {
      return inFlight.current.then(() => undefined);
    }
    const operation = resolveLocationReferenceData().then((resolution) => {
      applyResolution(resolution);
      return resolution;
    });
    inFlight.current = operation;
    setState((current) => ({ ...current, refreshing: true }));
    try {
      await operation;
    } finally {
      if (inFlight.current === operation) {
        inFlight.current = null;
      }
    }
  }, [applyResolution]);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    void resolveLocationReferenceData().then((resolution) => {
      if (active) {
        applyResolution(resolution);
      }
    });

    const unsubscribeNetwork = NetInfo.addEventListener((networkState) => {
      const online =
        networkState.isConnected === true &&
        networkState.isInternetReachable !== false;
      if (online) {
        void refresh();
      }
    });

    return () => {
      active = false;
      mounted.current = false;
      unsubscribeNetwork();
    };
  }, [applyResolution, refresh]);

  return { ...state, refresh };
}
