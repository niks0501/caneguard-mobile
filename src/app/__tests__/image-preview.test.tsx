import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useReducer } from 'react';

import ImagePreviewScreen from '@/app/image-preview';
import { ScanSessionContext } from '@/features/detection/context/ScanSessionProvider';
import {
  initialScanSessionState,
  scanSessionReducer,
} from '@/features/detection/context/scanSessionReducer';
import { InferenceError } from '@/features/detection/model/inferenceErrors';
import { runInference } from '@/features/detection/model/runInference';
import { useCaneGuardModel } from '@/features/detection/model/useCaneGuardModel';
import { pickScanImage } from '@/features/detection/imagePicker/pickScanImage';
import { PreprocessingError } from '@/features/detection/preprocessing/preprocessingErrors';
import { preprocessImage } from '@/features/detection/preprocessing/preprocessImage';
import type {
  ScanSessionAction,
  ScanSessionState,
} from '@/features/detection/types';

jest.mock('@/features/detection/preprocessing/preprocessImage', () => ({
  preprocessImage: jest.fn(),
}));

jest.mock('@/features/detection/model/runInference', () => ({
  runInference: jest.fn(),
}));

jest.mock('@/features/detection/model/useCaneGuardModel', () => ({
  useCaneGuardModel: jest.fn(),
}));

jest.mock('@/features/detection/imagePicker/pickScanImage', () => ({
  getPermissionDeniedMessage: (canAskAgain: boolean) =>
    canAskAgain
      ? 'Camera access is needed to take a sugarcane photo. You can try the camera again.'
      : 'Camera access is turned off. Open device settings to allow CaneGuard to use the camera.',
  pickScanImage: jest.fn(),
}));

const mockDispatch = jest.fn<void, [ScanSessionAction]>();
const mockRouterDismissTo = router.dismissTo as jest.Mock;
const mockRouterPush = router.push as jest.Mock;
const mockPreprocessImage = preprocessImage as jest.MockedFunction<typeof preprocessImage>;
const mockRunInference = runInference as jest.MockedFunction<typeof runInference>;
const mockUseCaneGuardModel = jest.mocked(useCaneGuardModel);
const mockPickScanImage = jest.mocked(pickScanImage);
const mockModelRun = jest.fn<Promise<ArrayBuffer[]>, [ArrayBuffer[]]>();
const successfulPreprocessingResult = {
  processedUri: 'file:///processed.jpg',
  inputBuffer: new ArrayBuffer(602_112),
  width: 224,
  height: 224,
  channels: 3,
  dataType: 'float32' as const,
  minValue: 0,
  maxValue: 255,
  meanValue: 116,
  letterbox: {
    resizedWidth: 224,
    resizedHeight: 126,
    paddingLeft: 0,
    paddingTop: 49,
  },
  qualityAssessment: {
    warnings: [],
    meanLuminance: 118,
    luminanceStandardDeviation: 42,
  },
  preprocessMs: 42,
};
const successfulInferenceResult = {
  predictedLabel: 'rust' as const,
  confidence: 0.8,
  scores: [
    { label: 'rust' as const, score: 0.8 },
    { label: 'mosaic' as const, score: 0.15 },
    { label: 'healthy' as const, score: 0.05 },
    { label: 'smut' as const, score: 0 },
  ],
  timings: {
    preprocessMs: 42,
    inferenceMs: 18,
    totalMs: 60,
  },
  modelVersion: 'v1.0-mobilenetv2',
};

const selectedState: ScanSessionState = {
  ...initialScanSessionState,
  sourceUri: 'content://sugarcane/selected-leaf',
  sourceWidth: 1920,
  sourceHeight: 1080,
  sourceType: 'gallery',
  status: 'image-selected',
};

async function renderPreview(initialState: ScanSessionState) {
  function PreviewHarness() {
    const [state, dispatch] = useReducer(
      (current: ScanSessionState, action: ScanSessionAction) => {
        mockDispatch(action);
        return scanSessionReducer(current, action);
      },
      initialState,
    );

    return (
      <ScanSessionContext.Provider value={{ state, dispatch }}>
        <ImagePreviewScreen />
      </ScanSessionContext.Provider>
    );
  }

  return render(<PreviewHarness />);
}

describe('ImagePreviewScreen', () => {
  beforeEach(() => {
    mockPreprocessImage.mockResolvedValue(successfulPreprocessingResult);
    mockRunInference.mockResolvedValue(successfulInferenceResult);
    mockUseCaneGuardModel.mockReturnValue({
      start: jest.fn(),
      retry: jest.fn(),
      state: 'loaded',
      model: {} as never,
      run: mockModelRun,
      errorKind: null,
      error: null,
    });
  });

  it('shows a clear recovery state when no image exists', async () => {
    await renderPreview(initialScanSessionState);

    expect(screen.getByText('No image selected')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Choose a gallery image or capture a photo before opening the preview.',
      ),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Return to scan image choices'));

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET_SCAN' });
    expect(mockRouterDismissTo).toHaveBeenCalledWith('/scan');
  });

  it('displays the exact selected image, source, and dimensions', async () => {
    await renderPreview(selectedState);

    expect(screen.getByTestId('scan.preview-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('scan.analyze-image')).toBeOnTheScreen();
    expect(screen.getByLabelText('Selected sugarcane image from gallery')).toHaveProp('source', {
      uri: 'content://sugarcane/selected-leaf',
    });
    expect(screen.getByText('Gallery')).toBeOnTheScreen();
    expect(screen.getByText('1920 × 1080 pixels')).toBeOnTheScreen();
    expect(screen.getByLabelText('Analyze selected image')).toBeDisabled();
    expect(
      screen.getByText(
        'Analysis stays on this screen until the check succeeds.',
      ),
    ).toBeOnTheScreen();
  });

  it('preprocesses, runs inference once, stores the result, and continues', async () => {
    let completePreprocessing:
      | ((result: typeof successfulPreprocessingResult) => void)
      | undefined;
    let completeInference: ((result: typeof successfulInferenceResult) => void) | undefined;
    mockPreprocessImage.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          completePreprocessing = resolve;
        }),
    );
    mockRunInference.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          completeInference = resolve;
        }),
    );
    await renderPreview(selectedState);

    await fireEvent(screen.getByLabelText('Selected sugarcane image from gallery'), 'load');
    await fireEvent.press(screen.getByLabelText('Analyze selected image'));

    expect(screen.getByLabelText('Image preparation in progress')).toBeDisabled();
    expect(screen.getByText('Preparing image…')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Image preparation in progress'));
    expect(mockPreprocessImage).toHaveBeenCalledTimes(1);
    completePreprocessing?.(successfulPreprocessingResult);

    await waitFor(() => {
      expect(mockPreprocessImage).toHaveBeenCalledTimes(1);
      expect(mockPreprocessImage).toHaveBeenCalledWith(
        'content://sugarcane/selected-leaf',
        { width: 1920, height: 1080 },
      );
      expect(mockRunInference).toHaveBeenCalledWith(
        expect.objectContaining({ state: 'loaded' }),
        successfulPreprocessingResult.inputBuffer,
        42,
      );
    });

    expect(screen.queryByText('Model input ready')).not.toBeOnTheScreen();
    expect(screen.queryByText('Saved image details')).not.toBeOnTheScreen();
    expect(screen.getByText('Checking image…')).toBeOnTheScreen();

    completeInference?.(successfulInferenceResult);
    await waitFor(() => {
      expect(
        screen
          .getAllByLabelText('Preparing analysis result')
          .some((element) => element.props.accessibilityState?.disabled),
      ).toBe(true);
      expect(screen.getByText('Preparing result…')).toBeOnTheScreen();
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Image analysis complete')).toBeDisabled();
      expect(
        screen.getByText(
          'Analysis complete. Continuing to the symptom checklist…',
        ),
      ).toBeOnTheScreen();
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/symptom-checklist');
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'START_INFERENCE' });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'START_RESULT_PREPARATION',
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'COMPLETE_INFERENCE',
      payload: successfulInferenceResult,
    });
  });

  it('keeps Analyze disabled until the model is loaded', async () => {
    mockUseCaneGuardModel.mockReturnValue({
      start: jest.fn(),
      retry: jest.fn(),
      state: 'loading',
      model: undefined,
      run: mockModelRun,
      errorKind: null,
      error: null,
    });
    await renderPreview(selectedState);

    await fireEvent(screen.getByLabelText('Selected sugarcane image from gallery'), 'load');

    expect(screen.getByLabelText('Getting ready')).toBeDisabled();
    expect(screen.getByText('Getting ready before analysis…')).toBeOnTheScreen();
    expect(mockPreprocessImage).not.toHaveBeenCalled();
  });

  it('shows a recoverable preprocessing failure and allows another attempt', async () => {
    mockPreprocessImage.mockRejectedValueOnce(
      new PreprocessingError('jpeg-decode-failed', 'decode failed'),
    );
    await renderPreview(selectedState);

    await fireEvent(screen.getByLabelText('Selected sugarcane image from gallery'), 'load');
    await fireEvent.press(screen.getByLabelText('Analyze selected image'));

    await waitFor(() => {
      expect(
        screen.getByText(
          'The resized image could not be decoded correctly. Please replace it and try again.',
        ),
      ).toBeOnTheScreen();
    });

    expect(screen.getByLabelText('Analyze selected image')).toBeEnabled();
    expect(screen.queryByText('Model input ready')).not.toBeOnTheScreen();
  });

  it('shows a recoverable inference failure and allows another attempt', async () => {
    mockRunInference.mockRejectedValueOnce(
      new InferenceError('MODEL_RUN_FAILED', 'native failure'),
    );
    await renderPreview(selectedState);

    await fireEvent(screen.getByLabelText('Selected sugarcane image from gallery'), 'load');
    await fireEvent.press(screen.getByLabelText('Analyze selected image'));

    await waitFor(() => {
      expect(
        screen.getByText('The on-device analysis could not finish. Please try again.'),
      ).toBeOnTheScreen();
    });

    expect(screen.getByLabelText('Analyze selected image')).toBeEnabled();
    expect(mockRouterPush).not.toHaveBeenCalledWith('/symptom-checklist');
  });

  it('does not write a stale error after leaving during preprocessing', async () => {
    let failPreprocessing: ((error: Error) => void) | undefined;
    mockPreprocessImage.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          failPreprocessing = reject;
        }),
    );
    const rendered = await renderPreview(selectedState);

    await fireEvent(
      screen.getByLabelText('Selected sugarcane image from gallery'),
      'load',
    );
    await fireEvent.press(screen.getByLabelText('Analyze selected image'));
    rendered.unmount();

    failPreprocessing?.(new Error('late native failure'));
    await Promise.resolve();
    await Promise.resolve();

    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_ERROR' }),
    );
  });

  it('offers the camera and gallery directly for replacement', async () => {
    await renderPreview(selectedState);

    await fireEvent.press(screen.getByLabelText('Show Retake / Replace image'));

    expect(screen.getByLabelText('Take another photo with the camera')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Choose another image from the gallery'),
    ).toBeOnTheScreen();
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'RESET_SCAN' });
    expect(
      screen.getByLabelText('Selected sugarcane image from gallery'),
    ).toBeOnTheScreen();
  });

  it('keeps the current image and result when replacement is cancelled', async () => {
    mockPickScanImage.mockResolvedValueOnce({ kind: 'canceled' });
    await renderPreview(selectedState);

    await fireEvent.press(screen.getByLabelText('Show Retake / Replace image'));
    await fireEvent.press(
      screen.getByLabelText('Choose another image from the gallery'),
    );

    expect(mockPickScanImage).toHaveBeenCalledWith('gallery');
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SELECT_IMAGE' }),
    );
    expect(
      screen.getByLabelText('Selected sugarcane image from gallery'),
    ).toBeOnTheScreen();
  });

  it('keeps the current image when replacement permission is denied', async () => {
    mockPickScanImage.mockResolvedValueOnce({
      canAskAgain: false,
      kind: 'permission-denied',
    });
    await renderPreview(selectedState);

    await fireEvent.press(screen.getByLabelText('Show Retake / Replace image'));
    await fireEvent.press(screen.getByLabelText('Take another photo with the camera'));

    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SELECT_IMAGE' }),
    );
    expect(
      screen.getByTestId('image-preview.replacement-notice'),
    ).toHaveTextContent(/Camera access is turned off/);
    expect(
      screen.getByLabelText('Selected sugarcane image from gallery'),
    ).toBeOnTheScreen();
  });

  it('replaces the image only after a new selection is accepted', async () => {
    mockPickScanImage.mockResolvedValueOnce({
      image: {
        sourceHeight: 900,
        sourceType: 'gallery',
        sourceUri: 'file:///replacement.jpg',
        sourceWidth: 1200,
      },
      kind: 'selected',
    });
    await renderPreview(selectedState);

    await fireEvent.press(screen.getByLabelText('Show Retake / Replace image'));
    await fireEvent.press(
      screen.getByLabelText('Choose another image from the gallery'),
    );

    expect(mockDispatch).toHaveBeenCalledWith({
      payload: {
        sourceHeight: 900,
        sourceType: 'gallery',
        sourceUri: 'file:///replacement.jpg',
        sourceWidth: 1200,
      },
      type: 'SELECT_IMAGE',
    });
    expect(
      screen.getByTestId('image-preview.replacement-notice'),
    ).toHaveTextContent(/The previous analysis result and symptom answers were cleared/);
    expect(mockRouterDismissTo).not.toHaveBeenCalled();
  });

  it('clears the session when starting a completely new scan', async () => {
    await renderPreview(selectedState);

    await fireEvent.press(screen.getByLabelText('Clear this image and start a new scan'));

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET_SCAN' });
    expect(mockRouterDismissTo).toHaveBeenCalledWith('/scan');
    expect(screen.getByText('No image selected')).toBeOnTheScreen();
  });

  it('handles image loading and display failure without crashing', async () => {
    await renderPreview(selectedState);

    const image = screen.getByLabelText('Selected sugarcane image from gallery');
    expect(screen.getByText('Loading image…')).toBeOnTheScreen();

    await fireEvent(image, 'load');
    expect(screen.queryByText('Loading image…')).not.toBeOnTheScreen();

    await fireEvent(image, 'error');
    expect(screen.getByText('Image preview unavailable')).toBeOnTheScreen();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_ERROR',
      payload: 'The selected image could not be displayed. Please replace it.',
    });
  });

  it('reports unavailable dimensions without inventing metadata', async () => {
    await renderPreview({
      ...selectedState,
      sourceWidth: null,
      sourceHeight: null,
      sourceType: 'camera',
    });

    expect(screen.getByText('Camera')).toBeOnTheScreen();
    expect(screen.getByText('Dimensions unavailable')).toBeOnTheScreen();
  });

  describe('cancel and return home', () => {
    it('opens cancel dialog from header close button', async () => {
      await renderPreview(selectedState);

      expect(screen.queryByTestId('image-preview.cancel-dialog')).not.toBeOnTheScreen();
      await fireEvent.press(screen.getByTestId('image-preview.header-close'));

      expect(screen.getByTestId('image-preview.cancel-dialog')).toBeOnTheScreen();
      expect(screen.getByText('Cancel scan?')).toBeOnTheScreen();
      expect(screen.getByText('Keep draft')).toBeOnTheScreen();
      expect(screen.getByText('Discard draft')).toBeOnTheScreen();
    });

    it('opens cancel dialog from on-screen Cancel button', async () => {
      await renderPreview(selectedState);

      expect(screen.queryByTestId('image-preview.cancel-dialog')).not.toBeOnTheScreen();
      await fireEvent.press(screen.getByTestId('image-preview.cancel'));

      expect(screen.getByTestId('image-preview.cancel-dialog')).toBeOnTheScreen();
    });

    it('routes home and preserves scan session when Keep draft is chosen', async () => {
      await renderPreview(selectedState);

      await fireEvent.press(screen.getByTestId('image-preview.cancel'));
      await fireEvent.press(screen.getByTestId('image-preview.cancel-dialog.cancel'));

      expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'RESET_SCAN' });
      expect(mockRouterDismissTo).toHaveBeenCalledWith('/home');
    });

    it('resets scan session and routes home when Discard draft is chosen', async () => {
      await renderPreview(selectedState);

      await fireEvent.press(screen.getByTestId('image-preview.cancel'));
      await fireEvent.press(screen.getByTestId('image-preview.cancel-dialog.confirm'));

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET_SCAN' });
      expect(mockRouterDismissTo).toHaveBeenCalledWith('/home');
    });
  });
});
