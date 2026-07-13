import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { SymptomChecklistItem } from '@/components/ui/SymptomChecklistItem';
import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SYMPTOMS = ['Yellow or white stripes', 'Rust-colored spots', 'Mosaic-like discoloration', 'Black whip-like growth', 'Drying young shoot'] as const;
const SEVERITIES = ['Mild', 'Moderate', 'Severe'] as const;
type Severity = (typeof SEVERITIES)[number];

export default function SymptomChecklistScreen() {
  const theme = useTheme();
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set());
  const [selectedSeverity, setSelectedSeverity] = useState<Severity>('Moderate');
  const toggleSymptom = (symptom: string) => setSelectedSymptoms((current) => {
    const next = new Set(current);
    if (next.has(symptom)) {
      next.delete(symptom);
    } else {
      next.add(symptom);
    }
    return next;
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="Symptoms" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.intro}><View style={[styles.introIcon, { backgroundColor: theme.warningBg }]}><Feather name="feather" size={20} color={theme.accentDark} /></View><Text style={[styles.introText, { color: theme.textSecondary }]}>Select the symptoms you can see in the sugarcane image or plant.</Text></View>
            <View style={styles.section}><Text style={[styles.sectionTitle, { color: theme.primaryDark }]}>What do you see?</Text><View style={styles.symptomList}>{SYMPTOMS.map((symptom) => <SymptomChecklistItem key={symptom} label={symptom} selected={selectedSymptoms.has(symptom)} onToggle={() => toggleSymptom(symptom)} />)}</View></View>
            <View style={styles.section}><Text style={[styles.sectionTitle, { color: theme.primaryDark }]}>Severity</Text><View style={[styles.severityControl, { backgroundColor: theme.surfaceMuted }]}>{SEVERITIES.map((severity) => { const selected = selectedSeverity === severity; return <Pressable key={severity} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setSelectedSeverity(severity)} style={({ pressed }) => [styles.severityOption, selected && { backgroundColor: theme.surfaceElevated, borderColor: theme.border }, pressed && styles.pressed]}><Text style={[styles.severityText, { color: selected ? theme.primaryDark : theme.textSecondary }]}>{severity}</Text></Pressable>; })}</View></View>
            <AppButton onPress={() => router.push(`/analysis-result?symptoms=${encodeURIComponent([...selectedSymptoms].join(','))}&severity=${encodeURIComponent(selectedSeverity)}`)} disabled={selectedSymptoms.size === 0} leadingIcon="check-circle" trailingIcon="arrow-right" accessibilityLabel="Continue to analysis result">Continue</AppButton>
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
  section: { gap: Spacing.md }, sectionTitle: { ...Typography.subheading }, symptomList: { gap: Spacing.sm },
  severityControl: { flexDirection: 'row', padding: Spacing.xs, borderRadius: Radius.lg, gap: Spacing.xs }, severityOption: { minHeight: 46, flex: 1, borderRadius: Radius.md, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' }, severityText: { ...Typography.bodySmall, fontWeight: '800' }, ornament: { alignSelf: 'center', width: 62, height: 3, borderRadius: Radius.full }, pressed: { opacity: 0.72 },
});
