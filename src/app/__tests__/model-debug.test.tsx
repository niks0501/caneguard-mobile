import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Image as NativeImage } from 'react-native';

import ModelDebugRoute from '@/app/model-debug';
import { runInference } from '@/features/detection/model/runInference';
import { useCaneGuardModel } from '@/features/detection/model/useCaneGuardModel';
import { preprocessImage } from '@/features/detection/preprocessing/preprocessImage';
import type { DetectionResult } from '@/features/detection/types';

jest.mock('@/features/detection/preprocessing/preprocessImage', () => ({
  preprocessImage: jest.fn(),
}));

jest.mock('@/features/detection/model/runInference', () => ({
  runInference: jest.fn(),
}));

jest.mock('@/features/detection/model/useCaneGuardModel', () => ({
  useCaneGuardModel: jest.fn(),
}));

const mockPreprocessImage = jest.mocked(preprocessImage);
const mockRunInference = jest.mocked(runInference);
const mockUseCaneGuardModel = jest.mocked(useCaneGuardModel);
const mockModelRun = jest.fn<Promise<ArrayBuffer[]>, [ArrayBuffer[]]>();

describe('ModelDebugRoute', () => {
  beforeEach(() => {
    jest.spyOn(NativeImage, 'resolveAssetSource').mockReturnValue({
      uri: 'asset://healthy-fixture',
      width: 3000,
      height: 4000,
      scale: 1,
    });
    mockUseCaneGuardModel.mockReturnValue({
      state: 'loaded',
      model: {} as never,
      run: mockModelRun,
      error: null,
    });
    mockPreprocessImage.mockResolvedValue({
      processedUri: 'file:///processed.jpg',
      inputBuffer: new ArrayBuffer(602_112),
      width: 224,
      height: 224,
      channels: 3,
      dataType: 'float32',
      minValue: 2,
      maxValue: 251,
      meanValue: 112.5,
      letterbox: {
        resizedWidth: 168,
        resizedHeight: 224,
        paddingLeft: 28,
        paddingTop: 0,
      },
      qualityAssessment: {
        warnings: [],
        meanLuminance: 110,
        luminanceStandardDeviation: 40,
      },
      preprocessMs: 41.6,
    });
    const inferenceResult: DetectionResult = {
      predictedLabel: 'healthy',
      confidence: 0.7,
      scores: [
        { label: 'healthy', score: 0.7 },
        { label: 'mosaic', score: 0.2 },
        { label: 'rust', score: 0.09 },
        { label: 'smut', score: 0.01 },
      ],
      timings: {
        preprocessMs: 41.6,
        inferenceMs: 18.4,
        totalMs: 60,
      },
      modelVersion: 'v1.0-mobilenetv2',
    };
    mockRunInference.mockImplementation(
      async (_model, _input, _preprocessMs, _clock, onRawOutput) => {
        onRawOutput?.([0.7, 0.2, 0.09, 0.01]);
        return inferenceResult;
      },
    );
  });

  it('shows the model contract and runs a bundled fixture with one tap', async () => {
    await render(<ModelDebugRoute />);

    expect(screen.getByText('loaded')).toBeOnTheScreen();
    expect(screen.getByText('healthy → mosaic → rust → smut')).toBeOnTheScreen();
    expect(screen.getByText('1 × 224 × 224 × 3')).toBeOnTheScreen();
    expect(screen.getByText('float32')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Run Healthy QA Fixture'));

    await waitFor(() => {
      expect(mockPreprocessImage).toHaveBeenCalledWith(
        'asset://healthy-fixture',
        { width: 3000, height: 4000 },
      );
      expect(mockRunInference).toHaveBeenCalledTimes(1);
      expect(screen.getByText('[0.700000, 0.200000, 0.090000, 0.010000]')).toBeOnTheScreen();
    });

    expect(screen.getByText('healthy (0.700000)')).toBeOnTheScreen();
    expect(screen.getByText('602112')).toBeOnTheScreen();
    expect(screen.getByText('42 ms')).toBeOnTheScreen();
    expect(screen.getByText('18 ms')).toBeOnTheScreen();
    expect(screen.getByText('Expected QA top-1')).toBeOnTheScreen();
    expect(screen.getByText('PASS')).toBeOnTheScreen();
    expect(screen.getByText('None')).toBeOnTheScreen();
  });

  it('keeps technical fixture failures on the development-only screen', async () => {
    mockPreprocessImage.mockRejectedValueOnce(
      new Error('fixture decode failed'),
    );
    await render(<ModelDebugRoute />);

    await fireEvent.press(screen.getByLabelText('Run Smut QA Fixture'));

    expect(
      await screen.findByText('Error: fixture decode failed'),
    ).toBeOnTheScreen();
    expect(mockRunInference).not.toHaveBeenCalled();
  });
});
