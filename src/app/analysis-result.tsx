import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { ComponentTokens, Layout, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AnalysisResultScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ symptoms?: string; severity?: string }>();
  const [message, setMessage] = useState<string | null>(null);
  const symptoms = params.symptoms ? decodeURIComponent(params.symptoms).split(',').filter(Boolean) : [];
  const severity = params.severity ? decodeURIComponent(params.severity) : 'Moderate';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="Analysis Result" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={[styles.resultCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <View style={[styles.diseasePill, { backgroundColor: theme.downyMildewBg }]}><Feather name="feather" size={15} color={theme.downyMildew} /><Text style={[styles.diseasePillText, { color: theme.downyMildew }]}>Downy Mildew</Text></View>
              <Image source={require('../../assets/images/sugarcane-diseases/sugarcane_downey_mildew.jpg')} accessibilityLabel="Sugarcane leaf with possible Downy Mildew" style={[styles.resultImage, { borderColor: theme.accent }]} />
              <View style={styles.diseaseTitle}><Text style={[styles.possible, { color: theme.textSecondary }]}>Possible disease</Text><Text style={[styles.diseaseName, { color: theme.primaryDark }]}>Downy Mildew</Text></View>
              <View style={styles.metrics}><Metric label="Confidence" value="87%" icon="bar-chart-2" /><Metric label="Severity" value={severity} icon="activity" /></View>
              {symptoms.length > 0 ? <View style={styles.matches}><Text style={[styles.matchesLabel, { color: theme.textSecondary }]}>Symptoms matched</Text><View style={styles.chips}>{symptoms.map((symptom) => <View key={symptom} style={[styles.chip, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}><Feather name="feather" size={13} color={theme.accentDark} /><Text style={[styles.chipText, { color: theme.text }]}>{symptom}</Text></View>)}</View></View> : null}
            </View>
            <View style={[styles.disclaimer, { backgroundColor: theme.infoBg, borderColor: theme.info }]}><ExpoImage accessible={false} contentFit="contain" pointerEvents="none" source={require('../../assets/svg/gold-leaf-corner.svg')} style={styles.disclaimerLeaf} /><Feather name="info" size={19} color={theme.info} style={styles.disclaimerContent} /><Text style={[styles.disclaimerText, styles.disclaimerContent, { color: theme.text }]}>This result is for decision support only and should not replace expert validation.</Text></View>
            <View style={styles.actions}><AppButton onPress={() => setMessage('Advisory information will be available in a future update.')} leadingIcon="book-open" trailingIcon="arrow-right">View Advisory</AppButton><AppButton variant="secondary" onPress={() => setMessage('Report submission will be available in a future update.')} leadingIcon="send" trailingIcon="arrow-right">Submit Report</AppButton></View>
            {message ? <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={[styles.message, { backgroundColor: theme.surfaceMuted }]}><Text style={[styles.messageText, { color: theme.primaryDark }]}>{message}</Text></View> : null}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: keyof typeof Feather.glyphMap }) {
  const theme = useTheme();
  return <View style={[styles.metric, { backgroundColor: theme.backgroundElement }]}><Feather name={icon} size={18} color={theme.primary} /><Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{label}</Text><Text style={[styles.metricValue, { color: theme.primaryDark }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, root: { flex: 1 }, scrollContent: { alignItems: 'center' },
  content: { width: '100%', maxWidth: Layout.mobileMaxWidth, paddingHorizontal: ComponentTokens.screen.horizontalPadding, paddingVertical: Spacing.xl, gap: Spacing.lg },
  resultCard: { borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', gap: Spacing.lg, ...Shadows.md },
  diseasePill: { borderRadius: Radius.full, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, alignSelf: 'flex-start' }, diseasePillText: { ...Typography.caption, fontWeight: '800' },
  resultImage: { width: 132, height: 132, borderRadius: Radius.full, borderWidth: 4 }, diseaseTitle: { alignItems: 'center', gap: Spacing.xs }, possible: { ...Typography.bodySmall }, diseaseName: { ...Typography.title, fontWeight: '800' },
  metrics: { flexDirection: 'row', width: '100%', gap: Spacing.sm }, metric: { flex: 1, minHeight: 112, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.xs }, metricLabel: { ...Typography.caption }, metricValue: { ...Typography.heading, fontWeight: '800' },
  matches: { alignSelf: 'stretch', gap: Spacing.sm }, matchesLabel: { ...Typography.caption, fontWeight: '800' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }, chip: { borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }, chipText: { ...Typography.caption },
  disclaimer: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm, flexDirection: 'row', alignItems: 'flex-start', overflow: 'hidden', position: 'relative' }, disclaimerLeaf: { position: 'absolute', width: 96, height: 96, right: -18, bottom: -26, opacity: 0.24 }, disclaimerContent: { zIndex: 1 }, disclaimerText: { ...Typography.caption, flex: 1, lineHeight: 18 }, actions: { gap: Spacing.md }, message: { padding: Spacing.md, borderRadius: Radius.lg }, messageText: { ...Typography.bodySmall, fontWeight: '700' },
});
