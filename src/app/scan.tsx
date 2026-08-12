import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { ComponentTokens, Layout, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useScanSession } from '@/features/detection/context/useScanSession';
import { readPickerOutcome } from '@/features/detection/imagePicker/readPickerOutcome';
import type { ScanSourceType } from '@/features/detection/types';
import { useTheme } from '@/hooks/use-theme';

const PENDING_PICKER_SOURCE_KEY = '@caneguard/model-v0/pending-picker-source';

const IMAGE_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: false,
  allowsMultipleSelection: false,
  selectionLimit: 1,
  base64: false,
  exif: false,
  quality: 1,
};

type ActiveOperation = ScanSourceType | 'recovery' | null;

async function rememberPendingSource(sourceType: ScanSourceType) {
  try {
    await AsyncStorage.setItem(PENDING_PICKER_SOURCE_KEY, sourceType);
  } catch {
    // Pending-result recovery is best effort. No image URI or user content is persisted here.
  }
}

async function takePendingSource() {
  try {
    const value = await AsyncStorage.getItem(PENDING_PICKER_SOURCE_KEY);
    await AsyncStorage.removeItem(PENDING_PICKER_SOURCE_KEY);
    return value === 'camera' || value === 'gallery' ? value : null;
  } catch {
    return null;
  }
}

async function clearPendingSource() {
  try {
    await AsyncStorage.removeItem(PENDING_PICKER_SOURCE_KEY);
  } catch {
    // The marker contains no user image data and can be safely overwritten on the next request.
  }
}

export default function ScanScreen() {
  const theme = useTheme();
  const { state, dispatch } = useScanSession();
  const [activeOperation, setActiveOperation] = useState<ActiveOperation>(
    Platform.OS === 'android' ? 'recovery' : null,
  );
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [cameraPermissionBlocked, setCameraPermissionBlocked] = useState(false);

  const applyPickerResult = useCallback(
    (
      result: ImagePicker.ImagePickerResult | ImagePicker.ImagePickerErrorResult,
      sourceType: ScanSourceType,
    ) => {
      const outcome = readPickerOutcome(result, sourceType);

      if (outcome.kind === 'error') {
        dispatch({ type: 'SET_ERROR', payload: outcome.message });
        return false;
      }

      if (outcome.kind === 'canceled') {
        return false;
      }

      dispatch({ type: 'SELECT_IMAGE', payload: outcome.image });
      return true;
    },
    [dispatch],
  );

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    let isMounted = true;

    const recoverPendingResult = async () => {
      try {
        const [pendingResult, pendingSource] = await Promise.all([
          ImagePicker.getPendingResultAsync(),
          takePendingSource(),
        ]);

        if (!isMounted) {
          return;
        }

        if (pendingResult && !pendingSource) {
          dispatch({
            type: 'SET_ERROR',
            payload:
              'An interrupted image selection was found, but its source could not be verified. Please choose the image again.',
          });
        } else if (pendingResult && pendingSource && applyPickerResult(pendingResult, pendingSource)) {
          router.push('/image-preview');
        }
      } catch {
        if (isMounted) {
          dispatch({
            type: 'SET_ERROR',
            payload: 'An interrupted image selection could not be recovered. Please try again.',
          });
        }
      } finally {
        if (isMounted) {
          setActiveOperation(null);
        }
      }
    };

    void recoverPendingResult();

    return () => {
      isMounted = false;
    };
  }, [applyPickerResult, dispatch]);

  const pickFromGallery = async () => {
    if (activeOperation) {
      return;
    }

    dispatch({ type: 'CLEAR_ERROR' });
    setCameraPermissionDenied(false);
    setActiveOperation('gallery');
    await rememberPendingSource('gallery');
    let shouldOpenPreview = false;

    try {
      const result = await ImagePicker.launchImageLibraryAsync(IMAGE_PICKER_OPTIONS);
      shouldOpenPreview = applyPickerResult(result, 'gallery');
    } catch {
      dispatch({
        type: 'SET_ERROR',
        payload: 'The gallery could not be opened. Please try again.',
      });
    } finally {
      await clearPendingSource();
      setActiveOperation(null);
    }

    if (shouldOpenPreview) {
      router.push('/image-preview');
    }
  };

  const captureWithCamera = async () => {
    if (activeOperation) {
      return;
    }

    dispatch({ type: 'CLEAR_ERROR' });
    setActiveOperation('camera');
    let shouldOpenPreview = false;

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        setCameraPermissionDenied(true);
        setCameraPermissionBlocked(!permission.canAskAgain);
        dispatch({
          type: 'SET_ERROR',
          payload: permission.canAskAgain
            ? 'Camera access is needed to take a sugarcane photo. You can try the camera again.'
            : 'Camera access is turned off. Open device settings to allow CaneGuard to use the camera.',
        });
        return;
      }

      setCameraPermissionDenied(false);
      setCameraPermissionBlocked(false);
      await rememberPendingSource('camera');
      const result = await ImagePicker.launchCameraAsync({
        ...IMAGE_PICKER_OPTIONS,
        cameraType: ImagePicker.CameraType.back,
      });
      shouldOpenPreview = applyPickerResult(result, 'camera');
    } catch {
      dispatch({
        type: 'SET_ERROR',
        payload: 'The camera could not be opened. Please try again.',
      });
    } finally {
      await clearPendingSource();
      setActiveOperation(null);
    }

    if (shouldOpenPreview) {
      router.push('/image-preview');
    }
  };

  const openDeviceSettings = () => {
    void Linking.openSettings().catch(() => {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Device settings could not be opened. Please open Settings and allow camera access.',
      });
    });
  };

  const startNewScan = () => {
    dispatch({ type: 'RESET_SCAN' });
    setCameraPermissionDenied(false);
    setCameraPermissionBlocked(false);
  };

  const isBusy = activeOperation !== null;
  const primaryLabel =
    activeOperation === 'gallery'
      ? 'Opening gallery…'
      : state.sourceUri
        ? 'Replace Image'
        : 'Upload Image';
  const cameraLabel = activeOperation === 'camera' ? 'Opening camera…' : 'Capture Photo';

  return (
    <SafeAreaView
      testID="scan.screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="Scan Sugarcane" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={[styles.intro, { color: theme.textSecondary }]}>
              Add a clear photo of the affected leaf, stalk, or central shoot.
            </Text>

            {state.errorMessage ? (
              <View
                accessibilityLiveRegion="assertive"
                style={[
                  styles.errorCard,
                  { backgroundColor: theme.dangerBg, borderColor: theme.danger },
                ]}>
                <Feather name="alert-circle" size={20} color={theme.danger} />
                <View style={styles.errorCopy}>
                  <Text style={[styles.errorTitle, { color: theme.danger }]}>Image not added</Text>
                  <Text style={[styles.errorText, { color: theme.text }]}>
                    {state.errorMessage}
                  </Text>
                  {cameraPermissionDenied ? (
                    <AppButton
                      variant="text"
                      onPress={cameraPermissionBlocked ? openDeviceSettings : captureWithCamera}
                      disabled={isBusy}
                      accessibilityLabel={
                        cameraPermissionBlocked ? 'Open device settings' : 'Try camera again'
                      }>
                      {cameraPermissionBlocked ? 'Open Settings' : 'Try Camera Again'}
                    </AppButton>
                  ) : null}
                </View>
              </View>
            ) : null}

            <View
              style={[
                styles.uploadCard,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}>
              <View
                style={[
                  styles.dropZone,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.primaryLight,
                  },
                  state.sourceUri && styles.selectedDropZone,
                ]}>
                {state.sourceUri ? (
                  <>
                    <ExpoImage
                      source={{ uri: state.sourceUri }}
                      contentFit="cover"
                      accessibilityLabel="Currently selected sugarcane image"
                      style={styles.selectedImage}
                    />
                    <Text style={[styles.uploadTitle, { color: theme.primaryDark }]}>
                      Image selected
                    </Text>
                    <Text style={[styles.uploadText, { color: theme.textSecondary }]}>
                      Choose another image below or return to its preview.
                    </Text>
                  </>
                ) : (
                  <>
                    <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceMuted }]}>
                      <Feather name="image" size={52} color={theme.primary} />
                    </View>
                    <Text style={[styles.uploadTitle, { color: theme.primaryDark }]}>
                      {activeOperation === 'recovery'
                        ? 'Checking for a selected image'
                        : 'No image added yet'}
                    </Text>
                    <Text style={[styles.uploadText, { color: theme.textSecondary }]}>
                      {activeOperation === 'recovery'
                        ? 'CaneGuard is checking whether Android interrupted the last picker.'
                        : 'Use a well-lit, focused photo for a more helpful result.'}
                    </Text>
                  </>
                )}
              </View>
            </View>

            <View style={styles.actions}>
              <AppButton
                testID="scan.choose-gallery"
                onPress={pickFromGallery}
                disabled={isBusy}
                leadingIcon="upload"
                trailingIcon="arrow-right"
                accessibilityLabel="Choose one image from the gallery">
                {primaryLabel}
              </AppButton>
              <AppButton
                variant="secondary"
                onPress={captureWithCamera}
                disabled={isBusy}
                leadingIcon="camera"
                trailingIcon="arrow-right"
                accessibilityLabel="Capture a photo with the camera">
                {cameraLabel}
              </AppButton>
              {state.sourceUri ? (
                <>
                  <AppButton
                    variant="secondary"
                    onPress={() => router.push('/image-preview')}
                    disabled={isBusy}
                    accessibilityLabel="Return to selected image preview">
                    View Selected Image
                  </AppButton>
                  <AppButton
                    variant="text"
                    onPress={startNewScan}
                    disabled={isBusy}
                    accessibilityLabel="Clear the current scan and start again">
                    Start New Scan
                  </AppButton>
                </>
              ) : null}
            </View>

            <View
              style={[
                styles.guide,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}>
              <View style={styles.guideHeading}>
                <View style={[styles.guideIcon, { backgroundColor: theme.warningBg }]}>
                  <Feather name="check-circle" size={18} color={theme.accentDark} />
                </View>
                <Text style={[styles.guideTitle, { color: theme.primaryDark }]}>
                  Photo quality guide
                </Text>
              </View>
              {[
                'Keep the symptom clear and focused',
                'Avoid dark, blurry, or distant images',
                'Capture the affected leaf, stalk, or shoot',
              ].map((item) => (
                <View key={item} style={styles.guideRow}>
                  <View style={[styles.bullet, { backgroundColor: theme.accentDark }]} />
                  <Text style={[styles.guideText, { color: theme.textSecondary }]}>{item}</Text>
                </View>
              ))}
            </View>

            <View
              style={[
                styles.disclaimer,
                { backgroundColor: theme.warningBg, borderColor: theme.accent },
              ]}>
              <Feather name="info" size={18} color={theme.accentDark} />
              <Text style={[styles.disclaimerText, { color: theme.text }]}>
                This result is for decision support only and should not replace expert validation.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingVertical: Spacing.xl,
    gap: Spacing.lg,
  },
  intro: {
    ...Typography.bodySmall,
  },
  errorCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  errorCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  errorTitle: {
    ...Typography.body,
    fontWeight: '800',
  },
  errorText: {
    ...Typography.bodySmall,
  },
  uploadCard: {
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.xl,
    ...Shadows.sm,
  },
  dropZone: {
    minHeight: 245,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    overflow: 'hidden',
  },
  selectedDropZone: {
    borderStyle: 'solid',
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radius.md,
  },
  uploadTitle: {
    ...Typography.subheading,
  },
  uploadText: {
    ...Typography.bodySmall,
    textAlign: 'center',
    maxWidth: 240,
  },
  actions: {
    gap: Spacing.md,
  },
  guide: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  guideHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  guideIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTitle: {
    ...Typography.body,
    fontWeight: '800',
  },
  guideRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  guideText: {
    ...Typography.bodySmall,
    flex: 1,
  },
  disclaimer: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  disclaimerText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 18,
  },
});
