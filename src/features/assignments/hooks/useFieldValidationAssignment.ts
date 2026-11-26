import { randomUUID } from 'expo-crypto';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ImagePickerAsset } from 'expo-image-picker';

import { AUTHORING_WINDOW_COPY, FIELD_VALIDATION_UNAVAILABLE } from '@/constants/copy';
import { readAuthoringBound } from '@/features/auth/domain/authoringBound';
import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { getStorageErrorMessage, toStorageError } from '@/database/errors';
import { findCachedFieldValidationAssignment } from '@/features/assignments/data/assignmentCacheRepository';
import {
  deleteUnsentAerialAnalysis,
  enqueueAerialAnalysis,
  findLatestAerialAnalysisForAssignment,
  markAerialAnalysisPending,
  type AerialAnalysisOutboxItem,
} from '@/features/assignments/data/aerialAnalysisOutboxRepository';
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
import {
  deleteFieldValidationCheckpoint,
  readFieldValidationCheckpoint,
  writeFieldValidationCheckpoint,
  type FieldValidationCheckpoint,
} from '@/features/assignments/drafts/fieldValidationDraft';
import { normalizeFieldValidationText } from '@/features/assignments/domain/fieldValidationCompletionValidation';
import { findFieldReportById } from '@/features/reports/data/fieldReportRepository';
import {
  deleteAerialUploadPhoto,
  persistAerialUploadPhoto,
} from '@/features/assignments/services/aerialPhotoStorage';
import {
  deleteFieldValidationPhoto,
  persistFieldValidationPhoto,
  type FieldValidationPhotoArtifact,
} from '@/features/assignments/services/fieldValidationPhotoStorage';
import { canCompleteFieldValidation } from '@/features/auth/capabilities';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { captureGpsLocation } from '@/features/reports/services/captureGpsLocation';
import { expoForegroundLocationClient } from '@/features/reports/services/expoForegroundLocationClient';
import { useSync } from '@/features/sync/hooks/useSync';
import { subscribeSyncRecords } from '@/features/sync/services/syncEvents';

export interface CompleteFieldValidationInput {
  actionTaken: string;
  fieldFinding: string;
  fieldObservation: string;
  freshPhoto?: ImagePickerAsset | null;
  followUpOutcome: FieldValidationFollowUpOutcome | null;
  /** A draft photo already persisted in owner-scoped managed storage. */
  savedFreshPhoto?: FieldValidationPhotoArtifact | null;
}

export type FieldValidationDraftStatus = 'idle' | 'saving' | 'saved' | 'failed';

interface AssignmentState {
  aerialSaving: boolean;
  aerialUpload: AerialAnalysisOutboxItem | null;
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
  const auth = useAuth();
  const { session, status: authStatus } = auth;
  const sync = useSync();
  const canComplete = canCompleteFieldValidation(session?.user);
  const mounted = useRef(true);
  const sessionRef = useRef(session);
  const [state, setState] = useState<AssignmentState>({
    aerialSaving: false,
    aerialUpload: null,
    assignment: null,
    completion: null,
    currentReporterConcern: null,
    errorMessage: null,
    previousVisit: null,
    loading: true,
    saving: false,
  });
  const [formDraft, setFormDraft] = useState<FieldValidationCheckpoint | null>(
    null,
  );
  const [draftStatus, setDraftStatus] =
    useState<FieldValidationDraftStatus>('idle');
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const formDraftRef = useRef<FieldValidationCheckpoint | null>(null);
  useEffect(() => {
    formDraftRef.current = formDraft;
  }, [formDraft]);

  sessionRef.current = session;

  const refresh = useCallback(async () => {
    const requestedSession = session;
    if (!canComplete) {
      setState({ aerialSaving: false, aerialUpload: null, assignment: null, completion: null, currentReporterConcern: null, errorMessage: FIELD_VALIDATION_UNAVAILABLE, loading: false, previousVisit: null, saving: false });
      return;
    }
    if (!assignmentId || authStatus !== 'authenticated' || !requestedSession) {
      setState({ aerialSaving: false, aerialUpload: null, assignment: null, completion: null, currentReporterConcern: null, errorMessage: 'Sign in to open this visit.', loading: false, previousVisit: null, saving: false });
      return;
    }
    setState((current) => ({ ...current, errorMessage: null, loading: true }));
    try {
      const [assignment, completion, aerialUpload] = await Promise.all([
        findCachedFieldValidationAssignment(database, requestedSession.user.uuid, assignmentId),
        findFieldValidationCompletion(database, requestedSession.user.uuid, assignmentId),
        findLatestAerialAnalysisForAssignment(database, requestedSession.user.uuid, assignmentId),
      ]);
      if (sessionRef.current?.token !== requestedSession.token || !mounted.current) return;
      if (!assignment) {
        setState({ aerialSaving: false, aerialUpload: null, assignment: null, completion: null, currentReporterConcern: null, errorMessage: 'This visit is not downloaded on this device. Refresh Activity while online first.', loading: false, previousVisit: null, saving: false });
        return;
      }
      let currentReporterConcern: string | null = null;
      try {
        const report = await findFieldReportById(database, assignment.reportClientUuid, requestedSession.user.uuid);
        currentReporterConcern = report.reporterSuspectedCondition;
      } catch {
        currentReporterConcern = null;
      }
      const draftRecord = completion
        ? null
        : readFieldValidationCheckpoint(
            database,
            requestedSession.user.uuid,
            assignment.id,
          );
      if (sessionRef.current?.token !== requestedSession.token || !mounted.current) return;
      setFormDraft(draftRecord?.checkpoint ?? null);
      setDraftSavedAt(draftRecord?.checkpoint.savedAt ?? null);
      setDraftStatus(draftRecord ? 'saved' : 'idle');
      setState({
        aerialSaving: false,
        aerialUpload,
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
        errorMessage: getStorageErrorMessage(toStorageError(error, 'QUERY_FAILED', 'The saved visit could not be opened.')),
        loading: false,
      }));
    }
  }, [assignmentId, authStatus, canComplete, database, session]);

  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      void refresh();
      return () => {
        mounted.current = false;
      };
    }, [refresh]),
  );

  useEffect(() => {
    if (!canComplete || !assignmentId || authStatus !== 'authenticated' || !session) {
      return undefined;
    }
    const requestedSession = session;
    return subscribeSyncRecords(() => {
      void Promise.all([
        findCachedFieldValidationAssignment(database, requestedSession.user.uuid, assignmentId),
        findLatestAerialAnalysisForAssignment(database, requestedSession.user.uuid, assignmentId),
      ]).then(([assignment, aerialUpload]) => {
        if (!mounted.current || sessionRef.current?.token !== requestedSession.token) return;
        setState((current) => ({
          ...current,
          assignment: assignment ?? current.assignment,
          aerialUpload,
        }));
      }).catch(() => undefined);
    });
  }, [assignmentId, authStatus, canComplete, database, session]);

  const persistDraftPhoto = useCallback(
    async (asset: ImagePickerAsset): Promise<FieldValidationPhotoArtifact | null> => {
      if (!canComplete || !state.assignment || !session) return null;
      try {
        return await persistFieldValidationPhoto({
          ownerIdentity: session.user.uuid,
          assignmentId: state.assignment.id,
          completionId: randomUUID(),
          fileName: asset.fileName,
          mimeType: asset.mimeType,
          sourceUri: asset.uri,
        });
      } catch {
        return null;
      }
    },
    [canComplete, session, state.assignment],
  );

  const saveDraftCheckpoint = useCallback(
    async (
      values: Omit<FieldValidationCheckpoint, 'savedAt'>,
    ): Promise<boolean> => {
      if (!canComplete || !state.assignment || !session || state.completion) {
        return false;
      }
      const checkpoint: FieldValidationCheckpoint = {
        ...values,
        savedAt: new Date().toISOString(),
      };
      const previousPhoto = formDraftRef.current?.photo ?? null;
      setDraftStatus('saving');
      try {
        await writeFieldValidationCheckpoint(
          database,
          session.user.uuid,
          state.assignment.id,
          checkpoint,
        );
        const nextPhotoUri = checkpoint.photo?.uri ?? null;
        if (previousPhoto && previousPhoto.uri !== nextPhotoUri) {
          deleteFieldValidationPhoto(previousPhoto.uri, session.user.uuid);
        }
        formDraftRef.current = checkpoint;
        setFormDraft(checkpoint);
        setDraftSavedAt(checkpoint.savedAt);
        setDraftStatus('saved');
        return true;
      } catch {
        setDraftStatus('failed');
        return false;
      }
    },
    [canComplete, database, session, state.assignment, state.completion],
  );

  const complete = useCallback(async (input: CompleteFieldValidationInput): Promise<FieldValidationCompletion | null> => {
    if (!canComplete || !state.assignment || !session) return null;
    // The authoring bound, checked at the moment of finishing.
    const provenance = readAuthoringBound(auth);
    if (provenance === null) {
      setState((current) => ({ ...current, errorMessage: AUTHORING_WINDOW_COPY.ended, saving: false }));
      return null;
    }
    const completionId = randomUUID();
    setState((current) => ({ ...current, errorMessage: null, saving: true }));
    let createdPhotoUri: string | null = null;
    let completionSaved = false;
    try {
      const gps = await captureGpsLocation(expoForegroundLocationClient);
      let photo: FieldValidationPhotoArtifact | null = null;
      if (input.savedFreshPhoto) {
        photo = input.savedFreshPhoto;
      } else if (input.freshPhoto) {
        photo = await persistFieldValidationPhoto({
          ownerIdentity: session.user.uuid,
          assignmentId: state.assignment.id,
          completionId,
          fileName: input.freshPhoto.fileName,
          mimeType: input.freshPhoto.mimeType,
          sourceUri: input.freshPhoto.uri,
        });
        createdPhotoUri = photo.uri;
      }
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
        provenance: provenance ?? null,
      };
      const saved = await saveFieldValidationCompletion(database, completionInput);
      completionSaved = true;
      // The visit is complete: its recovery checkpoint is no longer a draft.
      // A distinct photo that was saved only for the draft is cleaned up unless
      // it became the completion's photo.
      const draftPhoto = formDraftRef.current?.photo ?? null;
      const checkpointDeleted = deleteFieldValidationCheckpoint(
        database,
        session.user.uuid,
        state.assignment.id,
      );
      setFormDraft(null);
      formDraftRef.current = null;
      setDraftStatus('idle');
      setDraftSavedAt(null);
      if (
        checkpointDeleted &&
        draftPhoto &&
        draftPhoto.uri !== (photo?.uri ?? null)
      ) {
        deleteFieldValidationPhoto(draftPhoto.uri, session.user.uuid);
      }
      if (sync.isOnline === true) {
        await sync.syncNow('after-save');
      }
      await refresh();
      return saved;
    } catch (error: unknown) {
      if (createdPhotoUri && !completionSaved) {
        deleteFieldValidationPhoto(createdPhotoUri, session.user.uuid);
      }
      const message = getStorageErrorMessage(toStorageError(error, 'UPDATE_FAILED', 'The visit evidence could not be saved.'));
      if (mounted.current) setState((current) => ({ ...current, errorMessage: message, saving: false }));
      return null;
    }
  }, [auth, canComplete, database, refresh, session, state.assignment, sync]);

  const retry = useCallback(async () => {
    if (!canComplete || !state.completion || sync.isOnline !== true) return;
    setState((current) => ({ ...current, errorMessage: null, saving: true }));
    try {
      await sync.retryFieldValidationCompletion(state.completion.id);
      await refresh();
    } catch (error: unknown) {
      if (mounted.current) setState((current) => ({ ...current, errorMessage: getStorageErrorMessage(toStorageError(error, 'UPDATE_FAILED', 'Retrying visit synchronization failed.')), saving: false }));
    }
  }, [canComplete, refresh, state.completion, sync]);

  const attachAerialPhoto = useCallback(
    async (asset: ImagePickerAsset): Promise<{ queued: boolean; errorMessage: string | null }> => {
      if (!canComplete || !state.assignment || !session) {
        return { queued: false, errorMessage: FIELD_VALIDATION_UNAVAILABLE };
      }
      const provenance = readAuthoringBound(auth);
      if (provenance === null) {
        return { queued: false, errorMessage: AUTHORING_WINDOW_COPY.ended };
      }
      const uploadId = randomUUID();
      setState((current) => ({ ...current, aerialSaving: true }));
      let savedPhotoUri: string | null = null;
      try {
        const photoArtifact = await persistAerialUploadPhoto({
          ownerIdentity: session.user.uuid,
          assignmentId: state.assignment.id,
          uploadId,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
          sourceUri: asset.uri,
        });
        savedPhotoUri = photoArtifact.uri;

        const previous = state.aerialUpload;
        const queued = await enqueueAerialAnalysis(database, {
          id: uploadId,
          ownerIdentity: session.user.uuid,
          assignmentId: state.assignment.id,
          reportUuid: state.assignment.reportUuid,
          imageUri: photoArtifact.uri,
          imageMimeType: photoArtifact.mimeType,
          imageSizeBytes: photoArtifact.sizeBytes,
          provenance,
          createdAt: new Date().toISOString(),
        });
        if (previous && (previous.syncStatus === 'pending' || previous.syncStatus === 'failed')) {
          const removed = await deleteUnsentAerialAnalysis(database, previous.id, session.user.uuid).catch(() => null);
          if (removed) {
            deleteAerialUploadPhoto(removed.imageUri, session.user.uuid);
          }
        }
        if (mounted.current) {
          setState((current) => ({ ...current, aerialSaving: false, aerialUpload: queued }));
        }
        if (sync.isOnline === true) {
          void sync.syncNow('after-save');
        }
        return { queued: true, errorMessage: null };
      } catch (error: unknown) {
        if (savedPhotoUri) {
          deleteAerialUploadPhoto(savedPhotoUri, session.user.uuid);
        }
        const message = getStorageErrorMessage(
          toStorageError(error, 'IMAGE_COPY_FAILED', 'The drone photo could not be saved on this device.'),
        );
        if (mounted.current) {
          setState((current) => ({ ...current, aerialSaving: false }));
        }
        return { queued: false, errorMessage: message };
      }
    },
    [auth, canComplete, database, session, state.aerialUpload, state.assignment, sync],
  );

  const retryAerialPhoto = useCallback(async () => {
    if (!canComplete || !state.aerialUpload || !session || sync.isOnline !== true) return;
    setState((current) => ({ ...current, aerialSaving: true }));
    try {
      if (sync.retryAerialAnalysis) {
        await sync.retryAerialAnalysis(state.aerialUpload.id);
      } else {
        await markAerialAnalysisPending(database, state.aerialUpload.id, session.user.uuid);
        await sync.syncNow('manual');
      }
      if (assignmentId) {
        const [assignment, aerialUpload] = await Promise.all([
          findCachedFieldValidationAssignment(database, session.user.uuid, assignmentId),
          findLatestAerialAnalysisForAssignment(database, session.user.uuid, assignmentId),
        ]);
        if (mounted.current) {
          setState((current) => ({
            ...current,
            aerialSaving: false,
            assignment: assignment ?? current.assignment,
            aerialUpload,
          }));
        }
      }
    } catch {
      if (mounted.current) {
        setState((current) => ({ ...current, aerialSaving: false }));
      }
    }
  }, [assignmentId, canComplete, database, session, state.aerialUpload, sync]);

  const removeQueuedAerialPhoto = useCallback(async () => {
    if (!canComplete || !state.aerialUpload || !session) return;
    setState((current) => ({ ...current, aerialSaving: true }));
    try {
      const removed = await deleteUnsentAerialAnalysis(
        database,
        state.aerialUpload.id,
        session.user.uuid,
      );
      if (removed) {
        deleteAerialUploadPhoto(removed.imageUri, session.user.uuid);
      }
      if (mounted.current) {
        setState((current) => ({
          ...current,
          aerialSaving: false,
          aerialUpload: removed ? null : current.aerialUpload,
        }));
      }
    } catch {
      if (mounted.current) {
        setState((current) => ({ ...current, aerialSaving: false }));
      }
    }
  }, [canComplete, database, session, state.aerialUpload]);

  return {
    ...state,
    attachAerialPhoto,
    canComplete,
    complete,
    draftSavedAt,
    draftStatus,
    formDraft,
    isOnline: sync.isOnline,
    ownerIdentity: session?.user.uuid ?? null,
    persistDraftPhoto,
    saveDraftCheckpoint,
    photoAccessToken: session?.token ?? null,
    previousVisitPhotoUrl:
      state.assignment?.previousVisit?.freshPhotoAvailable
        ? buildMobilePreviousEvidencePhotoUrl(state.assignment.id)
        : null,
    refresh,
    removeQueuedAerialPhoto,
    retry,
    retryAerialPhoto,
  };
}
