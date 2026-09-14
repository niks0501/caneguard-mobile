import * as Device from 'expo-device';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TextField } from '@/components/ui/TextField';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';

const PASSWORD_MIN_LENGTH = 15;
const PASSWORD_MAX_LENGTH = 128;

export function AccountSecurityScreen() {
  const theme = useTheme();
  const {
    biometricCapability,
    biometricEnabled,
    biometricLoading,
    changeEmail,
    changePassword,
    disableBiometric,
    enableBiometricUnlock,
    enrollMobileDevice,
    errorMessage,
    session,
  } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [enrollmentPassword, setEnrollmentPassword] = useState('');
  const [deviceName, setDeviceName] = useState(
    Device.deviceName?.trim() || Device.modelName?.trim() || 'CaneGuard mobile device',
  );
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const submitPasswordChange = async () => {
    if (
      busyAction ||
      !currentPassword ||
      newPassword.length < PASSWORD_MIN_LENGTH
    ) {
      return;
    }
    setBusyAction('password');
    setSuccessMessage(null);
    const changed = await changePassword({
      currentPassword,
      password: newPassword,
    });
    setBusyAction(null);
    if (changed) {
      router.replace('/login');
    }
  };

  const submitEmailChange = async () => {
    if (busyAction || !emailPassword || !newEmail.trim()) {
      return;
    }
    setBusyAction('email');
    setSuccessMessage(null);
    const changed = await changeEmail({
      currentPassword: emailPassword,
      email: newEmail,
    });
    setBusyAction(null);
    if (changed) {
      router.replace('/login');
    }
  };

  const submitEnrollment = async () => {
    if (busyAction || !enrollmentPassword || !deviceName.trim()) {
      return;
    }
    setBusyAction('enrollment');
    setSuccessMessage(null);
    const enrolled = await enrollMobileDevice(
      enrollmentPassword,
      deviceName,
    );
    setBusyAction(null);
    if (enrolled) {
      setEnrollmentPassword('');
      setSuccessMessage(
        'This installation is enrolled with a fresh server session. Existing sessions on other device identities are unchanged.',
      );
    }
  };

  const submitBiometricDisable = async () => {
    if (busyAction || !disablePassword) {
      return;
    }
    setBusyAction('biometric-disable');
    setSuccessMessage(null);
    const disabled = await disableBiometric(disablePassword);
    setBusyAction(null);
    if (disabled) {
      router.replace('/login');
    }
  };

  const enableBiometrics = async () => {
    if (busyAction || biometricLoading) {
      return;
    }
    setBusyAction('biometric-enable');
    setSuccessMessage(null);
    const enabled = await enableBiometricUnlock();
    setBusyAction(null);
    if (enabled) {
      setSuccessMessage(
        'Biometric unlock is enabled on this installation. It unlocks the stored session after a cold start and never extends the server expiry.',
      );
    }
  };

  return (
    <ScreenContainer contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Account & security</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Protect your account without changing the offline reports and scans saved on this device.</Text>
      </View>

      <View style={[styles.identityCard, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
        <Text style={[styles.identityName, { color: theme.primaryDark }]}>{session?.user.name ?? 'Field Inspector'}</Text>
        <Text style={[styles.identityEmail, { color: theme.textSecondary }]}>{session?.user.email ?? 'Authenticated mobile account'}</Text>
        <Text style={[styles.identityExpiry, { color: theme.textSecondary }]}>{formatExpiry(session?.expiresAt)}</Text>
      </View>

      {errorMessage ? (
        <Text testID="account-security.error" accessibilityLiveRegion="assertive" style={[styles.error, { color: theme.danger }]}>{errorMessage}</Text>
      ) : null}
      {successMessage ? (
        <Text testID="account-security.success" accessibilityLiveRegion="polite" style={[styles.success, { color: theme.primaryDark, backgroundColor: theme.successBg }]}>{successMessage}</Text>
      ) : null}

      <SecuritySection title="Biometric unlock" description="Use an enrolled strong biometric to unlock the OS-protected session after a cold start. Password sign-in is always available; a device passcode cannot unlock this credential.">
        <Text style={[styles.capability, { color: theme.textSecondary }]}>{biometricCapabilityMessage(biometricCapability?.status)}</Text>
        {biometricEnabled ? (
          <View style={styles.form}>
            <TextField
              testID="account-security.disable-biometric-password"
              label="Current password"
              value={disablePassword}
              onChangeText={setDisablePassword}
              placeholder="Confirm to disable"
              secureTextEntry
              autoCapitalize="none"
              textContentType="password"
            />
            <AppButton
              testID="account-security.disable-biometric"
              variant="secondary"
              onPress={() => void submitBiometricDisable()}
              disabled={Boolean(busyAction) || !disablePassword}>
              {busyAction === 'biometric-disable' ? 'Disabling...' : 'Disable biometric unlock'}
            </AppButton>
          </View>
        ) : (
          <AppButton
            testID="account-security.enable-biometric"
            onPress={() => void enableBiometrics()}
            disabled={
              Boolean(busyAction) ||
              biometricLoading ||
              biometricCapability?.status !== 'available'
            }
            leadingIcon="shield">
            {biometricLoading || busyAction === 'biometric-enable' ? 'Enabling...' : 'Enable biometric unlock'}
          </AppButton>
        )}
      </SecuritySection>

      <SecuritySection title="Change password" description={`Use ${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters. Changing your password signs out every active session.`}>
        <View style={styles.form}>
          <TextField
            testID="account-security.current-password"
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
          />
          <TextField
            testID="account-security.new-password"
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            secureTextEntry
            maxLength={PASSWORD_MAX_LENGTH}
            autoCapitalize="none"
            textContentType="newPassword"
          />
          <AppButton
            testID="account-security.change-password"
            onPress={() => void submitPasswordChange()}
            disabled={
              Boolean(busyAction) ||
              !currentPassword ||
              newPassword.length < PASSWORD_MIN_LENGTH
            }>
            {busyAction === 'password' ? 'Updating...' : 'Change password'}
          </AppButton>
        </View>
      </SecuritySection>

      <SecuritySection title="Change email" description="Changing your email signs out every active session and requires verification of the new address.">
        <View style={styles.form}>
          <TextField
            testID="account-security.new-email"
            label="New email"
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="you@example.com"
            maxLength={255}
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
          />
          <TextField
            testID="account-security.email-password"
            label="Current password"
            value={emailPassword}
            onChangeText={setEmailPassword}
            placeholder="Confirm to change email"
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
          />
          <AppButton
            testID="account-security.change-email"
            onPress={() => void submitEmailChange()}
            disabled={Boolean(busyAction) || !emailPassword || !newEmail.trim()}>
            {busyAction === 'email' ? 'Updating...' : 'Change email'}
          </AppButton>
        </View>
      </SecuritySection>

      <SecuritySection title="Device enrollment" description="Enroll this installation with an auditable password step-up. Its opaque installation identity is stored securely and is not a hardware identifier.">
        <View style={styles.form}>
          <TextField
            testID="account-security.device-name"
            label="Installation name"
            value={deviceName}
            onChangeText={setDeviceName}
            placeholder="CaneGuard mobile device"
            maxLength={120}
            textContentType="none"
          />
          <TextField
            testID="account-security.enrollment-password"
            label="Current password"
            value={enrollmentPassword}
            onChangeText={setEnrollmentPassword}
            placeholder="Confirm this installation"
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
          />
          <AppButton
            testID="account-security.enroll-device"
            variant="secondary"
            onPress={() => void submitEnrollment()}
            disabled={Boolean(busyAction) || !enrollmentPassword || !deviceName.trim()}>
            {busyAction === 'enrollment' ? 'Enrolling...' : 'Enroll this installation'}
          </AppButton>
        </View>
      </SecuritySection>
    </ScreenContainer>
  );
}

type SecuritySectionProps = {
  children: ReactNode;
  description: string;
  title: string;
};

function SecuritySection({ children, description, title }: SecuritySectionProps) {
  const theme = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.primaryDark }]}>{title}</Text>
      <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>{description}</Text>
      {children}
    </View>
  );
}

function biometricCapabilityMessage(
  status: 'available' | 'not-enrolled' | 'unsupported' | 'unavailable' | undefined,
): string {
  switch (status) {
    case 'available':
      return 'A strong platform biometric is available for this installation.';
    case 'not-enrolled':
      return 'Enroll a strong biometric in device settings before enabling this option.';
    case 'unsupported':
      return 'This device does not expose a strong platform biometric. Use password sign-in.';
    default:
      return 'Biometric capability is unavailable until the native development build is ready. Use password sign-in.';
  }
}

function formatExpiry(expiresAt: string | null | undefined): string {
  if (expiresAt === null) {
    return 'Local session safety expiry unavailable; sign in again before continuing.';
  }
  if (!expiresAt) {
    return 'Session expiry is unavailable. Sign in again to establish a server session.';
  }
  const timestamp = Date.parse(expiresAt);
  if (!Number.isFinite(timestamp)) {
    return 'Session expiry is unavailable. Sign in again to establish a server session.';
  }
  return `Session expires ${new Date(timestamp).toLocaleString()}. Biometric unlock does not extend it.`;
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
  section: {
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.subheading,
  },
  sectionDescription: {
    ...Typography.bodySmall,
  },
  capability: {
    ...Typography.caption,
  },
  form: {
    gap: Spacing.lg,
  },
});
