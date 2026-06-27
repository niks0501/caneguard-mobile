import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { DiseaseBadge } from '@/components/ui/DiseaseBadge';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ComponentTokens, DiseaseTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MOCK_DISEASE = DiseaseTokens.downyMildew;
const MOCK_CONFIDENCE = 87;

export default function AnalysisResultScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ symptoms?: string; severity?: string }>();
  const [message, setMessage] = useState<string | null>(null);

  const decodedSymptoms = params.symptoms ? decodeURIComponent(params.symptoms).split(',') : [];
  const severity = params.severity ? decodeURIComponent(params.severity) : 'Moderate';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.root}>
        <ScreenHeader title="Analysis Result" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}>
          <View style={styles.content}>
            <AppCard style={styles.resultCard}>
              <DiseaseBadge label={MOCK_DISEASE.label} color={MOCK_DISEASE.color} background={MOCK_DISEASE.background} />
              <Text style={[styles.diseaseName, { color: theme.text }]}>Possible disease: {MOCK_DISEASE.label}</Text>

              <View style={styles.metrics}>
                <View style={[styles.metricItem, { backgroundColor: theme.surfaceMuted }]}>
                  <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Confidence</Text>
                  <Text style={[styles.metricValue, { color: theme.primary }]}> {MOCK_CONFIDENCE}%</Text>
                </View>
                <View style={[styles.metricItem, { backgroundColor: theme.surfaceMuted }]}>
                  <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Severity</Text>
                  <Text style={[styles.metricValue, { color: theme.text }]}>{severity}</Text>
                </View>
              </View>

              <View style={styles.symptomSummary}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Symptoms matched</Text>
                <View style={styles.symptomTags}>
                  {decodedSymptoms.length > 0
                    ? decodedSymptoms.map((symptom) => (
                        <View key={symptom} style={[styles.symptomTag, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
                          <Text style={[styles.symptomTagText, { color: theme.text }]}>{symptom}</Text>
                        </View>
                      ))
                    : null}
                </View>
              </View>
            </AppCard>

            <View style={[styles.disclaimerBox, { backgroundColor: theme.infoBg, borderColor: theme.info }]}>
              <Text style={[styles.disclaimerText, { color: theme.text }]}>
                This result is for decision support only and should not replace expert validation.
              </Text>
            </View>

            <View style={styles.actions}>
              <AppButton
                onPress={() => setMessage('Advisory information will be available in a future update.')}>
                View Advisory
              </AppButton>
              <AppButton
                variant="secondary"
                onPress={() => setMessage('Report submission will be available in a future update.')}>
                Submit Report
              </AppButton>
            </View>

            {message ? (
              <View style={[styles.messageBox, { backgroundColor: theme.surfaceMuted }]}>
                <Text style={[styles.messageText, { color: theme.primaryDark }]}>{message}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
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
    gap: ComponentTokens.screen.sectionGap,
  },
  resultCard: {
    gap: Spacing.lg,
  },
  diseaseName: {
    ...Typography.subheading,
  },
  metrics: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricItem: {
    flex: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  metricLabel: {
    ...Typography.caption,
  },
  metricValue: {
    ...Typography.heading,
  },
  symptomSummary: {
    gap: Spacing.sm,
  },
  summaryLabel: {
    ...Typography.caption,
  },
  symptomTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  symptomTag: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  symptomTagText: {
    ...Typography.caption,
  },
  disclaimerBox: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  disclaimerText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  actions: {
    gap: Spacing.md,
  },
  messageBox: {
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  messageText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
});
