import { randomUUID } from 'expo-crypto';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { getStorageErrorMessage, toStorageError } from '@/database/errors';
import {
  createOrGetFieldReportDraft,
  finalizeFieldReport,
  findFieldReportByScanRecordId,
  hasFieldReportOwnedByAnotherSubmitter,
  saveGpsCapture,
  saveFieldReportDraft,
  saveManualMapLocation,
} from '@/features/reports/data/fieldReportRepository';
import type {
  FieldReport,
  FieldReportSubmissionRequirement,
  SaveFieldReportDraftInput,
} from '@/features/reports/domain/fieldReportTypes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { captureGpsLocation } from '@/features/reports/services/captureGpsLocation';
import { expoForegroundLocationClient } from '@/features/reports/services/expoForegroundLocationClient';
import { useSyncRecordsRefresh } from '@/features/sync/hooks/useSyncRecordsRevision';

interface FieldReportState {
  data: FieldReport | null;
  errorMessage: string | null;
  loading: boolean;
}

interface FieldReportLookupState extends FieldReportState {
  hasOtherOwnerReport: boolean;
}

export function useFieldReportForScan(scanRecordId: string | null) {
  const database = useCaneGuardDatabase();
  const { user } = useAuth();
  const [state, setState] = useState<FieldReportLookupState>({
    data: null,
    errorMessage: null,
    hasOtherOwnerReport: false,
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (!scanRecordId || !user) {
      setState({
        data: null,
        errorMessage: 'This saved record link is invalid.',
        hasOtherOwnerReport: false,
        loading: false,
      });
      return;
    }
    setState((current) => ({ ...current, errorMessage: null, loading: true }));
    try {
      const [data, hasOtherOwnerReport] = await Promise.all([
        findFieldReportByScanRecordId(database, scanRecordId, user.uuid),
        hasFieldReportOwnedByAnotherSubmitter(
          database,
          scanRecordId,
          user.uuid,
        ),
      ]);
      setState({ data, errorMessage: null, hasOtherOwnerReport, loading: false });
    } catch (error: unknown) {
      const storageError = toStorageError(
        error,
        'QUERY_FAILED',
        'Reading the Field Report failed.',
      );
      setState({
        data: null,
        errorMessage: getStorageErrorMessage(storageError),
        hasOtherOwnerReport: false,
        loading: false,
      });
    }
  }, [database, scanRecordId, user]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );
  useSyncRecordsRefresh(() => {
    void refresh();
  });

  return { ...state, refresh };
}

export function useFieldReportDraft(
  scanRecordId: string | null,
  createIfMissing = true,
) {
  const database = useCaneGuardDatabase();
  const { user } = useAuth();
  const [state, setState] = useState<FieldReportState>({
    data: null,
    errorMessage: null,
    loading: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [savingManualLocation, setSavingManualLocation] = useState(false);
  const [submissionIssues, setSubmissionIssues] = useState<
    FieldReportSubmissionRequirement[]
  >([]);
  const reportId = useRef<{
    id: string;
    scanRecordId: string;
    submitterIdentity: string;
  } | null>(null);
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
    if (!user) {
      setState({
        data: null,
        errorMessage: 'Sign in before creating a Field Report.',
        loading: false,
      });
      return;
    }

    setState((current) => ({ ...current, errorMessage: null, loading: true }));
    try {
      const existing = await findFieldReportByScanRecordId(
        database,
        scanRecordId,
        user.uuid,
      );
      if (!existing && !createIfMissing) {
        setState({
          data: null,
          errorMessage: 'This Field Report Draft could not be found.',
          loading: false,
        });
        return;
      }
      const cachedReportId =
        reportId.current?.scanRecordId === scanRecordId &&
        reportId.current?.submitterIdentity === user.uuid
          ? reportId.current.id
          : null;
      const reportIdForScan = existing?.id ?? cachedReportId ?? randomUUID();
      const data =
        existing ??
        (await createOrGetFieldReportDraft(database, {
          id: reportIdForScan,
          scanRecordId,
          createdAt: new Date().toISOString(),
          submitterIdentity: user.uuid,
          submitterRole: user.role,
        }));
      reportId.current = {
        id: data.id,
        scanRecordId,
        submitterIdentity: user.uuid,
      };
      setState({ data, errorMessage: null, loading: false });
      setSubmissionIssues([]);
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
  }, [createIfMissing, database, scanRecordId, user]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );
  useSyncRecordsRefresh(() => {
    void refresh();
  });

  const save = useCallback(
    async (
      values: Omit<SaveFieldReportDraftInput, 'updatedAt'>,
    ): Promise<FieldReport | null> => {
      if (!state.data || !user || capturingLocation) {
        return null;
      }
      if (saveInFlight.current) {
        return saveInFlight.current;
      }

      setSaving(true);
      setSaved(false);
      setSubmissionIssues([]);
      setState((current) => ({ ...current, errorMessage: null }));
      const operation = saveFieldReportDraft(database, state.data.id, user.uuid, {
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
    [capturingLocation, database, state.data, user],
  );

  const captureLocation = useCallback(async (): Promise<FieldReport | null> => {
    if (!state.data || !user || capturingLocation || saveInFlight.current) {
      return null;
    }

    setCapturingLocation(true);
    setSaved(false);
    setSubmissionIssues([]);
    setState((current) => ({ ...current, errorMessage: null }));
    try {
      const result = await captureGpsLocation(expoForegroundLocationClient);
      const data = await saveGpsCapture(database, state.data.id, user.uuid, {
        ...result,
        updatedAt: new Date().toISOString(),
      });
      setState({ data, errorMessage: null, loading: false });
      return data;
    } catch (error: unknown) {
      const storageError = toStorageError(
        error,
        'UPDATE_FAILED',
        'Saving the GPS result failed.',
      );
      setState((current) => ({
        ...current,
        errorMessage: getStorageErrorMessage(storageError),
      }));
      return null;
    } finally {
      setCapturingLocation(false);
    }
  }, [capturingLocation, database, state.data, user]);

  const saveManualLocation = useCallback(
    async (latitude: number, longitude: number): Promise<FieldReport | null> => {
      if (
        !state.data ||
        !user ||
        savingManualLocation ||
        capturingLocation ||
        saveInFlight.current
      ) {
        return null;
      }

      setSavingManualLocation(true);
      setSaved(false);
      setSubmissionIssues([]);
      setState((current) => ({ ...current, errorMessage: null }));
      const selectedAt = new Date().toISOString();
      try {
        const data = await saveManualMapLocation(
          database,
          state.data.id,
          user.uuid,
          {
            latitude,
            longitude,
            selectedAt,
            updatedAt: selectedAt,
          },
        );
        setState({ data, errorMessage: null, loading: false });
        setSaved(true);
        return data;
      } catch (error: unknown) {
        const storageError = toStorageError(
          error,
          'UPDATE_FAILED',
          'Saving the manual map location failed.',
        );
        setState((current) => ({
          ...current,
          errorMessage: getStorageErrorMessage(storageError),
        }));
        return null;
      } finally {
        setSavingManualLocation(false);
      }
    }, [capturingLocation, database, savingManualLocation, state.data, user],
  );

  const finalize = useCallback(
    async (values: {
      barangay: string;
      farmerOrFarmOwnerName: string;
    }): Promise<FieldReport | null> => {
      if (
        !state.data ||
        !user ||
        finalizing ||
        savingManualLocation ||
        capturingLocation ||
        saveInFlight.current
      ) {
        return null;
      }

      setFinalizing(true);
      setSaved(false);
      setSubmissionIssues([]);
      setState((current) => ({ ...current, errorMessage: null }));
      const submittedAt = new Date().toISOString();
      try {
        const result = await finalizeFieldReport(
          database,
          state.data.id,
          user.uuid,
          {
            ...values,
            submittedAt,
            updatedAt: submittedAt,
          },
        );
        setState({ data: result.report, errorMessage: null, loading: false });
        if (result.status === 'invalid') {
          setSubmissionIssues(result.missingRequirements);
          setSaved(true);
          return null;
        }
        return result.report;
      } catch (error: unknown) {
        const storageError = toStorageError(
          error,
          'UPDATE_FAILED',
          'Finalizing the Field Report failed.',
        );
        setState((current) => ({
          ...current,
          errorMessage: getStorageErrorMessage(storageError),
        }));
        return null;
      } finally {
        setFinalizing(false);
      }
    }, [
      capturingLocation,
      database,
      finalizing,
      savingManualLocation,
      state.data,
      user,
    ],
  );

  return {
    ...state,
    captureLocation,
    capturingLocation,
    finalize,
    finalizing,
    refresh,
    save,
    saveManualLocation,
    saved,
    saving,
    savingManualLocation,
    submissionIssues,
  };
}
