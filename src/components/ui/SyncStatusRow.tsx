import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSync } from '@/features/sync/hooks/useSync';
import {
  getConnectionTone,
  getSyncRowSummary,
  isServerUnavailable,
  SYNC_TONE_COLOR,
} from '@/features/sync/utils/syncStatusCopy';
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
  const reportsCount = sync.pendingReportsCount;
  const surveysCount = sync.pendingSurveysCount;
  const completionsCount = sync.pendingCompletionsCount;
  const apiUnavailable = isServerUnavailable(
    sync.apiReachability,
    sessionVerification,
    sync.isOnline,
  );
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
  // Offline, waiting and sent are ordinary in the field and stay in ink.
  // An unreachable office or a sync error is a Note.
  const tone = getConnectionTone({
    apiReachability: sync.apiReachability,
    hasError: Boolean(sync.errorMessage),
    isOnline: sync.isOnline,
    sessionVerification,
  });
  const iconColor = theme[SYNC_TONE_COLOR[tone]];
  // Agent marker: stable state token plus counts only, never copy or identifiers.
  const syncState = sync.isSyncing
    ? 'syncing'
    : apiUnavailable
      ? 'server-unavailable'
      : sync.isOnline === null
        ? 'checking'
        : sync.isOnline === false
          ? 'offline'
          : hasPendingReports
            ? 'pending'
            : 'synced';
  const summary = getSyncRowSummary({
    apiReachability: sync.apiReachability,
    isOnline: sync.isOnline,
    isSyncing: sync.isSyncing,
    pendingCompletionsCount: completionsCount,
    pendingCount: sync.pendingCount,
    pendingReportsCount: reportsCount,
    pendingSurveysCount: surveysCount,
    sessionVerification,
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open Activity, ${summary}`}
      accessibilityLiveRegion="polite"
      accessibilityValue={{
        text: `state=${syncState};pending=${sync.pendingCount};error=${sync.errorMessage ? 'yes' : 'no'}`,
      }}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <Feather name={icon} size={18} color={iconColor} />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.primaryDark }]}>Report status</Text>
        <Text style={[styles.summary, { color: tone === 'note' ? theme.warning : theme.textSecondary }]}>{summary}</Text>
        {sync.errorMessage ? (
          <Text style={[styles.error, { color: theme.warning }]}>{sync.errorMessage}</Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  copy: { flex: 1, gap: 2 },
  title: { ...Typography.bodySmall, fontWeight: '500' },
  summary: { ...Typography.caption },
  error: { ...Typography.caption, fontWeight: '500' },
  pressed: { opacity: 0.74 },
});
