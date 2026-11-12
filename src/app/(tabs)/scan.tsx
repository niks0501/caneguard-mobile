import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionDock, dockSecondaryButtonStyle } from '@/components/ui/ActionDock';
import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ComponentTokens, Layout, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useScanDraft } from '@/features/detection/context/ScanSessionProvider';
import { useScanSession } from '@/features/detection/context/useScanSession';
import {
  getPermissionDeniedMessage,
  pickScanImage,
  takePendingPickerSource,
} from '@/features/detection/imagePicker/pickScanImage';
import { readPickerOutcome } from '@/features/detection/imagePicker/readPickerOutcome';
import type { ScanSourceType } from '@/features/detection/types';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/hooks/use-theme';
import { formatTime } from '@/lib/formatters';
import { useFarmerCopy } from '@/providers/LanguagePreferenceProvider';

type ActiveOperation = ScanSourceType | 'recovery' | null;

function getScanDraftStatusLabel(
  status: 'idle' | 'saving' | 'saved' | 'failed',
  savedAt: string | null,
  copy?: ReturnType<typeof useFarmerCopy>['scanScreen'],
): string {
  switch (status) {
    case 'saving':
      return copy?.savingDraft ?? 'Saving on this device…';
    case 'saved':
      return savedAt
        ? copy?.savedDraftTimed(formatTime(savedAt)) ?? `Saved on this device · ${formatTime(savedAt)}. You can close CaneGuard and resume this scan.`
        : copy?.savedDraft ?? 'Saved on this device. You can close CaneGuard and resume this scan.';
    case 'failed':
      return copy?.failedDraft ?? 'Not saved on this device. Your photo is still open here — try replacing it or keep this screen open.';
    default:
      return copy?.idleDraft ?? 'Not saved on this device yet.';
  }
}


export default function ScanScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const isFarmer = user?.role === 'farmer';
  const farmerCopy = useFarmerCopy();
  const scanCopy = farmerCopy.scanScreen;
  const copy = isFarmer ? scanCopy : undefined;
  const { showToast } = useToast();
  const { state, dispatch } = useScanSession();
  const draft = useScanDraft();
  const draftOwner = draft.ownerIdentity;
  const [activeOperation, setActiveOperation] = useState<ActiveOperation>(
    Platform.OS === 'android' ? 'recovery' : null,
  );
  const isOwnerCurrentRef = useRef(draft.isOwnerCurrent);
  useEffect(() => {
    isOwnerCurrentRef.current = draft.isOwnerCurrent;
  }, [draft.isOwnerCurrent]);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [cameraPermissionBlocked, setCameraPermissionBlocked] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const applyPickerResult = useCallback(
    (
      result: ImagePicker.ImagePickerResult | ImagePicker.ImagePickerErrorResult,
      sourceType: ScanSourceType,
    ) => {
      const outcome = readPickerOutcome(result, sourceType);

      if (outcome.kind === 'error') {
        const message = !isFarmer
          ? outcome.message
          : outcome.code === 'PICKER_FAILED'
            ? sourceType === 'camera'
              ? scanCopy.cameraFailed
              : scanCopy.galleryFailed
            : outcome.code === 'INVALID_IMAGE_URI'
              ? scanCopy.invalidImage
              : scanCopy.unsupportedImage;
        dispatch({ type: 'SET_ERROR', payload: message });
        return false;
      }

      if (outcome.kind === 'canceled') {
        return false;
      }

      dispatch({ type: 'SELECT_IMAGE', payload: outcome.image });
      return true;
    },
    [dispatch, isFarmer, scanCopy],
  );

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    let isMounted = true;
    const startingOwner = draftOwner;

    const recoverPendingResult = async () => {
      try {
        const [pendingResult, pendingLaunch] = await Promise.all([
          ImagePicker.getPendingResultAsync(),
          takePendingPickerSource(),
        ]);

        // Never hand an interrupted selection to a different signed-in owner.
        if (!isMounted || !isOwnerCurrentRef.current(startingOwner)) {
          return;
        }

        if (pendingResult && !pendingLaunch) {
          dispatch({
            type: 'SET_ERROR',
            payload: isFarmer
              ? scanCopy.recoveryUnverified
              : 'An interrupted image selection was found, but its source could not be verified. Please choose the image again.',
          });
        } else if (pendingResult && pendingLaunch) {
          // The interrupted capture keeps the Check Again it was taken for.
          if (pendingLaunch.followUpOf) {
            dispatch({
              type: 'START_FOLLOW_UP',
              payload: { scanId: pendingLaunch.followUpOf },
            });
          }
          if (applyPickerResult(pendingResult, pendingLaunch.sourceType)) {
            router.push('/symptom-checklist');
          }
        }
      } catch {
        if (isMounted && isOwnerCurrentRef.current(startingOwner)) {
          dispatch({
            type: 'SET_ERROR',
            payload: isFarmer
              ? scanCopy.recoveryFailed
              : 'An interrupted image selection could not be recovered. Please try again.',
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
  }, [applyPickerResult, dispatch, draftOwner, isFarmer, scanCopy]);

  const chooseImage = async (sourceType: ScanSourceType) => {
    if (activeOperation) {
      return;
    }

    const startingOwner = draft.ownerIdentity;
    dispatch({ type: 'CLEAR_ERROR' });
    setCameraPermissionDenied(false);
    setCameraPermissionBlocked(false);
    setActiveOperation(sourceType);
    let shouldOpenPreview = false;

    const outcome = await pickScanImage(sourceType, {
      followUpOf: state.followUpOf ?? null,
    });

    try {
      // A delayed picker result must never populate another owner's session.
      if (!isOwnerCurrentRef.current(startingOwner)) {
        return;
      }
      if (outcome.kind === 'selected') {
        dispatch({ type: 'SELECT_IMAGE', payload: outcome.image });
        shouldOpenPreview = true;
      } else if (outcome.kind === 'permission-denied') {
        setCameraPermissionDenied(true);
        setCameraPermissionBlocked(!outcome.canAskAgain);
        dispatch({
          type: 'SET_ERROR',
          payload: isFarmer
            ? outcome.canAskAgain
              ? scanCopy.permissionCanAsk
              : scanCopy.permissionBlocked
            : getPermissionDeniedMessage(outcome.canAskAgain),
        });
      } else if (outcome.kind === 'error') {
        dispatch({
          type: 'SET_ERROR',
          payload: isFarmer
            ? outcome.code === 'PICKER_FAILED'
              ? sourceType === 'camera'
                ? scanCopy.cameraFailed
                : scanCopy.galleryFailed
              : outcome.code === 'INVALID_IMAGE_URI'
                ? scanCopy.invalidImage
                : scanCopy.unsupportedImage
            : outcome.message,
        });
      }
    } finally {
      setActiveOperation(null);
    }

    if (shouldOpenPreview) {
      router.push('/symptom-checklist');
    }
  };

  const captureWithCamera = () => {
    void chooseImage('camera');
  };

  const pickFromGallery = () => {
    void chooseImage('gallery');
  };

  const openDeviceSettings = () => {
    void Linking.openSettings().catch(() => {
      dispatch({
        type: 'SET_ERROR',
        payload: isFarmer
          ? scanCopy.deviceSettingsFailed
          : 'Device settings could not be opened. Please open Settings and allow camera access.',
      });
    });
  };

  const startNewScan = () => {
    dispatch({ type: 'RESET_SCAN' });
    setCameraPermissionDenied(false);
    setCameraPermissionBlocked(false);
  };

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  // Inside the tab navigator the href resolves to the already-mounted tab, so
  // `replace` is the tab-level switch here; `returnToTab` is a no-op in here
  // and is only for screens outside `(tabs)`.
  const handleKeepDraft = async () => {
    setShowCancelConfirm(false);
    const saved = await draft.flushSavedDraft();
    if (!saved) {
      showToast(isFarmer ? scanCopy.draftNotSaved : 'Draft not saved on this device — try again', 'error');
      return;
    }
    showToast(isFarmer ? scanCopy.draftKept : 'Draft kept', 'info');
    router.replace('/home');
  };

  const handleDiscardDraft = async () => {
    setShowCancelConfirm(false);
    if (draft.ownerIdentity) {
      const discarded = await draft.discardSavedDraft();
      if (!discarded) {
        showToast(isFarmer ? farmerCopy.result.discardFailed : 'Could not discard the saved scan — try again', 'error');
        return;
      }
    } else {
      dispatch({ type: 'RESET_SCAN' });
    }
    showToast(isFarmer ? scanCopy.draftDiscarded : 'Draft discarded', 'info');
    router.replace('/home');
  };

  const isBusy = activeOperation !== null;
  return (
    <SafeAreaView
      testID="scan.screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.root}>
        <BrandedScreenHeader
          title={isFarmer ? scanCopy.title : 'Scan sugarcane'}
          showClose
          onClosePress={handleCancel}
          closeTestID="scan.header-close"
          closeAccessibilityLabel={isFarmer ? farmerCopy.result.closeLabel : undefined}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={[styles.intro, { color: theme.textSecondary }]}>
              {isFarmer ? scanCopy.intro : 'Add a clear photo of the affected leaf, stalk, or central shoot.'}
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
                  <Text style={[styles.errorTitle, { color: theme.danger }]}>{isFarmer ? scanCopy.errorTitle : 'Image not added'}</Text>
                  <Text style={[styles.errorText, { color: theme.text }]}>
                    {state.errorMessage}
                  </Text>
                  {cameraPermissionDenied ? (
                    <AppButton
                      variant="text"
                      onPress={cameraPermissionBlocked ? openDeviceSettings : captureWithCamera}
                      disabled={isBusy}
                      accessibilityLabel={
                        cameraPermissionBlocked
                          ? isFarmer ? scanCopy.cameraSettings : 'Open device settings'
                          : isFarmer ? scanCopy.tryCamera : 'Try camera again'
                      }>
                      {cameraPermissionBlocked
                        ? isFarmer ? scanCopy.cameraSettings : 'Open Settings'
                        : isFarmer ? scanCopy.tryCamera : 'Try Camera Again'}
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
                      cachePolicy="memory-disk"
                      contentFit="cover"
                      accessibilityLabel={isFarmer ? scanCopy.selectedImage : 'Currently selected sugarcane image'}
                      style={styles.selectedImage}
                    />
                    <Text style={[styles.uploadTitle, { color: theme.primaryDark }]}>
                      {isFarmer ? scanCopy.imageSelected : 'Image selected'}
                    </Text>
                    <Text style={[styles.uploadText, { color: theme.textSecondary }]}>
                      {isFarmer ? scanCopy.selectedImageHelp : 'View the selected image or start a new scan.'}
                    </Text>
                  </>
                ) : (
                  <>
                    <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceMuted }]}>
                      <Feather name="image" size={52} color={theme.primary} />
                    </View>
                    <Text style={[styles.uploadTitle, { color: theme.primaryDark }]}>
                      {activeOperation === 'recovery'
                        ? isFarmer ? scanCopy.checkingImage : 'Checking for a selected image'
                        : isFarmer ? scanCopy.noImage : 'No image added yet'}
                    </Text>
                    <Text style={[styles.uploadText, { color: theme.textSecondary }]}>
                      {activeOperation === 'recovery'
                        ? isFarmer ? scanCopy.checkingRecovery : 'CaneGuard is checking whether Android interrupted the last picker.'
                        : isFarmer ? scanCopy.photoTip : 'Use a well-lit, focused photo for a more helpful result.'}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {state.sourceUri ? (
              <View style={styles.actions}>
                <View
                  testID="scan.draft-status"
                  style={[
                    styles.draftStatus,
                    {
                      backgroundColor:
                        draft.draftStatus === 'failed'
                          ? theme.dangerBg
                          : theme.surfaceMuted,
                      borderColor:
                        draft.draftStatus === 'failed' ? theme.danger : theme.border,
                    },
                  ]}>
                  <Feather
                    name={
                      draft.draftStatus === 'saved'
                        ? 'check-circle'
                        : draft.draftStatus === 'failed'
                          ? 'alert-triangle'
                          : 'clock'
                    }
                    size={16}
                    color={
                      draft.draftStatus === 'saved'
                        ? theme.success
                        : draft.draftStatus === 'failed'
                          ? theme.danger
                          : theme.textSecondary
                    }
                  />
                  <Text
                    accessibilityLiveRegion="polite"
                    style={[styles.draftStatusText, { color: theme.textSecondary }]}>
                    {getScanDraftStatusLabel(draft.draftStatus, draft.draftSavedAt, copy)}
                  </Text>
                </View>
                <AppButton
                  variant="secondary"
                  onPress={captureWithCamera}
                  busy={activeOperation === 'camera'}
                  disabled={isBusy}
                  leadingIcon="camera"
                  accessibilityLabel={isFarmer ? scanCopy.replaceImage : 'Take another photo to replace the selected image'}>
                  {activeOperation === 'camera'
                    ? isFarmer ? scanCopy.cameraBusy : 'Opening camera…'
                    : isFarmer ? scanCopy.takeAnother : 'Take Another Photo'}
                </AppButton>
                <AppButton
                  variant="secondary"
                  onPress={pickFromGallery}
                  busy={activeOperation === 'gallery'}
                  disabled={isBusy}
                  leadingIcon="image"
                  accessibilityLabel={isFarmer ? scanCopy.chooseAnother : 'Choose another image to replace the selected image'}>
                  {activeOperation === 'gallery'
                    ? isFarmer ? scanCopy.galleryBusy : 'Opening gallery…'
                    : isFarmer ? scanCopy.chooseAnother : 'Choose Another Image'}
                </AppButton>
                <AppButton
                  variant="text"
                  onPress={startNewScan}
                  disabled={isBusy}
                  leadingIcon="rotate-ccw"
                  accessibilityLabel={isFarmer ? scanCopy.clearAndStart : 'Clear the current scan and start again'}>
                  {isFarmer ? scanCopy.startNew : 'Start New Scan'}
                </AppButton>
              </View>
            ) : null}

            <View
              style={[
                styles.guide,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}>
              <View style={styles.guideHeading}>
                <View style={[styles.guideIcon, { backgroundColor: theme.warningBg }]}>
                  <Feather name="check-circle" size={18} color={theme.warning} />
                </View>
                <Text style={[styles.guideTitle, { color: theme.primaryDark }]}>
                  {isFarmer ? scanCopy.photoGuide : 'Photo quality guide'}
                </Text>
              </View>
              {[
                ...(isFarmer
                  ? [scanCopy.guideFocus, scanCopy.guideLighting, scanCopy.guideSubject]
                  : [
                      'Keep the symptom clear and focused',
                      'Avoid dark, blurry, or distant images',
                      'Capture the affected leaf, stalk, or shoot',
                    ]),
              ].map((item) => (
                <View key={item} style={styles.guideRow}>
                  <View style={[styles.bullet, { backgroundColor: theme.primaryLight }]} />
                  <Text style={[styles.guideText, { color: theme.textSecondary }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
        <ActionDock
          primary={
            state.sourceUri ? (
              <AppButton
                onPress={() => {
                  if (state.result && state.status === 'error') {
                    dispatch({ type: 'CLEAR_ERROR' });
                  }
                  router.push('/symptom-checklist');
                }}
                disabled={isBusy}
                trailingIcon="arrow-right"
                accessibilityLabel={
                  isFarmer ? scanCopy.viewSelected : 'Continue with the selected photo'
                }>
                {draft.draftStatus === 'saved'
                  ? isFarmer ? scanCopy.resumeSaved : 'Resume Saved Scan'
                  : isFarmer ? scanCopy.viewSelected : 'Continue with this photo'}
              </AppButton>
            ) : (
              <AppButton
                onPress={captureWithCamera}
                busy={activeOperation === 'camera'}
                disabled={isBusy}
                leadingIcon="camera"
                trailingIcon="arrow-right"
                accessibilityLabel={isFarmer ? scanCopy.captureAccessibility : 'Capture a photo with the camera'}>
                {activeOperation === 'camera'
                  ? isFarmer ? scanCopy.cameraBusy : 'Opening camera…'
                  : isFarmer ? scanCopy.takePhoto : 'Take photo'}
              </AppButton>
            )
          }
          secondary={
            state.sourceUri ? undefined : (
              <AppButton
                testID="scan.choose-gallery"
                variant="secondary"
                onPress={pickFromGallery}
                busy={activeOperation === 'gallery'}
                disabled={isBusy}
                leadingIcon="image"
                style={dockSecondaryButtonStyle}
                accessibilityLabel={isFarmer ? scanCopy.galleryAccessibility : 'Choose one image from the gallery'}>
                {activeOperation === 'gallery'
                  ? isFarmer ? scanCopy.galleryBusy : 'Opening gallery…'
                  : isFarmer ? scanCopy.chooseFromDevice : 'Choose from device'}
              </AppButton>
            )
          }
        />
        <ConfirmDialog
          visible={showCancelConfirm}
          title={isFarmer ? scanCopy.cancelTitle : 'Cancel scan?'}
          message={isFarmer ? scanCopy.cancelMessage : 'Do you want to keep your in-progress scan or discard it before returning home?'}
          cancelLabel={isFarmer ? scanCopy.keepDraft : 'Keep draft'}
          confirmLabel={isFarmer ? scanCopy.discardDraft : 'Discard draft'}
          destructive
          overlay
          onRequestClose={() => setShowCancelConfirm(false)}
          onCancel={handleKeepDraft}
          onConfirm={handleDiscardDraft}
          testID="scan.cancel-dialog"
        />
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
    borderRadius: Radius.lg,
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
  draftStatus: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  draftStatusText: {
    ...Typography.caption,
    flex: 1,
  },
  guide: {
    borderWidth: 1,
    borderRadius: Radius.lg,
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
});
