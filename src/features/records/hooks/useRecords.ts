import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { getStorageErrorMessage, toStorageError } from '@/database/errors';
import {
  findScanRecordById,
  listScanRecords,
} from '@/features/records/data/scanRecordRepository';
import type {
  ScanRecordDetails,
  ScanRecordListItem,
  ScanRecordQuery,
} from '@/features/records/domain/recordTypes';

interface QueryState<T> {
  data: T;
  errorMessage: string | null;
  loading: boolean;
}

export function useScanRecords(query: ScanRecordQuery) {
  const database = useCaneGuardDatabase();
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
      });
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
  ]);

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

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { ...state, refresh };
}
