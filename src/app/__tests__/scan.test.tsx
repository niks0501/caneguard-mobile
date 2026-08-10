import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useReducer } from 'react';
import { Linking, Platform } from 'react-native';

import ScanScreen from '@/app/scan';
import { ScanSessionContext } from '@/features/detection/context/ScanSessionProvider';
import {
  initialScanSessionState,
  scanSessionReducer,
} from '@/features/detection/context/scanSessionReducer';
import type {
  ScanSessionAction,
  ScanSessionState,
} from '@/features/detection/types';

jest.mock('expo-image-picker', () => ({
  CameraType: { back: 'back' },
  PermissionStatus: { DENIED: 'denied', GRANTED: 'granted', UNDETERMINED: 'undetermined' },
  getPendingResultAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));

const mockDispatch = jest.fn<void, [ScanSessionAction]>();
const mockGetPendingResult = jest.mocked(ImagePicker.getPendingResultAsync);
const mockLaunchCamera = jest.mocked(ImagePicker.launchCameraAsync);
const mockLaunchImageLibrary = jest.mocked(ImagePicker.launchImageLibraryAsync);
const mockRequestCameraPermission = jest.mocked(ImagePicker.requestCameraPermissionsAsync);
const mockRouterPush = router.push as jest.Mock;
const originalPlatformOS = Platform.OS;

function selectedImageResult(uri = 'content://sugarcane/leaf-1'): ImagePicker.ImagePickerResult {
  return {
    canceled: false,
    assets: [
      {
        uri,
        width: 1920,
        height: 1080,
        type: 'image',
        mimeType: 'image/jpeg',
      },
    ],
  };
}

async function renderScan(initialState: ScanSessionState = initialScanSessionState) {
  function ScanHarness() {
    const [state, dispatch] = useReducer(
      (current: ScanSessionState, action: ScanSessionAction) => {
        mockDispatch(action);
        return scanSessionReducer(current, action);
      },
      initialState,
    );

    return (
      <ScanSessionContext.Provider value={{ state, dispatch }}>
        <ScanScreen />
      </ScanSessionContext.Provider>
    );
  }

  return render(<ScanHarness />);
}

describe('ScanScreen', () => {
  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatformOS,
    });
    mockGetPendingResult.mockResolvedValue(null);
    mockLaunchImageLibrary.mockResolvedValue({ canceled: true, assets: null });
    mockLaunchCamera.mockResolvedValue({ canceled: true, assets: null });
    mockRequestCameraPermission.mockResolvedValue({
      canAskAgain: true,
      expires: 'never',
      granted: true,
      status: ImagePicker.PermissionStatus.GRANTED,
    });
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatformOS,
    });
  });

  it('selects one gallery image with the Phase 3 picker options and opens its preview', async () => {
    mockLaunchImageLibrary.mockResolvedValue(selectedImageResult());

    await renderScan();
    expect(screen.getByTestId('scan.screen')).toBeOnTheScreen();
    expect(screen.getByTestId('scan.choose-gallery')).toHaveProp(
      'accessibilityState',
      { disabled: false },
    );
    await fireEvent.press(screen.getByLabelText('Choose one image from the gallery'));

    expect(mockLaunchImageLibrary).toHaveBeenCalledWith({
      mediaTypes: ['images'],
      allowsEditing: false,
      allowsMultipleSelection: false,
      selectionLimit: 1,
      base64: false,
      exif: false,
      quality: 1,
    });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@caneguard/model-v0/pending-picker-source',
      'gallery',
    );
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SELECT_IMAGE',
      payload: {
        sourceUri: 'content://sugarcane/leaf-1',
        sourceWidth: 1920,
        sourceHeight: 1080,
        sourceType: 'gallery',
      },
    });
    expect(screen.getByLabelText('Currently selected sugarcane image')).toHaveProp('source', {
      uri: 'content://sugarcane/leaf-1',
    });
    expect(mockRouterPush).toHaveBeenCalledWith('/image-preview');
  });

  it('stays on the scan screen when gallery selection is canceled', async () => {
    await renderScan();
    await fireEvent.press(screen.getByLabelText('Choose one image from the gallery'));

    expect(mockLaunchImageLibrary).toHaveBeenCalledTimes(1);
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SELECT_IMAGE' }),
    );
    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(screen.getByText('No image added yet')).toBeOnTheScreen();
  });

  it('shows a recoverable error for an invalid gallery asset', async () => {
    mockLaunchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [],
    });

    await renderScan();
    await fireEvent.press(screen.getByLabelText('Choose one image from the gallery'));

    expect(
      screen.getByText(
        'That selection did not contain a usable local image. Please choose another photo.',
      ),
    ).toBeOnTheScreen();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('requests camera permission only after the user taps Capture Photo', async () => {
    mockLaunchCamera.mockResolvedValue(selectedImageResult('file:///camera/leaf.jpg'));

    await renderScan();

    expect(mockRequestCameraPermission).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('Capture a photo with the camera'));

    expect(mockRequestCameraPermission).toHaveBeenCalledTimes(1);
    expect(mockLaunchCamera).toHaveBeenCalledWith(
      expect.objectContaining({
        mediaTypes: ['images'],
        cameraType: ImagePicker.CameraType.back,
        quality: 1,
      }),
    );
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SELECT_IMAGE',
      payload: {
        sourceUri: 'file:///camera/leaf.jpg',
        sourceWidth: 1920,
        sourceHeight: 1080,
        sourceType: 'camera',
      },
    });
    expect(mockRouterPush).toHaveBeenCalledWith('/image-preview');
  });

  it('explains retryable camera denial and lets the user try again', async () => {
    mockRequestCameraPermission
      .mockResolvedValueOnce({
        canAskAgain: true,
        expires: 'never',
        granted: false,
        status: ImagePicker.PermissionStatus.DENIED,
      })
      .mockResolvedValueOnce({
        canAskAgain: true,
        expires: 'never',
        granted: true,
        status: ImagePicker.PermissionStatus.GRANTED,
      });

    await renderScan();
    await fireEvent.press(screen.getByLabelText('Capture a photo with the camera'));

    expect(
      screen.getByText(
        'Camera access is needed to take a sugarcane photo. You can try the camera again.',
      ),
    ).toBeOnTheScreen();
    expect(mockLaunchCamera).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByLabelText('Try camera again'));

    expect(mockRequestCameraPermission).toHaveBeenCalledTimes(2);
    expect(mockLaunchCamera).toHaveBeenCalledTimes(1);
  });

  it('offers device settings when camera permission is blocked', async () => {
    mockRequestCameraPermission.mockResolvedValue({
      canAskAgain: false,
      expires: 'never',
      granted: false,
      status: ImagePicker.PermissionStatus.DENIED,
    });
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();

    await renderScan();
    await fireEvent.press(screen.getByLabelText('Capture a photo with the camera'));
    await fireEvent.press(screen.getByLabelText('Open device settings'));

    expect(
      screen.getByText(
        'Camera access is turned off. Open device settings to allow CaneGuard to use the camera.',
      ),
    ).toBeOnTheScreen();
    expect(openSettings).toHaveBeenCalledTimes(1);
  });

  it('recovers an Android pending picker result and its recorded source', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
    mockGetPendingResult.mockResolvedValue(selectedImageResult('content://recovered/leaf'));
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('gallery');

    await renderScan();

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/image-preview');
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SELECT_IMAGE',
      payload: {
        sourceUri: 'content://recovered/leaf',
        sourceWidth: 1920,
        sourceHeight: 1080,
        sourceType: 'gallery',
      },
    });
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      '@caneguard/model-v0/pending-picker-source',
    );
  });

  it('clears all scan data when starting a new scan', async () => {
    await renderScan({
      ...initialScanSessionState,
      sourceUri: 'file:///selected.jpg',
      sourceWidth: 800,
      sourceHeight: 600,
      sourceType: 'camera',
      status: 'image-selected',
    });

    await fireEvent.press(screen.getByLabelText('Clear the current scan and start again'));

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET_SCAN' });
    expect(screen.getByText('No image added yet')).toBeOnTheScreen();
  });
});
