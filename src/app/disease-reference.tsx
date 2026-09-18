import { Feather } from '@expo/vector-icons';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { Card } from '@/components/ui/Card';
import { Pill, type PillVariant } from '@/components/ui/Pill';
import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { diseaseCatalog } from '@/features/detection/constants/diseaseCatalog';
import type { ModelLabel } from '@/features/detection/constants/modelContract';
import { useTheme } from '@/hooks/use-theme';

type ReferenceItem = {
  key: ModelLabel;
  name: string;
  image?: number;
  patternDescription?: string;
};

const REFERENCE_ITEMS: ReferenceItem[] = [
  {
    key: 'healthy',
    name: 'Healthy',
    image: require('../../assets/images/sugarcane-diseases/reference_healthy.jpg'),
  },
  {
    key: 'mosaic',
    name: 'Mosaic',
    image: require('../../assets/images/sugarcane-diseases/reference_mosaic.jpg'),
  },
  {
    key: 'rust',
    name: 'Rust',
    image: require('../../assets/images/sugarcane-diseases/reference_rust.jpg'),
  },
  {
    key: 'smut',
    name: 'Smut',
    image: require('../../assets/model-fixtures/v1-smut.jpg'),
    patternDescription: 'Dark, whip-like growth emerging from the central shoot or stalk',
  },
];

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
                These are observational references for the four Model V1 classes. They support
                field decision-making only and do not confirm a disease or replace expert
                validation.
              </Text>
            </Card>

            <View style={styles.list}>
              {REFERENCE_ITEMS.map((item) => {
                const catalog = diseaseCatalog[item.key];
                return (
                  <Card
                    key={item.key}
                    style={styles.card}
                    testID={`disease-reference.${item.key}`}
                    variant="flat">
                    <View style={styles.cardHeader}>
                      <Pill label={item.name} variant={item.key as PillVariant} />
                      <Text style={[styles.catalogName, { color: theme.textSecondary }]}>
                        {catalog.displayName !== item.name ? catalog.displayName : 'Model V1 class'}
                      </Text>
                    </View>

                    {item.image ? (
                      <Image
                        accessibilityLabel={`${item.name} reference photo`}
                        resizeMode="cover"
                        source={item.image}
                        style={[styles.photo, { borderColor: theme.border }]}
                      />
                    ) : (
                      <View
                        accessibilityLabel={`${item.name} reference pattern`}
                        style={[
                          styles.patternBox,
                          { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                        ]}>
                        <Feather name="info" size={18} color={theme.primary} />
                        <Text style={[styles.patternText, { color: theme.textSecondary }]}>
                          {item.patternDescription}
                        </Text>
                      </View>
                    )}

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
  photo: {
    width: '100%',
    height: 190,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  patternBox: {
    minHeight: 80,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  patternText: {
    ...Typography.bodySmall,
    flex: 1,
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
