import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useReducer } from 'react';

import ImagePreviewScreen from '@/app/image-preview';
import { ScanSessionContext } from '@/features/detection/context/ScanSessionProvider';
import {
  initialScanSessionState,
  scanSessionReducer,
} from '@/features/detection/context/scanSessionReducer';
import type {
  ScanSessionAction,
  ScanSessionState,
} from '@/features/detection/types';

const mockDispatch = jest.fn<void, [ScanSessionAction]>();
const mockRouterReplace = router.replace as jest.Mock;

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
    expect(
      screen.getByLabelText('Analyze image, unavailable until preprocessing is implemented'),
    ).toBeDisabled();
    expect(
      screen.getByText(
        'Analysis is unavailable until the preprocessing pipeline is implemented. No result has been generated.',
      ),
    ).toBeOnTheScreen();
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
