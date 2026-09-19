import { Feather } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { Card } from '@/components/ui/Card';
import { Pill, type PillVariant } from '@/components/ui/Pill';
import { ReferenceMedia } from '@/components/ui/ReferenceMedia';
import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { diseaseCatalog } from '@/features/detection/constants/diseaseCatalog';
import { MODEL_LABELS } from '@/features/detection/constants/modelContract';
import { referenceMedia } from '@/features/detection/constants/referenceMedia';
import { useTheme } from '@/hooks/use-theme';

const REFERENCE_SUBTITLE = 'Observational reference';

export default function DiseaseReferenceScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: theme.background }]}
      testID="disease-reference.screen">
      <View style={styles.root}>
        <BrandedScreenHeader title="Disease reference" variant="plain" />

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
              <Text style={[styles.introTitle, { color: theme.primaryDark }]}>
                Sugarcane condition reference
              </Text>
              <Text style={[styles.introText, { color: theme.textSecondary }]}>
                Observational references for the four sugarcane conditions CaneGuard can check.
                They support field decision-making and do not confirm a disease or replace expert
                validation.
              </Text>
            </Card>

            <View style={styles.list}>
              {MODEL_LABELS.map((key) => {
                const catalog = diseaseCatalog[key];
                const media = referenceMedia[key];
                return (
                  <Card
                    key={key}
                    style={styles.card}
                    testID={`disease-reference.${key}`}
                    variant="flat">
                    <View style={styles.cardHeader}>
                      <Pill label={media.name} variant={key as PillVariant} />
                      <Text style={[styles.catalogName, { color: theme.textSecondary }]}>
                        {REFERENCE_SUBTITLE}
                      </Text>
                    </View>

                    <ReferenceMedia
                      label={media.name}
                      patternDescription={media.patternDescription}
                      photo={media.photo}
                      testID={`disease-reference.media.${key}`}
                    />

                    <View style={styles.details}>
                      <Text style={[styles.detailTitle, { color: theme.primaryDark }]}>
                        Visual symptoms
                      </Text>
                      <Text style={[styles.detailText, { color: theme.text }]}>
                        {catalog.shortDescription}
                      </Text>

                      <View
                        style={[
                          styles.advisoryBox,
                          { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                        ]}>
                        <Text style={[styles.advisoryText, { color: theme.textSecondary }]}>
                          {catalog.decisionSupportWording}
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
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
  introCard: {
    gap: Spacing.sm,
  },
  introHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  eyebrow: {
    ...Typography.label,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  introTitle: {
    ...Typography.heading,
    fontWeight: '800',
  },
  introText: {
    ...Typography.bodySmall,
    lineHeight: 20,
  },
  list: {
    gap: Spacing.lg,
  },
  card: {
    gap: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  catalogName: {
    ...Typography.caption,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  details: {
    gap: Spacing.xs,
  },
  detailTitle: {
    ...Typography.subheading,
    fontWeight: '700',
  },
  detailText: {
    ...Typography.bodySmall,
    lineHeight: 20,
  },
  advisoryBox: {
    marginTop: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  advisoryText: {
    ...Typography.caption,
    lineHeight: 16,
  },
});
