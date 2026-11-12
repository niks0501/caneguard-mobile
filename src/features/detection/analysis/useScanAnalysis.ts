import { useEffect, useRef, useState } from 'react';

import { useScanDraft } from '@/features/detection/context/ScanSessionProvider';
import { useScanSession } from '@/features/detection/context/useScanSession';
import { getInferenceErrorMessage } from '@/features/detection/model/inferenceErrors';
import { runInference } from '@/features/detection/model/runInference';
import { useCaneGuardModel } from '@/features/detection/model/useCaneGuardModel';
import { getPreprocessingErrorMessage } from '@/features/detection/preprocessing/preprocessingErrors';
import { preprocessImage } from '@/features/detection/preprocessing/preprocessImage';

const RESULT_PREPARATION_FEEDBACK_MS = 120;

/**
 * Starts the photo-quality check and analysis as soon as a photo is in the
 * session, with no button in between. The model download and native load are
 * deferred to this hook so a cold start does not pay for them.
 *
 * Model inputs, quality checks and the stored result are exactly what the old
 * Preview screen produced. The observation the inspector or farmer answers
 * beside it is stored separately and never feeds back into this analysis.
 */
export function useScanAnalysis(replacing = false) {
  const { state, dispatch } = useScanSession();
  const draft = useScanDraft();
  const modelState = useCaneGuardModel();
  const startModelLoad = modelState.start;
  const preprocessingInFlight = useRef(false);
  const inferenceInFlight = useRef(false);
  const [prepared, setPrepared] = useState<{
    sourceUri: string;
    processedUri: string;
    inputBuffer: ArrayBuffer;
    preprocessMs: number;
  } | null>(null);
  const isMounted = useRef(true);
  const isOwnerCurrentRef = useRef(draft.isOwnerCurrent);
  const ownerIdentity = draft.ownerIdentity;
  const mountedStatus = useRef(state.status);

  useEffect(() => {
    startModelLoad();
  }, [startModelLoad]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // A previous screen may have been abandoned while native analysis was in
  // flight. The provider does not checkpoint those transient statuses, so a
  // freshly mounted screen restarts instead of waiting on work that is gone.
  useEffect(() => {
    if (
      !preprocessingInFlight.current &&
      !inferenceInFlight.current &&
      (mountedStatus.current === 'preprocessing' ||
        mountedStatus.current === 'running' ||
        mountedStatus.current === 'finalizing')
    ) {
      dispatch({ type: 'CLEAR_ERROR' });
    }
    mountedStatus.current = 'idle';
  }, [dispatch]);

  // An owner change abandons any in-flight analysis from the previous account.
  useEffect(() => {
    preprocessingInFlight.current = false;
    inferenceInFlight.current = false;
    setPrepared(null);
    isOwnerCurrentRef.current = draft.isOwnerCurrent;
  }, [draft.isOwnerCurrent, ownerIdentity]);

  const { sourceUri, sourceWidth, sourceHeight, processedUri, status, result } = state;
  const hasPreparedPhoto = Boolean(
    prepared && prepared.sourceUri === sourceUri && prepared.processedUri === processedUri,
  );

  useEffect(() => {
    if (
      !sourceUri ||
      status !== 'image-selected' ||
      result ||
      hasPreparedPhoto ||
      preprocessingInFlight.current
    ) {
      return;
    }

    const startingOwner = ownerIdentity;
    const isCurrentWork = () =>
      isMounted.current && isOwnerCurrentRef.current(startingOwner);
    preprocessingInFlight.current = true;

    const run = async () => {
      dispatch({ type: 'START_PREPROCESSING' });
      try {
        const preprocessingResult = await preprocessImage(sourceUri, {
          width: sourceWidth,
          height: sourceHeight,
        });
        if (!isCurrentWork()) return;
        setPrepared({
          sourceUri,
          processedUri: preprocessingResult.processedUri,
          inputBuffer: preprocessingResult.inputBuffer,
          preprocessMs: preprocessingResult.preprocessMs,
        });
        dispatch({
          type: 'COMPLETE_PREPROCESSING',
          payload: {
            processedUri: preprocessingResult.processedUri,
            preprocessMs: preprocessingResult.preprocessMs,
            qualityAssessment: preprocessingResult.qualityAssessment,
          },
        });
      } catch (error) {
        if (!isCurrentWork()) return;
        dispatch({
          type: 'SET_ERROR',
          photoPreparationFailed: true,
          payload: getPreprocessingErrorMessage(error),
        });
      } finally {
        preprocessingInFlight.current = false;
      }
    };

    void run();
  }, [
    dispatch,
    hasPreparedPhoto,
    ownerIdentity,
    result,
    sourceHeight,
    sourceUri,
    sourceWidth,
    status,
  ]);

  useEffect(() => {
    if (
      !prepared ||
      !hasPreparedPhoto ||
      status !== 'image-selected' ||
      result ||
      replacing ||
      modelState.state !== 'loaded' ||
      inferenceInFlight.current
    ) {
      return;
    }

    const startingOwner = ownerIdentity;
    const isCurrentWork = () =>
      isMounted.current && isOwnerCurrentRef.current(startingOwner);
    inferenceInFlight.current = true;

    const run = async () => {
      dispatch({ type: 'START_INFERENCE' });
      try {
        const inferenceResult = await runInference(
          modelState,
          prepared.inputBuffer,
          prepared.preprocessMs,
        );
        if (!isCurrentWork()) return;
        dispatch({ type: 'START_RESULT_PREPARATION' });
        await new Promise<void>((resolve) => {
          setTimeout(resolve, RESULT_PREPARATION_FEEDBACK_MS);
        });
        if (!isCurrentWork()) return;
        dispatch({ type: 'COMPLETE_INFERENCE', payload: inferenceResult });
      } catch (error) {
        if (!isCurrentWork()) return;
        dispatch({ type: 'SET_ERROR', payload: getInferenceErrorMessage(error) });
      } finally {
        inferenceInFlight.current = false;
      }
    };

    void run();
  }, [dispatch, hasPreparedPhoto, modelState, ownerIdentity, prepared, replacing, result, status]);

  return {
    modelState,
    isChecking:
      status === 'preprocessing' || status === 'running' || status === 'finalizing',
    isReady: status === 'completed' && Boolean(result),
    photoFailedCheck:
      Boolean(state.photoPreparationFailed) || (state.qualityAssessment?.warnings.length ?? 0) > 0,
  };
}
