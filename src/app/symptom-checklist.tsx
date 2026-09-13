import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { SymptomChecklistItem } from '@/components/ui/SymptomChecklistItem';
import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import {
  getGuidedValidationQuestions,
  type ChecklistObservationId,
} from '@/features/detection/checklist/checklistConsistency';
import { useScanSession } from '@/features/detection/context/useScanSession';
import { useTheme } from '@/hooks/use-theme';

export default function SymptomChecklistScreen() {
  const theme = useTheme();
  const { state, dispatch } = useScanSession();
  const hasCompletedScan =
    state.status === 'completed' && Boolean(state.result) && Boolean(state.sourceUri);
  const guidedQuestions = state.result
    ? getGuidedValidationQuestions(state.result.predictedLabel)
    : [];
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedSymptoms, setSelectedSymptoms] = useState(
    () => new Set<ChecklistObservationId>(state.selectedSymptoms),
  );
  const currentQuestion = guidedQuestions[currentQuestionIndex];
  const isLastQuestion =
    currentQuestionIndex >= guidedQuestions.length - 1;
  const hasSelectedObservation = selectedSymptoms.size > 0;
  const canContinue = currentQuestion ? hasSelectedObservation : true;

  const selectObservation = (observation: ChecklistObservationId) =>
    setSelectedSymptoms((current) => {
      if (current.size === 1 && current.has(observation)) {
        return new Set();
      }

      // Each guided question records one answer. Fallback options such as
      // Something else and Unable to tell are therefore never combined with a
      // supported pattern in the same answer.
      return new Set([observation]);
    });

  const continueToResult = () => {
    if (!currentQuestion) {
      dispatch({ type: 'SET_SYMPTOMS', payload: [] });
      router.push('/analysis-result');
      return;
    }
    if (!hasSelectedObservation) {
      return;
    }
    if (!isLastQuestion) {
      setCurrentQuestionIndex((index) => index + 1);
      return;
    }

    dispatch({ type: 'SET_SYMPTOMS', payload: [...selectedSymptoms] });
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
    <SafeAreaView
      testID="scan.symptom-checklist-screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="Guided observations" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.intro}>
              <View style={[styles.introIcon, { backgroundColor: theme.warningBg }]}>
                <Feather name="eye" size={20} color={theme.accentDark} />
              </View>
              <Text style={[styles.introText, { color: theme.textSecondary }]}>
                Add a short visual observation before reviewing the AI-assisted result.
                Your answer is stored separately and never changes model scores.
              </Text>
            </View>
            {currentQuestion ? (
              <View style={styles.section}>
                <View style={styles.questionHeading}>
                  <Text
                    testID="scan.guided-progress"
                    style={[styles.progressText, { color: theme.primary }]}>
                    Observation {currentQuestionIndex + 1} of {guidedQuestions.length}
                  </Text>
                  <Text
                    testID="scan.guided-question"
                    style={[styles.questionText, { color: theme.primaryDark }]}>
                    {currentQuestion.prompt}
                  </Text>
                  <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                    {currentQuestion.helperText}
                  </Text>
                </View>
                <View style={styles.symptomList}>
                  {currentQuestion.options.map((observation) => (
                    <SymptomChecklistItem
                      key={observation.id}
                      testID={`scan.symptom-${observation.id}`}
                      label={observation.label}
                      selected={selectedSymptoms.has(observation.id)}
                      selectionMode="radio"
                      onToggle={() => selectObservation(observation.id)}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                Guided observations are unavailable for this model context. You can
                still review the AI-assisted result.
              </Text>
            )}
            <AppButton
              testID="scan.continue-to-result"
              onPress={continueToResult}
              disabled={!canContinue}
              leadingIcon="check-circle"
              trailingIcon="arrow-right"
              accessibilityLabel={
                isLastQuestion
                  ? 'Continue to analysis result'
                  : 'Continue to next observation'
              }>
              {currentQuestion && !isLastQuestion
                ? 'Next observation'
                : currentQuestion && !hasSelectedObservation
                  ? 'Choose an observation'
                  : 'Continue'}
            </AppButton>
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
  intro: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  introIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: { ...Typography.bodySmall, flex: 1 },
  section: { gap: Spacing.md },
  questionHeading: { gap: Spacing.xs },
  progressText: { ...Typography.caption, fontWeight: '800' },
  questionText: { ...Typography.heading, fontWeight: '800' },
  helperText: { ...Typography.caption },
  symptomList: { gap: Spacing.sm },
  recoveryContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  recoveryCard: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  recoveryTitle: { ...Typography.heading, textAlign: 'center' },
  recoveryText: { ...Typography.bodySmall, textAlign: 'center' },
});
