import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

import {
  readPickerOutcome,
  type PickerOutcome,
} from '@/features/detection/imagePicker/readPickerOutcome';
import type { ScanSourceType } from '@/features/detection/types';

const PENDING_PICKER_SOURCE_KEY = '@caneguard/model-v0/pending-picker-source';

export const SCAN_IMAGE_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: false,
  allowsMultipleSelection: false,
  selectionLimit: 1,
  base64: false,
  exif: false,
  quality: 1,
};

export type ScanPickOutcome =
  | PickerOutcome
  | { kind: 'permission-denied'; canAskAgain: boolean };

/** Records the picker source so an Android process kill can label the result. */
export async function rememberPendingPickerSource(sourceType: ScanSourceType) {
  try {
    await AsyncStorage.setItem(PENDING_PICKER_SOURCE_KEY, sourceType);
  } catch {
    // Pending-result recovery is best effort. No image URI or user content is
    // persisted here.
  }
}

export async function takePendingPickerSource(): Promise<ScanSourceType | null> {
  try {
    const value = await AsyncStorage.getItem(PENDING_PICKER_SOURCE_KEY);
    await AsyncStorage.removeItem(PENDING_PICKER_SOURCE_KEY);
    return value === 'camera' || value === 'gallery' ? value : null;
  } catch {
    return null;
  }
}

export async function clearPendingPickerSource() {
  try {
    await AsyncStorage.removeItem(PENDING_PICKER_SOURCE_KEY);
  } catch {
    // The marker contains no user image data and can be safely overwritten on
    // the next request.
  }
}

/**
 * Opens the camera or gallery and normalizes the result into a scan selection
 * outcome. A cancellation or permission denial never replaces the current
 * selection; callers only dispatch `SELECT_IMAGE` for a `selected` outcome.
 */
export async function pickScanImage(
  sourceType: ScanSourceType,
): Promise<ScanPickOutcome> {
  if (sourceType === 'camera') {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        return {
          kind: 'permission-denied',
          canAskAgain: permission.canAskAgain,
        };
      }
    } catch {
      return {
        code: 'PICKER_FAILED',
        kind: 'error',
        message: 'The camera could not be opened. Please try again.',
        stage: 'image-acquisition',
      };
    }
  }

  await rememberPendingPickerSource(sourceType);
  try {
    const result =
      sourceType === 'camera'
        ? await ImagePicker.launchCameraAsync({
            ...SCAN_IMAGE_PICKER_OPTIONS,
            cameraType: ImagePicker.CameraType.back,
          })
        : await ImagePicker.launchImageLibraryAsync(SCAN_IMAGE_PICKER_OPTIONS);
    return readPickerOutcome(result, sourceType);
  } catch {
    return {
      code: 'PICKER_FAILED',
      kind: 'error',
      message:
        sourceType === 'camera'
          ? 'The camera could not be opened. Please try again.'
          : 'The gallery could not be opened. Please try again.',
      stage: 'image-acquisition',
    };
  } finally {
    await clearPendingPickerSource();
  }
}

export function getPermissionDeniedMessage(canAskAgain: boolean): string {
  return canAskAgain
    ? 'Camera access is needed to take a sugarcane photo. You can try the camera again.'
    : 'Camera access is turned off. Open device settings to allow CaneGuard to use the camera.';
}
