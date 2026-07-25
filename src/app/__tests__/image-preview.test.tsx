import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useReducer } from 'react';

import ImagePreviewScreen from '@/app/image-preview';
import { ScanSessionContext } from '@/features/detection/context/ScanSessionProvider';
import {
  initialScanSessionState,
  scanSessionReducer,
} from '@/features/detection/context/scanSessionReducer';
import { PreprocessingError } from '@/features/detection/preprocessing/preprocessingErrors';
import { preprocessImage } from '@/features/detection/preprocessing/preprocessImage';
import type {
  ScanSessionAction,
  ScanSessionState,
} from '@/features/detection/types';

jest.mock('@/features/detection/preprocessing/preprocessImage', () => ({
  preprocessImage: jest.fn(),
}));

const mockDispatch = jest.fn<void, [ScanSessionAction]>();
const mockRouterReplace = router.replace as jest.Mock;
const mockPreprocessImage = preprocessImage as jest.MockedFunction<typeof preprocessImage>;
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
  preprocessMs: 42,
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
    expect(mockRouterReplace).toHaveBeenCalledWith('/scan');
  });

  it('displays the exact selected image, source, and dimensions', async () => {
    await renderPreview(selectedState);

    expect(screen.getByLabelText('Selected sugarcane image from gallery')).toHaveProp('source', {
      uri: 'content://sugarcane/selected-leaf',
    });
    expect(screen.getByText('Gallery')).toBeOnTheScreen();
    expect(screen.getByText('1920 × 1080 pixels')).toBeOnTheScreen();
    expect(screen.getByLabelText('Analyze selected image')).toBeDisabled();
    expect(
      screen.getByText(
        'Analysis stays on this screen until preprocessing succeeds.',
      ),
    ).toBeOnTheScreen();
  });

  it('preprocesses once, stores the result, and stays on the preview screen', async () => {
    let completePreprocessing:
      | ((result: typeof successfulPreprocessingResult) => void)
      | undefined;
    mockPreprocessImage.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          completePreprocessing = resolve;
        }),
    );
    await renderPreview(selectedState);

    await fireEvent(screen.getByLabelText('Selected sugarcane image from gallery'), 'load');
    await fireEvent.press(screen.getByLabelText('Analyze selected image'));

    expect(screen.getByLabelText('Preprocessing image')).toBeDisabled();
    expect(screen.getByText('Resizing and creating the model input…')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Preprocessing image'));
    expect(mockPreprocessImage).toHaveBeenCalledTimes(1);
    completePreprocessing?.(successfulPreprocessingResult);

    await waitFor(() => {
      expect(mockPreprocessImage).toHaveBeenCalledTimes(1);
      expect(mockPreprocessImage).toHaveBeenCalledWith('content://sugarcane/selected-leaf');
      expect(screen.getByText('Model input ready')).toBeOnTheScreen();
    });

    expect(screen.getByText('224 × 224 RGB float32 · 42 ms')).toBeOnTheScreen();
    expect(screen.getByLabelText('Image preprocessing complete')).toBeDisabled();
    expect(
      screen.getByText(
        'Preprocessing passed. Model inference will be connected in the next phase.',
      ),
    ).toBeOnTheScreen();
    expect(mockRouterReplace).not.toHaveBeenCalledWith('/analysis-result');
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

  it('returns to scan without clearing the selected image for replacement', async () => {
    await renderPreview(selectedState);

    await fireEvent.press(
      screen.getByLabelText('Return to scan and replace the selected image'),
    );

    expect(mockRouterReplace).toHaveBeenCalledWith('/scan');
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'RESET_SCAN' });
    expect(screen.getByLabelText('Selected sugarcane image from gallery')).toBeOnTheScreen();
  });

  it('clears the session when starting a completely new scan', async () => {
    await renderPreview(selectedState);

    await fireEvent.press(screen.getByLabelText('Clear this image and start a new scan'));

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET_SCAN' });
    expect(mockRouterReplace).toHaveBeenCalledWith('/scan');
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
});
