import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { Card } from '@/components/ui/Card';
import { ClampedText } from '@/components/ui/ClampedText';
import { DisclosureSection } from '@/components/ui/DisclosureSection';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pill } from '@/components/ui/Pill';
import { ReferenceMedia } from '@/components/ui/ReferenceMedia';
import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import {
  FIELD_GUIDE_APP_CAN_CHECK,
  FIELD_GUIDE_APP_CANNOT_CHECK,
  FIELD_GUIDE_APP_OBSERVATION_LABEL,
  FIELD_GUIDE_EDUCATION_DISCLAIMER,
  FIELD_GUIDE_NOT_FOUND_ACTION,
  FIELD_GUIDE_NOT_FOUND_MESSAGE,
  FIELD_GUIDE_NOT_FOUND_TITLE,
  FIELD_GUIDE_READ_FULL_GUIDE,
  FIELD_GUIDE_SCIENTIFIC_NAME_LABEL,
  FIELD_GUIDE_SECTION_DETAIL,
  FIELD_GUIDE_SECTION_IMPACT,
  FIELD_GUIDE_SECTION_MANAGEMENT,
  FIELD_GUIDE_SECTION_PREVENTION,
  FIELD_GUIDE_SECTION_SIGNS,
  FIELD_GUIDE_SECTION_SOURCES_AND_CREDITS,
  FIELD_GUIDE_SECTION_SOURCES_AND_CREDITS_SUMMARY,
  FIELD_GUIDE_SECTION_WHERE_TO_LOOK,
  FIELD_GUIDE_TITLE,
  fieldGuidePhotoOpenLabel,
} from '@/constants/copy';
import {
  catalogObservationalWording,
  findFieldGuideEntry,
} from '@/features/field-guide/constants/fieldGuideEntries';
import { FIELD_GUIDE_PILL_VARIANTS } from '@/features/field-guide/constants/fieldGuidePillVariants';
import { FieldGuidePhotoCredits } from '@/features/field-guide/components/FieldGuidePhotoCredits';
import { FieldGuidePendingValidationNotice } from '@/features/field-guide/components/FieldGuidePendingValidationNotice';
import { FieldGuideSources } from '@/features/field-guide/components/FieldGuideSources';
import type { FieldGuideEntry, FieldGuideImage } from '@/features/field-guide/domain/fieldGuideTypes';
import { useTheme } from '@/hooks/use-theme';

/**
 * The entry's bundled photos, in reading order. `FieldGuideImage.source` also
 * allows a downloaded local-file URI, which arrives in Phase 2 together with
 * the photo component's URI branch, so the honest runtime test for a bundled
 * asset is "not a string" (a Metro asset module is a number). Until then an
 * entry whose sources are all URIs renders the description-only frame, never a
 * broken image.
 */
function isBundledPhoto(image: FieldGuideImage): image is FieldGuideImage & { source: number } {
  return typeof image.source !== 'string';
}

function bundledPhotos(
  entry: FieldGuideEntry,
): readonly (FieldGuideImage & { source: number })[] {
  return entry.images.filter(isBundledPhoto);
}

/**
 * Field guide entry detail.
 *
 * Readable with no session, so it never reads from auth or an owner-scoped
 * store. An unknown route parameter renders an honest empty state instead of
 * throwing. Every photo is bundled, every citation is bundled, and the whole
 * page renders with no internet connection.
 */
export default function FieldGuideEntryScreen() {
  const theme = useTheme();
  const { entryId } = useLocalSearchParams<{ entryId?: string }>();
  const entry = findFieldGuideEntry(entryId);

  if (!entry) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.safe, { backgroundColor: theme.background }]}
        testID="field-guide.detail.screen">
        <BrandedScreenHeader title={FIELD_GUIDE_TITLE} variant="plain" />
        <View style={styles.notFoundWrap}>
          <EmptyState
            icon="search"
            message={FIELD_GUIDE_NOT_FOUND_MESSAGE}
            title={FIELD_GUIDE_NOT_FOUND_TITLE}
            action={{
              label: FIELD_GUIDE_NOT_FOUND_ACTION,
              onPress: () => router.replace('/field-guide'),
              icon: 'book-open',
              testID: 'field-guide.detail.not-found.action',
            }}
            testID="field-guide.detail.not-found"
          />
        </View>
      </SafeAreaView>
    );
  }

  const canCheck = entry.detectableByApp && entry.modelLabel !== null;
  const photos = bundledPhotos(entry);

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: theme.background }]}
      testID="field-guide.detail.screen">
      <View style={styles.root}>
        <BrandedScreenHeader title={entry.displayName} variant="plain" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Pill label={entry.shortName} variant={FIELD_GUIDE_PILL_VARIANTS[entry.id]} />
              <Text
                style={[styles.conditionLabel, { color: theme.textSecondary }]}
                testID={`field-guide.detail.${entry.id}.category`}>
                {entry.conditionLabel}
              </Text>
            </View>

            {entry.scientificName ? (
              <Text
                style={[styles.scientificName, { color: theme.textSecondary }]}
                testID={`field-guide.detail.${entry.id}.scientific-name`}>
                {`${FIELD_GUIDE_SCIENTIFIC_NAME_LABEL}: ${entry.scientificName}`}
              </Text>
            ) : null}

            <Text
              style={[styles.summary, { color: theme.text }]}
              testID={`field-guide.detail.${entry.id}.summary`}>
              {entry.summary}
            </Text>

            {photos.length > 0 ? (
              <View style={styles.photoList} testID={`field-guide.detail.${entry.id}.media`}>
                {photos.map((photo, index) => (
                  <GalleryPhoto
                    key={photo.assetKey}
                    caption={photo.caption}
                    onPress={() =>
                      router.push(`/field-guide/${entry.id}/photo?index=${index}`)
                    }
                    photo={photo.source}
                    testID={`field-guide.detail.${entry.id}.photo.${index + 1}`}
                  />
                ))}
              </View>
            ) : (
              <ReferenceMedia
                label={entry.displayName}
                patternDescription={entry.signs[0]}
                testID={`field-guide.detail.${entry.id}.media`}
              />
            )}

            <View
              style={[
                styles.callout,
                { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
              ]}>
              <Feather name="info" size={16} color={theme.primary} />
              <View style={styles.calloutBody}>
                <Text style={[styles.calloutText, { color: theme.textSecondary }]}>
                  {FIELD_GUIDE_EDUCATION_DISCLAIMER}
                </Text>
                <FieldGuidePendingValidationNotice
                  editorial={entry.editorial}
                  testID={`field-guide.detail.${entry.id}.pending-validation`}
                />
              </View>
            </View>

            <Card variant="flat">
              <Text
                style={[styles.sectionTitle, { color: theme.primaryDark }]}
                testID={`field-guide.detail.${entry.id}.app-check`}>
                {canCheck ? FIELD_GUIDE_APP_CAN_CHECK : FIELD_GUIDE_APP_CANNOT_CHECK}
              </Text>
              {canCheck && entry.modelLabel ? (
                <>
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                    {FIELD_GUIDE_APP_OBSERVATION_LABEL}
                  </Text>
                  <Text style={[styles.sectionBody, { color: theme.text }]}>
                    {catalogObservationalWording(entry.modelLabel)}
                  </Text>
                </>
              ) : null}
            </Card>

            <Card variant="flat">
              <Text
                style={[styles.sectionLabel, { color: theme.textSecondary }]}
                testID={`field-guide.detail.${entry.id}.signs`}>
                {FIELD_GUIDE_SECTION_SIGNS}
              </Text>
              <View style={styles.bulletList}>
                {entry.signs.map((sign) => (
                  <View key={sign} style={styles.bulletRow}>
                    <Feather name="circle" size={6} color={theme.primary} />
                    <Text style={[styles.sectionBody, { color: theme.text }]}>{sign}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <ReadingBlock
              label={FIELD_GUIDE_SECTION_WHERE_TO_LOOK}
              body={entry.whereToLook}
              testID={`field-guide.detail.${entry.id}.where-to-look`}
            />
            <ReadingBlock
              label={FIELD_GUIDE_SECTION_IMPACT}
              body={entry.impact}
              testID={`field-guide.detail.${entry.id}.impact`}
            />

            <Card variant="flat">
              <Text
                style={[styles.sectionLabel, { color: theme.textSecondary }]}
                testID={`field-guide.detail.${entry.id}.prevention`}>
                {FIELD_GUIDE_SECTION_PREVENTION}
              </Text>
              <View style={styles.bulletList}>
                {entry.prevention.map((action) => (
                  <View key={action} style={styles.bulletRow}>
                    <Feather name="shield" size={14} color={theme.primary} />
                    <Text style={[styles.sectionBody, { color: theme.text }]}>{action}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card variant="flat">
              <Text
                style={[styles.sectionLabel, { color: theme.textSecondary }]}
                testID={`field-guide.detail.${entry.id}.management`}>
                {FIELD_GUIDE_SECTION_MANAGEMENT}
              </Text>
              <View style={styles.bulletList}>
                {entry.management.map((action) => (
                  <View key={action} style={styles.bulletRow}>
                    <Feather name="check" size={14} color={theme.primary} />
                    <Text style={[styles.sectionBody, { color: theme.text }]}>{action}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card variant="flat">
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                {FIELD_GUIDE_SECTION_DETAIL}
              </Text>
              <ClampedText
                testID={`field-guide.detail.${entry.id}.detail`}
                text={entry.detail}
                style={[styles.sectionBody, { color: theme.text }]}
              />
            </Card>

            <AppButton
              accessibilityLabel={`${FIELD_GUIDE_READ_FULL_GUIDE}: ${entry.displayName}`}
              onPress={() => router.push(`/field-guide/${entry.id}/guide`)}
              testID={`field-guide.detail.${entry.id}.full-guide`}
              trailingIcon="arrow-right"
              variant="secondary">
              {FIELD_GUIDE_READ_FULL_GUIDE}
            </AppButton>

            <DisclosureSection
              summary={FIELD_GUIDE_SECTION_SOURCES_AND_CREDITS_SUMMARY}
              testID={`field-guide.detail.${entry.id}.sources`}
              title={FIELD_GUIDE_SECTION_SOURCES_AND_CREDITS}>
              <FieldGuideSources
                sourceIds={entry.sourceIds}
                testID={`field-guide.detail.${entry.id}.sources.list`}
              />
              <FieldGuidePhotoCredits
                images={entry.images}
                testID={`field-guide.detail.${entry.id}.credits`}
              />
            </DisclosureSection>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function ReadingBlock({ body, label, testID }: { body: string; label: string; testID: string }) {
  const theme = useTheme();

  return (
    <Card variant="flat">
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]} testID={testID}>
        {label}
      </Text>
      <Text style={[styles.sectionBody, { color: theme.text }]}>{body}</Text>
    </Card>
  );
}

function GalleryPhoto({
  caption,
  onPress,
  photo,
  testID,
}: {
  caption: string;
  onPress: () => void;
  photo: number;
  testID: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.photoFigure}>
      <Pressable
        accessibilityLabel={fieldGuidePhotoOpenLabel(caption)}
        accessibilityRole="imagebutton"
        onPress={onPress}
        style={({ pressed }) => [
          styles.photoFrame,
          { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
          pressed && styles.pressed,
        ]}
        testID={`${testID}.open`}>
        <Image
          accessibilityLabel={caption}
          cachePolicy="memory-disk"
          contentFit="contain"
          source={photo}
          style={styles.photoImage}
          testID={testID}
        />
        <View style={[styles.photoBadge, { backgroundColor: theme.surfaceElevated }]}>
          <Feather name="maximize-2" size={14} color={theme.text} />
        </View>
      </Pressable>
      <Text style={[styles.photoCaption, { color: theme.textSecondary }]}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1 },
  notFoundWrap: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingVertical: Spacing.xl,
  },
  scrollContent: { alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingVertical: Spacing.xl,
    gap: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  conditionLabel: { ...Typography.caption, flexShrink: 1, textAlign: 'right' },
  scientificName: { ...Typography.caption },
  summary: { ...Typography.body },
  callout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    padding: Spacing.md,
  },
  calloutText: { ...Typography.caption },
  calloutBody: { flex: 1 },
  sectionTitle: { ...Typography.subheading },
  sectionLabel: {
    ...Typography.label,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  sectionBody: { ...Typography.bodySmall, flex: 1 },
  photoList: { gap: Spacing.md },
  photoFigure: { gap: Spacing.xs },
  photoFrame: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImage: { width: '100%', height: '100%' },
  photoBadge: {
    position: 'absolute',
    right: Spacing.sm,
    bottom: Spacing.sm,
    borderRadius: Radius.full,
    padding: Spacing.xs,
  },
  photoCaption: { ...Typography.caption },
  bulletList: { gap: Spacing.sm },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  pressed: { opacity: 0.82 },
});
