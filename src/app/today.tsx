import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/ui/BottomNav';
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
import { useTheme } from '@/hooks/use-theme';

const BUCKET_LABELS: Record<TodayVisitBucket, string> = {
  overdue: 'Overdue',
  today: 'Due today',
  upcoming: 'Upcoming',
  none: 'No date',
};

export default function TodayScreen() {
  const theme = useTheme();
  const state = useTodayVisits();
  const groups = TODAY_VISIT_BUCKETS.map((bucket) => ({
    bucket,
    visits: state.visits.filter((visit) => bucketForVisit(visit, state.today) === bucket),
  })).filter(({ visits }) => visits.length > 0);

  return (
    <SafeAreaView testID="today.screen" style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="Today's field work" subtitle="Visits ordered by due date and barangay." showBack />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {state.errorMessage ? (
              <Text testID="today.refresh-message" style={[styles.refreshMessage, { color: theme.textSecondary }]}>{state.errorMessage}</Text>
            ) : null}
            {state.refreshing && state.visits.length === 0 ? (
              <View style={styles.centered}><ActivityIndicator accessibilityLabel="Loading today's field work" color={theme.primary} /></View>
            ) : state.visits.length === 0 ? (
              <EmptyState
                icon="clipboard"
                title="No visits assigned yet"
                message="Assignments from the office appear here after a refresh.">
                <AppButton onPress={() => void state.refresh()} leadingIcon="refresh-cw">Refresh assignments</AppButton>
              </EmptyState>
            ) : (
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
                {state.completedTodayCount > 0 ? (
                  <Text testID="today.completed-count" style={[styles.completed, { color: theme.success }]}>{state.completedTodayCount} {state.completedTodayCount === 1 ? 'visit' : 'visits'} completed today</Text>
                ) : null}
              </>
            )}
          </View>
        </ScrollView>
        <BottomNav activeTab="home" />
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
  refreshMessage: { ...Typography.caption },
  group: { gap: Spacing.sm },
  groupHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xs },
  groupTitle: { ...Typography.subheading, fontWeight: '800' },
  groupCount: { ...Typography.caption, fontWeight: '800' },
  visit: { gap: Spacing.xs },
  completed: { ...Typography.bodySmall, fontWeight: '800', textAlign: 'center' },
});
