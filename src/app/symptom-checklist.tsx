import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { SymptomChecklistItem } from '@/components/ui/SymptomChecklistItem';
import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import {
  CHECKLIST_OBSERVATIONS,
  type ChecklistObservationId,
} from '@/features/detection/checklist/checklistConsistency';
import { useScanSession } from '@/features/detection/context/useScanSession';
import type { ReportedSeverity } from '@/features/detection/types';
import { useTheme } from '@/hooks/use-theme';

const SEVERITIES: readonly (ReportedSeverity | null)[] = [
  null,
  'Mild',
  'Moderate',
  'Severe',
];

export default function SymptomChecklistScreen() {
  const theme = useTheme();
  const { state, dispatch } = useScanSession();
  const [selectedSymptoms, setSelectedSymptoms] = useState(
    () => new Set<ChecklistObservationId>(state.selectedSymptoms),
  );
  const [selectedSeverity, setSelectedSeverity] =
    useState<ReportedSeverity | null>(state.reportedSeverity);
  const hasCompletedScan =
    state.status === 'completed' && Boolean(state.result) && Boolean(state.sourceUri);

  const toggleSymptom = (symptom: ChecklistObservationId) =>
    setSelectedSymptoms((current) => {
      const next = new Set(current);

      if (next.has(symptom)) {
        next.delete(symptom);
        return next;
      }

      if (symptom === 'none' || symptom === 'unable-to-tell') {
        return new Set([symptom]);
      }

      next.delete('none');
      next.delete('unable-to-tell');
      next.add(symptom);
      return next;
    });

  const continueToResult = () => {
    dispatch({ type: 'SET_SYMPTOMS', payload: [...selectedSymptoms] });
    dispatch({ type: 'SET_REPORTED_SEVERITY', payload: selectedSeverity });
    router.push('/analysis-result');
  };

  if (!hasCompletedScan) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.background }]}
        edges={['top', 'bottom']}>
        <View style={styles.root}>
          <BrandedScreenHeader title="Symptoms" />
          <View style={styles.recoveryContent}>
            <View
              style={[
                styles.recoveryCard,
                {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                },
              ]}>
              <View style={[styles.introIcon, { backgroundColor: theme.warningBg }]}>
                <Feather name="alert-circle" size={22} color={theme.warning} />
              </View>
              <Text style={[styles.recoveryTitle, { color: theme.primaryDark }]}>
                No completed scan
              </Text>
              <Text style={[styles.recoveryText, { color: theme.textSecondary }]}>
                Analyze a sugarcane image before adding symptom observations.
              </Text>
              <AppButton
                onPress={() => router.replace('/scan')}
                leadingIcon="camera"
                accessibilityLabel="Return to scan">
                Return to Scan
              </AppButton>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="Symptoms" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.intro}>
              <View style={[styles.introIcon, { backgroundColor: theme.warningBg }]}>
                <Feather name="eye" size={20} color={theme.accentDark} />
              </View>
              <Text style={[styles.introText, { color: theme.textSecondary }]}>
                Select what you can see. These observations are compared with the model
                result but never change its scores.
              </Text>
            </View>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.primaryDark }]}>
                What do you see?
              </Text>
              <View style={styles.symptomList}>
                {CHECKLIST_OBSERVATIONS.map((observation) => (
                  <SymptomChecklistItem
                    key={observation.id}
                    label={observation.label}
                    selected={selectedSymptoms.has(observation.id)}
                    onToggle={() => toggleSymptom(observation.id)}
                  />
                ))}
              </View>
            </View>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.primaryDark }]}>
                Reported severity (optional)
              </Text>
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                This is your observation, not a model-estimated severity.
              </Text>
              <View
                style={[styles.severityControl, { backgroundColor: theme.surfaceMuted }]}>
                {SEVERITIES.map((severity) => {
                  const selected = selectedSeverity === severity;
                  const label = severity ?? 'Not provided';

                  return (
                    <Pressable
                      key={severity ?? 'not-provided'}
                      accessibilityRole="radio"
                      accessibilityLabel={`Reported severity: ${label}`}
                      accessibilityState={{ selected }}
                      onPress={() => setSelectedSeverity(severity)}
                      style={({ pressed }) => [
                        styles.severityOption,
                        selected && {
                          backgroundColor: theme.surfaceElevated,
                          borderColor: theme.border,
                        },
                        pressed && styles.pressed,
                      ]}>
                      <Text
                        style={[
                          styles.severityText,
                          {
                            color: selected
                              ? theme.primaryDark
                              : theme.textSecondary,
                          },
                        ]}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <AppButton
              onPress={continueToResult}
              leadingIcon="check-circle"
              trailingIcon="arrow-right"
              accessibilityLabel="Continue to analysis result">
              Continue
            </AppButton>
            <View style={[styles.ornament, { backgroundColor: theme.accent }]} />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, root: { flex: 1 }, scrollContent: { alignItems: 'center' },
  content: { width: '100%', maxWidth: Layout.mobileMaxWidth, paddingHorizontal: ComponentTokens.screen.horizontalPadding, paddingVertical: Spacing.xl, gap: Spacing.xl },
  intro: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md }, introIcon: { width: 42, height: 42, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' }, introText: { ...Typography.bodySmall, flex: 1 },
  section: { gap: Spacing.md }, sectionTitle: { ...Typography.subheading }, helperText: { ...Typography.caption, marginTop: -Spacing.sm }, symptomList: { gap: Spacing.sm },
  severityControl: { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.xs, borderRadius: Radius.lg, gap: Spacing.xs }, severityOption: { minHeight: 46, minWidth: '47%', flexGrow: 1, borderRadius: Radius.md, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.sm }, severityText: { ...Typography.bodySmall, fontWeight: '800', textAlign: 'center' }, ornament: { alignSelf: 'center', width: 62, height: 3, borderRadius: Radius.full }, pressed: { opacity: 0.72 },
  recoveryContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  recoveryCard: { width: '100%', maxWidth: Layout.mobileMaxWidth, borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md, alignItems: 'center' },
  recoveryTitle: { ...Typography.heading, textAlign: 'center' },
  recoveryText: { ...Typography.bodySmall, textAlign: 'center' },
});
