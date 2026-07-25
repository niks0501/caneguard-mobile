import { render, screen } from '@testing-library/react-native';

import ModelSmokeTestScreen from '@/app/model-smoke-test';
import {
  MODEL_INPUT,
  MODEL_OUTPUT,
} from '@/features/detection/constants/modelContract';
import { useCaneGuardModel } from '@/features/detection/model/useCaneGuardModel';

jest.mock('@/features/detection/model/useCaneGuardModel', () => ({
  useCaneGuardModel: jest.fn(),
}));

const mockUseCaneGuardModel = jest.mocked(useCaneGuardModel);
const mockRun = jest.fn<Promise<ArrayBuffer[]>, [ArrayBuffer[]]>();

describe('ModelSmokeTestScreen', () => {
  it('shows model loading status and static metadata', async () => {
    mockUseCaneGuardModel.mockReturnValue({
      model: undefined,
      state: 'loading',
      run: mockRun,
      error: null,
    });

    await render(<ModelSmokeTestScreen />);

    expect(screen.getByText('Loading model')).toBeOnTheScreen();
    expect(screen.getByLabelText('Model loading')).toBeOnTheScreen();
    expect(screen.getByText('caneguard_leaf_v0_1_baseline.tflite')).toBeOnTheScreen();
    expect(screen.getByText('v0.1-baseline')).toBeOnTheScreen();
    expect(screen.queryByText('Development error detail')).not.toBeOnTheScreen();
  });

  it('shows validated input and output metadata after loading', async () => {
    mockUseCaneGuardModel.mockReturnValue({
      state: 'loaded',
      run: mockRun,
      error: null,
      model: {
        inputs: [
          {
            name: MODEL_INPUT.name,
            dataType: MODEL_INPUT.dataType,
            shape: [...MODEL_INPUT.shape],
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
    } as unknown as ReturnType<typeof useCaneGuardModel>);

    await render(<ModelSmokeTestScreen />);

    expect(screen.getByText('Model loaded')).toBeOnTheScreen();
    expect(screen.getByText('float32 [1, 224, 224, 3]')).toBeOnTheScreen();
    expect(screen.getByText('float32 [1, 3]')).toBeOnTheScreen();
  });

  it('shows native error detail in development', async () => {
    mockUseCaneGuardModel.mockReturnValue({
      model: undefined,
      state: 'error',
      run: mockRun,
      error: new Error('TFLite asset could not load'),
    });

    await render(<ModelSmokeTestScreen />);

    expect(screen.getByText('Model failed to load')).toBeOnTheScreen();
    expect(screen.getByText('Development error detail')).toBeOnTheScreen();
    expect(screen.getByText('TFLite asset could not load')).toBeOnTheScreen();
  });
});
