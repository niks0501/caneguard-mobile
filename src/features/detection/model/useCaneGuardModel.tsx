import { Asset } from 'expo-asset';
import {
  loadTensorflowModel,
  type TensorflowPlugin,
  type TfliteModel,
  type TensorflowModelDelegate,
} from 'react-native-fast-tflite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { InferenceError } from '@/features/detection/model/inferenceErrors';
import { validateModelContract } from '@/features/detection/model/validateModelContract';

// Metro resolves bundled non-code assets through a static require.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MODEL_ASSET = require('../../../../assets/models/caneguard_leaf_v0_1_baseline.tflite') as number;
const CPU_DELEGATES: TensorflowModelDelegate[] = [];

/**
 * Downloads the bundled TFLite asset to a local file (via expo-asset) and then
 * hands that local file to react-native-fast-tflite.
 *
 * We must not pass the raw Metro asset URL to the native loader: in dev builds
 * it resolves to an `http://` URL, and when the dev server is reached through
 * an HTTPS tunnel (e.g. ngrok) that URL 307-redirects to `https://`. The native
 * TFLite loader does not follow redirects and would read the redirect page
 * instead of the model bytes ("Failed to create TFLite model from data!").
 * Downloading through expo-asset uses the app's regular networking stack, which
 * follows redirects, and yields a local `file://` URI the native loader reads
 * directly.
 */
function useTensorflowModelFromAsset(
  assetModule: number,
  delegates: TensorflowModelDelegate[],
): TensorflowPlugin {
  const [nativeModel, setNativeModel] = useState<TensorflowPlugin>({
    model: undefined,
    state: 'loading',
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setNativeModel({ model: undefined, state: 'loading' });
        const asset = Asset.fromModule(assetModule);
        await asset.downloadAsync();
        if (cancelled) {
          return;
        }

        if (!asset.localUri) {
          throw new Error('Bundled model asset downloaded without a localUri.');
        }

        const model = await loadTensorflowModel(
          { url: asset.localUri },
          delegates,
        );
        if (!cancelled) {
          setNativeModel({ model, state: 'loaded' });
        }
      } catch (error) {
        if (!cancelled) {
          setNativeModel({
            model: undefined,
            state: 'error',
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [assetModule, delegates]);

  return nativeModel;
}

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
  const nativeModel = useTensorflowModelFromAsset(MODEL_ASSET, CPU_DELEGATES);
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
        error: new InferenceError(
          'MODEL_LOAD_FAILED',
          'The native runtime could not load the bundled Model v0 asset.',
          nativeModel.error,
        ),
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
