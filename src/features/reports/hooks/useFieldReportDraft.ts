import { randomUUID } from 'expo-crypto';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const refreshGeneration = useRef(0);
  const refreshInput = useRef<{
    scanRecordId: string | null;
    submitterIdentity: string | null;
  }>({ scanRecordId: null, submitterIdentity: null });
  const submitterIdentity = user?.uuid ?? null;
  useEffect(() => {
    refreshInput.current = { scanRecordId, submitterIdentity };
  }, [scanRecordId, submitterIdentity]);
  const isCurrentInput = useCallback(
    () =>
      refreshInput.current.scanRecordId === scanRecordId &&
      refreshInput.current.submitterIdentity === submitterIdentity,
    [scanRecordId, submitterIdentity],
  );
  const refresh = useCallback(async () => {
    if (!isCurrentInput()) {
      return;
    }
    const requestGeneration = ++refreshGeneration.current;
    const isCurrentRequest = () =>
      refreshGeneration.current === requestGeneration &&
      isCurrentInput();

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
      if (!isCurrentRequest()) {
        return;
      }
      setState({ data, errorMessage: null, hasOtherOwnerReport, loading: false });
    } catch (error: unknown) {
      if (!isCurrentRequest()) {
        return;
      }
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
  }, [database, isCurrentInput, scanRecordId, user]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );
  useSyncRecordsRefresh(() => {
    void refresh();
  });

  const visibleState =
    state.data?.submitterIdentity === submitterIdentity
      ? state
      : {
          ...state,
          data: null,
          hasOtherOwnerReport: false,
          loading: true,
        };

  return { ...visibleState, refresh };
}

export function useFieldReportDraft(
  scanRecordId: string | null,
  createIfMissing = true,
  regionDefaults?: { municipality: string; province: string },
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
  const [locationServicesDisabled, setLocationServicesDisabled] = useState(false);
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
  const finalizeInFlight = useRef(false);
  const locationCaptureInFlight = useRef(false);
  const autoCaptureAttemptedFor = useRef<string | null>(null);
  const refreshGeneration = useRef(0);
  const refreshInput = useRef<{
    scanRecordId: string | null;
    submitterIdentity: string | null;
  }>({ scanRecordId: null, submitterIdentity: null });
  // `regionDefaults` is only read while creating a brand-new Draft; holding
  // it in a ref keeps `refresh` stable so the focus effect does not re-run on
  // every render when a caller passes a fresh object literal.
  const regionDefaultsRef = useRef(regionDefaults);
  const submitterIdentity = user?.uuid ?? null;
  useEffect(() => {
    refreshInput.current = { scanRecordId, submitterIdentity };
  }, [scanRecordId, submitterIdentity]);
  useEffect(() => {
    regionDefaultsRef.current = regionDefaults;
  }, [regionDefaults]);
  const isCurrentInput = useCallback(
    () =>
      refreshInput.current.scanRecordId === scanRecordId &&
      refreshInput.current.submitterIdentity === submitterIdentity,
    [scanRecordId, submitterIdentity],
  );
  const hasCurrentReport =
    state.data?.scanRecordId === scanRecordId &&
    state.data?.submitterIdentity === submitterIdentity;

  const runLocationCapture = useCallback(
    async (report: FieldReport): Promise<FieldReport | null> => {
      if (
        !user ||
        locationCaptureInFlight.current ||
        finalizing ||
        finalizeInFlight.current ||
        saveInFlight.current
      ) {
        return null;
      }

      locationCaptureInFlight.current = true;
      setCapturingLocation(true);
      setLocationServicesDisabled(false);
      setSaved(false);
      setSubmissionIssues([]);
      setState((current) => ({ ...current, errorMessage: null }));
      try {
        const result = await captureGpsLocation(expoForegroundLocationClient);
        setLocationServicesDisabled(
          result.outcome === 'unavailable' &&
            result.reason === 'location_services_disabled',
        );
        const data = await saveGpsCapture(database, report.id, user.uuid, {
          ...result,
          updatedAt: new Date().toISOString(),
        });
        if (!isCurrentInput() || !data) {
          return null;
        }
        setState({ data, errorMessage: null, loading: false });
        return data;
      } catch (error: unknown) {
        const storageError = toStorageError(
          error,
          'UPDATE_FAILED',
          'Saving the GPS result failed.',
        );
        if (isCurrentInput()) {
          setState((current) => ({
            ...current,
            errorMessage: getStorageErrorMessage(storageError),
          }));
        }
        return null;
      } finally {
        locationCaptureInFlight.current = false;
        setCapturingLocation(false);
      }
    },
    [database, finalizing, isCurrentInput, user],
  );

  const captureLocation = useCallback(async (): Promise<FieldReport | null> => {
    if (!state.data || !hasCurrentReport || !user) {
      return null;
    }
    return runLocationCapture(state.data);
  }, [hasCurrentReport, runLocationCapture, state.data, user]);

  const attemptAutomaticLocationCapture = useCallback(
    async (report: FieldReport) => {
      // D5 guards: draft-only, never overwrite a manual-map final location,
      // and only one automatic attempt per report identity.
      if (
        report.authoringState !== 'draft' ||
        report.locationSource === 'manual_map' ||
        report.gpsCaptureOutcome !== null ||
        autoCaptureAttemptedFor.current === report.id
      ) {
        return;
      }
      autoCaptureAttemptedFor.current = report.id;
      await runLocationCapture(report);
    },
    [runLocationCapture],
  );
  // Stable handle for `refresh`: the focus effect re-runs when `refresh`
  // changes identity, so the auto-capture callback must not be a direct
  // dependency (it changes while a GPS capture or finalize is in flight).
  const attemptAutomaticLocationCaptureRef = useRef(
    attemptAutomaticLocationCapture,
  );
  useEffect(() => {
    attemptAutomaticLocationCaptureRef.current = attemptAutomaticLocationCapture;
  }, [attemptAutomaticLocationCapture]);

  const refresh = useCallback(async () => {
    if (!isCurrentInput()) {
      return;
    }
    const requestGeneration = ++refreshGeneration.current;
    const isCurrentRequest = () =>
      refreshGeneration.current === requestGeneration &&
      isCurrentInput();

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

    setState({ data: null, errorMessage: null, loading: true });
    setSaved(false);
    setSubmissionIssues([]);
    try {
      const existing = await findFieldReportByScanRecordId(
        database,
        scanRecordId,
        user.uuid,
      );
      if (!isCurrentRequest()) {
        return;
      }
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
          // D2: seed province/municipality from the cached region list instead
          // of the hardcoded schema defaults when a default region is known.
          ...(regionDefaultsRef.current
            ? {
                province: regionDefaultsRef.current.province,
                municipality: regionDefaultsRef.current.municipality,
              }
            : {}),
        }));
      if (!isCurrentRequest()) {
        return;
      }
      reportId.current = {
        id: data.id,
        scanRecordId,
        submitterIdentity: user.uuid,
      };
      setState({ data, errorMessage: null, loading: false });
      setSubmissionIssues([]);
      if (!existing) {
        // D5: a brand-new draft automatically attempts one foreground GPS
        // reading. The manual map remains the fallback and may override;
        // failed attempts are preserved as evidence.
        void attemptAutomaticLocationCaptureRef.current(data);
      }
    } catch (error: unknown) {
      if (!isCurrentRequest()) {
        return;
      }
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
  }, [createIfMissing, database, isCurrentInput, scanRecordId, user]);

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
      if (
        !state.data ||
        !hasCurrentReport ||
        !user ||
        capturingLocation ||
        finalizing ||
        finalizeInFlight.current
      ) {
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
        if (!isCurrentInput()) {
          return null;
        }
        setState({ data, errorMessage: null, loading: false });
        setSaved(true);
        return data;
      } catch (error: unknown) {
        const storageError = toStorageError(
          error,
          'UPDATE_FAILED',
          'Saving the Field Report draft failed.',
        );
        if (isCurrentInput()) {
          setState((current) => ({
            ...current,
            errorMessage: getStorageErrorMessage(storageError),
          }));
        }
        return null;
      } finally {
        if (saveInFlight.current === operation) {
          saveInFlight.current = null;
          if (isCurrentInput()) {
            setSaving(false);
          }
        }
      }
    },
    [
      capturingLocation,
      database,
      finalizing,
      hasCurrentReport,
      isCurrentInput,
      state.data,
      user,
    ],
  );

  const saveManualLocation = useCallback(
    async (latitude: number, longitude: number): Promise<FieldReport | null> => {
      if (
        !state.data ||
        !hasCurrentReport ||
        !user ||
        savingManualLocation ||
        capturingLocation ||
        finalizing ||
        finalizeInFlight.current ||
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
        if (!isCurrentInput()) {
          return null;
        }
        setState({ data, errorMessage: null, loading: false });
        setSaved(true);
        return data;
      } catch (error: unknown) {
        const storageError = toStorageError(
          error,
          'UPDATE_FAILED',
          'Saving the manual map location failed.',
        );
        if (isCurrentInput()) {
          setState((current) => ({
            ...current,
            errorMessage: getStorageErrorMessage(storageError),
          }));
        }
        return null;
      } finally {
        setSavingManualLocation(false);
      }
    }, [
      capturingLocation,
      database,
      finalizing,
      hasCurrentReport,
      isCurrentInput,
      savingManualLocation,
      state.data,
      user,
    ],
  );

  const finalize = useCallback(
    async (values: {
      affectedAreaHectares: number;
      affectedPortionPercent: number;
      barangay: string;
      caneClass?: string;
      cropAge?: string;
      farmerOrFarmOwnerName: string;
      fieldNotes?: string | null;
      mismatchReported?: boolean | null;
      reporterObservationText?: string | null;
      reporterSuspectedCondition?: string | null;
      municipality?: string;
      province?: string;
      sugarcaneVariety?: string;
    }): Promise<FieldReport | null> => {
      if (
        !state.data ||
        !hasCurrentReport ||
        !user ||
        finalizing ||
        savingManualLocation ||
        capturingLocation ||
        finalizeInFlight.current ||
        saveInFlight.current
      ) {
        return null;
      }

      finalizeInFlight.current = true;
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
        if (!isCurrentInput()) {
          return null;
        }
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
        if (isCurrentInput()) {
          setState((current) => ({
            ...current,
            errorMessage: getStorageErrorMessage(storageError),
          }));
        }
        return null;
      } finally {
        finalizeInFlight.current = false;
        setFinalizing(false);
      }
    }, [
      capturingLocation,
      database,
      finalizing,
      hasCurrentReport,
      isCurrentInput,
      savingManualLocation,
      state.data,
      user,
    ],
  );

  const visibleState =
    state.data && !hasCurrentReport
      ? { data: null, errorMessage: null, loading: true }
      : state;

  return {
    ...visibleState,
    captureLocation,
    capturingLocation: hasCurrentReport ? capturingLocation : false,
    finalize,
    finalizing: hasCurrentReport ? finalizing : false,
    locationServicesDisabled: hasCurrentReport
      ? locationServicesDisabled
      : false,
    refresh,
    save,
    saveManualLocation,
    saved: hasCurrentReport ? saved : false,
    saving: hasCurrentReport ? saving : false,
    savingManualLocation: hasCurrentReport ? savingManualLocation : false,
    submissionIssues: hasCurrentReport ? submissionIssues : [],
  };
}
