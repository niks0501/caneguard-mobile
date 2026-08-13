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
};

const WEB_MODEL_ERROR = new InferenceError(
  'MODEL_LOAD_FAILED',
  'The native Model v0 runtime is available in the Android development build, not the web bundle.',
);

const CaneGuardModelContext = createContext<CaneGuardModelController | null>(null);

export function CaneGuardModelProvider({ children }: PropsWithChildren) {
  const run = useCallback<ModelRun>(async () => {
    throw WEB_MODEL_ERROR;
  }, []);
  const value = useMemo<CaneGuardModelController>(
    () => ({
      error: WEB_MODEL_ERROR,
      model: undefined,
      run,
      state: 'error',
    }),
    [run],
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
