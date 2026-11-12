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
import { FARMER_COPY, type FarmerCopyBlock } from '@/constants/copy';
import { farmerAuthErrorMessage } from '@/features/auth/authErrorCopy';
import { useLanguagePreference } from '@/providers/LanguagePreferenceProvider';

export function AccountSecurityScreen() {
  const theme = useTheme();
  const { language } = useLanguagePreference();
  const {
    biometricCapability,
    biometricEnabled,
    biometricLoading,
    enableBiometricUnlock,
    errorMessage,
    session,
    user,
  } = useAuth();
  const isFarmer = user?.role === 'farmer';
  const languageCopy = FARMER_COPY[language];
  const farmerCopy = languageCopy.accountSecurityScreen;
  const displayedError = isFarmer
    ? farmerAuthErrorMessage(errorMessage, languageCopy.authErrors)
    : errorMessage;
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ notice?: string | string[] }>();
  const notice = Array.isArray(params.notice) ? params.notice[0] : params.notice;
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const installationName =
    Device.deviceName?.trim() || Device.modelName?.trim() || (isFarmer ? farmerCopy.defaultInstallationName : 'CaneGuard mobile device');

  const enableBiometrics = async () => {
    if (busyAction || biometricLoading) {
      return;
    }
    setBusyAction('biometric-enable');
    setSuccessMessage(null);
    const enabled = await enableBiometricUnlock();
    setBusyAction(null);
    if (enabled) {
      showToast(isFarmer ? farmerCopy.biometricEnableToast : 'Biometrics enabled', 'success');
      setSuccessMessage(
        isFarmer
          ? farmerCopy.biometricEnabledMessage
          : 'Biometric unlock is enabled on this installation. It unlocks the stored session after a cold start and never extends the server expiry.',
      );
    }
  };

  return (
    <ScreenContainer contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{isFarmer ? farmerCopy.title : 'Account & security'}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{isFarmer ? farmerCopy.subtitle : 'Protect your account without changing the offline reports and scans saved on this device.'}</Text>
      </View>

      <View style={[styles.identityCard, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
        <Text style={[styles.identityName, { color: theme.primaryDark }]}>{session?.user.name ?? (isFarmer ? farmerCopy.fallbackName : 'Field Inspector')}</Text>
        <Text style={[styles.identityEmail, { color: theme.textSecondary }]}>{session?.user.email ?? (isFarmer ? farmerCopy.fallbackEmail : 'Authenticated mobile account')}</Text>
        <Text style={[styles.identityExpiry, { color: theme.textSecondary }]}>{formatExpiry(session?.expiresAt, isFarmer ? farmerCopy : undefined)}</Text>
      </View>

      {displayedError ? (
        <Text testID="account-security.error" accessibilityLiveRegion="assertive" style={[styles.error, { color: theme.danger }]}>{displayedError}</Text>
      ) : null}
      {notice === 'enrolled' || successMessage ? (
        <Text testID="account-security.success" accessibilityLiveRegion="polite" style={[styles.success, { color: theme.primaryDark, backgroundColor: theme.successBg }]}>{notice === 'enrolled'
            ? isFarmer
              ? farmerCopy.enrollmentSuccess
              : 'This installation is enrolled with a fresh server session. Existing sessions on other device identities are unchanged.'
            : successMessage}</Text>
      ) : null}

      <View style={[styles.row, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
        <View style={styles.rowCopy}>
          <Text style={[styles.rowTitle, { color: theme.primaryDark }]}>{isFarmer ? farmerCopy.biometricTitle : 'Biometric unlock'}</Text>
          <Text style={[styles.rowDescription, { color: theme.textSecondary }]}>
            {biometricEnabled
              ? isFarmer ? farmerCopy.biometricOn : 'Biometric unlock is on for this installation.'
              : biometricCapabilityMessage(biometricCapability?.status, isFarmer ? farmerCopy : undefined)}
          </Text>
        </View>
        {biometricEnabled ? (
          <AppButton
            testID="account-security.open-disable-biometric"
            variant="secondary"
            onPress={() => router.push('/account-biometric')}>
            {isFarmer ? farmerCopy.disableBiometric : 'Disable biometric unlock'}
          </AppButton>
        ) : (
          <AppButton
            testID="account-security.enable-biometric"
            onPress={() => void enableBiometrics()}
            busy={biometricLoading || busyAction === 'biometric-enable'}
            disabled={
              Boolean(busyAction) ||
              biometricLoading ||
              biometricCapability?.status !== 'available'
            }
            leadingIcon="shield">
            {biometricLoading || busyAction === 'biometric-enable'
              ? isFarmer ? farmerCopy.enablingBiometric : 'Enabling...'
              : isFarmer ? farmerCopy.enableBiometric : 'Enable biometric unlock'}
          </AppButton>
        )}
      </View>

      <SecurityRow
        title={isFarmer ? farmerCopy.changePassword : 'Change password'}
        description={isFarmer ? farmerCopy.changePasswordDescription : 'Password protection is on. Changing your password signs out every active session.'}
        openTestID="account-security.open-change-password"
        openLabel={isFarmer ? farmerCopy.openChangePassword : 'Open the change password form'}
        onOpen={() => router.push('/account-password')}
      />

      <SecurityRow
        title={isFarmer ? farmerCopy.changeEmail : 'Change email'}
        description={isFarmer
          ? farmerCopy.changeEmailDescription(session?.user.email ?? farmerCopy.fallbackEmail)
          : `Current email: ${session?.user.email ?? 'authenticated account'}. Changing it signs out every active session and requires verification of the new address.`}
        openTestID="account-security.open-change-email"
        openLabel={isFarmer ? farmerCopy.openChangeEmail : 'Open the change email form'}
        onOpen={() => router.push('/account-email')}
      />

      <SecurityRow
        title={isFarmer ? farmerCopy.deviceEnrollment : 'Device enrollment'}
        description={isFarmer ? farmerCopy.deviceEnrollmentDescription(installationName) : `Installation identity: ${installationName}.`}
        openTestID="account-security.open-enroll-device"
        openLabel={isFarmer ? farmerCopy.openDeviceEnrollment : 'Open the device enrollment form'}
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
        <Text style={[styles.rowDescription, { color: theme.textSecondary }]}>{description}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

function biometricCapabilityMessage(
  status: 'available' | 'not-enrolled' | 'unsupported' | 'unavailable' | undefined,
  copy?: FarmerCopyBlock['accountSecurityScreen'],
): string {
  switch (status) {
    case 'available':
      return copy?.biometricAvailable ?? 'A strong platform biometric is available for this installation.';
    case 'not-enrolled':
      return copy?.biometricNotEnrolled ?? 'Enroll a strong biometric in device settings before enabling this option.';
    case 'unsupported':
      return copy?.biometricUnsupported ?? 'This device does not expose a strong platform biometric. Use password sign-in.';
    default:
      return copy?.biometricUnavailable ?? 'Biometric capability is unavailable until the native development build is ready. Use password sign-in.';
  }
}

function formatExpiry(
  expiresAt: string | null | undefined,
  copy?: FarmerCopyBlock['accountSecurityScreen'],
): string {
  if (expiresAt === null) {
    return copy?.expiresUnavailable ?? 'Local session safety expiry unavailable; sign in again before continuing.';
  }
  if (!expiresAt) {
    return copy?.sessionExpiryUnavailable ?? 'Session expiry is unavailable. Sign in again to establish a server session.';
  }
  const timestamp = Date.parse(expiresAt);
  if (!Number.isFinite(timestamp)) {
    return copy?.sessionExpiryUnavailable ?? 'Session expiry is unavailable. Sign in again to establish a server session.';
  }
  return copy?.sessionExpires(formatDateTime(timestamp)) ?? `Session expires ${formatDateTime(timestamp)}. Biometric unlock does not extend it.`;
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
