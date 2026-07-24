import {
  useTensorflowModel,
  type TensorflowModelDelegate,
  type TensorflowPlugin,
} from 'react-native-fast-tflite';
import { createContext, useContext, type PropsWithChildren } from 'react';

import { validateModelContract } from '@/features/detection/model/validateModelContract';

// Metro resolves bundled non-code assets through a static require.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MODEL_ASSET = require('../../../../assets/models/caneguard_leaf_v0_1_baseline.tflite') as number;
const CPU_DELEGATES: TensorflowModelDelegate[] = [];

const CaneGuardModelContext = createContext<TensorflowPlugin | null>(null);

export function CaneGuardModelProvider({ children }: PropsWithChildren) {
  const nativeModel = useTensorflowModel(MODEL_ASSET, CPU_DELEGATES);
  let modelState = nativeModel;

  if (nativeModel.state === 'loaded') {
    const contractError = validateModelContract(nativeModel.model);

    if (contractError) {
      modelState = {
        model: undefined,
        state: 'error',
        error: contractError,
      };
    }
  }

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
