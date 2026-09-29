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
const MODEL_ASSET = require('../../../../assets/models/caneguard_v1_mobilenetv2_float32.tflite') as number;
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
  started: boolean,
): TensorflowPlugin {
  const [nativeModel, setNativeModel] = useState<TensorflowPlugin>({
    model: undefined,
    state: 'loading',
  });

  useEffect(() => {
    if (!started) {
      return;
    }

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
  }, [assetModule, delegates, started]);

  return nativeModel;
}

type ModelRun = (input: ArrayBuffer[]) => Promise<ArrayBuffer[]>;

/**
 * Starts the one-time model download and native load. The provider defers this
 * until the scan flow asks for it, so a cold start does not pay 8.9 MB of asset
 * I/O and a TFLite load for a screen the inspector has not opened. It is
 * idempotent: calling it more than once is a no-op after the first call.
 */
type StartModelLoad = () => void;

export type CaneGuardModelController = {
  /**
   * `loading` covers both "not started yet" and "downloading". The first call
   * to `start` moves it to the download, and the load then reports `loaded` or
   * `error` as before.
   */
  start: StartModelLoad;
} & (
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
    }
);

const CaneGuardModelContext = createContext<CaneGuardModelController | null>(null);

export function CaneGuardModelProvider({ children }: PropsWithChildren) {
  const [started, setStarted] = useState(false);
  const start = useCallback(() => setStarted(true), []);
  const nativeModel = useTensorflowModelFromAsset(
    MODEL_ASSET,
    CPU_DELEGATES,
    started,
  );
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
          'The Model V1 TensorFlow Lite runtime is not loaded.',
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
        start,
        state: 'error',
        run,
        error: contractError,
      };
    }

    if (nativeModel.state === 'error') {
      return {
        model: undefined,
        start,
        state: 'error',
        run,
        error: new InferenceError(
          'MODEL_LOAD_FAILED',
          'The native runtime could not load the bundled Model V1 asset.',
          nativeModel.error,
        ),
      };
    }

    if (nativeModel.state === 'loaded') {
      return {
        model: nativeModel.model,
        start,
        state: 'loaded',
        run,
        error: null,
      };
    }

    return {
      model: undefined,
      start,
      state: 'loading',
      run,
      error: null,
    };
  }, [contractError, nativeModel, run, start]);

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
