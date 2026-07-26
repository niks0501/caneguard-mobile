import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { getStorageErrorMessage, toStorageError } from '@/database/errors';
import type {
  DateRange,
  LocalReportSummary,
} from '@/features/records/domain/recordTypes';
import { getLocalReportSummary } from '@/features/reports/data/reportRepository';

interface LocalReportState {
  data: LocalReportSummary | null;
  errorMessage: string | null;
  loading: boolean;
}

export function useLocalReport(dateRange?: DateRange) {
  const database = useCaneGuardDatabase();
  const dateFrom = dateRange?.from;
  const dateTo = dateRange?.to;
  const [state, setState] = useState<LocalReportState>({
    data: null,
    errorMessage: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, errorMessage: null, loading: true }));
    try {
      const data = await getLocalReportSummary(database, {
        dateRange:
          dateFrom || dateTo ? { from: dateFrom, to: dateTo } : undefined,
      });
      setState({ data, errorMessage: null, loading: false });
    } catch (error: unknown) {
      const storageError = toStorageError(
        error,
        'QUERY_FAILED',
        'Calculating the local report summary failed.',
      );
      setState({
        data: null,
        errorMessage: getStorageErrorMessage(storageError),
        loading: false,
      });
    }
  }, [database, dateFrom, dateTo]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { ...state, refresh };
}
