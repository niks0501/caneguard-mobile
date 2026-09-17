import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSync } from '@/features/sync/hooks/useSync';
import { useTheme } from '@/hooks/use-theme';

type SyncStatusRowProps = {
  onPress: () => void;
  testID?: string;
};

export function SyncStatusRow({ onPress, testID }: SyncStatusRowProps) {
  const theme = useTheme();
  const { sessionVerification } = useAuth();
  const sync = useSync();
  const hasPendingReports = sync.pendingCount > 0;
  const reportsCount = (sync as any).pendingReportsCount ?? sync.pendingCount;
  const completionsCount = (sync as any).pendingCompletionsCount ?? 0;
  const formatPendingSummary = () => {
    if (reportsCount > 0 && completionsCount > 0) {
      return `${reportsCount} ${reportsCount === 1 ? 'report' : 'reports'}, ${completionsCount} ${completionsCount === 1 ? 'visit' : 'visits'} awaiting sync`;
    }
    if (completionsCount > 0 && reportsCount === 0) {
      return `${completionsCount} ${completionsCount === 1 ? 'visit' : 'visits'} awaiting sync`;
    }
    return `${sync.pendingCount} ${sync.pendingCount === 1 ? 'report' : 'reports'} awaiting sync`;
  };
  const pendingSummary = formatPendingSummary();
  const apiUnavailable =
    sessionVerification === 'unavailable' ||
    (sync.isOnline === true && sync.apiReachability === 'unavailable');
  const icon = sync.isSyncing
    ? 'upload-cloud'
    : apiUnavailable
      ? 'alert-triangle'
      : hasPendingReports
        ? 'clock'
        : sync.isOnline === null
          ? 'wifi'
          : sync.isOnline === false
            ? 'wifi-off'
            : 'check-circle';
  const iconColor = apiUnavailable
    ? theme.danger
    : sync.isOnline === null
      ? theme.info
      : hasPendingReports || sync.isOnline === false
        ? theme.warning
        : theme.success;
  const summary = sync.isSyncing
    ? 'Syncing saved reports…'
    : sync.isOnline === null
      ? 'Checking connection'
      : sync.isOnline === false
        ? 'Offline · saved reports stay on this device'
        : apiUnavailable
          ? hasPendingReports
            ? `${pendingSummary} · CaneGuard server unavailable`
            : 'Network available · CaneGuard server unavailable'
          : hasPendingReports
            ? pendingSummary
            : sync.apiReachability === 'unknown'
              ? 'Network available · CaneGuard status not checked'
              : 'CaneGuard connected · All saved reports are synced';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open Activity, ${summary}`}
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
