import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pressable, Text } from 'react-native';
import { useEffect } from 'react';
import type { TfliteModel } from 'react-native-fast-tflite';

import { GuardError } from '@/features/detection/model/guardInference';
import {
  GuardModelProvider,
  loadGuardModel,
  useGuardModel,
  type GuardModelLoader,
} from '@/features/detection/model/useGuardModel';

const mockAssetFromModule = jest.fn();
const mockFileArrayBuffer = jest.fn();
const mockLoadTensorflowModel = jest.fn();
jest.mock('expo-asset', () => ({
  Asset: { fromModule: (...args: unknown[]) => mockAssetFromModule(...args) },
}));
jest.mock('expo-file-system', () => ({
  File: function File() {
    return { arrayBuffer: () => mockFileArrayBuffer() };
  },
}));
jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digest: jest.fn(async (_algorithm: string, bytes: ArrayBuffer) => {
    const { createHash } = jest.requireActual('node:crypto') as typeof import('node:crypto');
    const hash = createHash('sha256').update(new Uint8Array(bytes)).digest();
    return hash.buffer.slice(hash.byteOffset, hash.byteOffset + hash.byteLength);
  }),
}));
jest.mock('react-native-fast-tflite', () => ({
  loadTensorflowModel: (...args: unknown[]) => mockLoadTensorflowModel(...args),
}));

const goodModel = (outShape: number[] = [1, 1]) =>
  ({
    run: jest.fn().mockResolvedValue([Float32Array.of(0.9).buffer]),
    inputs: [{ name: 'img', dataType: 'float32', shape: [1, 224, 224, 3] }],
    outputs: [{ name: 'p', dataType: 'float32', shape: outShape }],
  }) as unknown as TfliteModel;

function Probe({ autoStart = true }: { autoStart?: boolean }) {
  const guard = useGuardModel();
  useEffect(() => {
    if (autoStart) guard.start();
  }, [autoStart, guard]);
  return (
    <>
      <Text testID="state">{guard.state}</Text>
      <Text testID="kind">{String(guard.errorKind)}</Text>
      <Pressable testID="retry" onPress={guard.retry} />
    </>
  );
}

const state = () => screen.getByTestId('state').props.children;


describe('GuardModelProvider (guard is required)', () => {
  beforeEach(() => {
    mockAssetFromModule.mockReset();
    mockFileArrayBuffer.mockReset();
    mockLoadTensorflowModel.mockReset();
  });

  it('verifies the downloaded frozen bytes before native loading', async () => {
    const binary = readFileSync(
      join(process.cwd(), 'assets/models/caneguard_guard_v1_float32.tflite'),
    );
    const bytes = binary.buffer.slice(
      binary.byteOffset,
      binary.byteOffset + binary.byteLength,
    ) as ArrayBuffer;
    const model = goodModel();
    mockAssetFromModule.mockReturnValue({
      downloadAsync: jest.fn(),
      localUri: 'file:///guard.tflite',
    });
    mockFileArrayBuffer.mockResolvedValue(bytes);
    mockLoadTensorflowModel.mockResolvedValue(model);

    await expect(loadGuardModel(42)).resolves.toBe(model);
    expect(mockLoadTensorflowModel).toHaveBeenCalledTimes(1);

    const altered = new Uint8Array(bytes.slice(0));
    altered[altered.length - 1] ^= 0xff;
    mockFileArrayBuffer.mockResolvedValue(altered.buffer);
    await expect(loadGuardModel(42)).rejects.toMatchObject({
      code: 'GUARD_ARTIFACT_MISMATCH',
    });
    expect(mockLoadTensorflowModel).toHaveBeenCalledTimes(1);
  });

  // Proves: nothing loads until the scan flow starts it.
  it('defers loading until started', async () => {
    const loader = jest.fn<ReturnType<GuardModelLoader>, Parameters<GuardModelLoader>>();
    await render(
      <GuardModelProvider loader={loader}>
        <Probe autoStart={false} />
      </GuardModelProvider>,
    );
    expect(state()).toBe('loading');
    expect(loader).not.toHaveBeenCalled();
  });

  it('loads the bundled asset through the default provider', async () => {
    const binary = readFileSync(
      join(process.cwd(), 'assets/models/caneguard_guard_v1_float32.tflite'),
    );
    const bytes = binary.buffer.slice(
      binary.byteOffset,
      binary.byteOffset + binary.byteLength,
    ) as ArrayBuffer;
    const model = goodModel();
    const asset = {
      downloadAsync: jest.fn(),
      localUri: 'file:///bundled-guard.tflite',
    };
    mockAssetFromModule.mockReturnValue(asset);
    mockFileArrayBuffer.mockResolvedValue(bytes);
    mockLoadTensorflowModel.mockResolvedValue(model);

    await render(
      <GuardModelProvider>
        <Probe />
      </GuardModelProvider>,
    );

    await waitFor(() => expect(state()).toBe('loaded'));
    expect(mockAssetFromModule).toHaveBeenCalledWith(101);
    expect(asset.downloadAsync).toHaveBeenCalledTimes(1);
    expect(mockLoadTensorflowModel).toHaveBeenCalledWith(
      { url: 'file:///bundled-guard.tflite' },
      [],
    );
  });

  // Proves: a model whose real tensor metadata breaks the contract is refused even though it loaded.
  it('rejects a loaded model with the wrong tensor metadata', async () => {
    await render(
      <GuardModelProvider loader={async () => goodModel([1, 5])}>
        <Probe />
      </GuardModelProvider>,
    );
    await waitFor(() => expect(state()).toBe('error'));
    expect(screen.getByTestId('kind').props.children).toBe('contract');
  });

  // Proves: a wrong artifact (SHA mismatch) is an integrity error, never a loaded guard.
  it('reports an artifact mismatch as an integrity error', async () => {
    await render(
      <GuardModelProvider
        loader={async () => {
          throw new GuardError('GUARD_ARTIFACT_MISMATCH', 'wrong binary');
        }}>
        <Probe />
      </GuardModelProvider>,
    );
    await waitFor(() => expect(state()).toBe('error'));
    expect(screen.getByTestId('kind').props.children).toBe('integrity');
  });

  // Proves: a contract-valid model loads, and retry after a load failure recovers.
  it('loads a valid model and recovers on retry after a load failure', async () => {
    const loader = jest
      .fn<ReturnType<GuardModelLoader>, Parameters<GuardModelLoader>>()
      .mockRejectedValueOnce(new Error('native load failed'))
      .mockResolvedValue(goodModel());
    await render(
      <GuardModelProvider loader={loader}>
        <Probe />
      </GuardModelProvider>,
    );
    await waitFor(() => expect(state()).toBe('error'));
    expect(screen.getByTestId('kind').props.children).toBe('load');
    await fireEvent.press(screen.getByTestId('retry'));
    await waitFor(() => expect(state()).toBe('loaded'));
    expect(loader).toHaveBeenCalledTimes(2);
  });

  // Proves: outside a mounted provider the guard is an explicit error, never a silent pass.
  it('is an error when no provider is mounted', async () => {
    await render(<Probe />);
    expect(state()).toBe('error');
  });
});
