import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useScanSession } from '@/features/detection/context/useScanSession';
import { MODEL_INPUT } from '@/features/detection/constants/modelContract';
import {
  getPreprocessingErrorMessage,
} from '@/features/detection/preprocessing/preprocessingErrors';
import { preprocessImage } from '@/features/detection/preprocessing/preprocessImage';
import { useTheme } from '@/hooks/use-theme';

export default function ImagePreviewScreen() {
  const theme = useTheme();
  const { state, dispatch } = useScanSession();
  const [isImageLoading, setIsImageLoading] = useState(Boolean(state.sourceUri));
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const preprocessingInFlight = useRef(false);
  const isPreprocessing = state.status === 'preprocessing';
  const preprocessingComplete = Boolean(state.processedUri);

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
      preprocessingComplete ||
      preprocessingInFlight.current
    ) {
      return;
    }

    preprocessingInFlight.current = true;
    dispatch({ type: 'START_PREPROCESSING' });

    try {
      const result = await preprocessImage(state.sourceUri);
      dispatch({
        type: 'COMPLETE_PREPROCESSING',
        payload: {
          processedUri: result.processedUri,
          preprocessMs: result.preprocessMs,
        },
      });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: getPreprocessingErrorMessage(error),
      });
    } finally {
      preprocessingInFlight.current = false;
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
                Choose a gallery image or capture a photo before opening the preview.
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
                  isImageLoading || imageLoadFailed || isPreprocessing || preprocessingComplete
                }
                onPress={() => {
                  void analyzeImage();
                }}
                leadingIcon="search"
                accessibilityLabel={
                  preprocessingComplete
                    ? 'Image preprocessing complete'
                    : isPreprocessing
                      ? 'Preprocessing image'
                      : 'Analyze selected image'
                }>
                {isPreprocessing
                  ? 'Preparing Image…'
                  : preprocessingComplete
                    ? 'Image Ready'
                    : 'Analyze'}
              </AppButton>
              {isPreprocessing ? (
                <View accessibilityLiveRegion="polite" style={styles.progressRow}>
                  <ActivityIndicator
                    accessibilityLabel="Preparing image for model"
                    color={theme.primary}
                  />
                  <Text style={[styles.pipelineNotice, { color: theme.textSecondary }]}>
                    Resizing and creating the model input…
                  </Text>
                </View>
              ) : (
                <Text style={[styles.pipelineNotice, { color: theme.textSecondary }]}>
                  {preprocessingComplete
                    ? 'Preprocessing passed. Model inference will be connected in the next phase.'
                    : 'Analysis stays on this screen until preprocessing succeeds.'}
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
