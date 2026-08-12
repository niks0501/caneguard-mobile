import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useSync } from '@/features/sync/hooks/useSync';
import { useTheme } from '@/hooks/use-theme';

type SyncStatusRowProps = {
  onPress: () => void;
  testID?: string;
};

export function SyncStatusRow({ onPress, testID }: SyncStatusRowProps) {
  const theme = useTheme();
  const sync = useSync();
  const hasPendingReports = sync.pendingCount > 0;
  const icon = sync.isSyncing
    ? 'upload-cloud'
    : hasPendingReports
      ? 'clock'
      : sync.isOnline === null
        ? 'wifi'
        : sync.isOnline === false
          ? 'wifi-off'
          : 'check-circle';
  const iconColor = sync.isOnline === null
    ? theme.info
    : hasPendingReports || sync.isOnline === false
      ? theme.warning
      : theme.success;
  const summary = sync.isSyncing
    ? 'Syncing saved reports…'
    : hasPendingReports
      ? `${sync.pendingCount} ${sync.pendingCount === 1 ? 'report' : 'reports'} awaiting sync`
      : sync.isOnline === null
        ? 'Checking connection'
        : sync.isOnline === false
          ? 'Offline · saved reports stay on this device'
          : 'All saved reports are synced';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open Records, ${summary}`}
      accessibilityLiveRegion="polite"
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.icon, { backgroundColor: theme.surfaceElevated }]}>
        <Feather name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.primaryDark }]}>Sync status</Text>
        <Text style={[styles.summary, { color: theme.textSecondary }]}>{summary}</Text>
        {sync.errorMessage ? (
          <Text style={[styles.error, { color: theme.danger }]}>{sync.errorMessage}</Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  title: { ...Typography.bodySmall, fontWeight: '800' },
  summary: { ...Typography.caption },
  error: { ...Typography.caption, fontWeight: '700' },
  pressed: { opacity: 0.74 },
});
