import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useSync } from '@/features/sync/hooks/useSync';
import { useTheme } from '@/hooks/use-theme';

export function SyncStatusPanel() {
  const theme = useTheme();
  const sync = useSync();
  const apiUnavailable =
    sync.isOnline === true && sync.apiReachability === 'unavailable';
  const connectionLabel =
    sync.isOnline === null
      ? 'Checking connection'
      : sync.isOnline === false
        ? 'Offline'
        : apiUnavailable
          ? 'Network available · CaneGuard server unavailable'
          : sync.apiReachability === 'unknown'
            ? 'Network available · CaneGuard status not checked'
            : 'Network and CaneGuard available';
  const icon = apiUnavailable
    ? 'alert-triangle'
    : sync.isOnline === true
      ? 'wifi'
      : sync.isOnline === null
        ? 'wifi'
        : 'wifi-off';
  const iconColor = apiUnavailable
    ? theme.danger
    : sync.isOnline === true
      ? theme.success
      : sync.isOnline === null
        ? theme.info
        : theme.warning;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.panel,
        { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
      ]}>
      <View style={styles.heading}>
        <Feather name={icon} size={20} color={iconColor} />
        <View style={styles.copy}>
          <Text style={[styles.title, { color: theme.primaryDark }]}>
            Report synchronization
          </Text>
          <Text style={[styles.summary, { color: theme.textSecondary }]}>
            {connectionLabel} · {sync.pendingCount} awaiting upload
            {sync.isSyncing ? ' · Uploading' : ''}
          </Text>
        </View>
      </View>
      {sync.lastSuccessfulSyncAt ? (
        <Text style={[styles.detail, { color: theme.textSecondary }]}>
          Last upload: {formatDate(sync.lastSuccessfulSyncAt)}
        </Text>
      ) : null}
      {sync.errorMessage ? (
        <Text style={[styles.error, { color: theme.danger }]}>
          {sync.errorMessage}
        </Text>
      ) : null}
      <AppButton
        variant="secondary"
        onPress={() => void sync.syncNow('manual')}
        disabled={
          sync.isSyncing || sync.isOnline !== true || sync.pendingCount === 0
        }
        leadingIcon="refresh-cw"
        accessibilityLabel={
          sync.isSyncing ? 'Synchronizing pending reports' : 'Sync reports now'
        }>
        {sync.isSyncing ? 'Syncing...' : 'Sync Now'}
      </AppButton>
    </View>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  copy: { flex: 1, gap: Spacing.xs },
  title: { ...Typography.bodySmall, fontWeight: '800' },
  summary: { ...Typography.caption },
  detail: { ...Typography.caption },
  error: { ...Typography.caption, fontWeight: '700' },
});
