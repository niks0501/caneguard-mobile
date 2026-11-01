import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { Spacing, Typography } from '@/constants/theme';
import { FIELD_GUIDE_PHOTO_VIEWER_RESET } from '@/constants/copy';
import { photoPanBounds } from '@/features/field-guide/domain/photoPanBounds';
import { useTheme } from '@/hooks/use-theme';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

export type ZoomablePhotoProps = {
  /** Bundled asset module; the viewer never loads a remote image. */
  source: number;
  /** Accessible label and the text the frame describes. */
  caption: string;
  testID?: string;
};

/**
 * Full-screen, uncropped photo with pinch-to-zoom and drag-to-pan.
 *
 * The image is always `contain`-fitted, so the first view shows the whole photo
 * at its true aspect ratio. Gesture updates run on the UI thread and only move
 * a single transform; the reset control is a plain button, so a reader who
 * cannot pinch still has a way back to the original view.
 *
 * Pan is clamped to the edges of the rendered, contain-fitted image from the
 * measured viewport and the photo's own dimensions, so the photo cannot be
 * dragged off screen and lost.
 */
export function ZoomablePhoto({ caption, source, testID }: ZoomablePhotoProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);
  const viewportWidth = useSharedValue(0);
  const viewportHeight = useSharedValue(0);
  const imageWidth = useSharedValue(0);
  const imageHeight = useSharedValue(0);

  const reset = () => {
    scale.value = MIN_SCALE;
    savedScale.value = MIN_SCALE;
    translateX.value = 0;
    translateY.value = 0;
    savedX.value = 0;
    savedY.value = 0;
  };

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      'worklet';
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale.value * event.scale));
      scale.value = next;
      const bounds = photoPanBounds(
        next,
        viewportWidth.value,
        viewportHeight.value,
        imageWidth.value,
        imageHeight.value,
      );
      translateX.value = Math.min(bounds.x, Math.max(-bounds.x, translateX.value));
      translateY.value = Math.min(bounds.y, Math.max(-bounds.y, translateY.value));
    })
    .onEnd(() => {
      'worklet';
      savedScale.value = scale.value;
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      'worklet';
      const bounds = photoPanBounds(
        scale.value,
        viewportWidth.value,
        viewportHeight.value,
        imageWidth.value,
        imageHeight.value,
      );
      translateX.value = Math.min(
        bounds.x,
        Math.max(-bounds.x, savedX.value + event.translationX),
      );
      translateY.value = Math.min(
        bounds.y,
        Math.max(-bounds.y, savedY.value + event.translationY),
      );
    })
    .onEnd(() => {
      'worklet';
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      if (scale.value > MIN_SCALE) {
        scale.value = MIN_SCALE;
        savedScale.value = MIN_SCALE;
        translateX.value = 0;
        translateY.value = 0;
        savedX.value = 0;
        savedY.value = 0;
      } else {
        scale.value = 2;
        savedScale.value = 2;
      }
    });

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
      <View
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          viewportWidth.value = width;
          viewportHeight.value = height;
        }}
        style={styles.viewport}
        testID={testID ? `${testID}.viewport` : undefined}>
        <View style={StyleSheet.absoluteFill} testID={testID}>
          <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
            <Image
              accessibilityLabel={caption}
              cachePolicy="memory-disk"
              contentFit="contain"
              onLoad={(event) => {
                imageWidth.value = event.source.width;
                imageHeight.value = event.source.height;
              }}
              source={source}
              style={styles.image}
            />
          </Animated.View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={FIELD_GUIDE_PHOTO_VIEWER_RESET}
          hitSlop={8}
          onPress={reset}
          style={({ pressed }) => [
            styles.resetButton,
            { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
            pressed && styles.pressed,
          ]}
          testID={testID ? `${testID}.reset` : undefined}>
          <Text style={[styles.resetLabel, { color: theme.text }]}>
            {FIELD_GUIDE_PHOTO_VIEWER_RESET}
          </Text>
        </Pressable>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  resetButton: {
    position: 'absolute',
    bottom: Spacing.lg,
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  resetLabel: { ...Typography.caption, fontWeight: '700' },
  pressed: { opacity: 0.74 },
});
