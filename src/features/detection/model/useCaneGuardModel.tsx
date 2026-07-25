import {
  useTensorflowModel,
  type TfliteModel,
  type TensorflowModelDelegate,
} from 'react-native-fast-tflite';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';

import { InferenceError } from '@/features/detection/model/inferenceErrors';
import { validateModelContract } from '@/features/detection/model/validateModelContract';

// Metro resolves bundled non-code assets through a static require.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MODEL_ASSET = require('../../../../assets/models/caneguard_leaf_v0_1_baseline.tflite') as number;
const CPU_DELEGATES: TensorflowModelDelegate[] = [];

type ModelRun = (input: ArrayBuffer[]) => Promise<ArrayBuffer[]>;

export type CaneGuardModelController =
  | {
      state: 'loading';
      model: undefined;
      run: ModelRun;
      error: null;
    }
  | {
      state: 'loaded';
      model: TfliteModel;
      run: ModelRun;
      error: null;
    }
  | {
      state: 'error';
      model: undefined;
      run: ModelRun;
      error: Error;
    };

const CaneGuardModelContext = createContext<CaneGuardModelController | null>(null);

export function CaneGuardModelProvider({ children }: PropsWithChildren) {
  const nativeModel = useTensorflowModel(MODEL_ASSET, CPU_DELEGATES);
  const contractError =
    nativeModel.state === 'loaded'
      ? validateModelContract(nativeModel.model)
      : null;
  const loadedModel =
    nativeModel.state === 'loaded' && !contractError
      ? nativeModel.model
      : undefined;
  const run = useCallback<ModelRun>(
    async (input) => {
      if (!loadedModel) {
        throw new InferenceError(
          'MODEL_NOT_READY',
          'The Model v0 TensorFlow Lite runtime is not loaded.',
        );
      }

      return loadedModel.run(input);
    },
    [loadedModel],
  );
  const modelState = useMemo<CaneGuardModelController>(() => {
    if (contractError) {
      return {
        model: undefined,
        state: 'error',
        run,
        error: contractError,
      };
    }

    if (nativeModel.state === 'error') {
      return {
        model: undefined,
        state: 'error',
        run,
        error: nativeModel.error,
      };
    }

    if (nativeModel.state === 'loaded') {
      return {
        model: nativeModel.model,
        state: 'loaded',
        run,
        error: null,
      };
    }

    return {
      model: undefined,
      state: 'loading',
      run,
      error: null,
    };
  }, [contractError, nativeModel, run]);

  return (
    <CaneGuardModelContext.Provider value={modelState}>
      {children}
    </CaneGuardModelContext.Provider>
  );
}

export function useCaneGuardModel() {
  const modelState = useContext(CaneGuardModelContext);

  if (!modelState) {
    throw new Error('useCaneGuardModel must be used within CaneGuardModelProvider.');
  }

  return modelState;
}
