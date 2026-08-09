import { randomUUID } from 'expo-crypto';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { getStorageErrorMessage, toStorageError } from '@/database/errors';
import {
  createOrGetFieldReportDraft,
  findFieldReportByScanRecordId,
  saveFieldReportDraft,
} from '@/features/reports/data/fieldReportRepository';
import type {
  FieldReport,
  SaveFieldReportDraftInput,
} from '@/features/reports/domain/fieldReportTypes';

interface FieldReportState {
  data: FieldReport | null;
  errorMessage: string | null;
  loading: boolean;
}

export function useFieldReportForScan(scanRecordId: string | null) {
  const database = useCaneGuardDatabase();
  const [state, setState] = useState<FieldReportState>({
    data: null,
    errorMessage: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (!scanRecordId) {
      setState({
        data: null,
        errorMessage: 'This saved record link is invalid.',
        loading: false,
      });
      return;
    }
    setState((current) => ({ ...current, errorMessage: null, loading: true }));
    try {
      const data = await findFieldReportByScanRecordId(database, scanRecordId);
      setState({ data, errorMessage: null, loading: false });
    } catch (error: unknown) {
      const storageError = toStorageError(
        error,
        'QUERY_FAILED',
        'Reading the Field Report failed.',
      );
      setState({
        data: null,
        errorMessage: getStorageErrorMessage(storageError),
        loading: false,
      });
    }
  }, [database, scanRecordId]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { ...state, refresh };
}

export function useFieldReportDraft(scanRecordId: string | null) {
  const database = useCaneGuardDatabase();
  const [state, setState] = useState<FieldReportState>({
    data: null,
    errorMessage: null,
    loading: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const reportId = useRef<string | null>(null);
  const saveInFlight = useRef<Promise<FieldReport> | null>(null);

  const refresh = useCallback(async () => {
    if (!scanRecordId) {
      setState({
        data: null,
        errorMessage: 'This completed scan link is invalid.',
        loading: false,
      });
      return;
    }

    setState((current) => ({ ...current, errorMessage: null, loading: true }));
    try {
      const existing = await findFieldReportByScanRecordId(database, scanRecordId);
      reportId.current = existing?.id ?? reportId.current ?? randomUUID();
      const data =
        existing ??
        (await createOrGetFieldReportDraft(database, {
          id: reportId.current,
          scanRecordId,
          createdAt: new Date().toISOString(),
        }));
      reportId.current = data.id;
      setState({ data, errorMessage: null, loading: false });
    } catch (error: unknown) {
      const storageError = toStorageError(
        error,
        'QUERY_FAILED',
        'Opening the Field Report draft failed.',
      );
      setState({
        data: null,
        errorMessage: getStorageErrorMessage(storageError),
        loading: false,
      });
    }
  }, [database, scanRecordId]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const save = useCallback(
    async (
      values: Omit<SaveFieldReportDraftInput, 'updatedAt'>,
    ): Promise<FieldReport | null> => {
      if (!state.data) {
        return null;
      }
      if (saveInFlight.current) {
        return saveInFlight.current;
      }

      setSaving(true);
      setSaved(false);
      setState((current) => ({ ...current, errorMessage: null }));
      const operation = saveFieldReportDraft(database, state.data.id, {
        ...values,
        updatedAt: new Date().toISOString(),
      });
      saveInFlight.current = operation;

      try {
        const data = await operation;
        setState({ data, errorMessage: null, loading: false });
        setSaved(true);
        return data;
      } catch (error: unknown) {
        const storageError = toStorageError(
          error,
          'UPDATE_FAILED',
          'Saving the Field Report draft failed.',
        );
        setState((current) => ({
          ...current,
          errorMessage: getStorageErrorMessage(storageError),
        }));
        return null;
      } finally {
        saveInFlight.current = null;
        setSaving(false);
      }
    },
    [database, state.data],
  );

  return { ...state, refresh, save, saved, saving };
}
