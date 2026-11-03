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

import {
  ACTIVE_MODEL_ID,
  MODEL_CONTRACTS,
  type ModelId,
} from '@/features/detection/constants/modelContract';
import { InferenceError } from '@/features/detection/model/inferenceErrors';
import { validateModelContract } from '@/features/detection/model/validateModelContract';

// Metro resolves bundled non-code assets through a static require, so both
// artifacts stay bundled; the provider's `modelId` (default `ACTIVE_MODEL_ID`)
// picks one.
const MODEL_ASSETS: Record<ModelId, number> = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  v1: require('../../../../assets/models/caneguard_v1_mobilenetv2_float32.tflite') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  v2: require('../../../../assets/models/caneguard_v2.tflite') as number,
};
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
  attempt: number,
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
  }, [assetModule, attempt, delegates, started]);

  return nativeModel;
}

type ModelRun = (input: ArrayBuffer[]) => Promise<ArrayBuffer[]>;

/**
 * Starts the one-time model download and native load. The provider defers this
 * until the scan flow asks for it, so a cold start does not pay the model asset
 * I/O and a TFLite load for a screen the inspector has not opened. Calling it
 * again is a no-op; `retry` is the explicit recovery path after a load error.
 */
type StartModelLoad = () => void;
type RetryModelLoad = () => void;

/** Why analysis setup is unavailable. Contract mismatches stay fail-closed. */
export type ModelErrorKind = 'contract' | 'load';

export type CaneGuardModelController = {
  /**
   * `loading` covers both "not started yet" and "downloading". The first call
   * to `start` moves it to the download, and the load then reports `loaded` or
   * `error` as before.
   */
  start: StartModelLoad;
  /** Reattempts a failed download/native load without changing the contract. */
  retry: RetryModelLoad;
} & (
  | {
      state: 'loading';
      model: undefined;
      run: ModelRun;
      error: null;
      errorKind: null;
    }
  | {
      state: 'loaded';
      model: TfliteModel;
      run: ModelRun;
      error: null;
      errorKind: null;
    }
  | {
      state: 'error';
      model: undefined;
      run: ModelRun;
      error: Error;
      errorKind: ModelErrorKind;
    }
);

const CaneGuardModelContext = createContext<CaneGuardModelController | null>(null);

export function CaneGuardModelProvider({
  children,
  modelId = ACTIVE_MODEL_ID,
}: PropsWithChildren<{ modelId?: ModelId }>) {
  const contract = MODEL_CONTRACTS[modelId];
  const [started, setStarted] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const start = useCallback(() => setStarted(true), []);
  const retry = useCallback(() => {
    setStarted(true);
    setAttempt((current) => current + 1);
  }, []);
  const nativeModel = useTensorflowModelFromAsset(
    MODEL_ASSETS[modelId],
    CPU_DELEGATES,
    started,
    attempt,
  );
  const contractError =
    nativeModel.state === 'loaded'
      ? validateModelContract(nativeModel.model, contract)
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
          `The Model ${contract.id.toUpperCase()} TensorFlow Lite runtime is not loaded.`,
        );
      }

      return loadedModel.run(input);
    },
    [contract, loadedModel],
  );
  const modelState = useMemo<CaneGuardModelController>(() => {
    if (contractError) {
      return {
        model: undefined,
        start,
        retry,
        state: 'error',
        run,
        error: contractError,
        errorKind: 'contract',
      };
    }

    if (nativeModel.state === 'error') {
      return {
        model: undefined,
        start,
        retry,
        state: 'error',
        run,
        error: new InferenceError(
          'MODEL_LOAD_FAILED',
          `The native runtime could not load the bundled Model ${contract.id.toUpperCase()} asset.`,
          nativeModel.error,
        ),
        errorKind: 'load',
      };
    }

    if (nativeModel.state === 'loaded') {
      return {
        model: nativeModel.model,
        start,
        retry,
        state: 'loaded',
        run,
        error: null,
        errorKind: null,
      };
    }

    return {
      model: undefined,
      start,
      retry,
      state: 'loading',
      run,
      error: null,
      errorKind: null,
    };
  }, [contract, contractError, nativeModel, retry, run, start]);

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
