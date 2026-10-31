import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { ReferenceMedia } from '@/components/ui/ReferenceMedia';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import {
  FIELD_GUIDE_EDUCATION_DISCLAIMER,
  FIELD_GUIDE_APP_CAN_CHECK,
  FIELD_GUIDE_APP_CANNOT_CHECK,
  FIELD_GUIDE_INTRO,
  FIELD_GUIDE_TITLE,
} from '@/constants/copy';
import { fieldGuideEntriesForCategory } from '@/features/field-guide/constants/fieldGuideEntries';
import { fieldGuideEditorial } from '@/features/field-guide/constants/fieldGuideEntryContent';
import { FIELD_GUIDE_PILL_VARIANTS } from '@/features/field-guide/constants/fieldGuidePillVariants';
import { FieldGuidePendingValidationNotice } from '@/features/field-guide/components/FieldGuidePendingValidationNotice';
import {
  FIELD_GUIDE_CATEGORY_ORDER,
  type FieldGuideCategory,
  type FieldGuideEntry,
} from '@/features/field-guide/domain/fieldGuideTypes';
import { useTheme } from '@/hooks/use-theme';

const CATEGORY_HEADINGS: Record<FieldGuideCategory, string> = {
  healthy: 'Baseline',
  disease: 'Diseases',
  pest: 'Pests',
};

function appCheckLine(entry: FieldGuideEntry): string {
  return entry.detectableByApp && entry.modelLabel !== null
    ? FIELD_GUIDE_APP_CAN_CHECK
    : FIELD_GUIDE_APP_CANNOT_CHECK;
}

/**
 * Phase 1 renders bundled seed photos only. `FieldGuideImage.source` also
 * allows a downloaded local-file URI, which arrives in Phase 2 together with
 * the media component's URI branch; until then an entry whose source is not a
 * bundled asset module renders the description-only frame, never a broken
 * image.
 */
function entryPhoto(entry: FieldGuideEntry): number | undefined {
  const source = entry.images[0]?.source;
  if (source === undefined || typeof source === 'string') {
    return undefined;
  }
  return source;
}

/**
 * Field guide index.
 *
 * Deliberately readable with no session: it is declared outside both
 * `Stack.Protected` groups in `src/app/_layout.tsx`, so it must never read
 * from auth or an owner-scoped store.
 */
export default function FieldGuideIndexScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: theme.background }]}
      testID="field-guide.screen">
      <View style={styles.root}>
        <BrandedScreenHeader title={FIELD_GUIDE_TITLE} variant="plain" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Card style={styles.introCard} variant="flat">
              <View style={styles.introHeading}>
                <Feather name="book-open" size={20} color={theme.primary} />
                <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>
                  OBSERVATIONAL GUIDE
                </Text>
              </View>
              <Text style={[styles.introText, { color: theme.text }]}>{FIELD_GUIDE_INTRO}</Text>
              <View
                style={[
                  styles.disclaimerBox,
                  { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                ]}>
                <Text style={[styles.disclaimerText, { color: theme.textSecondary }]}>
                  {FIELD_GUIDE_EDUCATION_DISCLAIMER}
                </Text>
                <FieldGuidePendingValidationNotice
                  editorial={fieldGuideEditorial}
                  testID="field-guide.index.pending-validation"
                />
              </View>
            </Card>

            {FIELD_GUIDE_CATEGORY_ORDER.map((category) => {
              const entries = fieldGuideEntriesForCategory(category);
              if (entries.length === 0) {
                return null;
              }

              return (
                <View key={category} style={styles.section}>
                  <SectionHeading
                    testID={`field-guide.section.${category}`}
                    title={CATEGORY_HEADINGS[category]}
                  />
                  <View style={styles.list}>
                    {entries.map((entry) => (
                      <Card
                        key={entry.id}
                        accessibilityLabel={`Open the ${entry.displayName} field guide entry`}
                        onPress={() => router.push(`/field-guide/${entry.id}`)}
                        style={styles.card}
                        testID={`field-guide.entry.${entry.id}`}
                        variant="interactive">
                        <View style={styles.cardHeader}>
                          <Pill
                            label={entry.shortName}
                            variant={FIELD_GUIDE_PILL_VARIANTS[entry.id]}
                          />
                          <Text style={[styles.cardCheck, { color: theme.textSecondary }]}>
                            {appCheckLine(entry)}
                          </Text>
                        </View>

                        <ReferenceMedia
                          label={entry.displayName}
                          patternDescription={entry.signs[0]}
                          photo={entryPhoto(entry)}
                          testID={`field-guide.entry.${entry.id}.media`}
                        />

                        <Text style={[styles.cardSummary, { color: theme.text }]}>
                          {entry.summary}
                        </Text>
                      </Card>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1 },
  scrollContent: { alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingVertical: Spacing.xl,
    gap: Spacing.xl,
  },
  introCard: { gap: Spacing.sm },
  introHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  eyebrow: {
    ...Typography.label,
    textTransform: 'uppercase',
  },
  introText: { ...Typography.body },
  disclaimerBox: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    padding: Spacing.md,
  },
  disclaimerText: { ...Typography.caption },
  section: { gap: Spacing.sm },
  list: { gap: Spacing.md },
  card: { gap: Spacing.md },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardCheck: {
    ...Typography.caption,
    flexShrink: 1,
    textAlign: 'right',
  },
  cardSummary: { ...Typography.bodySmall },
});
