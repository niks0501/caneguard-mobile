import { useEffect, useRef } from 'react';

import { GUARD_COPY } from '@/constants/copy';
import { useScanDraft } from '@/features/detection/context/ScanSessionProvider';
import { deriveScanCheckState } from '@/features/detection/context/scanCheckState';
import { useScanSession } from '@/features/detection/context/useScanSession';
import { GUARD_V1, isGuardedResult } from '@/features/detection/constants/guardContract';
import { exclusiveRun } from '@/features/detection/model/exclusiveRun';
import {
  asGuardError,
  getGuardErrorMessage,
  GuardError,
  runGuard,
} from '@/features/detection/model/guardInference';
import { getInferenceErrorMessage } from '@/features/detection/model/inferenceErrors';
import { runInference } from '@/features/detection/model/runInference';
import { useCaneGuardModel } from '@/features/detection/model/useCaneGuardModel';
import { useGuardModel } from '@/features/detection/model/useGuardModel';
import { preprocessGuardImage } from '@/features/detection/preprocessing/guardPreprocess';
import { getPreprocessingErrorMessage } from '@/features/detection/preprocessing/preprocessingErrors';
import { preprocessImage } from '@/features/detection/preprocessing/preprocessImage';
import { activeWork, preparedPhotos } from '@/features/detection/analysis/scanAnalysisWork';

function prunePhotoCaches(currentKey: string | null): void {
  for (const candidate of preparedPhotos.keys()) {
    if (candidate !== currentKey && !activeWork.has(candidate)) {
      preparedPhotos.delete(candidate);
    }
  }
}

function workKey(sessionIdentity: string, generation: number, sourceUri: string): string {
  return `${sessionIdentity}:${generation}:${sourceUri}`;
}

function isCurrentSession(
  draft: ReturnType<typeof useScanDraft>,
  owner: string | null,
  sourceUri: string,
  generation: number,
  currentSourceUri: string | null,
): boolean {
  return (
    draft.isOwnerCurrent(owner) &&
    draft.isSessionCurrent(sourceUri, generation) && currentSourceUri === sourceUri
  );
}

/**
 * Starts the quality check and analysis as soon as a photo is in the session.
 * Guard V1 is required and runs before V2 for every captured or uploaded photo.
 */
export function useScanAnalysis(replacing = false) {
  const { state, dispatch } = useScanSession();
  const draft = useScanDraft();
  const modelState = useCaneGuardModel();
  const guard = useGuardModel();
  const {
    sourceUri,
    sourceWidth,
    sourceHeight,
    status,
    result,
    qualityAssessment,
  } = state;
  const generation = draft.sessionGeneration;
  const appActive = draft.appActive ?? true;
  const currentSourceUriRef = useRef(sourceUri);
  useEffect(() => {
    currentSourceUriRef.current = sourceUri;
  }, [sourceUri]);
  const key = sourceUri ? workKey(draft.sessionIdentity, generation, sourceUri) : null;
  const prepared = key ? preparedPhotos.get(key) : undefined;
  const photoHasWarnings = (qualityAssessment?.warnings.length ?? 0) > 0;
  const guardReady = guard.state === 'loaded';

  const startModel = modelState.start;
  const startGuard = guard.start;
  useEffect(() => {
    startModel();
  }, [startModel]);

  useEffect(() => {
    startGuard();
  }, [startGuard]);

  useEffect(() => {
    if (status !== 'completed' || !result || isGuardedResult(result)) {
      return;
    }
    dispatch({
      type: 'SET_ERROR',
      guardFailure: 'error',
      payload: GUARD_COPY.unavailable,
    });
  }, [dispatch, result, status]);

  useEffect(() => {
    prunePhotoCaches(key);
    if (!key) {
      return;
    }
    if (
      !sourceUri ||
      !appActive ||
      status !== 'image-selected' ||
      result ||
      photoHasWarnings ||
      preparedPhotos.has(key) ||
      activeWork.has(key)
    ) {
      return;
    }

    const startingOwner = draft.ownerIdentity;
    const startingGeneration = generation;
    const startingSource = sourceUri;
    let work!: Promise<void>;
    work = (async () => {
      dispatch({ type: 'START_PREPROCESSING' });
      try {
        const preprocessingResult = await preprocessImage(startingSource, {
          width: sourceWidth,
          height: sourceHeight,
        });
        if (
          !isCurrentSession(
            draft,
            startingOwner,
            startingSource,
            startingGeneration,
            currentSourceUriRef.current,
          ) || activeWork.get(key) !== work
        ) {
          return;
        }
        const hasQualityWarnings = preprocessingResult.qualityAssessment.warnings.length > 0;
        if (!hasQualityWarnings) {
          preparedPhotos.set(key, {
            inputBuffer: preprocessingResult.inputBuffer,
            preprocessMs: preprocessingResult.preprocessMs,
          });
        }
        dispatch({
          type: 'COMPLETE_PREPROCESSING',
          payload: {
            processedUri: preprocessingResult.processedUri,
            preprocessMs: preprocessingResult.preprocessMs,
            qualityAssessment: preprocessingResult.qualityAssessment,
          },
        });
      } catch (error) {
        if (
          isCurrentSession(
            draft,
            startingOwner,
            startingSource,
            startingGeneration,
            currentSourceUriRef.current,
          ) && activeWork.get(key) === work
        ) {
          dispatch({
            type: 'SET_ERROR',
            photoPreparationFailed: true,
            payload: getPreprocessingErrorMessage(error),
          });
        }
      } finally {
        if (activeWork.get(key) === work) {
          activeWork.delete(key);
        }
      }
    })();
    activeWork.set(key, work);
  }, [
    appActive,
    dispatch,
    draft,
    generation,
    key,
    photoHasWarnings,
    qualityAssessment,
    result,
    sourceHeight,
    sourceUri,
    sourceWidth,
    status,
  ]);

  useEffect(() => {
    if (
      !sourceUri ||
      !key ||
      !prepared ||
      !appActive ||
      photoHasWarnings ||
      status !== 'image-selected' ||
      result ||
      replacing ||
      modelState.state !== 'loaded' ||
      !guardReady ||
      activeWork.has(key)
    ) {
      return;
    }

    const startingOwner = draft.ownerIdentity;
    const startingGeneration = generation;
    const startingSource = sourceUri;
    let work!: Promise<void>;
    const isCurrentWork = () =>
      isCurrentSession(
        draft,
        startingOwner,
        startingSource,
        startingGeneration,
        currentSourceUriRef.current,
      ) && activeWork.get(key) === work;
    work = (async () => {
      let stage: 'guard' | 'v2' = 'guard';
      dispatch({ type: 'START_INFERENCE' });
      try {
        const guardInput = await preprocessGuardImage(startingSource);
        if (!isCurrentWork()) {
          return;
        }
        const assessment = await runGuard(
          {
            run: exclusiveRun(async (input) => {
              await (draft.waitForAppActive?.() ?? Promise.resolve());
              if (!isCurrentWork()) {
                throw new GuardError('GUARD_RUN_FAILED', 'The guard work is no longer current.');
              }
              return guard.run(input);
            }),
          },
          guardInput,
        );
        if (!isCurrentWork()) {
          return;
        }
        if (!assessment.accepted) {
          dispatch({
            type: 'SET_ERROR',
            guardFailure: 'rejected',
            payload: GUARD_COPY.rejectedStatus,
          });
          return;
        }

        stage = 'v2';
        const inferenceResult = await runInference(
          {
            run: exclusiveRun(async (input) => {
              await (draft.waitForAppActive?.() ?? Promise.resolve());
              if (!isCurrentWork()) {
                throw new GuardError('GUARD_RUN_FAILED', 'The scan work is no longer current.');
              }
              return modelState.run(input);
            }),
          },
          prepared.inputBuffer,
          prepared.preprocessMs,
        );
        if (!isCurrentWork()) {
          return;
        }
        dispatch({
          type: 'COMPLETE_INFERENCE',
          payload: { ...inferenceResult, guardModelId: GUARD_V1.modelId },
        });
      } catch (error) {
        if (!isCurrentWork()) {
          return;
        }
        if (stage === 'guard') {
          const guardError = asGuardError(error);
          dispatch({
            type: 'SET_ERROR',
            guardFailure: 'error',
            photoPreparationFailed: guardError.code === 'GUARD_INPUT_INVALID',
            payload: getGuardErrorMessage(guardError),
          });
        } else {
          dispatch({ type: 'SET_ERROR', payload: getInferenceErrorMessage(error) });
        }
      } finally {
        if (activeWork.get(key) === work) {
          activeWork.delete(key);
        }
        preparedPhotos.delete(key);
      }
    })();
    activeWork.set(key, work);
  }, [
    appActive,
    dispatch,
    draft,
    generation,
    guard,
    guardReady,
    key,
    modelState,
    photoHasWarnings,
    prepared,
    replacing,
    result,
    sourceUri,
    status,
  ]);

  const guardLoadFailed = guard.state === 'error';
  const photoFailedCheck = Boolean(state.photoPreparationFailed) || photoHasWarnings;
  const checkState = deriveScanCheckState({
    session: state,
    modelState: guardLoadFailed
      ? 'error'
      : guard.state === 'loading' && modelState.state === 'loaded'
        ? 'loading'
        : modelState.state,
    photoFailedCheck,
    replacing,
  });

  return {
    modelState,
    guardState: guard,
    guardError: guardLoadFailed ? getGuardErrorMessage(guard.error) : null,
    guardRejected: checkState === 'not-sugarcane',
    checkState,
    isChecking:
      status === 'preprocessing' || status === 'running' || status === 'finalizing',
    isReady: status === 'completed' && isGuardedResult(result),
    photoFailedCheck,
  };
}
