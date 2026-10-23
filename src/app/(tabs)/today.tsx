import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppButton } from '@/components/ui/AppButton';
import { ComponentTokens, Layout, Spacing, Typography } from '@/constants/theme';
import { AssignmentCard } from '@/features/activity/components/AssignmentCard';
import {
  TODAY_VISIT_BUCKETS,
  bucketForVisit,
  type TodayVisitBucket,
} from '@/features/assignments/domain/todayVisits';
import { useTodayVisits } from '@/features/assignments/hooks/useTodayVisits';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/hooks/use-theme';

const BUCKET_LABELS: Record<TodayVisitBucket, string> = {
  overdue: 'Overdue',
  today: 'Due today',
  upcoming: 'Upcoming',
  none: 'No date',
};

function formatLastUpdated(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : `Last updated ${date.toLocaleString()}`;
}

export default function TodayScreen() {
  const theme = useTheme();
  const { showToast } = useToast();
  const state = useTodayVisits();
  const groups = TODAY_VISIT_BUCKETS.map((bucket) => ({
    bucket,
    visits: state.visits.filter((visit) => bucketForVisit(visit, state.today) === bucket),
  })).filter(({ visits }) => visits.length > 0);
  const lastUpdated = formatLastUpdated(state.lastSuccessfulAt);
  const hasVisits = state.visits.length > 0;
  const completedLabel = `${state.completedTodayCount} ${
    state.completedTodayCount === 1 ? 'visit' : 'visits'
  } completed today`;

  const handleRefresh = async () => {
    const success = await state.refresh();
    if (success) {
      showToast('Assignments refreshed', 'info');
    } else {
      showToast('Refresh failed', 'error');
    }
  };

  return (
    <SafeAreaView testID="today.screen" style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="Today's field work" subtitle="Visits ordered by due date and barangay." showBack={false} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {state.errorMessage || state.capabilityUnavailable ? (
              <View
                testID="today.refresh-error"
                accessibilityLiveRegion="polite"
                style={[styles.noticeCard, { backgroundColor: theme.warningBg, borderColor: theme.warning }]}>
                <Text style={[styles.noticeTitle, { color: theme.warning }]}>
                  {state.capabilityUnavailable
                    ? 'Visit assignments unavailable'
                    : hasVisits
                      ? 'Could not refresh visits'
                      : 'Visits could not be refreshed'}
                </Text>
                <Text testID="today.refresh-message" style={[styles.noticeBody, { color: theme.text }]}>
                  {state.capabilityUnavailable
                    ? 'This server does not provide visit assignments. Any visits already downloaded stay on this device.'
                    : hasVisits
                      ? 'Showing the visits already downloaded on this device. Refresh when the connection returns.'
                      : 'Nothing was downloaded on this refresh. Any saved visits stay on this device — this is not proof that the office assigned none.'}
                </Text>
              </View>
            ) : null}

            {lastUpdated ? (
              <Text testID="today.last-updated" style={[styles.lastUpdated, { color: theme.textSecondary }]}>
                {lastUpdated}
              </Text>
            ) : null}

            {state.refreshing && !hasVisits && !state.errorMessage && !state.lastSuccessfulAt ? (
              <View style={styles.centered}>
                <ActivityIndicator accessibilityLabel="Loading today's field work" color={theme.primary} />
              </View>
            ) : hasVisits ? (
              <>
                {groups.map(({ bucket, visits }) => (
                  <View key={bucket} testID={`today.bucket.${bucket}`} style={styles.group}>
                    <View style={styles.groupHeading}>
                      <Text style={[styles.groupTitle, { color: theme.primaryDark }]}>{BUCKET_LABELS[bucket]}</Text>
                      <Text style={[styles.groupCount, { color: theme.textSecondary }]}>{visits.length}</Text>
                    </View>
                    {visits.map((assignment) => (
                      <View key={assignment.id} testID={`today.visit.${assignment.id}`} style={styles.visit}>
                        <AssignmentCard
                          assignment={assignment}
                          dueState={bucket}
                          today={state.today}
                          onPress={() => router.push({ pathname: '/field-validation', params: { assignmentId: assignment.id } } as never)}
                        />
                      </View>
                    ))}
                  </View>
                ))}
              </>
            ) : state.capabilityUnavailable ? (
              <EmptyState
                icon="clipboard"
                title="Visits are not available"
                message="This server does not provide visit assignments for this account. Downloaded visits stay readable offline."
                testID="today.state.capability-unavailable">
                <AppButton onPress={() => void handleRefresh()} leadingIcon="refresh-cw">Refresh assignments</AppButton>
              </EmptyState>
            ) : state.errorMessage ? (
              <EmptyState
                icon="cloud-off"
                title="No visits downloaded"
                message="The last refresh did not complete, so CaneGuard cannot say whether the office assigned visits. Saved work on this device is unchanged."
                testID="today.state.refresh-failed">
                <AppButton onPress={() => void handleRefresh()} leadingIcon="refresh-cw">Refresh assignments</AppButton>
              </EmptyState>
            ) : state.completedTodayCount > 0 ? (
              <EmptyState
                icon="check-circle"
                title="All today's visits completed"
                message="You finished every open visit for today. New visits from the office appear here after a refresh."
                testID="today.state.all-completed">
                <AppButton onPress={() => void handleRefresh()} leadingIcon="refresh-cw">Refresh assignments</AppButton>
              </EmptyState>
            ) : (
              <EmptyState
                icon="clipboard"
                title="No open visits"
                message="Visits that are due, overdue, or upcoming appear here after a successful refresh."
                testID="today.state.no-open-visits">
                <AppButton onPress={() => void handleRefresh()} leadingIcon="refresh-cw">Refresh assignments</AppButton>
              </EmptyState>
            )}

            {state.completedTodayCount > 0 ? (
              <Text testID="today.completed-count" style={[styles.completed, { color: theme.success }]}>
                {completedLabel}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingBottom: Spacing.xl },
  content: { width: '100%', maxWidth: Layout.mobileMaxWidth, paddingHorizontal: ComponentTokens.screen.horizontalPadding, paddingVertical: Spacing.lg, gap: Spacing.lg },
  centered: { minHeight: 220, alignItems: 'center', justifyContent: 'center' },
  noticeCard: { borderWidth: 1, borderRadius: Spacing.md, padding: Spacing.md, gap: Spacing.xs },
  noticeTitle: { ...Typography.bodySmall, fontWeight: '800' },
  noticeBody: { ...Typography.caption },
  lastUpdated: { ...Typography.caption },
  refreshMessage: { ...Typography.caption },
  group: { gap: Spacing.sm },
  groupHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xs },
  groupTitle: { ...Typography.subheading, fontWeight: '800' },
  groupCount: { ...Typography.caption, fontWeight: '800' },
  visit: { gap: Spacing.xs },
  completed: { ...Typography.bodySmall, fontWeight: '800', textAlign: 'center' },
});
