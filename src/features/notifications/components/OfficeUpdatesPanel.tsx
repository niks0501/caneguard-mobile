import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OFFICE_UPDATES_PANEL_CLOSE_LABEL } from '@/constants/copy';
import { Layout, Radius, Shadows, Spacing } from '@/constants/theme';
import { NotificationInbox } from '@/features/notifications/components/NotificationInbox';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import type { NotificationDestination } from '@/features/notifications/services/resolveNotificationDestination';
import { useTheme } from '@/hooks/use-theme';

export type OfficeUpdatesPanelProps = {
  destinations: Map<string, NotificationDestination>;
  errorMessage: string | null;
  notifications: MobileNotification[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onNotificationPress: (notification: MobileNotification) => void;
  partial: boolean;
  readActionError: string | null;
  unreadCount: number;
  visible: boolean;
};

/**
 * Floating office-updates panel. It opens over whatever screen asked for it,
 * carries its own scrim, and closes when the scrim is tapped. Nothing is added
 * to the page behind it, so reading the updates never means scrolling.
 */
export function OfficeUpdatesPanel({
  destinations,
  errorMessage,
  notifications,
  onClose,
  onMarkAllRead,
  onNotificationPress,
  partial,
  readActionError,
  unreadCount,
  visible,
}: OfficeUpdatesPanelProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={[styles.root, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Pressable
          accessibilityLabel={OFFICE_UPDATES_PANEL_CLOSE_LABEL}
          accessibilityRole="button"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, styles.scrim]}
          testID="office-updates.scrim"
        />
        <View
          testID="office-updates.panel"
          style={[
            styles.card,
            { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
            Shadows.md,
          ]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.list}
            contentContainerStyle={styles.listContent}>
            <NotificationInbox
              destinations={destinations}
              errorMessage={errorMessage}
              notifications={notifications}
              onMarkAllRead={onMarkAllRead}
              onNotificationPress={onNotificationPress}
              partial={partial}
              readActionError={readActionError}
              unreadCount={unreadCount}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
  },
  scrim: { backgroundColor: 'rgba(16, 23, 17, 0.45)' },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    maxHeight: '72%',
    maxWidth: Layout.mobileMaxWidth,
    overflow: 'hidden',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    width: '100%',
  },
  list: { flexGrow: 0 },
  listContent: { paddingBottom: Spacing.lg },
});
