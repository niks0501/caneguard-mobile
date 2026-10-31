import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { Card } from '@/components/ui/Card';
import { DisclosureSection } from '@/components/ui/DisclosureSection';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pill, type PillVariant } from '@/components/ui/Pill';
import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import {
  FIELD_GUIDE_EDUCATION_DISCLAIMER,
  FIELD_GUIDE_GUIDE_SOURCES_TITLE,
  FIELD_GUIDE_GUIDE_TITLE,
  FIELD_GUIDE_NOT_FOUND_ACTION,
  FIELD_GUIDE_NOT_FOUND_MESSAGE,
  FIELD_GUIDE_NOT_FOUND_TITLE,
  FIELD_GUIDE_SECTION_SOURCES_AND_CREDITS,
  FIELD_GUIDE_SECTION_SOURCES_AND_CREDITS_SUMMARY,
  FIELD_GUIDE_TITLE,
} from '@/constants/copy';
import { FieldGuidePhotoCredits } from '@/features/field-guide/components/FieldGuidePhotoCredits';
import { FieldGuideSources } from '@/features/field-guide/components/FieldGuideSources';
import { findFieldGuideEntry } from '@/features/field-guide/constants/fieldGuideEntries';
import type { FieldGuideGuideSection } from '@/features/field-guide/domain/fieldGuideTypes';
import { useTheme } from '@/hooks/use-theme';

const PILL_VARIANTS: Record<string, PillVariant> = {
  healthy: 'healthy',
  mosaic: 'mosaic',
  rust: 'rust',
  smut: 'smut',
  rssi: 'warning',
};

/**
 * The full offline guide for one entry.
 *
 * Everything on this page — chapters, citations and credits — is bundled, so
 * "Read the full guide" works in a field with no signal. Original documents
 * are optional online reading; their absence never blocks the page.
 */
export default function FieldGuideGuideScreen() {
  const theme = useTheme();
  const { entryId } = useLocalSearchParams<{ entryId?: string }>();
  const entry = findFieldGuideEntry(entryId);

  if (!entry) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.safe, { backgroundColor: theme.background }]}
        testID="field-guide.guide.screen">
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
              testID: 'field-guide.guide.not-found.action',
            }}
            testID="field-guide.guide.not-found"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: theme.background }]}
      testID="field-guide.guide.screen">
      <View style={styles.root}>
        <BrandedScreenHeader
          subtitle={FIELD_GUIDE_GUIDE_TITLE}
          title={entry.displayName}
          variant="plain"
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Pill label={entry.shortName} variant={PILL_VARIANTS[entry.id] ?? 'default'} />
              <Text style={[styles.conditionLabel, { color: theme.textSecondary }]}>
                {entry.conditionLabel}
              </Text>
            </View>

            <View
              style={[
                styles.callout,
                { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
              ]}>
              <Feather name="info" size={16} color={theme.primary} />
              <Text
                style={[styles.calloutText, { color: theme.textSecondary }]}
                testID="field-guide.guide.disclaimer">
                {FIELD_GUIDE_EDUCATION_DISCLAIMER}
              </Text>
            </View>

            <Text style={[styles.intro, { color: theme.text }]} testID="field-guide.guide.intro">
              {entry.guide.intro}
            </Text>

            {entry.guide.sections.map((section, index) => (
              <GuideSection
                key={section.id}
                entryId={entry.id}
                index={index + 1}
                section={section}
              />
            ))}

            <DisclosureSection
              summary={FIELD_GUIDE_SECTION_SOURCES_AND_CREDITS_SUMMARY}
              testID={`field-guide.guide.${entry.id}.sources`}
              title={FIELD_GUIDE_SECTION_SOURCES_AND_CREDITS}>
              <Text style={[styles.sourceHeading, { color: theme.primaryDark }]}>
                {FIELD_GUIDE_GUIDE_SOURCES_TITLE}
              </Text>
              <FieldGuideSources
                sourceIds={entry.sourceIds}
                testID={`field-guide.guide.${entry.id}.sources.list`}
              />
              <FieldGuidePhotoCredits
                images={entry.images}
                testID={`field-guide.guide.${entry.id}.credits`}
              />
            </DisclosureSection>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function GuideSection({
  entryId,
  index,
  section,
}: {
  entryId: string;
  index: number;
  section: FieldGuideGuideSection;
}) {
  const theme = useTheme();

  return (
    <Card
      variant="flat"
      testID={`field-guide.guide.${entryId}.section.${section.id}`}>
      <Text style={[styles.sectionHeading, { color: theme.primaryDark }]}>
        {`${index}. ${section.heading}`}
      </Text>
      {section.paragraphs.map((paragraph) => (
        <Text key={paragraph} style={[styles.paragraph, { color: theme.text }]}>
          {paragraph}
        </Text>
      ))}
      {section.sourceIds.length > 0 ? (
        <FieldGuideSources
          sourceIds={section.sourceIds}
          testID={`field-guide.guide.${entryId}.section.${section.id}.sources`}
        />
      ) : null}
    </Card>
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
  callout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    padding: Spacing.md,
  },
  calloutText: { ...Typography.caption, flex: 1 },
  intro: { ...Typography.body },
  sectionHeading: { ...Typography.subheading, marginBottom: Spacing.sm },
  paragraph: { ...Typography.bodySmall, marginBottom: Spacing.sm },
  sourceHeading: { ...Typography.label, textTransform: 'uppercase' },
});
