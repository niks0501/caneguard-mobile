import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TextField } from '@/components/ui/TextField';
import { Radius, Spacing, Typography } from '@/constants/theme';
import {
  MobileAuthError,
  resetPassword,
} from '@/features/auth/api/mobileAuthApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';

const PASSWORD_MIN_LENGTH = 15;
const PASSWORD_MAX_LENGTH = 128;

type ResetParams = {
  email?: string | string[];
  token?: string | string[];
};

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const { clearSessionAfterRemoteRevocation } = useAuth();
  const params = useLocalSearchParams<ResetParams>();
  const [email, setEmail] = useState(readParam(params.email));
  const [token] = useState(readParam(params.token));
  const [password, setPassword] = useState('');
  const [updated, setUpdated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (
      submitting ||
      !token ||
      !email.trim() ||
      password.length < PASSWORD_MIN_LENGTH
    ) {
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await resetPassword({ email, password, token });
      const cleared = await clearSessionAfterRemoteRevocation();
      if (!cleared) {
        setErrorMessage(
          'Password updated, but secure session storage could not be cleared. Restart the app before signing in again.',
        );
        return;
      }
      setUpdated(true);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof MobileAuthError
          ? error.message
          : 'CaneGuard could not update your password.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Choose a new password</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Use the one-time recovery link from your email to secure your account again.</Text>
      </View>

      {updated ? (
        <View
          testID="reset-password.success"
          accessibilityLiveRegion="polite"
          style={[styles.message, { backgroundColor: theme.surfaceMuted }]}>
          <Text style={[styles.messageTitle, { color: theme.primaryDark }]}>Password updated</Text>
          <Text style={[styles.messageText, { color: theme.text }]}>All existing sessions were signed out. Sign in again with your new password.</Text>
          <AppButton onPress={() => router.replace('/login')}>Return to login</AppButton>
        </View>
      ) : !token ? (
        <View
          testID="reset-password.missing-token"
          accessibilityLiveRegion="assertive"
          style={[styles.message, { backgroundColor: theme.dangerBg }]}>
          <Text style={[styles.messageTitle, { color: theme.danger }]}>Recovery link required</Text>
          <Text style={[styles.messageText, { color: theme.text }]}>This recovery link is missing its one-time value. Request a new link to continue.</Text>
          <AppButton variant="secondary" onPress={() => router.push('/forgot-password')}>
            Request a new link
          </AppButton>
        </View>
      ) : (
        <View style={styles.form}>
          <TextField
            testID="reset-password.email-input"
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            maxLength={255}
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
          />
          <TextField
            testID="reset-password.password-input"
            label="New password"
            value={password}
            onChangeText={setPassword}
            placeholder="Choose a new password"
            maxLength={PASSWORD_MAX_LENGTH}
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
          />
          <Text style={[styles.hint, { color: theme.textSecondary }]}>Use {PASSWORD_MIN_LENGTH} to {PASSWORD_MAX_LENGTH} characters. A phrase is fine; no symbol or number pattern is required.</Text>
          {errorMessage ? (
            <Text
              testID="reset-password.error"
              accessibilityLiveRegion="assertive"
              style={[styles.error, { color: theme.danger }]}>
              {errorMessage}
            </Text>
          ) : null}
          <AppButton
            testID="reset-password.submit"
            onPress={() => void submit()}
            disabled={
              submitting ||
              !email.trim() ||
              password.length < PASSWORD_MIN_LENGTH
            }>
            {submitting ? 'Updating password...' : 'Update password'}
          </AppButton>
        </View>
      )}

      <AppButton variant="text" onPress={() => router.push('/login')}>
        Back to login
      </AppButton>
    </ScreenContainer>
  );
}

function readParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    gap: Spacing['2xl'],
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
  form: {
    gap: Spacing.lg,
  },
  hint: {
    ...Typography.caption,
  },
  message: {
    gap: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  messageTitle: {
    ...Typography.heading,
  },
  messageText: {
    ...Typography.bodySmall,
  },
  error: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
});
