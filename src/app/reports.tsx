import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BottomNav } from '@/components/ui/BottomNav';
import { DiseasePill } from '@/components/ui/DiseasePill';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { SummaryTile } from '@/components/ui/SummaryTile';
import { ComponentTokens, Colors, Layout, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const DISEASE_BARS = [
  { name: 'Sugarcane Smut', cases: 7, color: Colors.light.smut },
  { name: 'Downy Mildew', cases: 3, color: Colors.light.downyMildew },
  { name: 'Mosaic Disease', cases: 1, color: Colors.light.mosaic },
];

export default function ReportsScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.root}>
        <ScreenHeader title="Reports" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}>
          <View style={styles.content}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>DISEASE SUMMARY</Text>

            <View
              style={[
                styles.summaryCard,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}>
              <View style={styles.tileRow}>
                <SummaryTile value={18} label="Total Reports" tintColor="#7B2CBF" tintBackground={Colors.light.smutBg} />
                <SummaryTile value={11} label="AI Predictions" tintColor={Colors.light.info} tintBackground={Colors.light.infoBg} />
              </View>
              <View style={styles.tileRow}>
                <SummaryTile value={5} label="Healthy Scans" tintColor={Colors.light.success} tintBackground={Colors.light.successBg} />
                <SummaryTile value={2} label="Pending Sync" tintColor={Colors.light.warning} tintBackground={Colors.light.warningBg} />
              </View>
            </View>

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>BY DISEASE TYPE</Text>

            <View
              style={[
                styles.diseaseCard,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}>
              {DISEASE_BARS.map((item, index) => (
                <View key={item.name}>
                  {index > 0 ? (
                    <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                  ) : null}
                  <View style={styles.diseaseRow}>
                    <Text style={[styles.diseaseName, { color: theme.text }]}>{item.name}</Text>
                    <View
                      style={[
                        styles.casePill,
                        { backgroundColor: theme.surfaceMuted },
                      ]}>
                      <Text style={[styles.caseCount, { color: theme.textSecondary }]}>
                        {item.cases} cases
                      </Text>
                    </View>
                  </View>
                  <ProgressBar progress={item.cases / 7} color={item.color} />
                </View>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>SYNC STATUS</Text>

            <View
              style={[
                styles.syncCard,
                {
                  backgroundColor: theme.warningBg,
                  borderColor: theme.warning,
                },
              ]}>
              <View style={styles.syncHeader}>
                <View style={styles.syncTextBlock}>
                  <Text style={[styles.syncTitle, { color: theme.text }]}>2 reports unsent</Text>
                  <Text style={[styles.syncSubtitle, { color: theme.textSecondary }]}>
                    Saved locally · Will sync when online
                  </Text>
                </View>
                <StatusChip variant="queued" />
              </View>
              <AppButton
                onPress={() => Alert.alert('Sync', 'Sync will be available in a future update.')}
                accessibilityLabel="Sync unsent reports to MAO">
                Sync to MAO Now
              </AppButton>
            </View>

            <View
              style={[
                styles.syncCard,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}>
              <View style={styles.syncHeader}>
                <View style={styles.syncTextBlock}>
                  <Text style={[styles.syncTitle, { color: theme.text }]}>16 reports synced</Text>
                  <Text style={[styles.syncSubtitle, { color: theme.textSecondary }]}>
                    Last synced: Jul 12, 2025 · 11:04 AM
                  </Text>
                </View>
                <StatusChip variant="sent" />
              </View>
            </View>

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>RECENT SUBMISSIONS</Text>

            <View
              style={[
                styles.recentCard,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}>
              <View style={styles.recentHeader}>
                <View style={styles.recentTextBlock}>
                  <Text style={[styles.recentTitle, { color: theme.text }]}>Scan — Brgy. Wawa</Text>
                  <Text style={[styles.recentDate, { color: theme.textSecondary }]}>
                    Jul 12, 2025 · 10:23 AM
                  </Text>
                </View>
                <DiseasePill variant="smut" />
              </View>
              <View style={styles.recentFooter}>
                <StatusChip variant="queued" />
              </View>
            </View>

            <View style={{ height: Layout.bottomNavHeight + Spacing.xl }} />
          </View>
        </ScrollView>

        <BottomNav activeTab="reports" />
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
    gap: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.label,
    letterSpacing: 1,
  },
  summaryCard: {
    borderRadius: ComponentTokens.card.borderRadius,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  tileRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  diseaseCard: {
    borderRadius: ComponentTokens.card.borderRadius,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  divider: {
    height: 1,
  },
  diseaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  diseaseName: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  casePill: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.half,
  },
  caseCount: {
    ...Typography.caption,
    fontWeight: '800',
  },
  syncCard: {
    borderRadius: ComponentTokens.card.borderRadius,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  syncTextBlock: {
    flex: 1,
    gap: Spacing.xs,
  },
  syncTitle: {
    ...Typography.bodySmall,
    fontWeight: '800',
  },
  syncSubtitle: {
    ...Typography.caption,
  },
  recentCard: {
    borderRadius: ComponentTokens.card.borderRadius,
    borderWidth: 1,
    padding: ComponentTokens.card.padding,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  recentTextBlock: {
    flex: 1,
    gap: Spacing.xs,
  },
  recentTitle: {
    ...Typography.bodySmall,
    fontWeight: '800',
  },
  recentDate: {
    ...Typography.caption,
  },
  recentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
