import { render, screen, waitFor } from '@testing-library/react-native';
import { Image as NativeImage } from 'react-native';

import ModelSmokeTestScreen from '@/app/model-smoke-test';
import {
  MODEL_INPUT,
  MODEL_OUTPUT,
} from '@/features/detection/constants/modelContract';
import { runInference } from '@/features/detection/model/runInference';
import { useCaneGuardModel } from '@/features/detection/model/useCaneGuardModel';
import { preprocessImage } from '@/features/detection/preprocessing/preprocessImage';

jest.mock('@/features/detection/model/useCaneGuardModel', () => ({
  useCaneGuardModel: jest.fn(),
}));

jest.mock('@/features/detection/preprocessing/preprocessImage', () => ({
  preprocessImage: jest.fn(),
}));

jest.mock('@/features/detection/model/runInference', () => ({
  runInference: jest.fn(),
}));

const mockUseCaneGuardModel = jest.mocked(useCaneGuardModel);
const mockRun = jest.fn<Promise<ArrayBuffer[]>, [ArrayBuffer[]]>();
const mockPreprocessImage = jest.mocked(preprocessImage);
const mockRunInference = jest.mocked(runInference);

describe('ModelSmokeTestScreen', () => {
  beforeEach(() => {
    jest.spyOn(NativeImage, 'resolveAssetSource').mockReturnValue({
      uri: 'asset://v1-healthy',
      width: 3000,
      height: 4000,
      scale: 1,
    });
    mockPreprocessImage.mockResolvedValue({
      processedUri: 'file:///v1-healthy.jpg',
      inputBuffer: new ArrayBuffer(602_112),
      width: 224,
      height: 224,
      channels: 3,
      dataType: 'float32',
      minValue: 0,
      maxValue: 255,
      meanValue: 127.5,
      letterbox: {
        resizedWidth: 168,
        resizedHeight: 224,
        paddingLeft: 28,
        paddingTop: 0,
      },
      qualityAssessment: {
        warnings: [],
        meanLuminance: 120,
        luminanceStandardDeviation: 40,
      },
      preprocessMs: 1,
    });
    mockRunInference.mockImplementation(
      async (_model, _input, _preprocessMs, _clock, onRawOutput) => {
        onRawOutput?.([
          0.9999984502792358,
          1.1242434538871748e-6,
          3.297952559933037e-7,
          7.9567350041998e-8,
        ]);
        return {} as never;
      },
    );
  });

  it('shows model loading status and static metadata', async () => {
    mockUseCaneGuardModel.mockReturnValue({
      model: undefined,
      state: 'loading',
      run: mockRun,
      error: null,
    });

    await render(<ModelSmokeTestScreen />);

    expect(screen.getByText('Loading Model V1')).toBeOnTheScreen();
    expect(screen.getByLabelText('Model V1 inference loading')).toBeOnTheScreen();
    expect(screen.getByText('caneguard_v1_mobilenetv2_float32.tflite')).toBeOnTheScreen();
    expect(screen.getByText('v1.0-mobilenetv2')).toBeOnTheScreen();
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

    expect(await screen.findByText('Model V1 inference passed')).toBeOnTheScreen();
    expect(screen.getByText('float32 [1, 224, 224, 3]')).toBeOnTheScreen();
    expect(screen.getByText('float32 [1, 4]')).toBeOnTheScreen();
    await waitFor(() => expect(mockRunInference).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Actual top-1')).toBeOnTheScreen();
  });

  it('shows native error detail in development', async () => {
    mockUseCaneGuardModel.mockReturnValue({
      model: undefined,
      state: 'error',
      run: mockRun,
      error: new Error('TFLite asset could not load'),
    });

    await render(<ModelSmokeTestScreen />);

    expect(screen.getByText('Model V1 failed to load')).toBeOnTheScreen();
    expect(screen.getByText('Development error detail')).toBeOnTheScreen();
    expect(screen.getByText('TFLite asset could not load')).toBeOnTheScreen();
  });
});
