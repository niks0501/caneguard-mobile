import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';

import { InferenceError } from '@/features/detection/model/inferenceErrors';

type ModelRun = (input: ArrayBuffer[]) => Promise<ArrayBuffer[]>;

export type CaneGuardModelController = {
  state: 'error';
  model: undefined;
  run: ModelRun;
  error: Error;
  /** Fail-closed: a web bundle can never load the native model contract. */
  errorKind: 'contract';
  /** No-op on web: there is no native TFLite runtime to start. */
  start: () => void;
  /** No-op on web: retrying cannot supply the native runtime. */
  retry: () => void;
};

const WEB_MODEL_ERROR = new InferenceError(
  'MODEL_LOAD_FAILED',
  'The native Model V1 runtime is available in the Android development build, not the web bundle.',
);

const CaneGuardModelContext = createContext<CaneGuardModelController | null>(null);

export function CaneGuardModelProvider({ children }: PropsWithChildren) {
  const run = useCallback<ModelRun>(async () => {
    throw WEB_MODEL_ERROR;
  }, []);
  const start = useCallback(() => undefined, []);
  const retry = useCallback(() => undefined, []);
  const value = useMemo<CaneGuardModelController>(
    () => ({
      error: WEB_MODEL_ERROR,
      errorKind: 'contract',
      model: undefined,
      retry,
      run,
      start,
      state: 'error',
    }),
    [retry, run, start],
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
