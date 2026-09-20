import { randomUUID } from 'expo-crypto';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import type { ImagePickerAsset } from 'expo-image-picker';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { getStorageErrorMessage, toStorageError } from '@/database/errors';
import {
  findCachedFieldValidationAssignment,
  markCachedFieldValidationAssignmentInProgress,
} from '@/features/assignments/data/assignmentCacheRepository';
import {
  findFieldValidationCompletion,
  saveFieldValidationCompletion,
} from '@/features/assignments/data/fieldValidationCompletionRepository';
import type { FieldValidationFollowUpOutcome } from '@/database/schema';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import type { PreviousVisitContext } from '@/features/assignments/domain/previousVisit';
import { buildMobilePreviousEvidencePhotoUrl } from '@/features/assignments/api/mobileFieldValidationAssignmentsApi';
import type {
  FieldValidationCompletion,
  SaveFieldValidationCompletionInput,
} from '@/features/assignments/domain/fieldValidationCompletionTypes';
import { normalizeFieldValidationText } from '@/features/assignments/domain/fieldValidationCompletionValidation';
import { findFieldReportById } from '@/features/reports/data/fieldReportRepository';
import {
  deleteFieldValidationPhoto,
  persistFieldValidationPhoto,
} from '@/features/assignments/services/fieldValidationPhotoStorage';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { captureGpsLocation } from '@/features/reports/services/captureGpsLocation';
import { expoForegroundLocationClient } from '@/features/reports/services/expoForegroundLocationClient';
import { useSync } from '@/features/sync/hooks/useSync';

export interface CompleteFieldValidationInput {
  actionTaken: string;
  fieldFinding: string;
  fieldObservation: string;
  freshPhoto?: ImagePickerAsset | null;
  followUpOutcome: FieldValidationFollowUpOutcome;
}

interface AssignmentState {
  assignment: FieldValidationAssignment | null;
  completion: FieldValidationCompletion | null;
  currentReporterConcern: string | null;
  errorMessage: string | null;
  previousVisit: PreviousVisitContext | null;
  loading: boolean;
  saving: boolean;
}

export function useFieldValidationAssignment(assignmentId: string | null) {
  const database = useCaneGuardDatabase();
  const { session, status: authStatus } = useAuth();
  const sync = useSync();
  const mounted = useRef(true);
  const sessionRef = useRef(session);
  const [state, setState] = useState<AssignmentState>({
    assignment: null,
    completion: null,
    currentReporterConcern: null,
    errorMessage: null,
    previousVisit: null,
    loading: true,
    saving: false,
  });

  sessionRef.current = session;

  const refresh = useCallback(async () => {
    const requestedSession = session;
    if (!assignmentId || authStatus !== 'authenticated' || !requestedSession) {
      setState({ assignment: null, completion: null, currentReporterConcern: null, errorMessage: 'Sign in to open this assignment.', loading: false, previousVisit: null, saving: false });
      return;
    }
    setState((current) => ({ ...current, errorMessage: null, loading: true }));
    try {
      const [assignment, completion] = await Promise.all([
        findCachedFieldValidationAssignment(database, requestedSession.user.uuid, assignmentId),
        findFieldValidationCompletion(database, requestedSession.user.uuid, assignmentId),
      ]);
      if (sessionRef.current?.token !== requestedSession.token || !mounted.current) return;
      if (!assignment) {
        setState({ assignment: null, completion: null, currentReporterConcern: null, errorMessage: 'This assignment is not downloaded on this device. Refresh Activity while online first.', loading: false, previousVisit: null, saving: false });
        return;
      }
      let currentReporterConcern: string | null = null;
      try {
        const report = await findFieldReportById(database, assignment.reportClientUuid, requestedSession.user.uuid);
        currentReporterConcern = report.reporterSuspectedCondition;
      } catch {
        currentReporterConcern = null;
      }
      setState({
        assignment,
        completion,
        currentReporterConcern,
        errorMessage: null,
        loading: false,
        previousVisit: assignment.previousVisit ?? null,
        saving: false,
      });
    } catch (error: unknown) {
      if (!mounted.current) return;
      setState((current) => ({
        ...current,
        errorMessage: getStorageErrorMessage(toStorageError(error, 'QUERY_FAILED', 'The saved assignment could not be opened.')),
        loading: false,
      }));
    }
  }, [assignmentId, authStatus, database, session]);

  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      void refresh();
      return () => {
        mounted.current = false;
      };
    }, [refresh]),
  );

  const complete = useCallback(async (input: CompleteFieldValidationInput): Promise<FieldValidationCompletion | null> => {
    if (!state.assignment || !session) return null;
    const completionId = randomUUID();
    setState((current) => ({ ...current, errorMessage: null, saving: true }));
    let photoUri: string | null = null;
    let completionSaved = false;
    try {
      const gps = await captureGpsLocation(expoForegroundLocationClient);
      const photo = input.freshPhoto
        ? await persistFieldValidationPhoto({
            ownerIdentity: session.user.uuid,
            assignmentId: state.assignment.id,
            completionId,
            fileName: input.freshPhoto.fileName,
            mimeType: input.freshPhoto.mimeType,
            sourceUri: input.freshPhoto.uri,
          })
        : null;
      photoUri = photo?.uri ?? null;
      const gpsInput = gps.outcome === 'resolved' || gps.outcome === 'low_accuracy'
        ? {
            gpsAccuracy: gps.accuracy,
            gpsAttemptedAt: gps.capturedAt,
            gpsLatitude: gps.latitude,
            gpsLongitude: gps.longitude,
          }
        : { gpsAttemptedAt: gps.capturedAt };
      const completionInput: SaveFieldValidationCompletionInput = {
        id: completionId,
        ownerIdentity: session.user.uuid,
        assignmentId: state.assignment.id,
        reportUuid: state.assignment.reportUuid,
        fieldObservation: normalizeFieldValidationText(input.fieldObservation),
        fieldFinding: normalizeFieldValidationText(input.fieldFinding),
        actionTaken: normalizeFieldValidationText(input.actionTaken),
        followUpOutcome: input.followUpOutcome,
        visitedAt: new Date().toISOString(),
        gpsOutcome: gps.outcome,
        ...gpsInput,
        freshPhotoUri: photo?.uri ?? null,
        freshPhotoMimeType: photo?.mimeType ?? null,
        freshPhotoSizeBytes: photo?.sizeBytes ?? null,
      };
      const saved = await saveFieldValidationCompletion(database, completionInput);
      completionSaved = true;
      await markCachedFieldValidationAssignmentInProgress(
        database,
        session.user.uuid,
        state.assignment.id,
        saved.updatedAt,
      ).catch(() => undefined);
      if (sync.isOnline === true) {
        await sync.syncNow('after-save');
      }
      await refresh();
      return saved;
    } catch (error: unknown) {
      if (photoUri && !completionSaved) {
        deleteFieldValidationPhoto(photoUri, session.user.uuid);
      }
      const message = getStorageErrorMessage(toStorageError(error, 'UPDATE_FAILED', 'The field validation evidence could not be saved.'));
      if (mounted.current) setState((current) => ({ ...current, errorMessage: message, saving: false }));
      return null;
    }
  }, [database, refresh, session, state.assignment, sync]);

  const retry = useCallback(async () => {
    if (!state.completion || sync.isOnline !== true) return;
    setState((current) => ({ ...current, errorMessage: null, saving: true }));
    try {
      await sync.retryFieldValidationCompletion(state.completion.id);
      await refresh();
    } catch (error: unknown) {
      if (mounted.current) setState((current) => ({ ...current, errorMessage: getStorageErrorMessage(toStorageError(error, 'UPDATE_FAILED', 'Retrying field validation synchronization failed.')), saving: false }));
    }
  }, [refresh, state.completion, sync]);

  return {
    ...state,
    complete,
    photoAccessToken: session?.token ?? null,
    previousVisitPhotoUrl:
      state.assignment?.previousVisit?.freshPhotoAvailable
        ? buildMobilePreviousEvidencePhotoUrl(state.assignment.id)
        : null,
    refresh,
    retry,
  };
}
