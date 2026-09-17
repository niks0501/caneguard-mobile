import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import type { NotificationDestination } from '@/features/notifications/services/resolveNotificationDestination';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function NotificationInbox({
  destinations,
  errorMessage,
  notifications,
  onMarkAllRead,
  onNotificationPress,
  readActionError,
  unreadCount,
}: {
  destinations: Map<string, NotificationDestination>;
  errorMessage: string | null;
  notifications: MobileNotification[];
  onMarkAllRead: () => void;
  onNotificationPress: (notification: MobileNotification) => void;
  readActionError: string | null;
  unreadCount: number;
}) {
  const theme = useTheme();
  const recent = [...notifications]
    .sort((first, second) => Date.parse(second.createdAt ?? '') - Date.parse(first.createdAt ?? ''))
    .slice(0, 10);

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
          {recent.map((notification, index) => {
            const destination = destinations.get(notification.id);
            const actionable =
              destination !== undefined && destination.kind !== 'unavailable';
            return (
              <Pressable
                key={notification.id}
                testID={`activity.notification.${notification.id}`}
                accessibilityRole={actionable ? 'button' : 'text'}
                accessibilityLabel={`${notification.title}: ${notification.message}`}
                onPress={() => onNotificationPress(notification)}
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
          })}
        </View>
      )}
    </View>
  );
}

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
