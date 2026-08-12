import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { getStorageErrorMessage, toStorageError } from '@/database/errors';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  findScanRecordById,
  listScanRecords,
} from '@/features/records/data/scanRecordRepository';
import {
  MAX_RECORD_PAGE_SIZE,
  type ScanRecordDetails,
  type ScanRecordListItem,
  type ScanRecordQuery,
} from '@/features/records/domain/recordTypes';
import { useSyncRecordsRefresh } from '@/features/sync/hooks/useSyncRecordsRevision';

interface QueryState<T> {
  data: T;
  errorMessage: string | null;
  loading: boolean;
}

interface PaginatedQueryState {
  data: ScanRecordListItem[];
  errorMessage: string | null;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
}

export function useScanRecords(query: ScanRecordQuery) {
  const database = useCaneGuardDatabase();
  const { user } = useAuth();
  const submitterIdentity = user?.uuid;
  const {
    barangay,
    limit,
    offset,
    predictedLabel,
    search,
    syncStatus,
  } = query;
  const dateFrom = query.dateRange?.from;
  const dateTo = query.dateRange?.to;
  const [state, setState] = useState<QueryState<ScanRecordListItem[]>>({
    data: [],
    errorMessage: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, errorMessage: null, loading: true }));
    try {
      const data = await listScanRecords(database, {
        barangay,
        dateRange:
          dateFrom || dateTo
            ? {
                from: dateFrom,
                to: dateTo,
              }
            : undefined,
        limit,
        offset,
        predictedLabel,
        search,
        syncStatus,
      }, submitterIdentity);
      setState({ data, errorMessage: null, loading: false });
    } catch (error: unknown) {
      const storageError = toStorageError(
        error,
        'QUERY_FAILED',
        'Listing scan records failed.',
      );
      setState((current) => ({
        ...current,
        errorMessage: getStorageErrorMessage(storageError),
        loading: false,
      }));
    }
  }, [
    database,
    barangay,
    dateFrom,
    dateTo,
    limit,
    offset,
    predictedLabel,
    search,
    syncStatus,
    submitterIdentity,
  ]);
  useSyncRecordsRefresh(() => {
    void refresh();
  });

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { ...state, refresh };
}

export function useScanRecordDetails(id: string | null) {
  const database = useCaneGuardDatabase();
  const [state, setState] = useState<QueryState<ScanRecordDetails | null>>({
    data: null,
    errorMessage: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (!id) {
      setState({
        data: null,
        errorMessage: 'This saved record link is invalid.',
        loading: false,
      });
      return;
    }

    setState((current) => ({ ...current, errorMessage: null, loading: true }));
    try {
      const data = await findScanRecordById(database, id);
      setState({ data, errorMessage: null, loading: false });
    } catch (error: unknown) {
      const storageError = toStorageError(
        error,
        'QUERY_FAILED',
        'Reading a scan record failed.',
      );
      setState({
        data: null,
        errorMessage: getStorageErrorMessage(storageError),
        loading: false,
      });
    }
  }, [database, id]);
  useSyncRecordsRefresh(() => {
    void refresh();
  });

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { ...state, refresh };
}

export function usePaginatedScanRecords(
  query: Omit<ScanRecordQuery, 'limit' | 'offset'>,
  pageSize: number,
) {
  const database = useCaneGuardDatabase();
  const { user } = useAuth();
  const submitterIdentity = user?.uuid;
  const {
    barangay,
    predictedLabel,
    search,
    syncStatus,
  } = query;
  const dateFrom = query.dateRange?.from;
  const dateTo = query.dateRange?.to;
  const normalizedPageSize = Math.min(
    Math.max(Math.trunc(pageSize), 1),
    MAX_RECORD_PAGE_SIZE,
  );
  const loadMoreInFlight = useRef<Promise<void> | null>(null);
  const requestId = useRef(0);
  const [state, setState] = useState<PaginatedQueryState>({
    data: [],
    errorMessage: null,
    hasMore: true,
    loading: true,
    loadingMore: false,
  });

  const loadPage = useCallback(
    async (offset: number, append: boolean) => {
      const currentRequestId = ++requestId.current;
      setState((current) => ({
        ...current,
        data: append ? current.data : [],
        errorMessage: null,
        hasMore: append ? current.hasMore : true,
        loading: !append,
        loadingMore: append,
      }));

      try {
        const page = await listScanRecords(database, {
          barangay,
          dateRange:
            dateFrom || dateTo
              ? {
                  from: dateFrom,
                  to: dateTo,
                }
              : undefined,
          limit: normalizedPageSize,
          offset,
          predictedLabel,
          search,
          syncStatus,
        }, submitterIdentity);

        if (requestId.current !== currentRequestId) {
          return;
        }

        setState((current) => ({
          data: append ? [...current.data, ...page] : page,
          errorMessage: null,
          hasMore: page.length === normalizedPageSize,
          loading: false,
          loadingMore: false,
        }));
      } catch (error: unknown) {
        if (requestId.current !== currentRequestId) {
          return;
        }

        const storageError = toStorageError(
          error,
          'QUERY_FAILED',
          'Listing scan records failed.',
        );
        setState((current) => ({
          ...current,
          errorMessage: getStorageErrorMessage(storageError),
          loading: false,
          loadingMore: false,
        }));
      }
    },
    [
      database,
      barangay,
      dateFrom,
      dateTo,
      normalizedPageSize,
      predictedLabel,
      search,
      syncStatus,
      submitterIdentity,
    ],
  );

  const refresh = useCallback(
    () => loadPage(0, false),
    [loadPage],
  );
  useSyncRecordsRefresh(() => {
    void refresh();
  });
  const loadMore = useCallback(() => {
    if (loadMoreInFlight.current) {
      return loadMoreInFlight.current;
    }
    if (state.loading || state.loadingMore || !state.hasMore) {
      return Promise.resolve();
    }
    const request: Promise<void> = loadPage(state.data.length, true).finally(() => {
      if (loadMoreInFlight.current === request) {
        loadMoreInFlight.current = null;
      }
    });
    loadMoreInFlight.current = request;
    return request;
  }, [
    loadPage,
    state.data.length,
    state.hasMore,
    state.loading,
    state.loadingMore,
  ]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {
        requestId.current += 1;
      };
    }, [refresh]),
  );

  return { ...state, loadMore, refresh };
}
