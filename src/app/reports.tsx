import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BottomNav } from '@/components/ui/BottomNav';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { RecordCard } from '@/components/ui/RecordCard';
import { SummaryTile } from '@/components/ui/SummaryTile';
import {
  ComponentTokens,
  Layout,
  Radius,
  Spacing,
  Typography,
  type ThemeColor,
} from '@/constants/theme';
import type { RecordsByLabel } from '@/features/records/domain/recordTypes';
import {
  PROTOTYPE_LOW_SCORE_THRESHOLD,
} from '@/features/reports/data/reportRepository';
import { useLocalReport } from '@/features/reports/hooks/useLocalReport';
import { useTheme } from '@/hooks/use-theme';

export default function ReportsScreen() {
  const theme = useTheme();
  const report = useLocalReport();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="Reports" showBack={false} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.scope}>
              <Feather name="calendar" size={16} color={theme.accentDark} />
              <Text style={[styles.scopeText, { color: theme.textSecondary }]}>
                All-time summary of observations saved on this device
              </Text>
            </View>

            {report.loading && !report.data ? (
              <StateCard
                title="Calculating local summary"
                message="Reading aggregate counts from local storage."
                liveRegion="polite">
                <ActivityIndicator
                  accessibilityLabel="Loading local report"
                  color={theme.primary}
                />
              </StateCard>
            ) : report.errorMessage || !report.data ? (
              <StateCard
                title="Report unavailable"
                message={
                  report.errorMessage ??
                  'The local report could not be calculated.'
                }
                liveRegion="assertive">
                <AppButton onPress={() => void report.refresh()} leadingIcon="refresh-cw">
                  Try Again
                </AppButton>
              </StateCard>
            ) : (
              <>
                <SectionLabel icon="pie-chart" label="LOCAL SUMMARY" />
                <View
                  style={[
                    styles.summary,
                    {
                      backgroundColor: theme.surfaceElevated,
                      borderColor: theme.border,
                    },
                  ]}>
                  <View style={styles.tileRow}>
                    <SummaryTile
                      value={report.data.totalSavedScans}
                      label="Saved observations"
                      tintColor={theme.primary}
                      tintBackground={theme.surfaceMuted}
                      icon="file-text"
                    />
                    <SummaryTile
                      value={report.data.possibleDiseasePredictions}
                      label="Possible disease results"
                      tintColor={theme.warning}
                      tintBackground={theme.warningBg}
                      icon="alert-circle"
                    />
                  </View>
                  <View style={styles.tileRow}>
                    <SummaryTile
                      value={report.data.healthyPredictions}
                      label="Healthy predictions"
                      tintColor={theme.success}
                      tintBackground={theme.successBg}
                      icon="check-circle"
                    />
                    <SummaryTile
                      value={report.data.pendingSyncRecords}
                      label="Awaiting synchronization"
                      tintColor={theme.warning}
                      tintBackground={theme.warningBg}
                      icon="upload-cloud"
                    />
                  </View>
                </View>

                {report.data.totalSavedScans === 0 ? (
                  <StateCard
                    title="No saved observations yet"
                    message="Complete an analysis and save it to build an offline summary.">
                    <AppButton
                      onPress={() => router.push('/scan')}
                      leadingIcon="camera">
                      Start Scan
                    </AppButton>
                  </StateCard>
                ) : (
                  <>
                    <SectionLabel
                      icon="bar-chart-2"
                      label="RECORDS BY PREDICTED CLASS"
                    />
                    <View
                      style={[
                        styles.classCard,
                        {
                          backgroundColor: theme.surfaceElevated,
                          borderColor: theme.border,
                        },
                      ]}>
                      {report.data.recordsByLabel.map((item, index) => (
                        <ClassCount
                          key={item.label}
                          item={item}
                          maximum={Math.max(
                            ...report.data!.recordsByLabel.map(
                              (entry) => entry.count,
                            ),
                          )}
                          bordered={index > 0}
                        />
                      ))}
                    </View>

                    <View
                      style={[
                        styles.prototype,
                        {
                          backgroundColor: theme.warningBg,
                          borderColor: theme.warning,
                        },
                      ]}>
                      <Feather
                        name="info"
                        size={19}
                        color={theme.warning}
                      />
                      <View style={styles.prototypeCopy}>
                        <Text
                          style={[
                            styles.prototypeTitle,
                            { color: theme.primaryDark },
                          ]}>
                          {report.data.lowScorePredictions} low top-score{' '}
                          {report.data.lowScorePredictions === 1
                            ? 'record'
                            : 'records'}
                        </Text>
                        <Text
                          style={[
                            styles.prototypeText,
                            { color: theme.textSecondary },
                          ]}>
                          Prototype presentation rule: highest class score below{' '}
                          {Math.round(PROTOTYPE_LOW_SCORE_THRESHOLD * 100)}%.
                          This is not a calibrated reliability threshold.
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.offline,
                        {
                          backgroundColor: theme.infoBg,
                          borderColor: theme.info,
                        },
                      ]}>
                      <Feather name="wifi-off" size={22} color={theme.info} />
                      <View style={styles.offlineCopy}>
                        <Text
                          style={[
                            styles.offlineTitle,
                            { color: theme.primaryDark },
                          ]}>
                          Stored locally
                        </Text>
                        <Text
                          style={[
                            styles.offlineText,
                            { color: theme.textSecondary },
                          ]}>
                          CaneGuard is not connected to MAO. These are local AI
                          predictions, not submitted or confirmed diagnoses.
                        </Text>
                      </View>
                    </View>

                    <SectionLabel icon="clock" label="RECENT RECORDS" />
                    <View style={styles.recentList}>
                      {report.data.recentRecords.map((record) => (
                        <RecordCard
                          key={record.id}
                          record={record}
                          onPress={() =>
                            router.push({
                              pathname: '/record-details',
                              params: { id: record.id },
                            } as unknown as Href)
                          }
                        />
                      ))}
                    </View>
                  </>
                )}
              </>
            )}
            <View style={styles.bottomSpace} />
          </View>
        </ScrollView>
        <BottomNav activeTab="reports" />
      </View>
    </SafeAreaView>
  );
}

function SectionLabel({
  icon,
  label,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.sectionLabel}>
      <Feather name={icon} size={16} color={theme.accentDark} />
      <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

function ClassCount({
  bordered,
  item,
  maximum,
}: {
  bordered: boolean;
  item: RecordsByLabel;
  maximum: number;
}) {
  const theme = useTheme();
  const presentation = getClassPresentation(item.label);
  return (
    <View
      style={[
        styles.classItem,
        bordered && {
          borderTopColor: theme.divider,
          borderTopWidth: 1,
        },
      ]}>
      <View style={styles.classHeader}>
        <View style={styles.classTitle}>
          <View
            style={[
              styles.classIcon,
              { backgroundColor: theme[presentation.background] },
            ]}>
            <Feather
              name={presentation.icon}
              size={17}
              color={theme[presentation.color]}
            />
          </View>
          <Text style={[styles.className, { color: theme.primaryDark }]}>
            {presentation.label}
          </Text>
        </View>
        <Text style={[styles.classCount, { color: theme.textSecondary }]}>
          {item.count} {item.count === 1 ? 'record' : 'records'}
        </Text>
      </View>
      <ProgressBar
        progress={maximum > 0 ? item.count / maximum : 0}
        color={theme[presentation.color]}
      />
    </View>
  );
}

function StateCard({
  children,
  liveRegion,
  message,
  title,
}: {
  children: React.ReactNode;
  liveRegion?: 'none' | 'polite' | 'assertive';
  message: string;
  title: string;
}) {
  const theme = useTheme();
  return (
    <View
      accessibilityLiveRegion={liveRegion}
      style={[
        styles.stateCard,
        { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
      ]}>
      <Feather name="bar-chart-2" size={28} color={theme.primary} />
      <Text style={[styles.stateTitle, { color: theme.primaryDark }]}>
        {title}
      </Text>
      <Text style={[styles.stateMessage, { color: theme.textSecondary }]}>
        {message}
      </Text>
      <View style={styles.stateAction}>{children}</View>
    </View>
  );
}

function getClassPresentation(label: string): {
  background: ThemeColor;
  color: ThemeColor;
  icon: keyof typeof Feather.glyphMap;
  label: string;
} {
  if (label === 'healthy') {
    return {
      background: 'healthyBg',
      color: 'healthy',
      icon: 'check-circle',
      label: 'Healthy',
    };
  }
  if (label === 'mosaic') {
    return {
      background: 'mosaicBg',
      color: 'mosaic',
      icon: 'grid',
      label: 'Mosaic',
    };
  }
  if (label === 'rust') {
    return {
      background: 'rustBg',
      color: 'rust',
      icon: 'sun',
      label: 'Rust',
    };
  }
  return {
    background: 'unclearBg',
    color: 'unclear',
    icon: 'help-circle',
    label,
  };
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
    gap: Spacing.lg,
  },
  scope: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scopeText: { ...Typography.caption, flex: 1 },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionText: { ...Typography.label, letterSpacing: 1 },
  summary: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  tileRow: { flexDirection: 'row', gap: Spacing.sm },
  classCard: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
  },
  classItem: {
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 0,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  classTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  classIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  className: { ...Typography.bodySmall, fontWeight: '800', flex: 1 },
  classCount: { ...Typography.caption, fontWeight: '700' },
  prototype: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  prototypeCopy: { flex: 1, gap: Spacing.xs },
  prototypeTitle: { ...Typography.bodySmall, fontWeight: '800' },
  prototypeText: { ...Typography.caption },
  offline: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  offlineCopy: { flex: 1, gap: Spacing.xs },
  offlineTitle: { ...Typography.body, fontWeight: '800' },
  offlineText: { ...Typography.caption },
  recentList: { gap: Spacing.md },
  stateCard: {
    minHeight: 220,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  stateTitle: { ...Typography.subheading, textAlign: 'center' },
  stateMessage: { ...Typography.bodySmall, textAlign: 'center' },
  stateAction: { width: '100%', marginTop: Spacing.sm },
  bottomSpace: { height: Layout.bottomNavHeight + Spacing['3xl'] },
});
