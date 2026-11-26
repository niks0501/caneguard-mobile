import * as Device from 'expo-device';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/lib/formatters';
import {
  FARMER_COPY,
  getOfflineUnlockCopy,
  type FarmerCopyBlock,
} from '@/constants/copy';
import { farmerAuthErrorMessage } from '@/features/auth/authErrorCopy';
import { useLanguagePreference } from '@/providers/LanguagePreferenceProvider';

export function AccountSecurityScreen() {
  const theme = useTheme();
  const { language } = useLanguagePreference();
  const {
    biometricCapability,
    biometricEnabled,
    biometricLoading,
    disableLocalLock,
    enableBiometricUnlock,
    errorMessage,
    farmerOfflineGrace = false,
    localLockMode = biometricEnabled ? 'device' : 'none',
    session,
    user,
  } = useAuth();
  const isFarmer = user?.role === 'farmer';
  const copyLang = isFarmer ? language : 'en';
  const languageCopy = FARMER_COPY[copyLang];
  const screenCopy = languageCopy.accountSecurityScreen;
  const deviceLockAvailable = biometricCapability?.status === 'available';
  const deviceCredentialOnly =
    biometricCapability?.strongBiometricsAvailable === false &&
    biometricCapability?.deviceCredentialAvailable === true;
  const unlockCopy = getOfflineUnlockCopy(
    biometricCapability?.strongBiometricsAvailable,
    biometricCapability?.deviceCredentialAvailable,
    copyLang,
  );
  const displayedError = isFarmer
    ? farmerAuthErrorMessage(errorMessage, languageCopy.authErrors)
    : errorMessage;
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ notice?: string | string[] }>();
  const notice = Array.isArray(params.notice) ? params.notice[0] : params.notice;
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const installationName =
    Device.deviceName?.trim() ||
    Device.modelName?.trim() ||
    screenCopy.defaultInstallationName;

  const enableDeviceLock = async () => {
    if (busyAction || biometricLoading) {
      return;
    }
    setBusyAction('biometric-enable');
    setSuccessMessage(null);
    const enabled = await enableBiometricUnlock();
    setBusyAction(null);
    if (enabled) {
      showToast(unlockCopy.enableToast, 'success');
      setSuccessMessage(unlockCopy.enabledMessage);
    }
  };

  const turnOffLock = async () => {
    if (busyAction || biometricLoading) {
      return;
    }
    if (typeof disableLocalLock !== 'function') {
      router.push('/account-biometric');
      return;
    }
    setBusyAction('lock-disable');
    setSuccessMessage(null);
    const turnedOff = await disableLocalLock();
    setBusyAction(null);
    if (turnedOff) {
      showToast(screenCopy.appLockTurnedOffToast, 'info');
      setSuccessMessage(screenCopy.appLockTurnedOffMessage);
    }
  };

  const lockDescription =
    localLockMode === 'app-pin'
      ? screenCopy.appLockPinOn
      : localLockMode === 'device'
        ? deviceCredentialOnly
          ? screenCopy.appLockDeviceCredentialOn
          : screenCopy.appLockDeviceBiometricOn
        : deviceLockAvailable
          ? screenCopy.appLockOffDescription
          : biometricCapabilityMessage(
              biometricCapability?.status,
              screenCopy,
              deviceCredentialOnly,
            );

  return (
    <ScreenContainer contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{screenCopy.title}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {screenCopy.subtitle}
        </Text>
      </View>

      <View
        style={[
          styles.identityCard,
          { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
        ]}>
        <Text style={[styles.identityName, { color: theme.primaryDark }]}>
          {session?.user.name ?? screenCopy.fallbackName}
        </Text>
        <Text style={[styles.identityEmail, { color: theme.textSecondary }]}>
          {session?.user.email ?? screenCopy.fallbackEmail}
        </Text>
        <Text style={[styles.identityExpiry, { color: theme.textSecondary }]}>
          {formatExpiry(session?.expiresAt, screenCopy, unlockCopy.sessionExpires)}
        </Text>
      </View>

      <View
        testID="account-security.offline-access"
        style={[
          styles.offlineBanner,
          {
            backgroundColor: farmerOfflineGrace ? theme.warningBg : theme.successBg,
            borderColor: farmerOfflineGrace ? theme.warning : theme.success,
          },
        ]}>
        <Feather
          name={farmerOfflineGrace ? 'wifi-off' : 'check-circle'}
          size={18}
          color={farmerOfflineGrace ? theme.warning : theme.success}
        />
        <View style={styles.rowCopy}>
          <Text style={[styles.rowTitle, { color: theme.text }]}>
            {screenCopy.offlineAccessTitle}
          </Text>
          <Text style={[styles.rowDescription, { color: theme.textSecondary }]}>
            {farmerOfflineGrace
              ? screenCopy.offlineAccessGrace
              : screenCopy.offlineAccessOn}
          </Text>
        </View>
      </View>

      {displayedError ? (
        <Text
          testID="account-security.error"
          accessibilityLiveRegion="assertive"
          style={[styles.error, { color: theme.danger }]}>
          {displayedError}
        </Text>
      ) : null}
      {notice === 'enrolled' || successMessage ? (
        <Text
          testID="account-security.success"
          accessibilityLiveRegion="polite"
          style={[
            styles.success,
            { color: theme.primaryDark, backgroundColor: theme.successBg },
          ]}>
          {notice === 'enrolled' ? screenCopy.enrollmentSuccess : successMessage}
        </Text>
      ) : null}

      <View
        testID="account-security.app-lock"
        style={[
          styles.row,
          { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
        ]}>
        <View style={styles.rowCopy}>
          <Text style={[styles.rowTitle, { color: theme.primaryDark }]}>
            {screenCopy.appLockTitle}
          </Text>
          <Text style={[styles.rowDescription, { color: theme.textSecondary }]}>
            {lockDescription}
          </Text>
        </View>
        <View style={styles.actionStack}>
          {localLockMode !== 'none' ? (
            <>
              {localLockMode === 'app-pin' ? (
                <AppButton
                  testID="account-security.change-app-pin"
                  variant="secondary"
                  disabled={Boolean(busyAction) || biometricLoading}
                  onPress={() => router.push('/account-app-pin')}>
                  {screenCopy.appLockChangePin}
                </AppButton>
              ) : null}
              <AppButton
                testID="account-security.disable-app-lock"
                variant="secondary"
                busy={busyAction === 'lock-disable'}
                disabled={Boolean(busyAction) || biometricLoading}
                onPress={() => void turnOffLock()}>
                {busyAction === 'lock-disable'
                  ? screenCopy.appLockTurningOff
                  : screenCopy.appLockTurnOff}
              </AppButton>
            </>
          ) : (
            <>
              {deviceLockAvailable ? (
                <AppButton
                  testID="account-security.enable-biometric"
                  onPress={() => void enableDeviceLock()}
                  busy={biometricLoading || busyAction === 'biometric-enable'}
                  disabled={Boolean(busyAction) || biometricLoading}
                  leadingIcon="shield">
                  {biometricLoading || busyAction === 'biometric-enable'
                    ? unlockCopy.enabling
                    : unlockCopy.enable}
                </AppButton>
              ) : null}
              <AppButton
                testID="account-security.setup-app-pin"
                variant={deviceLockAvailable ? 'secondary' : 'primary'}
                disabled={Boolean(busyAction) || biometricLoading}
                leadingIcon="lock"
                onPress={() => router.push('/account-app-pin')}>
                {screenCopy.appLockSetPin}
              </AppButton>
            </>
          )}
        </View>
      </View>

      <SecurityRow
        title={screenCopy.changePassword}
        description={screenCopy.changePasswordDescription}
        openTestID="account-security.open-change-password"
        openLabel={screenCopy.openChangePassword}
        onOpen={() => router.push('/account-password')}
      />

      <SecurityRow
        title={screenCopy.changeEmail}
        description={screenCopy.changeEmailDescription(
          session?.user.email ?? screenCopy.fallbackEmail,
        )}
        openTestID="account-security.open-change-email"
        openLabel={screenCopy.openChangeEmail}
        onOpen={() => router.push('/account-email')}
      />

      <SecurityRow
        title={screenCopy.deviceEnrollment}
        description={screenCopy.deviceEnrollmentDescription(installationName)}
        openTestID="account-security.open-enroll-device"
        openLabel={screenCopy.openDeviceEnrollment}
        onOpen={() => router.push('/account-device-enrollment')}
      />
    </ScreenContainer>
  );
}

function SecurityRow({
  description,
  onOpen,
  openLabel,
  openTestID,
  title,
}: {
  description: string;
  onOpen: () => void;
  openLabel: string;
  openTestID: string;
  title: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      testID={openTestID}
      accessibilityRole="button"
      accessibilityLabel={openLabel}
      onPress={onOpen}
      style={({ pressed }) => [
        styles.row,
        styles.pressableRow,
        { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: theme.primaryDark }]}>{title}</Text>
        <Text style={[styles.rowDescription, { color: theme.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

function biometricCapabilityMessage(
  status: 'available' | 'not-enrolled' | 'unsupported' | 'unavailable' | undefined,
  copy: FarmerCopyBlock['accountSecurityScreen'],
  deviceCredentialOnly = false,
): string {
  switch (status) {
    case 'available':
      return deviceCredentialOnly
        ? copy.biometricAvailableDeviceCredential
        : copy.biometricAvailable;
    case 'not-enrolled':
      return copy.biometricNotEnrolled;
    case 'unsupported':
      return copy.biometricUnsupported;
    default:
      return copy.biometricUnavailable;
  }
}

function formatExpiry(
  expiresAt: string | null | undefined,
  copy: FarmerCopyBlock['accountSecurityScreen'],
  sessionExpires: (date: string) => string = (date) =>
    `Session expires ${date}. Protected unlock does not extend it.`,
): string {
  if (expiresAt === null) {
    return copy.expiresUnavailable;
  }
  if (!expiresAt) {
    return copy.sessionExpiryUnavailable;
  }
  const timestamp = Date.parse(expiresAt);
  if (!Number.isFinite(timestamp)) {
    return copy.sessionExpiryUnavailable;
  }
  return sessionExpires(formatDateTime(timestamp));
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  header: {
    gap: Spacing.sm,
  },
  title: {
    ...Typography.title,
  },
  subtitle: {
    ...Typography.body,
  },
  identityCard: {
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  identityName: {
    ...Typography.subheading,
  },
  identityEmail: {
    ...Typography.bodySmall,
  },
  identityExpiry: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  error: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  success: {
    ...Typography.bodySmall,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  row: {
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  actionStack: {
    gap: Spacing.sm,
  },
  pressableRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  rowTitle: {
    ...Typography.subheading,
  },
  rowDescription: {
    ...Typography.bodySmall,
  },
  pressed: { opacity: 0.74 },
});
