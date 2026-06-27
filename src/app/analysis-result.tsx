import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { DiseaseBadge } from '@/components/ui/DiseaseBadge';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ComponentTokens, DiseaseTokens, Radius, Spacing, Typography } from '@/constants/theme';
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
    <ScreenContainer contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Analysis Result</Text>
      </View>

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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: ComponentTokens.screen.sectionGap,
  },
  header: {
    paddingTop: Spacing.lg,
  },
  title: {
    ...Typography.heading,
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
