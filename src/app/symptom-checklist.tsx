import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SymptomChecklistItem } from '@/components/ui/SymptomChecklistItem';
import { ComponentTokens, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SYMPTOMS = [
  'Yellow or white stripes',
  'Rust-colored spots',
  'Mosaic-like discoloration',
  'Black whip-like growth',
  'Drying young shoot',
] as const;

const SEVERITIES = ['Mild', 'Moderate', 'Severe'] as const;

type Severity = (typeof SEVERITIES)[number];

export default function SymptomChecklistScreen() {
  const theme = useTheme();
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set());
  const [selectedSeverity, setSelectedSeverity] = useState<Severity>('Moderate');

  const toggleSymptom = (symptom: string) => {
    const next = new Set(selectedSymptoms);
    if (next.has(symptom)) {
      next.delete(symptom);
    } else {
      next.add(symptom);
    }
    setSelectedSymptoms(next);
  };

  const canContinue = selectedSymptoms.size > 0;

  const handleContinue = () => {
    const symptomsParam = encodeURIComponent([...selectedSymptoms].join(','));
    const severityParam = encodeURIComponent(selectedSeverity);
    router.push(`/analysis-result?symptoms=${symptomsParam}&severity=${severityParam}`);
  };

  return (
    <ScreenContainer contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Confirm visible symptoms</Text>
        <Text style={[styles.instruction, { color: theme.textSecondary }]}>
          Select the symptoms that are visible in the sugarcane image or plant.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.text }]}>Symptoms</Text>
        <View style={styles.symptomList}>
          {SYMPTOMS.map((symptom) => (
            <SymptomChecklistItem
              key={symptom}
              label={symptom}
              selected={selectedSymptoms.has(symptom)}
              onToggle={() => toggleSymptom(symptom)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.text }]}>Severity</Text>
        <View style={styles.severityRow}>
          {SEVERITIES.map((severity) => {
            const isSelected = selectedSeverity === severity;
            return (
              <AppButton
                key={severity}
                variant={isSelected ? 'primary' : 'secondary'}
                onPress={() => setSelectedSeverity(severity)}
                accessibilityLabel={`Select severity: ${severity}`}
                style={styles.severityButton}>
                {severity}
              </AppButton>
            );
          })}
        </View>
      </View>

      <AppButton onPress={handleContinue} disabled={!canContinue} accessibilityLabel="Continue to analysis result">
        Continue
      </AppButton>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: ComponentTokens.screen.sectionGap,
  },
  header: {
    gap: Spacing.sm,
    paddingTop: Spacing.lg,
  },
  title: {
    ...Typography.heading,
  },
  instruction: {
    ...Typography.body,
  },
  section: {
    gap: Spacing.md,
  },
  sectionLabel: {
    ...Typography.subheading,
  },
  symptomList: {
    gap: Spacing.sm,
  },
  severityRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  severityButton: {
    flex: 1,
  },
});
