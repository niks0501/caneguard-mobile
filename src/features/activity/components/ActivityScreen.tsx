import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AssignmentCard } from '@/features/activity/components/AssignmentCard';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import { RecordCard } from '@/components/ui/RecordCard';
import { AppButton } from '@/components/ui/AppButton';
import { BottomNav } from '@/components/ui/BottomNav';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { SyncStatusPanel } from '@/components/ui/SyncStatusPanel';
import {
  ComponentTokens,
  Layout,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import {
  ACTIVITY_FILTERS,
  getActivityItemKind,
  type CurrentActivityFilter,
} from '@/features/activity/domain/activityTypes';
import { useFieldValidationAssignments } from '@/features/assignments/hooks/useFieldValidationAssignments';
import { DEFAULT_RECORD_PAGE_SIZE } from '@/features/records/domain/recordTypes';
import { usePaginatedScanRecords } from '@/features/records/hooks/useRecords';
import { useAuthorityReviewStatus } from '@/features/reports/hooks/useAuthorityReviewStatus';
import { useTheme } from '@/hooks/use-theme';

export default function ActivityScreen() {
  const theme = useTheme();
  const [activeFilter, setActiveFilter] = useState<CurrentActivityFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const hasFieldReport =
    activeFilter === 'reports'
      ? true
      : activeFilter === 'scans'
        ? false
        : undefined;
  const records = usePaginatedScanRecords(
    {
      hasFieldReport,
      search: submittedSearch || undefined,
    },
    DEFAULT_RECORD_PAGE_SIZE,
  );
  const authorityStatus = useAuthorityReviewStatus(activeFilter !== 'assignments');
  const assignments = useFieldValidationAssignments();
  const visibleAssignments =
    activeFilter === 'all' || activeFilter === 'assignments'
      ? assignments.assignments.filter((assignment) => matchesSearch(assignment, submittedSearch))
      : [];
  const visibleRecords = activeFilter === 'assignments' ? [] : records.data;
  const hasFilters = activeFilter !== 'all' || Boolean(submittedSearch);
  const activityCount = visibleRecords.length + visibleAssignments.length;

  const submitSearch = () => {
    setSubmittedSearch(searchInput.trim());
  };

  const clearFilters = () => {
    setActiveFilter('all');
    setSearchInput('');
    setSubmittedSearch('');
  };

  return (
    <SafeAreaView
      testID="activity.screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="Activity" showBack={false} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoiding}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              <View
                style={[
                  styles.intro,
                  {
                    backgroundColor: theme.surfaceMuted,
                    borderColor: theme.border,
                  },
                ]}>
                <View style={[styles.introIcon, { backgroundColor: theme.surfaceElevated }]}>
                  <Feather name="activity" size={20} color={theme.primary} />
                </View>
                <Text style={[styles.introText, { color: theme.textSecondary }]}>
                  One place for your field work. Reports and scan-only observations stay available on this device.
                </Text>
              </View>

              {activeFilter !== 'scans' ? <SyncStatusPanel /> : null}

              {activeFilter !== 'scans' ? (
                <View
                  testID="activity.authority-status-refresh"
                  style={[
                    styles.authorityRefresh,
                    {
                      backgroundColor: theme.surfaceMuted,
                      borderColor: theme.border,
                    },
                  ]}>
                  <View style={styles.authorityRefreshCopy}>
                    <Text style={[styles.authorityRefreshTitle, { color: theme.primaryDark }]}>
                      Office review updates
                    </Text>
                    <Text style={[styles.authorityRefreshMessage, { color: theme.textSecondary }]}>
                      Synchronized reports show the latest review status when available.
                    </Text>
                    {authorityStatus.errorMessage ? (
                      <Text
                        accessibilityLiveRegion="assertive"
                        style={[styles.authorityRefreshMessage, { color: theme.danger }]}>
                        {authorityStatus.errorMessage}
                      </Text>
                    ) : null}
                  </View>
                  <AppButton
                    onPress={() => void authorityStatus.refresh()}
                    disabled={authorityStatus.refreshing}
                    variant="secondary"
                    leadingIcon="refresh-cw"
                    accessibilityLabel={
                      authorityStatus.refreshing
                        ? 'Refreshing office review updates'
                        : 'Refresh office review updates'
                    }>
                    {authorityStatus.refreshing ? 'Refreshing...' : 'Refresh status'}
                  </AppButton>
                </View>
              ) : null}

              {activeFilter !== 'scans' ? (
                <View
                  testID="activity.assignment-refresh"
                  style={[
                    styles.authorityRefresh,
                    {
                      backgroundColor: theme.surfaceMuted,
                      borderColor: theme.border,
                    },
                  ]}>
                  <View style={styles.authorityRefreshCopy}>
                    <Text style={[styles.authorityRefreshTitle, { color: theme.primaryDark }]}>Field assignments</Text>
                    <Text style={[styles.authorityRefreshMessage, { color: theme.textSecondary }]}>Assignments are refreshed from the server and kept on this device for field work.</Text>
                    {assignments.errorMessage ? (
                      <Text accessibilityLiveRegion="assertive" style={[styles.authorityRefreshMessage, { color: theme.danger }]}>{assignments.errorMessage}</Text>
                    ) : null}
                  </View>
                  <AppButton
                    onPress={() => void assignments.refresh()}
                    disabled={assignments.refreshing}
                    variant="secondary"
                    leadingIcon="refresh-cw"
                    accessibilityLabel={assignments.refreshing ? 'Refreshing field assignments' : 'Refresh field assignments'}>
                    {assignments.refreshing ? 'Refreshing...' : 'Refresh assignments'}
                  </AppButton>
                </View>
              ) : null}

              <View style={styles.searchRow}>
                <View
                  style={[
                    styles.search,
                    {
                      backgroundColor: theme.surfaceElevated,
                      borderColor: theme.border,
                    },
                  ]}>
                  <Feather name="search" size={20} color={theme.textSecondary} />
                  <TextInput
                    accessibilityLabel="Search activity"
                    placeholder="Search result or barangay"
                    placeholderTextColor={theme.textSecondary}
                    value={searchInput}
                    onChangeText={setSearchInput}
                    onSubmitEditing={submitSearch}
                    returnKeyType="search"
                    style={[styles.searchInput, { color: theme.text }]}
                  />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Submit activity search"
                  onPress={submitSearch}
                  style={({ pressed }) => [
                    styles.searchButton,
                    { backgroundColor: theme.primary },
                    pressed && styles.pressed,
                  ]}>
                  <Feather name="arrow-right" size={20} color={theme.background} />
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filters}>
                {ACTIVITY_FILTERS.map((filter) => {
                  const selected = activeFilter === filter.key;
                  return (
                    <Pressable
                      key={filter.key}
                      testID={`activity.filter.${filter.key}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Filter activity by ${filter.label}`}
                      accessibilityState={{ selected }}
                      onPress={() => setActiveFilter(filter.key)}
                      style={({ pressed }) => [
                        styles.filter,
                        {
                          backgroundColor: selected
                            ? theme.primary
                            : theme.surfaceMuted,
                          borderColor: selected ? theme.primary : theme.border,
                        },
                        pressed && styles.pressed,
                      ]}>
                      <Text
                        style={[
                          styles.filterText,
                          {
                            color: selected
                              ? theme.background
                              : theme.primaryDark,
                          },
                        ]}>
                        {filter.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {activeFilter !== 'assignments' && records.loading && records.data.length === 0 ? (
                <StateCard
                  icon="loader"
                  title="Loading activity"
                  message="Reading reports and scans from this device."
                  liveRegion="polite">
                  <ActivityIndicator
                    accessibilityLabel="Loading activity"
                    color={theme.primary}
                  />
                </StateCard>
              ) : activeFilter !== 'assignments' && records.errorMessage ? (
                <StateCard
                  icon="alert-triangle"
                  title="Activity unavailable"
                  message={records.errorMessage}
                  liveRegion="assertive">
                  <AppButton onPress={() => void records.refresh()} leadingIcon="refresh-cw">
                    Try Again
                  </AppButton>
                </StateCard>
              ) : (records.loading || assignments.refreshing) && activityCount === 0 ? (
                <StateCard
                  icon="loader"
                  title="Loading activity"
                  message="Reading saved reports, scans, and assignments from this device."
                  liveRegion="polite">
                  <ActivityIndicator accessibilityLabel="Loading activity" color={theme.primary} />
                </StateCard>
              ) : activityCount === 0 ? (
                <StateCard
                  icon={hasFilters ? 'search' : 'activity'}
                  title={getEmptyTitle(activeFilter, hasFilters)}
                  message={getEmptyMessage(activeFilter, hasFilters)}>
                  {hasFilters ? (
                    <AppButton onPress={clearFilters} variant="secondary">
                      Clear Filters
                    </AppButton>
                  ) : (
                    <AppButton
                      onPress={() => router.push('/scan')}
                      leadingIcon="camera">
                      Start Scan
                    </AppButton>
                  )}
                </StateCard>
              ) : (
                <>
                  <Text testID="activity.count" style={[styles.count, { color: theme.textSecondary }]}>
                    {formatActivityCount(activityCount, activeFilter)}
                  </Text>
                  <View testID="activity.timeline" style={styles.list}>
                    {visibleAssignments.map((assignment) => (
                      <AssignmentCard
                        key={`assignment-${assignment.id}`}
                        testID={`activity.assignment.${assignment.id}`}
                        assignment={assignment}
                      />
                    ))}
                    {visibleRecords.map((record) => (
                      <RecordCard
                        key={record.id}
                        testID={`activity.item.${record.id}`}
                        activityType={getActivityItemKind(record.hasFieldReport)}
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
                  {records.hasMore ? (
                    <AppButton
                      onPress={() => void records.loadMore()}
                      disabled={records.loadingMore}
                      variant="secondary">
                      {records.loadingMore ? 'Loading...' : 'Load More'}
                    </AppButton>
                  ) : null}
                </>
              )}
              <View style={styles.bottomSpace} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <BottomNav activeTab="activity" />
      </View>
    </SafeAreaView>
  );
}

function formatActivityCount(
  count: number,
  filter: CurrentActivityFilter,
): string {
  if (filter === 'all') {
    return `${count} ${count === 1 ? 'activity item' : 'activity items'}`;
  }
  return `${count} ${filter}`;
}

function matchesSearch(
  assignment: FieldValidationAssignment,
  search: string,
): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return [
    assignment.referenceCode,
    assignment.case.barangay,
    assignment.case.predictedLabel,
    assignment.submitter.name,
  ].some((value) => value.toLowerCase().includes(query));
}

function getEmptyTitle(
  filter: CurrentActivityFilter,
  hasFilters: boolean,
): string {
  if (hasFilters) {
    return 'No matching activity';
  }
  if (filter === 'reports') {
    return 'No reports yet';
  }
  if (filter === 'scans') {
    return 'No scan-only activity yet';
  }
  if (filter === 'assignments') {
    return 'No assignments yet';
  }
  return 'No activity yet';
}

function getEmptyMessage(
  filter: CurrentActivityFilter,
  hasFilters: boolean,
): string {
  if (hasFilters) {
    return 'No field activity matches the current search and filter.';
  }
  if (filter === 'reports') {
    return 'Reports sent to the office will appear here.';
  }
  if (filter === 'scans') {
    return 'Keep a scan without reporting it to the office and it will appear here.';
  }
  if (filter === 'assignments') {
    return 'Assignments from the office will appear here after a refresh.';
  }
  return 'Complete a scan to start building your field activity.';
}

function StateCard({
  children,
  icon,
  liveRegion,
  message,
  title,
}: {
  children: ReactNode;
  icon: keyof typeof Feather.glyphMap;
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
      <Feather name={icon} size={26} color={theme.primary} />
      <Text style={[styles.stateTitle, { color: theme.primaryDark }]}>{title}</Text>
      <Text style={[styles.stateMessage, { color: theme.textSecondary }]}>{message}</Text>
      <View style={styles.stateAction}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1 },
  keyboardAvoiding: { flex: 1 },
  scrollContent: { alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingVertical: Spacing.xl,
    gap: Spacing.lg,
  },
  intro: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  introIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: { ...Typography.bodySmall, flex: 1 },
  authorityRefresh: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  authorityRefreshCopy: { gap: Spacing.xs },
  authorityRefreshTitle: { ...Typography.bodySmall, fontWeight: '800' },
  authorityRefreshMessage: { ...Typography.caption },
  searchRow: { flexDirection: 'row', gap: Spacing.sm },
  search: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchInput: { ...Typography.body, flex: 1 },
  searchButton: {
    width: 54,
    height: 54,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: { gap: Spacing.sm },
  filter: {
    minHeight: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: { ...Typography.bodySmall, fontWeight: '800' },
  count: { ...Typography.label, letterSpacing: 0.8 },
  list: { gap: Spacing.md },
  stateCard: {
    minHeight: 220,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  stateTitle: { ...Typography.subheading, textAlign: 'center' },
  stateMessage: { ...Typography.bodySmall, textAlign: 'center' },
  stateAction: { width: '100%', marginTop: Spacing.sm },
  bottomSpace: { height: Layout.bottomNavHeight + Spacing['3xl'] },
  pressed: { opacity: 0.72 },
});
