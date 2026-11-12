import { canAuthorInspectorWork } from '@/features/auth/capabilities';
import { randomUUID } from 'expo-crypto';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  canTransition,
  createFieldReportFlowState,
  isFlowBusy,
  reduceFieldReportFlow,
  type FieldReportFlowEvent,
  type FieldReportFlowState,
} from '@/features/reports/domain/fieldReportFlow';

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
  SaveFieldReportDraftInput,
} from '@/features/reports/domain/fieldReportTypes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { captureGpsLocation } from '@/features/reports/services/captureGpsLocation';
import { expoForegroundLocationClient } from '@/features/reports/services/expoForegroundLocationClient';
import { useSyncRecordsRefresh } from '@/features/sync/hooks/useSyncRecordsRevision';

const FIELD_REPORT_ROLE_ERROR =
  'Only Field Inspector accounts can access Field Reports.';

export type FinalizeValues = {
  affectedAreaHectares: number | null;
  affectedAreaMeasurement?: MeasurementProvenance;
  affectedPortionPercent: number | null;
  affectedPortionMeasurement?: MeasurementProvenance;
  barangay: string;
  caneClass?: string;
  cropAge?: string;
  farmerOrFarmOwnerName: string;
  fieldNotes?: string | null;
  fieldSurveyClientUuid?: string | null;
  mismatchReported?: boolean | null;
  reporterObservationText?: string | null;
  reporterSuspectedCondition?: string | null;
  municipality?: string;
  province?: string;
  sugarcaneVariety?: string;
};

/**
 * Why a finalize attempt ended. `busy` means it was refused up front because
 * another save, capture or finalize on this report was still running, so
 * nothing was attempted and the caller can retry.
 */
export type FinalizeOutcome =
  | { report: FieldReport; status: 'finalized' }
  | { status: 'busy' | 'failed' | 'invalid' };

interface FieldReportLookupState {
  data: FieldReport | null;
  errorMessage: string | null;
  loading: boolean;
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
    canSeeFieldReport: boolean;
    scanRecordId: string | null;
    submitterIdentity: string | null;
  }>({ canSeeFieldReport: false, scanRecordId: null, submitterIdentity: null });
  const submitterIdentity = user?.uuid ?? null;
  const canSeeFieldReport = user?.role === 'field_reporter';
  useEffect(() => {
    refreshInput.current = {
      canSeeFieldReport,
      scanRecordId,
      submitterIdentity,
    };
  }, [canSeeFieldReport, scanRecordId, submitterIdentity]);
  const isCurrentInput = useCallback(
    () =>
      refreshInput.current.canSeeFieldReport === canSeeFieldReport &&
      refreshInput.current.scanRecordId === scanRecordId &&
      refreshInput.current.submitterIdentity === submitterIdentity,
    [canSeeFieldReport, scanRecordId, submitterIdentity],
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
    if (!canSeeFieldReport) {
      setDataOwnerIdentity(submitterIdentity);
      setState({
        data: null,
        errorMessage: null,
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
  }, [
    canSeeFieldReport,
    database,
    isCurrentInput,
    scanRecordId,
    submitterIdentity,
    user,
  ]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );
  useSyncRecordsRefresh(() => {
    void refresh();
  });

  const visibleState = !canSeeFieldReport
    ? {
        data: null,
        errorMessage: null,
        hasOtherOwnerReport: false,
        loading: false,
      }
    : dataOwnerIdentity === submitterIdentity
      ? state
      : {
          data: null,
          errorMessage: null,
          hasOtherOwnerReport: false,
          loading: true,
        };

  return { ...visibleState, refresh };
}

/**
 * The report flow's single state. `send` runs the shared reducer against a
 * synchronously updated ref, so two callers in the same tick see the same
 * phase and the transition table, not a render's closure, decides who wins.
 * Returns false when the table refuses the event.
 */
function useFieldReportFlowStore() {
  const [state, setState] = useState<FieldReportFlowState>(() =>
    createFieldReportFlowState(),
  );
  const latest = useRef<FieldReportFlowState>(state);
  const send = useCallback((event: FieldReportFlowEvent): boolean => {
    const next = reduceFieldReportFlow(latest.current, event);
    if (next === latest.current) {
      return false;
    }
    latest.current = next;
    setState(next);
    return true;
  }, []);
  const get = useCallback(() => latest.current, []);
  return { get, send, state };
}

export function useFieldReportDraft(
  scanRecordId: string | null,
  createIfMissing = true,
  regionDefaults?: { municipality: string; province: string },
) {
  const database = useCaneGuardDatabase();
  const { user } = useAuth();
  const { get: getFlow, send, state } = useFieldReportFlowStore();
  const reportId = useRef<{
    id: string;
    scanRecordId: string;
    submitterIdentity: string;
  } | null>(null);
  const saveInFlight = useRef<Promise<FieldReport> | null>(null);
  // Increments whenever a newer location action supersedes an in-flight
  // reading; a late native result is then discarded instead of persisted.
  const locationAttempt = useRef(0);
  const lastError = useRef<string | null>(null);
  const autoCaptureAttemptedFor = useRef<string | null>(null);
  const refreshGeneration = useRef(0);
  const refreshInput = useRef<{
    canAuthorReports: boolean;
    scanRecordId: string | null;
    submitterIdentity: string | null;
  }>({ canAuthorReports: false, scanRecordId: null, submitterIdentity: null });
  // `regionDefaults` is only read while creating a brand-new Draft; holding
  // it in a ref keeps `refresh` stable so the focus effect does not re-run on
  // every render when a caller passes a fresh object literal.
  const regionDefaultsRef = useRef(regionDefaults);
  const submitterIdentity = user?.uuid ?? null;
  const canAuthorReports = canAuthorInspectorWork(user);
  useEffect(() => {
    refreshInput.current = {
      canAuthorReports,
      scanRecordId,
      submitterIdentity,
    };
  }, [canAuthorReports, scanRecordId, submitterIdentity]);
  useEffect(() => {
    regionDefaultsRef.current = regionDefaults;
  }, [regionDefaults]);
  const isCurrentInput = useCallback(
    () =>
      refreshInput.current.canAuthorReports === canAuthorReports &&
      refreshInput.current.scanRecordId === scanRecordId &&
      refreshInput.current.submitterIdentity === submitterIdentity,
    [canAuthorReports, scanRecordId, submitterIdentity],
  );
  const hasCurrentReport =
    state.data?.scanRecordId === scanRecordId &&
    state.data?.submitterIdentity === submitterIdentity;

  const runLocationCapture = useCallback(
    async (report: FieldReport): Promise<FieldReport | null> => {
      if (!user || !canAuthorReports || !send({ type: 'LOCATE_STARTED' })) {
        return null;
      }

      const attempt = ++locationAttempt.current;
      const attemptStartedAt = new Date().toISOString();
      lastError.current = null;
      try {
        const result = await captureGpsLocation(expoForegroundLocationClient);
        if (attempt !== locationAttempt.current) {
          // Cancelled, superseded, or the owner changed while the reading ran.
          return null;
        }
        send({
          type: 'LOCATE_NOTICES',
          permissionDenied: result.outcome === 'permission_denied',
          servicesDisabled:
            result.outcome === 'unavailable' &&
            result.reason === 'location_services_disabled',
        });
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
        send({ type: 'LOCATE_SUCCEEDED', data });
        return data;
      } catch (error: unknown) {
        const storageError = toStorageError(
          error,
          'UPDATE_FAILED',
          'Saving the GPS result failed.',
        );
        if (attempt === locationAttempt.current && isCurrentInput()) {
          lastError.current = getStorageErrorMessage(storageError);
          send({
            type: 'LOCATE_FAILED',
            message: getStorageErrorMessage(storageError),
          });
        }
        return null;
      } finally {
        if (attempt === locationAttempt.current) {
          send({ type: 'LOCATE_ENDED' });
        }
      }
    },
    [canAuthorReports, database, isCurrentInput, send, user],
  );

  const invalidateLocationAttempt = useCallback(() => {
    locationAttempt.current += 1;
    send({ type: 'LOCATE_ENDED' });
  }, [send]);

  const cancelLocationCapture = useCallback(() => {
    // A foreground native read cannot be cancelled directly; invalidating the
    // attempt makes any late result stale so it is never applied.
    invalidateLocationAttempt();
  }, [invalidateLocationAttempt]);

  const captureLocation = useCallback(async (): Promise<FieldReport | null> => {
    const data = getFlow().data;
    if (!data || !hasCurrentReport || !user) {
      return null;
    }
    return runLocationCapture(data);
  }, [getFlow, hasCurrentReport, runLocationCapture, user]);

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
  // dependency.
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
      send({
        type: 'LOAD_FAILED',
        message: 'This completed scan link is invalid.',
      });
      return null;
    }
    if (!user) {
      send({
        type: 'LOAD_FAILED',
        message: 'Sign in before creating a Field Report.',
      });
      return null;
    }
    if (!canAuthorReports) {
      send({ type: 'LOAD_FAILED', message: FIELD_REPORT_ROLE_ERROR });
      return null;
    }

    // Refused while a save, place or finalize is mid-flight: reloading then
    // would wipe the report the running operation is about to update.
    if (!send({ type: 'LOAD_STARTED' })) {
      return null;
    }
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
        send({
          type: 'LOAD_FAILED',
          message: 'This Field Report Draft could not be found.',
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
          submitterRole: 'field_reporter',
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
      send({ type: 'LOADED', data });
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
      send({
        type: 'LOAD_FAILED',
        message: getStorageErrorMessage(storageError),
      });
      return null;
    }
  }, [
    canAuthorReports,
    createIfMissing,
    database,
    isCurrentInput,
    scanRecordId,
    send,
    user,
  ]);

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
      const current = getFlow().data;
      if (!current || !hasCurrentReport || !user || !canAuthorReports) {
        return null;
      }
      if (saveInFlight.current) {
        return saveInFlight.current;
      }
      if (!send({ type: 'SAVE_STARTED' })) {
        return null;
      }

      lastError.current = null;
      const operation = saveFieldReportDraft(database, current.id, user.uuid, {
        ...values,
        updatedAt: new Date().toISOString(),
      });
      saveInFlight.current = operation;

      try {
        const data = await operation;
        if (!isCurrentInput()) {
          return null;
        }
        send({ type: 'SAVE_SUCCEEDED', data });
        return data;
      } catch (error: unknown) {
        const storageError = toStorageError(
          error,
          'UPDATE_FAILED',
          'Saving the Field Report draft failed.',
        );
        lastError.current = getStorageErrorMessage(storageError);
        if (isCurrentInput()) {
          send({
            type: 'SAVE_FAILED',
            message: getStorageErrorMessage(storageError),
          });
        }
        return null;
      } finally {
        if (saveInFlight.current === operation) {
          saveInFlight.current = null;
          // No-op when the success/failure above already left `saving`.
          send({ type: 'SAVE_ENDED' });
        }
      }
    },
    [
      canAuthorReports,
      database,
      getFlow,
      hasCurrentReport,
      isCurrentInput,
      send,
      user,
    ],
  );

  /**
   * Manual map point, clear, or "unavailable" mark: one place write at a time,
   * never alongside a save or finalize, and it supersedes a running reading.
   */
  const runPlaceOperation = useCallback(
    async (
      write: (
        reportIdToWrite: string,
        owner: string,
      ) => Promise<FieldReport | null>,
      failureMessage: string,
    ): Promise<FieldReport | null> => {
      const current = getFlow().data;
      if (
        !current ||
        !hasCurrentReport ||
        !user ||
        !canAuthorReports ||
        saveInFlight.current ||
        !send({ type: 'PLACE_STARTED' })
      ) {
        return null;
      }

      locationAttempt.current += 1;
      lastError.current = null;
      try {
        const data = await write(current.id, user.uuid);
        if (!isCurrentInput() || !data) {
          return null;
        }
        send({ type: 'PLACE_SUCCEEDED', data });
        return data;
      } catch (error: unknown) {
        const storageError = toStorageError(
          error,
          'UPDATE_FAILED',
          failureMessage,
        );
        lastError.current = getStorageErrorMessage(storageError);
        if (isCurrentInput()) {
          send({
            type: 'PLACE_FAILED',
            message: getStorageErrorMessage(storageError),
          });
        }
        return null;
      } finally {
        send({ type: 'PLACE_ENDED' });
      }
    },
    [canAuthorReports, getFlow, hasCurrentReport, isCurrentInput, send, user],
  );

  const saveManualLocation = useCallback(
    (latitude: number, longitude: number): Promise<FieldReport | null> => {
      const selectedAt = new Date().toISOString();
      return runPlaceOperation(
        (id, owner) =>
          saveManualMapLocation(database, id, owner, {
            latitude,
            longitude,
            selectedAt,
            updatedAt: selectedAt,
          }),
        'Saving the manual map location failed.',
      );
    },
    [database, runPlaceOperation],
  );

  const clearUnavailableLocation = useCallback(
    (): Promise<FieldReport | null> =>
      runPlaceOperation(
        (id, owner) =>
          clearLocationUnavailable(database, id, owner, {
            updatedAt: new Date().toISOString(),
          }),
        'Changing the report location failed.',
      ),
    [database, runPlaceOperation],
  );

  const markLocationUnavailable = useCallback(
    (reason: LocationUnavailableReason): Promise<FieldReport | null> =>
      runPlaceOperation(
        (id, owner) =>
          setLocationUnavailable(database, id, owner, {
            reason,
            updatedAt: new Date().toISOString(),
          }),
        'Recording the unavailable location failed.',
      ),
    [database, runPlaceOperation],
  );

  const finalizeWithOutcome = useCallback(
    async (values: FinalizeValues): Promise<FinalizeOutcome> => {
      const current = getFlow().data;
      if (!current || !hasCurrentReport || !user || !canAuthorReports) {
        return { status: 'failed' };
      }
      // Refused because other work on this report is running, not because
      // finalizing failed: the caller can show a busy state and try again.
      if (isFlowBusy(getFlow()) || saveInFlight.current) {
        send({ type: 'FINALIZE_REFUSED_BUSY' });
        return { status: 'busy' };
      }
      if (!send({ type: 'FINALIZE_STARTED' })) {
        return { status: 'failed' };
      }

      locationAttempt.current += 1;
      const submittedAt = new Date().toISOString();
      try {
        const result = await finalizeFieldReport(
          database,
          current.id,
          user.uuid,
          {
            ...values,
            districtCode: user.districtCode ?? '',
            submittedAt,
            updatedAt: submittedAt,
          },
        );
        if (!isCurrentInput()) {
          return { status: 'failed' };
        }
        if (result.status === 'invalid') {
          send({
            type: 'FINALIZE_INVALID',
            data: result.report,
            issues: result.missingRequirements,
          });
          return { status: 'invalid' };
        }
        send({ type: 'FINALIZE_SUCCEEDED', data: result.report });
        return { report: result.report, status: 'finalized' };
      } catch (error: unknown) {
        const storageError = toStorageError(
          error,
          'UPDATE_FAILED',
          'Finalizing the Field Report failed.',
        );
        lastError.current = getStorageErrorMessage(storageError);
        if (isCurrentInput()) {
          send({
            type: 'FINALIZE_FAILED',
            message: getStorageErrorMessage(storageError),
          });
        }
        return { status: 'failed' };
      } finally {
        // No-op when a result above already left `finalizing`.
        send({ type: 'FINALIZE_ENDED' });
      }
    },
    [
      canAuthorReports,
      database,
      getFlow,
      hasCurrentReport,
      isCurrentInput,
      send,
      user,
    ],
  );

  const finalize = useCallback(
    async (values: FinalizeValues): Promise<FieldReport | null> => {
      const outcome = await finalizeWithOutcome(values);
      return outcome.status === 'finalized' ? outcome.report : null;
    },
    [finalizeWithOutcome],
  );

  const discardDraft = useCallback(async (): Promise<boolean> => {
    const current = getFlow().data;
    if (
      !current ||
      !hasCurrentReport ||
      !user ||
      !canAuthorReports ||
      !canTransition(getFlow().phase, 'DISCARDED')
    ) {
      return false;
    }
    try {
      await deleteFieldReportDraft(database, current.id, user.uuid);
      if (isCurrentInput()) {
        send({ type: 'DISCARDED' });
      }
      return true;
    } catch {
      return false;
    }
  }, [
    canAuthorReports,
    database,
    getFlow,
    hasCurrentReport,
    isCurrentInput,
    send,
    user,
  ]);

  const openFinalizeConfirm = useCallback(
    () => send({ type: 'CONFIRM_OPENED' }),
    [send],
  );
  const dismissFinalizeConfirm = useCallback(
    () => send({ type: 'CONFIRM_DISMISSED' }),
    [send],
  );
  /** The finalized report has been handed to sync; the flow is complete. */
  const endSending = useCallback(() => send({ type: 'SEND_ENDED' }), [send]);

  // What the screen sees. A report from another scan or owner, or a role that
  // cannot author, never shows through: it reads as opening or unavailable.
  const visible: FieldReportFlowState = !canAuthorReports
    ? {
        ...createFieldReportFlowState(
          user || state.errorMessage ? 'load-failed' : 'empty',
        ),
        errorMessage: user ? FIELD_REPORT_ROLE_ERROR : state.errorMessage,
      }
    : state.data && !hasCurrentReport
      ? createFieldReportFlowState('loading')
      : state;
  const own = hasCurrentReport && canAuthorReports;

  return {
    cancelLocationCapture,
    captureLocation,
    capturingLocation: own ? visible.reading : false,
    clearLocationUnavailable: clearUnavailableLocation,
    confirmNotice: own ? visible.confirmNotice : null,
    data: visible.data,
    discardDraft,
    dismissFinalizeConfirm,
    endSending,
    errorMessage: visible.errorMessage,
    finalize,
    finalizeWithOutcome,
    finalizing: own ? visible.phase === 'finalizing' : false,
    getLastOperationError: () => lastError.current,
    loading: visible.phase === 'loading',
    locationPermissionDenied: own ? visible.locationPermissionDenied : false,
    locationServicesDisabled: own ? visible.locationServicesDisabled : false,
    markLocationUnavailable,
    markingLocationUnavailable: own ? visible.phase === 'saving-location' : false,
    openFinalizeConfirm,
    /** The one named answer to where the report flow stands. */
    phase: visible.phase,
    refresh,
    save,
    saveManualLocation,
    saved: own ? visible.saved : false,
    saving: own ? visible.phase === 'saving' : false,
    savingManualLocation: own ? visible.phase === 'saving-location' : false,
    submissionIssues: own ? visible.submissionIssues : [],
  };
}
