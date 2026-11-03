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

/** A picker launch, remembered durably so an Android process kill can recover it. */
export interface PendingPickerLaunch {
  /** Set when the launch belonged to a Check Again of that saved scan. */
  followUpOf: string | null;
  sourceType: ScanSourceType;
}

/**
 * Records the picker launch so an Android process kill can label the result and
 * keep its Check Again link. No image URI or note text is persisted here.
 */
export async function rememberPendingPickerSource(
  sourceType: ScanSourceType,
  followUpOf: string | null = null,
) {
  try {
    await AsyncStorage.setItem(
      PENDING_PICKER_SOURCE_KEY,
      JSON.stringify({ followUpOf, sourceType }),
    );
  } catch {
    // Pending-result recovery is best effort.
  }
}

export async function takePendingPickerSource(): Promise<PendingPickerLaunch | null> {
  try {
    const value = await AsyncStorage.getItem(PENDING_PICKER_SOURCE_KEY);
    await AsyncStorage.removeItem(PENDING_PICKER_SOURCE_KEY);
    return parsePendingPickerSource(value);
  } catch {
    return null;
  }
}

function parsePendingPickerSource(value: string | null): PendingPickerLaunch | null {
  if (value === 'camera' || value === 'gallery') {
    // A marker written before the link was recorded has no follow-up context.
    return { followUpOf: null, sourceType: value };
  }
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as Partial<PendingPickerLaunch> | null;
    if (!parsed || (parsed.sourceType !== 'camera' && parsed.sourceType !== 'gallery')) {
      return null;
    }
    return {
      followUpOf:
        typeof parsed.followUpOf === 'string' && parsed.followUpOf.length > 0
          ? parsed.followUpOf
          : null,
      sourceType: parsed.sourceType,
    };
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
  options: { followUpOf?: string | null } = {},
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

  await rememberPendingPickerSource(sourceType, options.followUpOf ?? null);
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
