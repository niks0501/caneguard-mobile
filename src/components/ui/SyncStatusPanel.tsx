import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { useToast } from '@/components/ui/Toast';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useSync } from '@/features/sync/hooks/useSync';
import type { SyncBatchResult } from '@/features/sync/services/syncPendingFieldReports';
import {
  getBatchSendOutcome,
  getConnectionLabel,
  getConnectionTone,
  isServerUnavailable,
  SYNC_TONE_COLOR,
} from '@/features/sync/utils/syncStatusCopy';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/lib/formatters';

export function SyncStatusPanel({ showAction = true }: { showAction?: boolean } = {}) {
  const theme = useTheme();
  const { showToast } = useToast();
  const sync = useSync();

  const runSend = async (send: () => Promise<SyncBatchResult | null>) => {
    try {
      const result = await send();
      const outcome = getBatchSendOutcome(
        result,
        sync.errorMessage,
        result?.pendingCount ?? null,
      );
      showToast(
        outcome.message,
        outcome.kind === 'sent'
          ? 'success'
          : outcome.kind === 'still-waiting'
            ? 'info'
            : 'error',
      );
    } catch {
      showToast('Could not send — will try again', 'error');
    }
  };
  const handleManualSync = () => runSend(() => sync.syncNow('manual'));
  const handleSendAllAgain = () => runSend(() => sync.sendAllAgain());
  const apiUnavailable = isServerUnavailable(sync.apiReachability, undefined, sync.isOnline);
  const connectionLabel = getConnectionLabel(sync.isOnline, sync.apiReachability);
  const icon = apiUnavailable
    ? 'alert-triangle'
    : sync.isOnline === true
      ? 'wifi'
      : sync.isOnline === null
        ? 'wifi'
        : 'wifi-off';
  // Offline, checking and online are ordinary: ink. Unreachable office is a Note.
  const iconColor =
    theme[
      SYNC_TONE_COLOR[
        getConnectionTone({
          apiReachability: sync.apiReachability,
          isOnline: sync.isOnline,
        })
      ]
    ];

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
            Report status
          </Text>
          <Text style={[styles.summary, { color: theme.textSecondary }]}>
            {connectionLabel} · {sync.pendingCount} waiting to send
            {sync.isSyncing ? ' · Sending' : ''}
          </Text>
        </View>
      </View>
      {sync.lastSuccessfulSyncAt ? (
        <Text style={[styles.detail, { color: theme.textSecondary }]}>
          Last sent: {formatDate(sync.lastSuccessfulSyncAt)}
        </Text>
      ) : null}
      {sync.errorMessage ? (
        <Text style={[styles.error, { color: theme.warning }]}>
          {sync.errorMessage}
        </Text>
      ) : null}
      {showAction ? (
        <AppButton
          variant="secondary"
          onPress={() => void handleManualSync()}
          busy={sync.isSyncing}
          disabled={
            sync.isSyncing || sync.isOnline !== true || sync.pendingCount === 0
          }
          leadingIcon="refresh-cw"
          accessibilityLabel={
            sync.isSyncing ? 'Sending saved reports' : 'Send reports now'
          }>
          {sync.isSyncing ? 'Sending...' : 'Send Now'}
        </AppButton>
      ) : null}
      <AppButton
        variant="secondary"
        onPress={() => void handleSendAllAgain()}
        disabled={sync.isSyncing || sync.isOnline !== true}
        leadingIcon="send"
        accessibilityLabel="Send all saved reports again">
        Send all again
      </AppButton>
    </View>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : formatDateTime(date);
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
  title: { ...Typography.bodySmall, fontWeight: '500' },
  summary: { ...Typography.caption },
  detail: { ...Typography.caption },
  error: { ...Typography.caption, fontWeight: '500' },
});
