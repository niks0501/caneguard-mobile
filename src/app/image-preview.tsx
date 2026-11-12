import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionDock, dockSecondaryButtonStyle } from '@/components/ui/ActionDock';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DisclosureSection } from '@/components/ui/DisclosureSection';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useScanDraft } from '@/features/detection/context/ScanSessionProvider';
import { useScanSession } from '@/features/detection/context/useScanSession';
import {
  getPermissionDeniedMessage,
  pickScanImage,
} from '@/features/detection/imagePicker/pickScanImage';
import {
  getSessionStateErrorMessage,
  SessionStateError,
} from '@/features/detection/context/sessionErrors';
import {
  getPreprocessingErrorMessage,
} from '@/features/detection/preprocessing/preprocessingErrors';
import { preprocessImage } from '@/features/detection/preprocessing/preprocessImage';
import { getInferenceErrorMessage } from '@/features/detection/model/inferenceErrors';
import { runInference } from '@/features/detection/model/runInference';
import { useCaneGuardModel } from '@/features/detection/model/useCaneGuardModel';
import { returnToTab } from '@/features/navigation/returnToTab';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/hooks/use-theme';
import { useFarmerCopy } from '@/providers/LanguagePreferenceProvider';

const RESULT_PREPARATION_FEEDBACK_MS = 120;

export default function ImagePreviewScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const isFarmer = user?.role === 'farmer';
  const farmerCopy = useFarmerCopy();
  const copy = farmerCopy.imagePreview;
  const scanCopy = farmerCopy.scanScreen;
  const { showToast } = useToast();
  const { state, dispatch } = useScanSession();
  const draft = useScanDraft();
  const modelState = useCaneGuardModel();
  const startModelLoad = modelState.start;
  // The model download and native load are deferred to this screen: it is the
  // only place that needs the runtime, so a cold start no longer pays for it.
  useEffect(() => {
    startModelLoad();
  }, [startModelLoad]);
  const [isImageLoading, setIsImageLoading] = useState(Boolean(state.sourceUri));
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [replacementNotice, setReplacementNotice] = useState<string | null>(null);
  const analysisInFlight = useRef(false);
  const isMounted = useRef(true);
  const isOwnerCurrentRef = useRef(draft.isOwnerCurrent);
  const isPreprocessing = state.status === 'preprocessing';
  const isRunning = state.status === 'running';
  const isFinalizing = state.status === 'finalizing';
  const analysisComplete = state.status === 'completed';
  const preprocessingComplete = Boolean(state.processedUri);
  const isAnalysisActive = isPreprocessing || isRunning || isFinalizing;
  const accessibleStatus = isFarmer
    ? {
        idle: copy.statusIdle,
        'image-selected': copy.statusImageSelected,
        preprocessing: copy.statusPreprocessing,
        running: copy.statusAnalyzing,
        finalizing: copy.statusPreparingResult,
        completed: copy.statusCompleted,
        error: copy.statusError,
      }[state.status]
    : state.status;
  const hasMountedPreview = useRef(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  // A previous preview may have been abandoned while native analysis was
  // still in flight. The provider deliberately does not checkpoint those
  // transient statuses, so make a newly mounted preview retryable instead of
  // showing an analysis spinner that can never finish.
  useEffect(() => {
    if (hasMountedPreview.current) {
      return;
    }
    hasMountedPreview.current = true;
    if (!analysisInFlight.current && isAnalysisActive) {
      dispatch({ type: 'CLEAR_ERROR' });
    }
  }, [dispatch, isAnalysisActive]);

  // An owner change abandons any in-flight analysis started by the previous
  // account, so the next inspector is never blocked by it.
  useEffect(() => {
    analysisInFlight.current = false;
    isOwnerCurrentRef.current = draft.isOwnerCurrent;
  }, [draft.isOwnerCurrent, draft.ownerIdentity]);

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const handleKeepDraft = async () => {
    setShowCancelConfirm(false);
    const saved = await draft.flushSavedDraft();
    if (!saved) {
      showToast(isFarmer ? scanCopy.draftNotSaved : 'Draft not saved on this device — try again', 'error');
      return;
    }
    showToast(isFarmer ? scanCopy.draftKept : 'Draft kept', 'info');
    returnToTab('/home');
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
    returnToTab('/home');
  };

  const startNewScan = () => {
    dispatch({ type: 'RESET_SCAN' });
    returnToTab('/scan');
  };

  const replaceImage = async (sourceType: 'camera' | 'gallery') => {
    if (replacing || analysisInFlight.current) {
      return;
    }
    const startingOwner = draft.ownerIdentity;
    setReplacing(true);
    setReplacementNotice(null);
    try {
      const outcome = await pickScanImage(sourceType, {
        followUpOf: state.followUpOf ?? null,
      });
      if (!isMounted.current || !isOwnerCurrentRef.current(startingOwner)) {
        return;
      }
      if (outcome.kind === 'selected') {
        analysisInFlight.current = false;
        dispatch({ type: 'SELECT_IMAGE', payload: outcome.image });
        setImageLoadFailed(false);
        setIsImageLoading(true);
        setReplacementNotice(
          isFarmer
            ? copy.replacementSelected
            : 'New image selected. The previous analysis result and symptom answers were cleared; the previous scan draft was replaced.',
        );
        showToast(isFarmer ? copy.imageReplaced : 'Image replaced', 'success');
      } else if (outcome.kind === 'permission-denied') {
        setReplacementNotice(
          isFarmer
            ? outcome.canAskAgain ? copy.permissionCanAsk : copy.permissionBlocked
            : getPermissionDeniedMessage(outcome.canAskAgain),
        );
      } else if (outcome.kind === 'error') {
        setReplacementNotice(
          isFarmer
            ? outcome.code === 'PICKER_FAILED'
              ? sourceType === 'camera' ? copy.pickerFailedCamera : copy.pickerFailedGallery
              : outcome.code === 'INVALID_IMAGE_URI'
                ? copy.invalidImage
                : copy.unsupportedImage
            : outcome.message,
        );
      }
      // A cancelled replacement keeps the current image and everything derived
      // from it untouched.
    } finally {
      if (isMounted.current) {
        setReplacing(false);
      }
    }
  };

  const analyzeImage = async () => {
    if (
      !state.sourceUri ||
      isPreprocessing ||
      isRunning ||
      isFinalizing ||
      modelState.state !== 'loaded' ||
      analysisInFlight.current
    ) {
      return;
    }

    const startingOwner = draft.ownerIdentity;
    const isCurrentWork = () =>
      isMounted.current && isOwnerCurrentRef.current(startingOwner);

    analysisInFlight.current = true;
    dispatch({ type: 'START_PREPROCESSING' });
    let inferenceStarted = false;

    try {
      const preprocessingResult = await preprocessImage(state.sourceUri, {
        width: state.sourceWidth,
        height: state.sourceHeight,
      });

      if (!isCurrentWork()) {
        return;
      }

      dispatch({
        type: 'COMPLETE_PREPROCESSING',
        payload: {
          processedUri: preprocessingResult.processedUri,
          preprocessMs: preprocessingResult.preprocessMs,
          qualityAssessment: preprocessingResult.qualityAssessment,
        },
      });
      dispatch({ type: 'START_INFERENCE' });
      inferenceStarted = true;

      const inferenceResult = await runInference(
        modelState,
        preprocessingResult.inputBuffer,
        preprocessingResult.preprocessMs,
      );

      if (!isCurrentWork()) {
        return;
      }

      dispatch({ type: 'START_RESULT_PREPARATION' });
      await new Promise<void>((resolve) => {
        setTimeout(resolve, RESULT_PREPARATION_FEEDBACK_MS);
      });

      if (!isCurrentWork()) {
        return;
      }

      dispatch({
        type: 'COMPLETE_INFERENCE',
        payload: inferenceResult,
      });
      router.push('/symptom-checklist');
    } catch (error) {
      if (!isCurrentWork()) {
        return;
      }

      dispatch({
        type: 'SET_ERROR',
        payload: isFarmer
          ? inferenceStarted ? copy.analysisFailed : copy.imagePreparationFailed
          : inferenceStarted
            ? getInferenceErrorMessage(error)
            : getPreprocessingErrorMessage(error),
      });
    } finally {
      analysisInFlight.current = false;
    }
  };

  if (!state.sourceUri || !state.sourceType) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.root}>
          <View
            testID="scan.session-status"
            accessibilityValue={{ text: accessibleStatus }}
          />
          <BrandedScreenHeader
            title={isFarmer ? copy.title : 'Image preview'}
            showClose
            onClosePress={handleCancel}
            closeTestID="image-preview.header-close"
            closeAccessibilityLabel={isFarmer ? farmerCopy.record.backLabel : undefined}
          />
          <View style={styles.recoveryContent}>
            <AppCard style={styles.recoveryCard}>
              <View style={[styles.recoveryIcon, { backgroundColor: theme.warningBg }]}>
                <Feather name="image" size={36} color={theme.warning} />
              </View>
              <Text accessibilityRole="header" style={[styles.recoveryTitle, { color: theme.text }]}>
                {isFarmer ? copy.noImageTitle : 'No image selected'}
              </Text>
              <Text style={[styles.recoveryText, { color: theme.textSecondary }]}>
                {isFarmer
                  ? copy.noImageMessage
                  : getSessionStateErrorMessage(
                      new SessionStateError(
                        'SOURCE_IMAGE_MISSING',
                        'Image preview requires a selected source image.',
                      ),
                    )}
              </Text>
              <AppButton
                onPress={startNewScan}
                accessibilityLabel={isFarmer ? copy.chooseImage : 'Return to scan image choices'}>
                {isFarmer ? copy.chooseImage : 'Choose an Image'}
              </AppButton>
            </AppCard>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const dimensions =
    state.sourceWidth && state.sourceHeight
      ? `${state.sourceWidth} × ${state.sourceHeight} ${isFarmer ? copy.pixels : 'pixels'}`
      : isFarmer ? copy.dimensionsUnavailable : 'Dimensions unavailable';
  const sourceLabel = state.sourceType === 'camera'
    ? isFarmer ? copy.camera : 'Camera'
    : isFarmer ? copy.gallery : 'Gallery';

  return (
    <SafeAreaView
      testID="scan.preview-screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top']}>
      <View style={styles.root}>
        <View
          testID="scan.session-status"
          accessibilityValue={{ text: accessibleStatus }}
        />
        <BrandedScreenHeader
          title={isFarmer ? copy.title : 'Image preview'}
          showClose
          onClosePress={handleCancel}
          closeTestID="image-preview.header-close"
          closeAccessibilityLabel={isFarmer ? farmerCopy.record.backLabel : undefined}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}>
          <View style={styles.content}>
            <AppCard style={styles.imageCard}>
              <View
                style={[
                  styles.imageFrame,
                  { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                ]}>
                <ExpoImage
                  source={{ uri: state.sourceUri }}
                  cachePolicy="memory-disk"
                  contentFit="contain"
                  transition={150}
                  accessibilityLabel={isFarmer
                    ? copy.imageAccessibility(sourceLabel)
                    : `Selected sugarcane image from ${sourceLabel.toLowerCase()}`}
                  onLoadStart={() => {
                    setIsImageLoading(true);
                    setImageLoadFailed(false);
                  }}
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => {
                    setIsImageLoading(false);
                    setImageLoadFailed(true);
                    dispatch({
                      type: 'SET_ERROR',
                      payload: isFarmer
                        ? copy.imageLoadFailed
                        : 'The selected image could not be displayed. Please replace it.'
                    });
                  }}
                  style={styles.previewImage}
                />

                {isImageLoading ? (
                  <View
                    accessibilityLiveRegion="polite"
                    style={[styles.imageOverlay, { backgroundColor: theme.surfaceMuted }]}>
                    <ActivityIndicator
                      accessibilityLabel={isFarmer ? copy.loadingImage : 'Loading selected image'}
                      color={theme.primary}
                    />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                      {isFarmer ? copy.loading : 'Loading image…'}
                    </Text>
                  </View>
                ) : null}

                {imageLoadFailed ? (
                  <View
                    accessibilityLiveRegion="assertive"
                    style={[styles.imageOverlay, { backgroundColor: theme.dangerBg }]}>
                    <Feather name="alert-triangle" size={32} color={theme.danger} />
                    <Text style={[styles.loadingText, { color: theme.danger }]}>
                      {isFarmer ? copy.imageUnavailable : 'Image preview unavailable'}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.metadata}>
                <MetadataRow label={isFarmer ? copy.source : 'Source'} value={sourceLabel} />
                <MetadataRow label={isFarmer ? copy.size : 'Size'} value={dimensions} />
              </View>

              <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                {isFarmer ? copy.checkingNotice : 'Your image will be checked on this device before analysis.'}
              </Text>
            </AppCard>

            <View style={styles.actions}>
              <DisclosureSection
                testID="image-preview.replace"
                title={isFarmer ? copy.replaceSection : 'Retake / Replace image'}
                accessibilityLabel={isFarmer
                  ? (expanded) => expanded ? copy.replaceHide : copy.replaceShow
                  : undefined}
                summary={isFarmer ? copy.replaceSummary : 'Camera or gallery'}
                expandedSummary={isFarmer ? copy.expandedSummary : undefined}>
                <Text style={[styles.pipelineNotice, { color: theme.textSecondary }]}>
                  {isFarmer
                    ? copy.replacementHelp
                    : 'The current image stays in place until you choose a replacement. A replacement clears the previous result and symptom answers.'}
                </Text>
                <AppButton
                  testID="image-preview.replace-camera"
                  variant="secondary"
                  disabled={replacing || isAnalysisActive}
                  onPress={() => void replaceImage('camera')}
                  leadingIcon="camera"
                  accessibilityLabel={isFarmer ? copy.replaceCameraAccessibility : 'Take another photo with the camera'}>
                  {isFarmer ? copy.replaceCamera : 'Take another photo'}
                </AppButton>
                <AppButton
                  testID="image-preview.replace-gallery"
                  variant="secondary"
                  disabled={replacing || isAnalysisActive}
                  onPress={() => void replaceImage('gallery')}
                  leadingIcon="image"
                  accessibilityLabel={isFarmer ? copy.replaceGalleryAccessibility : 'Choose another image from the gallery'}>
                  {isFarmer ? copy.replaceGallery : 'Choose another image'}
                </AppButton>
              </DisclosureSection>
              {replacementNotice ? (
                <Text
                  testID="image-preview.replacement-notice"
                  accessibilityLiveRegion="polite"
                  style={[styles.pipelineNotice, { color: theme.textSecondary }]}>
                  {replacementNotice}
                </Text>
              ) : null}
              {isAnalysisActive ? (
                <View accessibilityLiveRegion="polite" style={styles.progressRow}>
                  <ActivityIndicator
                    accessibilityLabel={
                      isFinalizing
                        ? isFarmer ? copy.preparingResult : 'Preparing analysis result'
                        : isRunning
                          ? isFarmer ? copy.checkingImage : 'Checking image'
                          : isFarmer ? copy.preparingImage : 'Preparing image'
                    }
                    color={theme.primary}
                  />
                  <Text style={[styles.pipelineNotice, { color: theme.textSecondary }]}>
                    {isFinalizing
                      ? isFarmer ? copy.preparingResult : 'Preparing result…'
                      : isRunning
                        ? isFarmer ? copy.checkingImage : 'Checking image…'
                        : isFarmer ? copy.preparingImage : 'Preparing image…'}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.pipelineNotice, { color: theme.textSecondary }]}>
                  {modelState.state === 'loading'
                    ? isFarmer ? copy.modelLoading : 'Getting ready before analysis…'
                    : modelState.state === 'error'
                      ? isFarmer ? copy.modelError : getInferenceErrorMessage(modelState.error)
                      : analysisComplete
                        ? isFarmer ? copy.analysisComplete : 'Analysis complete. Open the result to review it and save this scan.'
                        : preprocessingComplete
                          ? isFarmer ? copy.imageReady : 'The image is ready. Retry analysis to continue.'
                          : isFarmer ? copy.analysisWaiting : 'Analysis stays on this screen until the check succeeds.'}
                </Text>
              )}
              {state.errorMessage && !imageLoadFailed ? (
                <Text
                  accessibilityLiveRegion="assertive"
                  style={[styles.errorText, { color: theme.danger }]}>
                  {isFarmer ? copy.analysisFailed : state.errorMessage}
                </Text>
              ) : null}
              <AppButton
                testID="image-preview.cancel"
                variant="text"
                onPress={handleCancel}
                leadingIcon="x"
                accessibilityLabel={isFarmer ? copy.cancelAccessibility : 'Cancel scan and return home'}>
                {isFarmer ? copy.cancel : 'Cancel Scan'}
              </AppButton>
              <AppButton
                variant="text"
                onPress={startNewScan}
                accessibilityLabel={isFarmer ? scanCopy.clearAndStart : 'Clear this image and start a new scan'}>
                {isFarmer ? copy.startNew : 'Start New Scan'}
              </AppButton>
            </View>
          </View>
        </ScrollView>
        <ActionDock
          primary={
            analysisComplete ? (
                <AppButton
                  testID="image-preview.view-result"
                  onPress={() => router.push('/analysis-result')}
                  leadingIcon="arrow-right"
                  accessibilityLabel={isFarmer ? copy.viewResultAccessibility : 'View the analysis result'}>
                  {isFarmer ? copy.viewResult : 'View Analysis Result'}
                </AppButton>
              ) : (
                <AppButton
                  testID="scan.analyze-image"
                  busy={isPreprocessing || isRunning || isFinalizing}
                  disabled={
                    isImageLoading ||
                    imageLoadFailed ||
                    isPreprocessing ||
                    isRunning ||
                    isFinalizing ||
                    modelState.state !== 'loaded'
                  }
                  onPress={() => {
                    void analyzeImage();
                  }}
                  leadingIcon="search"
                  accessibilityLabel={
                    isFinalizing
                      ? isFarmer ? copy.preparingResult : 'Preparing analysis result'
                      : isRunning
                        ? isFarmer ? copy.analyzing : 'Analyzing image'
                        : isPreprocessing
                          ? isFarmer ? copy.prepareImage : 'Image preparation in progress'
                          : modelState.state === 'loading'
                            ? isFarmer ? copy.modelLoading : 'Getting ready'
                            : modelState.state === 'error'
                              ? isFarmer ? copy.modelError : 'Check unavailable'
                              : isFarmer ? copy.analyzeAccessibility : 'Analyze selected image'
                  }>
                  {isFinalizing
                    ? isFarmer ? copy.preparingResult : 'Preparing Result…'
                    : isRunning
                      ? isFarmer ? copy.analyzing : 'Analyzing…'
                      : isPreprocessing
                        ? isFarmer ? copy.prepareImage : 'Preparing Image…'
                        : isFarmer ? copy.analyze : 'Analyze'}
                </AppButton>
              )
          }
          secondary={
            modelState.state === 'error' && modelState.errorKind === 'load' ? (
                <AppButton
                  testID="image-preview.retry-model"
                  variant="secondary"
                  style={dockSecondaryButtonStyle}
                  onPress={modelState.retry}
                  disabled={replacing || isAnalysisActive}
                  leadingIcon="refresh-cw"
                  accessibilityLabel={isFarmer ? copy.retrySetupAccessibility : 'Retry analysis setup'}>
                  {isFarmer ? copy.retrySetup : 'Retry analysis setup'}
                </AppButton>
              ) : null
          }
        />
        <ConfirmDialog
          visible={showCancelConfirm}
          title={isFarmer ? copy.cancelTitle : 'Cancel scan?'}
          message={isFarmer ? copy.cancelMessage : 'Do you want to keep your in-progress scan draft or discard it before returning home?'}
          cancelLabel={isFarmer ? copy.keepDraft : 'Keep draft'}
          confirmLabel={isFarmer ? copy.discardDraft : 'Discard draft'}
          destructive
          overlay
          onRequestClose={() => setShowCancelConfirm(false)}
          onCancel={handleKeepDraft}
          onConfirm={handleDiscardDraft}
          testID="image-preview.cancel-dialog"
        />
      </View>
    </SafeAreaView>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={styles.metadataRow}>
      <Text style={[styles.metadataLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.metadataValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    gap: ComponentTokens.screen.sectionGap,
  },
  imageCard: {
    gap: Spacing.lg,
    padding: Spacing.lg,
  },
  imageFrame: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  metadata: {
    gap: Spacing.sm,
  },
  metadataRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  metadataLabel: {
    ...Typography.label,
    width: 64,
  },
  metadataValue: {
    ...Typography.bodySmall,
    flex: 1,
  },
  statusText: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.md,
  },
  pipelineNotice: {
    ...Typography.caption,
    textAlign: 'center',
  },
  progressRow: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  recoveryContent: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    alignSelf: 'center',
    justifyContent: 'center',
    padding: ComponentTokens.screen.horizontalPadding,
  },
  recoveryCard: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  recoveryIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoveryTitle: {
    ...Typography.heading,
    textAlign: 'center',
  },
  recoveryText: {
    ...Typography.body,
    textAlign: 'center',
  },
});
