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
import { NeedsAttentionPanel } from '@/features/activity/components/NeedsAttentionPanel';
import {
  buildNeedsAttention,
  type NeedsAttentionItem,
} from '@/features/activity/domain/needsAttention';
import {
  describeRefreshAllResult,
  type RefreshAllTarget,
} from '@/features/activity/domain/refreshAll';
import { useRefreshAll } from '@/features/activity/hooks/useRefreshAll';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import { NotificationInbox } from '@/features/notifications/components/NotificationInbox';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import { useNotificationDestinations } from '@/features/notifications/hooks/useNotificationDestinations';
import { notificationDestinationRoute } from '@/features/notifications/services/resolveNotificationDestination';
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
import { useMobileNotifications } from '@/features/notifications/hooks/useMobileNotifications';
import { useSync } from '@/features/sync/hooks/useSync';
import { useTheme } from '@/hooks/use-theme';

export default function ActivityScreen() {
  const theme = useTheme();
  const [activeFilter, setActiveFilter] = useState<CurrentActivityFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [attentionExpanded, setAttentionExpanded] = useState(false);
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
  const notifications = useMobileNotifications();
  const destinations = useNotificationDestinations(notifications.notifications);
  const sync = useSync();
  const visibleAssignments =
    activeFilter === 'all' || activeFilter === 'assignments'
      ? assignments.assignments.filter((assignment) => matchesSearch(assignment, submittedSearch))
      : [];
  const visibleRecords = activeFilter === 'assignments' ? [] : records.data;
  const timeline = [
    ...visibleAssignments.map((assignment) => ({
      assignment,
      id: assignment.id,
      kind: 'assignment' as const,
      timestamp: assignment.updatedAt,
    })),
    ...visibleRecords.map((record) => ({
      id: record.id,
      kind: 'record' as const,
      record,
      timestamp: record.createdAt,
    })),
  ].sort((first, second) =>
    Date.parse(second.timestamp) - Date.parse(first.timestamp) ||
    second.id.localeCompare(first.id),
  );
  const hasFilters = activeFilter !== 'all' || Boolean(submittedSearch);
  const latestVisibleRecordId = timeline.find((item) => item.kind === 'record')?.id;
  const activityCount = timeline.length;
  const attention = buildNeedsAttention({
    assignments: assignments.assignments,
    destinations,
    notifications: notifications.notifications,
    pendingUploadCount: sync.pendingCount,
    syncErrorMessage: sync.errorMessage,
    today: new Date().toISOString().slice(0, 10),
  });
  const buildRefreshTargets = (): RefreshAllTarget[] => {
    const targets: RefreshAllTarget[] = [
      { key: 'notifications', run: () => notifications.refresh() },
      { key: 'officeReview', run: () => authorityStatus.refresh() },
      { key: 'assignments', run: () => assignments.refresh() },
      { key: 'records', run: () => records.refresh() },
    ];
    if (sync.isOnline === true) {
      targets.unshift({
        key: 'sync',
        run: async () => void (await sync.syncNow('manual')),
      });
    }
    return targets;
  };
  const { refreshAll, refreshing: refreshingAll, result: refreshAllResult } =
    useRefreshAll();
  const refreshMessage = describeRefreshAllResult(refreshAllResult);
  const subsystemErrors = [
    authorityStatus.errorMessage,
    assignments.errorMessage,
  ].filter((message): message is string => Boolean(message));

  const submitSearch = () => {
    setSubmittedSearch(searchInput.trim());
  };

  const clearFilters = () => {
    setActiveFilter('all');
    setSearchInput('');
    setSubmittedSearch('');
  };

  const openNotification = (notification: MobileNotification) => {
    const destination = destinations.get(notification.id);
    if (!destination || destination.kind === 'unavailable') return;
    // Acknowledgment is best effort: a failed read mutation never blocks the
    // inspector from opening the destination.
    void notifications.markRead(notification.id);
    const route = notificationDestinationRoute(destination);
    setNotificationsOpen(false);
    if (route) {
      router.push(route as never);
    }
  };

  const openAttentionItem = (item: NeedsAttentionItem) => {
    if (!item.destination) return;
    const route = notificationDestinationRoute(item.destination);
    if (!route) return;
    if (item.kind === 'notification') {
      const notificationId = item.id.replace(/^notification-/, '');
      void notifications.markRead(notificationId);
    }
    router.push(route as never);
  };

  return (
    <SafeAreaView
      testID="activity.screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top']}>
      <View style={styles.root}>
        <BrandedScreenHeader
          title="Activity"
          showBack={false}
          subtitle="One place for your field work. Reports and scans stay on this device."
          action={
            <Pressable
              testID="activity.notifications-toggle"
              accessibilityRole="button"
              accessibilityLabel={
                notificationsOpen ? 'Hide office updates' : 'Show office updates'
              }
              accessibilityState={{ expanded: notificationsOpen }}
              onPress={() => setNotificationsOpen((value) => !value)}
              style={({ pressed }) => [
                styles.bell,
                {
                  backgroundColor: notificationsOpen
                    ? theme.primary
                    : theme.surfaceElevated,
                  borderColor: notificationsOpen ? theme.primary : theme.border,
                },
                pressed && styles.pressed,
              ]}>
              <Feather
                name="bell"
                size={21}
                color={notificationsOpen ? theme.background : theme.primaryDark}
              />
              {notifications.unreadCount > 0 ? (
                <View style={[styles.badge, { backgroundColor: theme.danger }]}>
                  <Text style={[styles.badgeText, { color: theme.background }]}>
                    {notifications.unreadCount > 9 ? '9+' : notifications.unreadCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          }
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoiding}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              {activeFilter !== 'scans' ? (
                <NeedsAttentionPanel
                  expanded={attentionExpanded}
                  onOpenItem={openAttentionItem}
                  onToggleExpanded={() => setAttentionExpanded((value) => !value)}
                  summary={attention}
                />
              ) : null}

              {activeFilter !== 'scans' && notificationsOpen ? (
                <NotificationInbox
                  destinations={destinations}
                  errorMessage={notifications.errorMessage}
                  notifications={notifications.notifications}
                  onMarkAllRead={() => void notifications.markAllRead()}
                  onNotificationPress={openNotification}
                  readActionError={notifications.readActionError}
                  unreadCount={notifications.unreadCount}
                />
              ) : null}

              {activeFilter !== 'scans' ? (
                <View testID="activity.refresh-scope" style={styles.refreshScope}>
                  <SyncStatusPanel showAction={false} />
                  <AppButton
                    testID="activity.refresh-all"
                    onPress={() => void refreshAll(buildRefreshTargets())}
                    disabled={refreshingAll}
                    variant="secondary"
                    leadingIcon="refresh-cw"
                    accessibilityLabel={
                      refreshingAll ? 'Refreshing all activity' : 'Refresh all activity'
                    }>
                    {refreshingAll ? 'Refreshing...' : 'Refresh all'}
                  </AppButton>
                  {refreshMessage ? (
                    <Text
                      accessibilityLiveRegion="polite"
                      style={[styles.refreshMessage, { color: theme.textSecondary }]}>
                      {refreshMessage}
                    </Text>
                  ) : null}
                  {subsystemErrors.map((message) => (
                    <Text
                      key={message}
                      accessibilityLiveRegion="assertive"
                      style={[styles.refreshMessage, { color: theme.danger }]}>
                      {message}
                    </Text>
                  ))}
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
                    {timeline.map((item) =>
                      item.kind === 'assignment' ? (
                        <AssignmentCard
                          key={`assignment-${item.assignment.id}`}
                          testID={`activity.assignment.${item.assignment.id}`}
                          assignment={item.assignment}
                          onPress={() =>
                            router.push({
                              pathname: '/field-validation',
                              params: { assignmentId: item.assignment.id },
                            } as never)
                          }
                        />
                      ) : (
                        <RecordCard
                          key={item.record.id}
                          testID={
                            item.id === latestVisibleRecordId
                              ? 'activity.latest-record'
                              : `activity.item.${item.record.id}`
                          }
                          activityType={getActivityItemKind(item.record.hasFieldReport)}
                          record={item.record}
                          onPress={() =>
                            router.push({
                              pathname: '/record-details',
                              params: { id: item.record.id },
                            } as unknown as Href)
                          }
                        />
                      ),
                    )}
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
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  },
  bell: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { ...Typography.caption, fontSize: 11, fontWeight: '800' },
  refreshScope: { gap: Spacing.sm },
  refreshMessage: { ...Typography.caption },
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
