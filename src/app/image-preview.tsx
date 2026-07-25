import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useScanSession } from '@/features/detection/context/useScanSession';
import {
  getSessionStateErrorMessage,
  SessionStateError,
} from '@/features/detection/context/sessionErrors';
import { MODEL_INPUT } from '@/features/detection/constants/modelContract';
import {
  getPreprocessingErrorMessage,
} from '@/features/detection/preprocessing/preprocessingErrors';
import { preprocessImage } from '@/features/detection/preprocessing/preprocessImage';
import { getInferenceErrorMessage } from '@/features/detection/model/inferenceErrors';
import { runInference } from '@/features/detection/model/runInference';
import { useCaneGuardModel } from '@/features/detection/model/useCaneGuardModel';
import { useTheme } from '@/hooks/use-theme';

const RESULT_PREPARATION_FEEDBACK_MS = 120;

export default function ImagePreviewScreen() {
  const theme = useTheme();
  const { state, dispatch } = useScanSession();
  const modelState = useCaneGuardModel();
  const [isImageLoading, setIsImageLoading] = useState(Boolean(state.sourceUri));
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const analysisInFlight = useRef(false);
  const isMounted = useRef(true);
  const isPreprocessing = state.status === 'preprocessing';
  const isRunning = state.status === 'running';
  const isFinalizing = state.status === 'finalizing';
  const analysisComplete = state.status === 'completed';
  const preprocessingComplete = Boolean(state.processedUri);
  const isAnalysisActive = isPreprocessing || isRunning || isFinalizing;

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const returnToScan = () => {
    router.replace('/scan');
  };

  const startNewScan = () => {
    dispatch({ type: 'RESET_SCAN' });
    router.replace('/scan');
  };

  const analyzeImage = async () => {
    if (
      !state.sourceUri ||
      isPreprocessing ||
      isRunning ||
      isFinalizing ||
      analysisComplete ||
      modelState.state !== 'loaded' ||
      analysisInFlight.current
    ) {
      return;
    }

    analysisInFlight.current = true;
    dispatch({ type: 'START_PREPROCESSING' });
    let inferenceStarted = false;

    try {
      const preprocessingResult = await preprocessImage(state.sourceUri, {
        width: state.sourceWidth,
        height: state.sourceHeight,
      });

      if (!isMounted.current) {
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

      if (!isMounted.current) {
        return;
      }

      dispatch({ type: 'START_RESULT_PREPARATION' });
      await new Promise<void>((resolve) => {
        setTimeout(resolve, RESULT_PREPARATION_FEEDBACK_MS);
      });

      if (!isMounted.current) {
        return;
      }

      dispatch({
        type: 'COMPLETE_INFERENCE',
        payload: inferenceResult,
      });
      router.push('/symptom-checklist');
    } catch (error) {
      if (!isMounted.current) {
        return;
      }

      dispatch({
        type: 'SET_ERROR',
        payload: inferenceStarted
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
          <ScreenHeader title="Image Preview" />
          <View style={styles.recoveryContent}>
            <AppCard style={styles.recoveryCard}>
              <View style={[styles.recoveryIcon, { backgroundColor: theme.warningBg }]}>
                <Feather name="image" size={36} color={theme.warning} />
              </View>
              <Text accessibilityRole="header" style={[styles.recoveryTitle, { color: theme.text }]}>
                No image selected
              </Text>
              <Text style={[styles.recoveryText, { color: theme.textSecondary }]}>
                {getSessionStateErrorMessage(
                  new SessionStateError(
                    'SOURCE_IMAGE_MISSING',
                    'Image preview requires a selected source image.',
                  ),
                )}
              </Text>
              <AppButton onPress={startNewScan} accessibilityLabel="Return to scan image choices">
                Choose an Image
              </AppButton>
            </AppCard>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const dimensions =
    state.sourceWidth && state.sourceHeight
      ? `${state.sourceWidth} × ${state.sourceHeight} pixels`
      : 'Dimensions unavailable';
  const sourceLabel = state.sourceType === 'camera' ? 'Camera' : 'Gallery';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.root}>
        <ScreenHeader title="Image Preview" />

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
                  contentFit="contain"
                  transition={150}
                  accessibilityLabel={`Selected sugarcane image from ${sourceLabel.toLowerCase()}`}
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
                      payload: 'The selected image could not be displayed. Please replace it.',
                    });
                  }}
                  style={styles.previewImage}
                />

                {isImageLoading ? (
                  <View
                    accessibilityLiveRegion="polite"
                    style={[styles.imageOverlay, { backgroundColor: theme.surfaceMuted }]}>
                    <ActivityIndicator
                      accessibilityLabel="Loading selected image"
                      color={theme.primary}
                    />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                      Loading image…
                    </Text>
                  </View>
                ) : null}

                {imageLoadFailed ? (
                  <View
                    accessibilityLiveRegion="assertive"
                    style={[styles.imageOverlay, { backgroundColor: theme.dangerBg }]}>
                    <Feather name="alert-triangle" size={32} color={theme.danger} />
                    <Text style={[styles.loadingText, { color: theme.danger }]}>
                      Image preview unavailable
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.metadata}>
                <MetadataRow label="Source" value={sourceLabel} />
                <MetadataRow label="Size" value={dimensions} />
              </View>

              <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                CaneGuard will stretch this image to the model&apos;s exact 224 × 224 RGB input.
              </Text>

              {preprocessingComplete ? (
                <View
                  accessibilityLiveRegion="polite"
                  style={[styles.preprocessingStatus, { backgroundColor: theme.successBg }]}>
                  <Feather name="check-circle" size={20} color={theme.success} />
                  <View style={styles.preprocessingStatusCopy}>
                    <Text style={[styles.preprocessingStatusTitle, { color: theme.success }]}>
                      Model input ready
                    </Text>
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                      {MODEL_INPUT.shape[2]} × {MODEL_INPUT.shape[1]} RGB float32
                      {state.preprocessMs === null
                        ? ''
                        : ` · ${Math.round(state.preprocessMs)} ms`}
                    </Text>
                  </View>
                </View>
              ) : null}
            </AppCard>

            <View style={styles.actions}>
              <AppButton
                variant="secondary"
                onPress={returnToScan}
                accessibilityLabel="Return to scan and replace the selected image">
                Retake / Replace Image
              </AppButton>
              <AppButton
                disabled={
                  isImageLoading ||
                  imageLoadFailed ||
                  isPreprocessing ||
                  isRunning ||
                  isFinalizing ||
                  analysisComplete ||
                  modelState.state !== 'loaded'
                }
                onPress={() => {
                  void analyzeImage();
                }}
                leadingIcon="search"
                accessibilityLabel={
                  analysisComplete
                    ? 'Image analysis complete'
                    : isFinalizing
                      ? 'Preparing analysis result'
                    : isRunning
                      ? 'Analyzing image'
                    : isPreprocessing
                      ? 'Preprocessing image'
                      : modelState.state === 'loading'
                        ? 'Model loading'
                        : modelState.state === 'error'
                          ? 'Model unavailable'
                      : 'Analyze selected image'
                }>
                {isFinalizing
                  ? 'Preparing Result…'
                  : isRunning
                  ? 'Analyzing…'
                  : isPreprocessing
                    ? 'Preparing Image…'
                    : analysisComplete
                      ? 'Analysis Complete'
                      : 'Analyze'}
              </AppButton>
              {isAnalysisActive ? (
                <View accessibilityLiveRegion="polite" style={styles.progressRow}>
                  <ActivityIndicator
                    accessibilityLabel={
                      isFinalizing
                        ? 'Preparing analysis result'
                        : isRunning
                          ? 'Running on-device model'
                          : 'Preparing image for model'
                    }
                    color={theme.primary}
                  />
                  <Text style={[styles.pipelineNotice, { color: theme.textSecondary }]}>
                    {isFinalizing
                      ? 'Preparing result…'
                      : isRunning
                        ? 'Running on-device model…'
                        : 'Preparing image…'}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.pipelineNotice, { color: theme.textSecondary }]}>
                  {modelState.state === 'loading'
                    ? 'Loading the on-device model before analysis…'
                    : modelState.state === 'error'
                      ? getInferenceErrorMessage(modelState.error)
                      : analysisComplete
                        ? 'Analysis complete. Continuing to the symptom checklist…'
                        : preprocessingComplete
                          ? 'The model input is ready. Retry analysis to continue.'
                          : 'Analysis stays on this screen until preprocessing and inference succeed.'}
                </Text>
              )}
              {state.errorMessage && !imageLoadFailed ? (
                <Text
                  accessibilityLiveRegion="assertive"
                  style={[styles.errorText, { color: theme.danger }]}>
                  {state.errorMessage}
                </Text>
              ) : null}
              <AppButton
                variant="text"
                onPress={startNewScan}
                accessibilityLabel="Clear this image and start a new scan">
                Start New Scan
              </AppButton>
            </View>
          </View>
        </ScrollView>
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
  preprocessingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  preprocessingStatusCopy: {
    flex: 1,
    gap: 2,
  },
  preprocessingStatusTitle: {
    ...Typography.label,
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
