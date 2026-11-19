import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import type { TfliteModel } from 'react-native-fast-tflite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { GuardError } from '@/features/detection/model/guardInference';
import { assertGuardArtifact } from '@/features/detection/model/guardArtifact';
import {
  validateGuardContract,
  type GuardMetadata,
} from '@/features/detection/model/validateGuardContract';

// Guard V1 is bundled with the app and required in the scan workflow.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const GUARD_ASSET = require('../../../../assets/models/caneguard_guard_v1_float32.tflite') as number;

export type GuardErrorKind = 'integrity' | 'contract' | 'load' | 'unsupported';
type GuardRun = (input: ArrayBuffer[]) => Promise<ArrayBuffer[]>;

export type GuardModelController = {
  start: () => void;
  retry: () => void;
  run: GuardRun;
} & (
  | { state: 'loading'; error: null; errorKind: null }
  | { state: 'loaded'; error: null; errorKind: null }
  | { state: 'error'; error: GuardError; errorKind: GuardErrorKind }
);

type LoadState =
  | { state: 'loading' }
  | { state: 'loaded'; model: TfliteModel }
  | { state: 'error'; error: GuardError; errorKind: GuardErrorKind };

export type GuardModelLoader = (assetModule: number) => Promise<TfliteModel>;

/** Downloads the bundled asset, verifies the pinned SHA-256, then loads it on CPU. */
export const loadGuardModel: GuardModelLoader = async (assetModule) => {
  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();
  if (!asset.localUri) {
    throw new GuardError('GUARD_MODEL_LOAD_FAILED', 'The guard asset downloaded without a localUri.');
  }
  await assertGuardArtifact(await new File(asset.localUri).arrayBuffer());
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { loadTensorflowModel } = require('react-native-fast-tflite') as typeof import('react-native-fast-tflite');
  return loadTensorflowModel({ url: asset.localUri }, []);
};

export function classifyGuardLoadError(error: unknown): {
  error: GuardError;
  errorKind: GuardErrorKind;
} {
  if (error instanceof GuardError) {
    return {
      error,
      errorKind:
        error.code === 'GUARD_ARTIFACT_MISMATCH'
          ? 'integrity'
          : error.code === 'GUARD_UNSUPPORTED_PLATFORM'
            ? 'unsupported'
            : 'load',
    };
  }
  return {
    error: new GuardError(
      'GUARD_MODEL_LOAD_FAILED',
      'The native runtime could not load the Guard V1 model.',
      error,
    ),
    errorKind: 'load',
  };
}

const NOT_MOUNTED: GuardModelController = {
  state: 'error',
  error: new GuardError('GUARD_NOT_READY', 'The Guard V1 provider is not mounted.'),
  errorKind: 'load',
  start: () => undefined,
  retry: () => undefined,
  run: async () => {
    throw new GuardError('GUARD_NOT_READY', 'The Guard V1 provider is not mounted.');
  },
};

const GuardModelContext = createContext<GuardModelController | null>(null);

export function GuardModelProvider({
  children,
  loader = loadGuardModel,
}: PropsWithChildren<{ loader?: GuardModelLoader }>) {
  const [started, setStarted] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [load, setLoad] = useState<LoadState>({ state: 'loading' });
  const start = useCallback(() => setStarted(true), []);
  const retry = useCallback(() => {
    setLoad({ state: 'loading' });
    setStarted(true);
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!started) return;
    let cancelled = false;
    loader(GUARD_ASSET)
      .then((model) => {
        if (!cancelled) setLoad({ state: 'loaded', model });
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoad({ state: 'error', ...classifyGuardLoadError(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt, loader, started]);

  const contractError =
    load.state === 'loaded' ? validateGuardContract(load.model as GuardMetadata) : null;
  const loadedModel = load.state === 'loaded' && !contractError ? load.model : undefined;
  const run = useCallback<GuardRun>(
    async (input) => {
      if (!loadedModel) {
        throw new GuardError('GUARD_NOT_READY', 'The Guard V1 runtime is not loaded.');
      }
      return loadedModel.run(input);
    },
    [loadedModel],
  );

  const value = useMemo<GuardModelController>(() => {
    const base = { start, retry, run } as const;
    if (contractError) {
      return { ...base, state: 'error', error: contractError, errorKind: 'contract' };
    }
    if (load.state === 'error') {
      return { ...base, state: 'error', error: load.error, errorKind: load.errorKind };
    }
    if (load.state === 'loaded') {
      return { ...base, state: 'loaded', error: null, errorKind: null };
    }
    return { ...base, state: 'loading', error: null, errorKind: null };
  }, [contractError, load, retry, run, start]);

  return <GuardModelContext.Provider value={value}>{children}</GuardModelContext.Provider>;
}

/** Outside a mounted provider the guard is an explicit error, never a silent pass. */
export function useGuardModel(): GuardModelController {
  return useContext(GuardModelContext) ?? NOT_MOUNTED;
}
