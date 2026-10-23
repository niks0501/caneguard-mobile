import { randomUUID } from 'expo-crypto';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  LocationUnavailableReason,
  MeasurementProvenance,
} from '@/database/schema';
import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { getStorageErrorMessage, toStorageError } from '@/database/errors';
import {
  clearLocationUnavailable,
  createOrGetFieldReportDraft,
  deleteFieldReportDraft,
  finalizeFieldReport,
  findFieldReportByScanRecordId,
  hasFieldReportOwnedByAnotherSubmitter,
  saveGpsCapture,
  saveFieldReportDraft,
  saveManualMapLocation,
  setLocationUnavailable,
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
  const [dataOwnerIdentity, setDataOwnerIdentity] = useState<
    string | null
  >(null);
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
      setDataOwnerIdentity(submitterIdentity);
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
      setDataOwnerIdentity(submitterIdentity);
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
      setDataOwnerIdentity(submitterIdentity);
      setState({
        data: null,
        errorMessage: getStorageErrorMessage(storageError),
        hasOtherOwnerReport: false,
        loading: false,
      });
    }
  }, [database, isCurrentInput, scanRecordId, submitterIdentity, user]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );
  useSyncRecordsRefresh(() => {
    void refresh();
  });

  const visibleState =
    dataOwnerIdentity === submitterIdentity
      ? state
      : {
          data: null,
          errorMessage: null,
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
  // Increments whenever a newer location action supersedes an in-flight
  // reading; a late native result is then discarded instead of persisted.
  const locationAttempt = useRef(0);
  const lastError = useRef<string | null>(null);
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
        finalizeInFlight.current
      ) {
        return null;
      }

      const attempt = ++locationAttempt.current;
      const attemptStartedAt = new Date().toISOString();
      locationCaptureInFlight.current = true;
      setCapturingLocation(true);
      setLocationServicesDisabled(false);
      setSaved(false);
      setSubmissionIssues([]);
      lastError.current = null;
      setState((current) => ({ ...current, errorMessage: null }));
      try {
        const result = await captureGpsLocation(expoForegroundLocationClient);
        if (attempt !== locationAttempt.current) {
          // Cancelled, superseded, or the owner changed while the reading ran.
          return null;
        }
        setLocationServicesDisabled(
          result.outcome === 'unavailable' &&
            result.reason === 'location_services_disabled',
        );
        const data = await saveGpsCapture(database, report.id, user.uuid, {
          ...result,
          startedAt: attemptStartedAt,
          updatedAt: new Date().toISOString(),
        });
        if (!isCurrentInput() || !data) {
          return null;
        }
        if (attempt !== locationAttempt.current) {
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
        if (attempt === locationAttempt.current && isCurrentInput()) {
          lastError.current = getStorageErrorMessage(storageError);
          setState((current) => ({
            ...current,
            errorMessage: getStorageErrorMessage(storageError),
          }));
        }
        return null;
      } finally {
        if (attempt === locationAttempt.current) {
          locationCaptureInFlight.current = false;
          setCapturingLocation(false);
        }
      }
    },
    [database, finalizing, isCurrentInput, user],
  );

  const invalidateLocationAttempt = useCallback(() => {
    locationAttempt.current += 1;
    locationCaptureInFlight.current = false;
    setCapturingLocation(false);
  }, []);

  const cancelLocationCapture = useCallback(() => {
    // A foreground native read cannot be cancelled directly; invalidating the
    // attempt makes any late result stale so it is never applied.
    invalidateLocationAttempt();
  }, [invalidateLocationAttempt]);

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

  const refresh = useCallback(async (): Promise<FieldReport | null> => {
    if (!isCurrentInput()) {
      return null;
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
      return null;
    }
    if (!user) {
      setState({
        data: null,
        errorMessage: 'Sign in before creating a Field Report.',
        loading: false,
      });
      return null;
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
        return null;
      }
      if (!existing && !createIfMissing) {
        setState({
          data: null,
          errorMessage: 'This Field Report Draft could not be found.',
          loading: false,
        });
        return null;
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
        return null;
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
      return data;
    } catch (error: unknown) {
      if (!isCurrentRequest()) {
        return null;
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
      return null;
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
        finalizing ||
        finalizeInFlight.current
      ) {
        return null;
      }
      if (saveInFlight.current) {
        return saveInFlight.current;
      }

      lastError.current = null;
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
        lastError.current = getStorageErrorMessage(storageError);
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
        finalizing ||
        finalizeInFlight.current ||
        saveInFlight.current
      ) {
        return null;
      }

      invalidateLocationAttempt();
      lastError.current = null;
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
        lastError.current = getStorageErrorMessage(storageError);
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
      database,
      finalizing,
      hasCurrentReport,
      invalidateLocationAttempt,
      isCurrentInput,
      savingManualLocation,
      state.data,
      user,
    ],
  );

  const clearUnavailableLocation = useCallback(
    async (): Promise<FieldReport | null> => {
      if (
        !state.data ||
        !hasCurrentReport ||
        !user ||
        savingManualLocation ||
        finalizing ||
        finalizeInFlight.current ||
        saveInFlight.current
      ) {
        return null;
      }

      invalidateLocationAttempt();
      lastError.current = null;
      setSavingManualLocation(true);
      setSaved(false);
      setSubmissionIssues([]);
      setState((current) => ({ ...current, errorMessage: null }));
      try {
        const data = await clearLocationUnavailable(
          database,
          state.data.id,
          user.uuid,
          { updatedAt: new Date().toISOString() },
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
          'Changing the report location failed.',
        );
        lastError.current = getStorageErrorMessage(storageError);
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
    },
    [
      database,
      finalizing,
      hasCurrentReport,
      invalidateLocationAttempt,
      isCurrentInput,
      savingManualLocation,
      state.data,
      user,
    ],
  );

  const markLocationUnavailable = useCallback(
    async (reason: LocationUnavailableReason): Promise<FieldReport | null> => {
      if (
        !state.data ||
        !hasCurrentReport ||
        !user ||
        savingManualLocation ||
        finalizing ||
        finalizeInFlight.current ||
        saveInFlight.current
      ) {
        return null;
      }

      invalidateLocationAttempt();
      lastError.current = null;
      setSavingManualLocation(true);
      setSaved(false);
      setSubmissionIssues([]);
      setState((current) => ({ ...current, errorMessage: null }));
      try {
        const data = await setLocationUnavailable(database, state.data.id, user.uuid, {
          reason,
          updatedAt: new Date().toISOString(),
        });
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
          'Recording the unavailable location failed.',
        );
        lastError.current = getStorageErrorMessage(storageError);
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
    },
    [
      database,
      finalizing,
      hasCurrentReport,
      invalidateLocationAttempt,
      isCurrentInput,
      savingManualLocation,
      state.data,
      user,
    ],
  );

  const finalize = useCallback(

    async (values: {
      affectedAreaHectares: number | null;
      affectedAreaMeasurement?: MeasurementProvenance;
      affectedPortionPercent: number | null;
      affectedPortionMeasurement?: MeasurementProvenance;
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

      invalidateLocationAttempt();
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
        lastError.current = getStorageErrorMessage(storageError);
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
      invalidateLocationAttempt,
      isCurrentInput,
      savingManualLocation,
      state.data,
      user,
    ],
  );

  const discardDraft = useCallback(async (): Promise<boolean> => {
    if (!state.data || !hasCurrentReport || !user) {
      return false;
    }
    try {
      await deleteFieldReportDraft(database, state.data.id, user.uuid);
      if (isCurrentInput()) {
        setState({ data: null, errorMessage: null, loading: false });
      }
      return true;
    } catch {
      return false;
    }
  }, [database, hasCurrentReport, isCurrentInput, state.data, user]);

  const visibleState =
    state.data && !hasCurrentReport
      ? { data: null, errorMessage: null, loading: true }
      : state;

  return {
    ...visibleState,
    cancelLocationCapture,
    captureLocation,
    capturingLocation: hasCurrentReport ? capturingLocation : false,
    getLastOperationError: () => lastError.current,
    clearLocationUnavailable: clearUnavailableLocation,
    discardDraft,
    finalize,
    finalizing: hasCurrentReport ? finalizing : false,
    locationServicesDisabled: hasCurrentReport
      ? locationServicesDisabled
      : false,
    markLocationUnavailable,
    markingLocationUnavailable: hasCurrentReport
      ? savingManualLocation
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
