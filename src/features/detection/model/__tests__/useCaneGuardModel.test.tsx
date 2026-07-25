import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import type { TensorflowPlugin } from 'react-native-fast-tflite';
import { useState } from 'react';

import {
  MODEL_INPUT,
  MODEL_OUTPUT,
} from '@/features/detection/constants/modelContract';
import {
  CaneGuardModelProvider,
  useCaneGuardModel,
} from '@/features/detection/model/useCaneGuardModel';

const mockUseTensorflowModel = jest.fn();
const mockModelRun = jest.fn<Promise<ArrayBuffer[]>, [ArrayBuffer[]]>();

jest.mock('react-native-fast-tflite', () => ({
  useTensorflowModel: (...args: unknown[]) => mockUseTensorflowModel(...args),
}));

function createLoadedPlugin(
  inputShape: number[] = [...MODEL_INPUT.shape],
): TensorflowPlugin {
  return {
    state: 'loaded',
    model: {
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
    },
  } as unknown as TensorflowPlugin;
}

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
    mockUseTensorflowModel.mockReturnValue({
      model: undefined,
      state: 'loading',
    } satisfies TensorflowPlugin);
  });

  it('loads the static model asset once with the CPU delegate', async () => {
    await render(
      <CaneGuardModelProvider>
        <ModelStateProbe />
      </CaneGuardModelProvider>,
    );

    expect(screen.getByText('loading')).toBeOnTheScreen();
    expect(mockUseTensorflowModel).toHaveBeenCalledWith(1, []);
    expect(mockUseTensorflowModel).toHaveBeenCalledTimes(1);
  });

  it('provides a loaded model when its tensor metadata matches the contract', async () => {
    mockUseTensorflowModel.mockReturnValue(createLoadedPlugin());

    await render(
      <CaneGuardModelProvider>
        <ModelStateProbe />
      </CaneGuardModelProvider>,
    );

    expect(screen.getByText('loaded')).toBeOnTheScreen();
  });

  it('runs inference through the reusable loaded model', async () => {
    mockUseTensorflowModel.mockReturnValue(createLoadedPlugin());

    await render(
      <CaneGuardModelProvider>
        <ModelStateProbe />
      </CaneGuardModelProvider>,
    );

    await fireEvent.press(screen.getByLabelText('Run model'));

    await waitFor(() => {
      expect(mockModelRun).toHaveBeenCalledWith([]);
      expect(screen.getByText('run-complete')).toBeOnTheScreen();
    });
  });

  it('blocks inference while the model is still loading', async () => {
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
    mockUseTensorflowModel.mockReturnValue(createLoadedPlugin([1, 256, 256, 3]));

    await render(
      <CaneGuardModelProvider>
        <ModelStateProbe />
      </CaneGuardModelProvider>,
    );

    expect(screen.getByText(/error: Model input does not match the Model v0 contract/)).toBeOnTheScreen();
  });

  it('preserves an error returned by the native model hook', async () => {
    mockUseTensorflowModel.mockReturnValue({
      model: undefined,
      state: 'error',
      error: new Error('Native model failed'),
    } satisfies TensorflowPlugin);

    await render(
      <CaneGuardModelProvider>
        <ModelStateProbe />
      </CaneGuardModelProvider>,
    );

    expect(screen.getByText('error: Native model failed')).toBeOnTheScreen();
  });
});
