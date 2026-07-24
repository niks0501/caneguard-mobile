import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import type { TensorflowPlugin } from 'react-native-fast-tflite';

import {
  MODEL_INPUT,
  MODEL_OUTPUT,
} from '@/features/detection/constants/modelContract';
import {
  CaneGuardModelProvider,
  useCaneGuardModel,
} from '@/features/detection/model/useCaneGuardModel';

const mockUseTensorflowModel = jest.fn();

jest.mock('react-native-fast-tflite', () => ({
  useTensorflowModel: (...args: unknown[]) => mockUseTensorflowModel(...args),
}));

function createLoadedPlugin(
  inputShape: number[] = [...MODEL_INPUT.shape],
): TensorflowPlugin {
  return {
    state: 'loaded',
    model: {
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
  } as TensorflowPlugin;
}

function ModelStateProbe() {
  const modelState = useCaneGuardModel();

  return (
    <Text>
      {modelState.state}
      {modelState.state === 'error' ? `: ${modelState.error.message}` : ''}
    </Text>
  );
}

describe('CaneGuardModelProvider', () => {
  beforeEach(() => {
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
