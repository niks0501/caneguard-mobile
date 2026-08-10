import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { getStorageErrorMessage, toStorageError } from '@/database/errors';
import { useAuth } from '@/features/auth/hooks/useAuth';
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

interface LocalReportInput {
  dateFrom?: string;
  dateTo?: string;
  submitterIdentity: string | null;
}

export function useLocalReport(dateRange?: DateRange) {
  const database = useCaneGuardDatabase();
  const { user } = useAuth();
  const dateFrom = dateRange?.from;
  const dateTo = dateRange?.to;
  const [state, setState] = useState<LocalReportState>({
    data: null,
    errorMessage: null,
    loading: true,
  });
  const requestGeneration = useRef(0);
  const currentInput = useRef<LocalReportInput>({
    dateFrom,
    dateTo,
    submitterIdentity: user?.uuid ?? null,
  });
  const appliedInput = useRef<LocalReportInput>(currentInput.current);
  currentInput.current = {
    dateFrom,
    dateTo,
    submitterIdentity: user?.uuid ?? null,
  };
  const isCurrentInput = useCallback(
    () =>
      currentInput.current.dateFrom === dateFrom &&
      currentInput.current.dateTo === dateTo &&
      currentInput.current.submitterIdentity === (user?.uuid ?? null),
    [dateFrom, dateTo, user?.uuid],
  );
  const hasCurrentState =
    appliedInput.current.dateFrom === dateFrom &&
    appliedInput.current.dateTo === dateTo &&
    appliedInput.current.submitterIdentity === (user?.uuid ?? null);

  useEffect(() => {
    requestGeneration.current += 1;
    appliedInput.current = currentInput.current;
    setState({ data: null, errorMessage: null, loading: true });
  }, [user?.uuid]);

  const refresh = useCallback(async () => {
    if (!isCurrentInput()) {
      return;
    }
    const requestId = ++requestGeneration.current;
    const isCurrentRequest = () =>
      requestGeneration.current === requestId && isCurrentInput();
    const submitterIdentity = user?.uuid ?? null;
    appliedInput.current = currentInput.current;

    if (!submitterIdentity) {
      setState({
        data: null,
        errorMessage: 'Sign in before reading local reports.',
        loading: false,
      });
      return;
    }
    setState({ data: null, errorMessage: null, loading: true });
    try {
      const data = await getLocalReportSummary(
        database,
        submitterIdentity,
        {
          dateRange:
            dateFrom || dateTo ? { from: dateFrom, to: dateTo } : undefined,
        },
      );
      if (!isCurrentRequest()) {
        return;
      }
      appliedInput.current = currentInput.current;
      setState({ data, errorMessage: null, loading: false });
    } catch (error: unknown) {
      if (!isCurrentRequest()) {
        return;
      }
      appliedInput.current = currentInput.current;
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
  }, [database, dateFrom, dateTo, isCurrentInput, user?.uuid]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return {
    ...(hasCurrentState
      ? state
      : { data: null, errorMessage: null, loading: true }),
    refresh,
  };
}
