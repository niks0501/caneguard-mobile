import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import type { TfliteModel } from 'react-native-fast-tflite';
import { useState } from 'react';

import {
  MODEL_INPUT,
  MODEL_OUTPUT,
} from '@/features/detection/constants/modelContract';
import {
  CaneGuardModelProvider,
  useCaneGuardModel,
} from '@/features/detection/model/useCaneGuardModel';

const mockLoadTensorflowModel = jest.fn();
const mockAssetDownloadAsync = jest.fn();
const mockAsset: {
  localUri: string | null;
  downloadAsync: jest.Mock;
} = {
  localUri: 'file:///cached/caneguard_leaf_v0_1_baseline.tflite',
  downloadAsync: mockAssetDownloadAsync,
};

jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn(() => mockAsset),
  },
}));

jest.mock('react-native-fast-tflite', () => ({
  loadTensorflowModel: (...args: unknown[]) => mockLoadTensorflowModel(...args),
}));

const MODEL_LOCAL_URI = 'file:///cached/caneguard_leaf_v0_1_baseline.tflite';

function createLoadedModel(
  inputShape: number[] = [...MODEL_INPUT.shape],
): TfliteModel {
  return {
    run: mockModelRun,
    inputs: [
      {
        name: MODEL_INPUT.name,
        dataType: MODEL_INPUT.dataType,
        shape: inputShape,
      },
    ],
    outputs: [
      {
        name: MODEL_OUTPUT.name,
        dataType: MODEL_OUTPUT.dataType,
        shape: [...MODEL_OUTPUT.shape],
      },
    ],
  } as unknown as TfliteModel;
}

const mockModelRun = jest.fn<Promise<ArrayBuffer[]>, [ArrayBuffer[]]>();

function ModelStateProbe() {
  const modelState = useCaneGuardModel();
  const [runState, setRunState] = useState('not-run');

  return (
    <>
      <Text>
        {modelState.state}
        {modelState.state === 'error' ? `: ${modelState.error.message}` : ''}
      </Text>
      <Pressable
        accessibilityLabel="Run model"
        onPress={() => {
          void modelState.run([]).then(
            () => setRunState('run-complete'),
            (error: unknown) =>
              setRunState(
                error && typeof error === 'object' && 'code' in error
                  ? String(error.code)
                  : 'run-failed',
              ),
          );
        }}
      />
      <Text>{runState}</Text>
    </>
  );
}

describe('CaneGuardModelProvider', () => {
  beforeEach(() => {
    mockModelRun.mockResolvedValue([]);
    mockAssetDownloadAsync.mockResolvedValue(undefined);
    mockLoadTensorflowModel.mockResolvedValue(createLoadedModel());
  });

  it('downloads the static model asset to a local file, then loads it with the CPU delegate', async () => {
    await render(
      <CaneGuardModelProvider>
        <ModelStateProbe />
      </CaneGuardModelProvider>,
    );

    await waitFor(() => {
      expect(mockAssetDownloadAsync).toHaveBeenCalledTimes(1);
      expect(mockLoadTensorflowModel).toHaveBeenCalledWith(
        { url: MODEL_LOCAL_URI },
        [],
      );
      expect(mockLoadTensorflowModel).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('loaded')).toBeOnTheScreen();
  });

  it('provides a loaded model when its tensor metadata matches the contract', async () => {
    await render(
      <CaneGuardModelProvider>
        <ModelStateProbe />
      </CaneGuardModelProvider>,
    );

    expect(await screen.findByText('loaded')).toBeOnTheScreen();
  });

  it('runs inference through the reusable loaded model', async () => {
    await render(
      <CaneGuardModelProvider>
        <ModelStateProbe />
      </CaneGuardModelProvider>,
    );

    await screen.findByText('loaded');
    await fireEvent.press(screen.getByLabelText('Run model'));

    await waitFor(() => {
      expect(mockModelRun).toHaveBeenCalledWith([]);
      expect(screen.getByText('run-complete')).toBeOnTheScreen();
    });
  });

  it('blocks inference while the model is still loading', async () => {
    mockAssetDownloadAsync.mockReturnValue(new Promise(() => {}));

    await render(
      <CaneGuardModelProvider>
        <ModelStateProbe />
      </CaneGuardModelProvider>,
    );

    await fireEvent.press(screen.getByLabelText('Run model'));

    expect(await screen.findByText('MODEL_NOT_READY')).toBeOnTheScreen();
    expect(mockModelRun).not.toHaveBeenCalled();
  });

  it('converts a loaded model with mismatched tensors into an error state', async () => {
    mockLoadTensorflowModel.mockResolvedValue(
      createLoadedModel([1, 256, 256, 3]),
    );

    await render(
      <CaneGuardModelProvider>
        <ModelStateProbe />
      </CaneGuardModelProvider>,
    );

    expect(
      await screen.findByText(
        /error: Model input does not match the Model v0 contract/,
      ),
    ).toBeOnTheScreen();
  });

  it('preserves an error returned by the native model loader', async () => {
    mockLoadTensorflowModel.mockRejectedValue(new Error('Native model failed'));

    await render(
      <CaneGuardModelProvider>
        <ModelStateProbe />
      </CaneGuardModelProvider>,
    );

    expect(
      await screen.findByText(
        'error: The native runtime could not load the bundled Model v0 asset.',
      ),
    ).toBeOnTheScreen();
  });

  it('converts a failing asset download into an error state', async () => {
    mockAssetDownloadAsync.mockRejectedValue(new Error('Download failed'));

    await render(
      <CaneGuardModelProvider>
        <ModelStateProbe />
      </CaneGuardModelProvider>,
    );

    expect(
      await screen.findByText(
        'error: The native runtime could not load the bundled Model v0 asset.',
      ),
    ).toBeOnTheScreen();
    expect(mockLoadTensorflowModel).not.toHaveBeenCalled();
  });
});
