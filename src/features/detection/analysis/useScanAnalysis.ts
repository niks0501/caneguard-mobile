import { useEffect, useRef } from 'react';

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
export function useScanAnalysis() {
  const { state, dispatch } = useScanSession();
  const draft = useScanDraft();
  const modelState = useCaneGuardModel();
  const startModelLoad = modelState.start;
  const inFlight = useRef(false);
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
      !inFlight.current &&
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
    inFlight.current = false;
    isOwnerCurrentRef.current = draft.isOwnerCurrent;
  }, [draft.isOwnerCurrent, ownerIdentity]);

  const { sourceUri, sourceWidth, sourceHeight, status, result } = state;
  const modelReady = modelState.state === 'loaded';

  useEffect(() => {
    if (
      !sourceUri ||
      status !== 'image-selected' ||
      result ||
      !modelReady ||
      inFlight.current
    ) {
      return;
    }

    const startingOwner = ownerIdentity;
    const isCurrentWork = () =>
      isMounted.current && isOwnerCurrentRef.current(startingOwner);
    inFlight.current = true;

    const run = async () => {
      dispatch({ type: 'START_PREPROCESSING' });
      let inferenceStarted = false;
      try {
        const preprocessingResult = await preprocessImage(sourceUri, {
          width: sourceWidth,
          height: sourceHeight,
        });
        if (!isCurrentWork()) {
          return;
        }
        dispatch({
          type: 'COMPLETE_PREPROCESSING',
          payload: {
            processedUri: preprocessingResult.processedUri,
            preprocessMs: preprocessingResult.preprocessMs,
            qualityAssessment: preprocessingResult.qualityAssessment,
          },
        });
        dispatch({ type: 'START_INFERENCE' });
        inferenceStarted = true;

        const inferenceResult = await runInference(
          modelState,
          preprocessingResult.inputBuffer,
          preprocessingResult.preprocessMs,
        );
        if (!isCurrentWork()) {
          return;
        }
        dispatch({ type: 'START_RESULT_PREPARATION' });
        await new Promise<void>((resolve) => {
          setTimeout(resolve, RESULT_PREPARATION_FEEDBACK_MS);
        });
        if (!isCurrentWork()) {
          return;
        }
        dispatch({ type: 'COMPLETE_INFERENCE', payload: inferenceResult });
      } catch (error) {
        if (!isCurrentWork()) {
          return;
        }
        dispatch({
          type: 'SET_ERROR',
          payload: inferenceStarted
            ? getInferenceErrorMessage(error)
            : getPreprocessingErrorMessage(error),
        });
      } finally {
        inFlight.current = false;
      }
    };

    void run();
  }, [
    dispatch,
    modelReady,
    modelState,
    ownerIdentity,
    result,
    sourceHeight,
    sourceUri,
    sourceWidth,
    status,
  ]);

  return {
    modelState,
    isChecking:
      status === 'preprocessing' || status === 'running' || status === 'finalizing',
    isReady: status === 'completed' && Boolean(result),
    // Retake is offered only when the photo-quality check flagged the photo.
    photoFailedCheck: (state.qualityAssessment?.warnings.length ?? 0) > 0,
  };
}
