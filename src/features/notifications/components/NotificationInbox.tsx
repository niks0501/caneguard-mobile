import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import { AppButton } from '@/components/ui/AppButton';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function NotificationInbox({
  errorMessage,
  notifications,
  onNotificationPress,
  onRefresh,
  refreshing,
  unreadCount,
}: {
  errorMessage: string | null;
  notifications: MobileNotification[];
  onNotificationPress: (notification: MobileNotification) => void;
  onRefresh: () => void;
  refreshing: boolean;
  unreadCount: number;
}) {
  const theme = useTheme();
  const recent = [...notifications]
    .sort((first, second) => Date.parse(second.createdAt ?? '') - Date.parse(first.createdAt ?? ''))
    .slice(0, 10);

  return (
    <View
      testID="activity.notifications"
      style={[styles.container, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
    >
      <View style={styles.header}>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Feather name="bell" size={18} color={theme.primary} />
            <Text style={[styles.title, { color: theme.primaryDark }]}>Attention items</Text>
          </View>
          <Text style={[styles.message, { color: theme.textSecondary }]}>
            {unreadCount > 0
              ? `${unreadCount} unread item${unreadCount === 1 ? '' : 's'} from the office.`
              : 'Your latest office attention items are saved on this device.'}
          </Text>
          {errorMessage ? (
            <Text accessibilityLiveRegion="assertive" style={[styles.error, { color: theme.danger }]}>
              {errorMessage}
            </Text>
          ) : null}
        </View>
        <AppButton
          onPress={onRefresh}
          disabled={refreshing}
          variant="secondary"
          leadingIcon="refresh-cw"
          accessibilityLabel={refreshing ? 'Refreshing notifications' : 'Refresh notifications'}>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </AppButton>
      </View>

      {recent.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>No office attention items yet.</Text>
      ) : (
        <View style={styles.list}>
          {recent.map((notification) => (
            <Pressable
              key={notification.id}
              testID={`activity.notification.${notification.id}`}
              accessibilityRole={notification.assignmentUuid ? 'button' : 'text'}
              accessibilityLabel={`${notification.title}: ${notification.message}`}
              onPress={() => onNotificationPress(notification)}
              style={({ pressed }) => [
                styles.item,
                {
                  backgroundColor: notification.isRead ? theme.surfaceElevated : theme.background,
                  borderColor: notification.isRead ? theme.border : theme.primary,
                },
                pressed && notification.assignmentUuid ? styles.pressed : null,
              ]}>
              <View style={[styles.marker, { backgroundColor: notification.isRead ? theme.border : theme.primary }]} />
              <View style={styles.itemCopy}>
                <View style={styles.itemTitleRow}>
                  <Text style={[styles.itemTitle, { color: theme.primaryDark }]}>{notification.title}</Text>
                  {!notification.isRead ? <Text style={[styles.unread, { color: theme.primary }]}>Unread</Text> : null}
                </View>
                <Text style={[styles.itemMessage, { color: theme.textSecondary }]}>{notification.message}</Text>
                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                  {notification.referenceCode ?? 'Case activity'}{notification.createdAt ? ` · ${formatDate(notification.createdAt)}` : ''}
                </Text>
              </View>
              {notification.assignmentUuid ? <Feather name="chevron-right" size={18} color={theme.textSecondary} /> : null}
            </Pressable>
          ))}
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
  container: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  copy: { flex: 1, gap: Spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  title: { ...Typography.bodySmall, fontWeight: '800' },
  message: { ...Typography.caption },
  error: { ...Typography.caption },
  empty: { ...Typography.caption },
  list: { gap: Spacing.xs },
  item: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  marker: { width: 7, height: 7, borderRadius: Radius.full, marginTop: 6 },
  itemCopy: { flex: 1, gap: 2 },
  itemTitleRow: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },
  itemTitle: { ...Typography.caption, fontWeight: '800', flex: 1 },
  unread: { ...Typography.caption, fontWeight: '800' },
  itemMessage: { ...Typography.caption },
  meta: { ...Typography.caption, fontSize: 11 },
  pressed: { opacity: 0.72 },
});
