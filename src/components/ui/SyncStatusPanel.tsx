import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { useToast } from '@/components/ui/Toast';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useSync } from '@/features/sync/hooks/useSync';
import {
  getConnectionLabel,
  isServerUnavailable,
} from '@/features/sync/utils/syncStatusCopy';
import { useTheme } from '@/hooks/use-theme';

export function SyncStatusPanel({ showAction = true }: { showAction?: boolean } = {}) {
  const theme = useTheme();
  const { showToast } = useToast();
  const sync = useSync();

  const handleManualSync = async () => {
    try {
      const result = await sync.syncNow('manual');
      if (result && !result.authRequired && result.failed === 0) {
        showToast('Sync complete', 'success');
      } else if (result && result.failed > 0) {
        showToast('Sync failed — will retry', 'error');
      } else if (result?.authRequired) {
        showToast('Session expired — please sign in again', 'error');
      } else if (result === null && sync.errorMessage) {
        showToast(sync.errorMessage, 'error');
      } else if (result === null) {
        showToast('Sync failed — will retry', 'error');
      }
    } catch {
      showToast('Sync failed — will retry', 'error');
    }
  };
  const apiUnavailable = isServerUnavailable(sync.apiReachability, undefined, sync.isOnline);
  const connectionLabel = getConnectionLabel(sync.isOnline, sync.apiReachability);
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
      {showAction ? (
        <AppButton
          variant="secondary"
          onPress={() => void handleManualSync()}
          disabled={
            sync.isSyncing || sync.isOnline !== true || sync.pendingCount === 0
          }
          leadingIcon="refresh-cw"
          accessibilityLabel={
            sync.isSyncing ? 'Synchronizing pending reports' : 'Sync reports now'
          }>
          {sync.isSyncing ? 'Syncing...' : 'Sync Now'}
        </AppButton>
      ) : null}
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
