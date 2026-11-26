import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import {
  FARMER_COPY,
  getMissingStepCopy,
  getOfflineUnlockCopy,
  OFFLINE_READINESS_COPY,
} from '@/constants/copy';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useOfflineReadiness } from '@/features/auth/hooks/useOfflineReadiness';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/lib/formatters';
import { useOptionalLanguage } from '@/providers/LanguagePreferenceProvider';

/**
 * Calm offline readiness status (D01).
 * - Farmers see a simple bilingual confirmation (or personal-scan grace notice).
 * - Inspectors see automatic offline persistence status, office window expiry,
 *   and an informational assigned-visit count (0 visits is neutral, not an alarm).
 */
export function OfflineReadinessCard() {
  const theme = useTheme();
  const language = useOptionalLanguage();
  const readiness = useOfflineReadiness();

  if (readiness.isFarmer) {
    const copy = FARMER_COPY[language].offlineStatus;
    const isGrace = Boolean(readiness.farmerOfflineGrace);
    return (
      <View
        testID="settings.offline-readiness"
        accessibilityValue={{
          text: `state=${readiness.ready ? 'ready' : 'not-ready'};unlock=${readiness.protectedSessionEnabled ? 'on' : 'off'};expired=${isGrace ? 'grace' : 'no'};visits-saved=0`,
        }}
        accessibilityLiveRegion="polite"
        style={[
          styles.card,
          {
            backgroundColor: isGrace ? theme.warningBg : theme.successBg,
            borderColor: isGrace ? theme.warning : theme.success,
          },
        ]}>
        <View style={styles.heading}>
          <Feather
            name={isGrace ? 'wifi-off' : 'check-circle'}
            size={20}
            color={isGrace ? theme.warning : theme.success}
          />
          <Text style={[styles.title, { color: theme.text }]}>
            {isGrace ? copy.graceTitle : copy.readyTitle}
          </Text>
        </View>
        <Text style={[styles.rowDetail, { color: theme.textSecondary }]}>
          {isGrace ? copy.graceBody : copy.readyBody}
        </Text>
      </View>
    );
  }

  const unlockCopy = getOfflineUnlockCopy(
    readiness.strongBiometricsAvailable,
    readiness.deviceCredentialAvailable,
  );
  const expiresLabel = readiness.sessionExpiresAt
    ? formatDateTime(readiness.sessionExpiresAt)
    : null;
  const lockDetail =
    readiness.localLockMode === 'app-pin'
      ? 'On — stays signed in offline (protected by your 4-digit Quick PIN).'
      : readiness.localLockMode === 'device'
        ? readiness.strongBiometricsAvailable
          ? 'On — stays signed in offline (protected by phone biometric/lock).'
          : 'On — stays signed in offline (protected by phone PIN/pattern).'
        : 'On — stays signed in offline after restarts.';

  const checks = [
    {
      detail: readiness.protectedSessionEnabled
        ? lockDetail
        : 'Off — sign in again while online to save this session for offline work.',
      label: 'Offline access',
      ok: readiness.protectedSessionEnabled,
    },
    {
      detail: readiness.sessionExpired
        ? 'Expired — sign in again while online before leaving coverage.'
        : expiresLabel
          ? `Session expires ${expiresLabel}.`
          : 'No saved session is configured on this device.',
      label: 'Session active',
      ok: !readiness.sessionExpired && expiresLabel !== null,
    },
    {
      detail: readiness.checkingAssignments
        ? 'Checking the saved visit list…'
        : readiness.assignmentCount === null
          ? 'Saved visits could not be read on this device.'
          : readiness.assignmentCount === 0
            ? OFFLINE_READINESS_COPY.zeroVisitsDetail
            : `${readiness.assignmentCount} ${readiness.assignmentCount === 1 ? 'visit' : 'visits'} saved on this device.`,
      label: 'Assigned visits',
      ok: readiness.assignmentCount !== null,
    },
  ];

  return (
    <View
      testID="settings.offline-readiness"
      accessibilityValue={{
        text: `state=${readiness.ready ? 'ready' : 'not-ready'};unlock=${readiness.protectedSessionEnabled ? 'on' : 'off'};expired=${readiness.sessionExpired ? 'yes' : 'no'};visits-saved=${readiness.assignmentCount ?? 'unknown'}${readiness.sessionState ? `;session=${readiness.sessionState.kind};missing=${readiness.missingStep ?? 'none'}` : ''}`,
      }}
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
      {!readiness.ready && readiness.missingStep ? (
        <Text style={[styles.rowLabel, { color: theme.text }]}>
          {getMissingStepCopy(readiness.missingStep, unlockCopy)}
        </Text>
      ) : null}
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
