import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';

import { InferenceError } from '@/features/detection/model/inferenceErrors';
import { isWebValidationRuntimeEnabled } from '../../../../validation/web-validation/runtime';

type ModelRun = (input: ArrayBuffer[]) => Promise<ArrayBuffer[]>;

/**
 * Web has no native TFLite runtime, so it fails closed by default. The browser
 * validation route (`npm run web:validate`) needs a completed analysis to reach
 * the farmer Check Again screens, so a development-only stub returns a fixed
 * deterministic output there. The stub is gated on the explicit validation flag
 * and the fixed stub API origin, and is never enabled in a release build.
 */
export type CaneGuardModelController = {
  model: undefined;
  run: ModelRun;
  /** Fail-closed web bundles cannot start a native runtime. */
  start: () => void;
  retry: () => void;
} & (
  | {
      state: 'loading';
      error: null;
      errorKind: null;
    }
  | {
      state: 'loaded';
      error: null;
      errorKind: null;
    }
  | {
      state: 'error';
      error: Error;
      errorKind: 'contract';
    }
);

const WEB_MODEL_ERROR = new InferenceError(
  'MODEL_LOAD_FAILED',
  'The native Model V1 runtime is available in the Android development build, not the web bundle.',
);

// A fixed deterministic result: the validation model never inspects pixels.
const VALIDATION_PROBABILITIES = [0.05, 0.1, 0.8, 0.05] as const;

function runValidationModel(): ArrayBuffer[] {
  const output = new Float32Array(VALIDATION_PROBABILITIES);
  return [output.buffer];
}

const CaneGuardModelContext = createContext<CaneGuardModelController | null>(null);

export function CaneGuardModelProvider({ children }: PropsWithChildren) {
  const validationEnabled = isWebValidationRuntimeEnabled();
  const run = useCallback<ModelRun>(async () => {
    if (!validationEnabled) {
      throw WEB_MODEL_ERROR;
    }
    return runValidationModel();
  }, [validationEnabled]);
  const start = useCallback(() => undefined, []);
  const retry = useCallback(() => undefined, []);
  const value = useMemo<CaneGuardModelController>(
    () =>
      validationEnabled
        ? {
            error: null,
            errorKind: null,
            model: undefined,
            retry,
            run,
            start,
            state: 'loaded',
          }
        : {
            error: WEB_MODEL_ERROR,
            errorKind: 'contract',
            model: undefined,
            retry,
            run,
            start,
            state: 'error',
          },
    [retry, run, start, validationEnabled],
  );

  return (
    <CaneGuardModelContext.Provider value={value}>
      {children}
    </CaneGuardModelContext.Provider>
  );
}

export function useCaneGuardModel(): CaneGuardModelController {
  const modelState = useContext(CaneGuardModelContext);
  if (!modelState) {
    throw new Error('useCaneGuardModel must be used within CaneGuardModelProvider.');
  }
  return modelState;
}
