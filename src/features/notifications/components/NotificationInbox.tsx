import { Feather } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import type { NotificationDestination } from '@/features/notifications/services/resolveNotificationDestination';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * The panel is a content-sized card capped at 72% of the viewport, so its list
 * cannot own a virtualized viewport. Only this many newest updates are ever
 * drawn, which keeps the panel's first paint and scroll cost independent of the
 * cached notification history.
 */
export const RECENT_NOTIFICATION_COUNT = 10;

export function NotificationInbox({
  destinations,
  errorMessage,
  notifications,
  onMarkAllRead,
  partial,
  onNotificationPress,
  readActionError,
  unreadCount,
}: {
  destinations: Map<string, NotificationDestination>;
  errorMessage: string | null;
  notifications: MobileNotification[];
  onMarkAllRead: () => void;
  partial: boolean;
  onNotificationPress: (notification: MobileNotification) => void;
  readActionError: string | null;
  unreadCount: number;
}) {
  const theme = useTheme();
  // Sorting the whole cached notification history on every parent render is
  // what scales with the cache size. The panel only ever shows the newest ten,
  // so the sort is derived once per notification change.
  const recent = useMemo(
    () =>
      [...notifications]
        .sort(
          (first, second) =>
            Date.parse(second.createdAt ?? '') - Date.parse(first.createdAt ?? ''),
        )
        .slice(0, RECENT_NOTIFICATION_COUNT),
    [notifications],
  );

  return (
    <View testID="activity.notifications" style={styles.container}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: theme.primaryDark }]}>Office updates</Text>
          <Text style={[styles.message, { color: theme.textSecondary }]}>
            {unreadCount > 0
              ? `${unreadCount} unread item${unreadCount === 1 ? '' : 's'} from the office.`
              : 'Every office update has been read.'}
          </Text>
          {errorMessage ? (
            <Text accessibilityLiveRegion="assertive" style={[styles.error, { color: theme.danger }]}>
              {errorMessage}
            </Text>
          ) : null}
          {partial ? (
            <Text accessibilityLiveRegion="polite" style={[styles.message, { color: theme.warning }]}>
              Some office updates could not be loaded.
            </Text>
          ) : null}
          {readActionError ? (
            <Text accessibilityLiveRegion="assertive" style={[styles.error, { color: theme.danger }]}>
              {readActionError}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mark all office updates as read"
          accessibilityState={{ disabled: unreadCount === 0 }}
          disabled={unreadCount === 0}
          onPress={onMarkAllRead}
          style={({ pressed }) => [
            styles.markAll,
            {
              backgroundColor: theme.surfaceMuted,
              borderColor: theme.border,
              opacity: unreadCount === 0 ? 0.5 : 1,
            },
            pressed && unreadCount > 0 ? styles.pressed : null,
          ]}>
          <Feather name="check-circle" size={16} color={theme.primaryDark} />
          <Text style={[styles.markAllText, { color: theme.primaryDark }]}>Mark all read</Text>
        </Pressable>
      </View>

      {recent.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>
          Office review results and assignments appear here after a refresh.
        </Text>
      ) : (
        <View>
          {recent.map((notification, index) => (
            <NotificationRow
              destination={destinations.get(notification.id)}
              index={index}
              key={notification.id}
              notification={notification}
              onPress={onNotificationPress}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * One office-update row. Memoized so a panel re-render that does not change the
 * notification, its resolved destination, or the memoized press handler cannot
 * re-render every row in the list.
 */
const NotificationRow = memo(function NotificationRow({
  destination,
  index,
  notification,
  onPress,
}: {
  destination: NotificationDestination | undefined;
  index: number;
  notification: MobileNotification;
  onPress: (notification: MobileNotification) => void;
}) {
  const theme = useTheme();
  const actionable =
    Boolean(notification.content || notification.advisory) ||
    (destination !== undefined && destination.kind !== 'unavailable');

  return (
    <Pressable
      testID={`activity.notification.${notification.id}`}
      accessibilityRole={actionable ? 'button' : 'text'}
      accessibilityLabel={`${notification.title}: ${notification.message}`}
      onPress={() => onPress(notification)}
      style={({ pressed }) => [
        styles.item,
        {
          borderTopColor: theme.divider,
          borderTopWidth: index === 0 ? 0 : 1,
        },
        pressed && actionable ? styles.pressed : null,
      ]}>
      <View
        style={[
          styles.marker,
          { backgroundColor: notification.isRead ? theme.border : theme.primary },
        ]}
      />
      <View style={styles.itemCopy}>
        <View style={styles.itemTitleRow}>
          <Text style={[styles.itemTitle, { color: theme.primaryDark }]}>
            {notification.title}
          </Text>
          {!notification.isRead ? (
            <Text style={[styles.unread, { color: theme.primary }]}>Unread</Text>
          ) : null}
        </View>
        <Text style={[styles.itemMessage, { color: theme.textSecondary }]}>
          {notification.message}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {destination?.kind === 'unavailable'
            ? 'This case is not stored on this device'
            : `${notification.referenceCode ?? 'Case activity'}${notification.createdAt ? ` · ${formatDate(notification.createdAt)}` : ''}`}
        </Text>
      </View>
      {actionable ? (
        <Feather name="chevron-right" size={18} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );
});

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(date);
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  copy: { flex: 1, gap: Spacing.xs },
  title: { ...Typography.bodySmall, fontWeight: '800' },
  message: { ...Typography.caption },
  error: { ...Typography.caption },
  empty: { ...Typography.caption },
  markAll: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  markAllText: { ...Typography.caption, fontWeight: '800' },
  item: {
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  marker: { width: 7, height: 7, borderRadius: Radius.full, marginTop: 6 },
  itemCopy: { flex: 1, gap: Spacing.xs },
  itemTitleRow: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },
  itemTitle: { ...Typography.caption, fontWeight: '800', flex: 1 },
  unread: { ...Typography.caption, fontWeight: '800' },
  itemMessage: { ...Typography.caption },
  meta: { ...Typography.caption },
  pressed: { opacity: 0.72 },
});
