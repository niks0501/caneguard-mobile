import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { OFFLINE_READINESS_COPY } from '@/constants/copy';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useOfflineReadiness } from '@/features/auth/hooks/useOfflineReadiness';
import { useTheme } from '@/hooks/use-theme';

/**
 * "Before you go offline" readiness check (D01). It explains the existing
 * biometric-restoration boundary rather than promising a weaker offline unlock.
 */
export function OfflineReadinessCard() {
  const theme = useTheme();
  const readiness = useOfflineReadiness();
  const expiresLabel = readiness.sessionExpiresAt
    ? new Date(readiness.sessionExpiresAt).toLocaleString()
    : null;

  const checks = [
    {
      detail: readiness.protectedSessionEnabled
        ? 'On — this device can reopen the protected session offline.'
        : 'Off — the protected session cannot restore after a restart. Turn on biometric unlock in Account security.',
      label: 'Biometric-protected session',
      ok: readiness.protectedSessionEnabled,
    },
    {
      detail: readiness.sessionExpired
        ? 'Expired — sign in again while online before leaving coverage.'
        : expiresLabel
          ? `Protected session expires ${expiresLabel}.`
          : 'No protected session is configured on this device.',
      label: 'Protected session not expired',
      ok: !readiness.sessionExpired && expiresLabel !== null,
    },
    {
      detail: readiness.checkingAssignments
        ? 'Checking the saved visit list…'
        : readiness.assignmentCount === null
          ? 'Saved visits could not be read on this device.'
          : `${readiness.assignmentCount} ${readiness.assignmentCount === 1 ? 'visit' : 'visits'} saved on this device.`,
      label: 'Visits downloaded for offline work',
      ok: readiness.assignmentCount !== null && readiness.assignmentCount > 0,
    },
  ];

  return (
    <View
      testID="settings.offline-readiness"
      accessibilityLiveRegion="polite"
      style={[
        styles.card,
        {
          backgroundColor: readiness.ready ? theme.successBg : theme.warningBg,
          borderColor: readiness.ready ? theme.success : theme.warning,
        },
      ]}>
      <View style={styles.heading}>
        <Feather
          name={readiness.ready ? 'check-circle' : 'alert-triangle'}
          size={20}
          color={readiness.ready ? theme.success : theme.warning}
        />
        <Text style={[styles.title, { color: theme.text }]}>
          {readiness.ready
            ? OFFLINE_READINESS_COPY.readyTitle
            : OFFLINE_READINESS_COPY.notReadyTitle}
        </Text>
      </View>
      {checks.map((check) => (
        <View key={check.label} style={styles.row}>
          <Feather
            name={check.ok ? 'check' : 'x'}
            size={16}
            color={check.ok ? theme.success : theme.warning}
          />
          <View style={styles.rowCopy}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>
              {check.label}
            </Text>
            <Text style={[styles.rowDetail, { color: theme.textSecondary }]}>
              {check.detail}
            </Text>
          </View>
        </View>
      ))}
      <Text style={[styles.note, { color: theme.textSecondary }]}>
        {OFFLINE_READINESS_COPY.explanation}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { ...Typography.subheading, flex: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  rowCopy: { flex: 1, gap: 2 },
  rowLabel: { ...Typography.bodySmall, fontWeight: '700' },
  rowDetail: { ...Typography.caption },
  note: { ...Typography.caption, marginTop: Spacing.xs },
});
