import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import {
  FIELD_GUIDE_EDUCATION_DISCLAIMER,
  FIELD_GUIDE_NOT_FOUND_MESSAGE,
  FIELD_GUIDE_NOT_FOUND_TITLE,
  FIELD_GUIDE_PHOTO_VIEWER_CLOSE,
  FIELD_GUIDE_PHOTO_VIEWER_HINT,
  FIELD_GUIDE_PHOTO_VIEWER_MISSING_ACTION,
  FIELD_GUIDE_PHOTO_VIEWER_MISSING_MESSAGE,
  FIELD_GUIDE_PHOTO_VIEWER_MISSING_TITLE,
} from '@/constants/copy';
import { FieldGuidePhotoCredits } from '@/features/field-guide/components/FieldGuidePhotoCredits';
import { ZoomablePhoto } from '@/features/field-guide/components/ZoomablePhoto';
import { findFieldGuideEntry } from '@/features/field-guide/constants/fieldGuideEntries';
import type { FieldGuideImage } from '@/features/field-guide/domain/fieldGuideTypes';
import { useTheme } from '@/hooks/use-theme';

const PHOTO_BACKDROP = '#000000';

function isBundledPhoto(image: FieldGuideImage): image is FieldGuideImage & { source: number } {
  return typeof image.source !== 'string';
}

/**
 * Full-screen photo viewer.
 *
 * The photo opens uncropped at its true aspect ratio and can be pinched,
 * dragged and reset. Caption, credits and the educational note stay visible
 * below the photo, and the whole screen resolves from bundled assets, so it
 * works with no connection. An out-of-range index renders an honest empty
 * state rather than a broken image.
 */
export default function FieldGuidePhotoScreen() {
  const theme = useTheme();
  const { entryId, index } = useLocalSearchParams<{ entryId?: string; index?: string }>();
  const entry = findFieldGuideEntry(entryId);
  const photos = entry ? entry.images.filter(isBundledPhoto) : [];
  const parsedIndex = Number.parseInt(index ?? '0', 10);
  const photo = Number.isInteger(parsedIndex) ? photos[parsedIndex] : undefined;
  const backToEntry = () => router.replace(`/field-guide/${entry?.id ?? ''}`);

  if (!entry || !photo) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.safe, { backgroundColor: theme.background }]}
        testID="field-guide.photo.screen">
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="image"
            message={
              entry ? FIELD_GUIDE_PHOTO_VIEWER_MISSING_MESSAGE : FIELD_GUIDE_NOT_FOUND_MESSAGE
            }
            title={entry ? FIELD_GUIDE_PHOTO_VIEWER_MISSING_TITLE : FIELD_GUIDE_NOT_FOUND_TITLE}
            action={{
              label: FIELD_GUIDE_PHOTO_VIEWER_MISSING_ACTION,
              onPress: backToEntry,
              icon: 'arrow-left',
              testID: 'field-guide.photo.not-found.action',
            }}
            testID="field-guide.photo.not-found"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safe, { backgroundColor: PHOTO_BACKDROP }]}
      testID="field-guide.photo.screen">
      <View style={styles.header}>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {entry.displayName}
        </Text>
        <Pressable
          accessibilityLabel={FIELD_GUIDE_PHOTO_VIEWER_CLOSE}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : backToEntry())}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          testID="field-guide.photo.close">
          <Feather name="x" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <ZoomablePhoto
        caption={photo.caption}
        source={photo.source}
        testID="field-guide.photo.image"
      />

      <ScrollView
        contentContainerStyle={styles.footerContent}
        style={[styles.footer, { backgroundColor: theme.background }]}>
        <Text style={[styles.caption, { color: theme.text }]} testID="field-guide.photo.caption">
          {photo.caption}
        </Text>
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          {FIELD_GUIDE_PHOTO_VIEWER_HINT}
        </Text>
        <FieldGuidePhotoCredits
          images={[photo]}
          testID="field-guide.photo.credits"
        />
        <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>
          {FIELD_GUIDE_EDUCATION_DISCLAIMER}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingVertical: Spacing.sm,
  },
  headerTitle: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    flex: 1,
    fontWeight: '700',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    maxHeight: '38%',
  },
  footerContent: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  caption: { ...Typography.bodySmall, fontWeight: '800' },
  hint: { ...Typography.caption },
  disclaimer: { ...Typography.caption },
  emptyWrap: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingVertical: Spacing.xl,
  },
  pressed: { opacity: 0.7 },
});
