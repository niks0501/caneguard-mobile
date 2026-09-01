import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TextField } from '@/components/ui/TextField';
import { Radius, Spacing, Typography } from '@/constants/theme';
import {
  MobileAuthError,
  requestPasswordReset,
} from '@/features/auth/api/mobileAuthApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const { status } = useAuth();
  const loginRoute = status === 'authenticated' ? '/home' : '/login';
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting || !email.trim()) {
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof MobileAuthError
          ? error.message
          : 'CaneGuard could not start account recovery.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Forgot password?</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Enter your account email and we will send a secure, one-time recovery link.</Text>
      </View>

      {submitted ? (
        <View
          testID="forgot-password.success"
          accessibilityLiveRegion="polite"
          style={[styles.message, { backgroundColor: theme.surfaceMuted }]}>
          <Text style={[styles.messageTitle, { color: theme.primaryDark }]}>Check your email</Text>
          <Text style={[styles.messageText, { color: theme.text }]}>If an account matches, a password recovery link will be sent. The message is the same whether or not an account matches.</Text>
          <Text style={[styles.messageText, { color: theme.textSecondary }]}>Open the link on this device. The one-time value is never displayed or saved by CaneGuard.</Text>
          <AppButton variant="text" onPress={() => router.replace(loginRoute)}>
            Return to login
          </AppButton>
        </View>
      ) : (
        <View style={styles.form}>
          <TextField
            testID="forgot-password.email-input"
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            maxLength={255}
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
          />
          {errorMessage ? (
            <Text
              testID="forgot-password.error"
              accessibilityLiveRegion="assertive"
              style={[styles.error, { color: theme.danger }]}>
              {errorMessage}
            </Text>
          ) : null}
          <AppButton
            testID="forgot-password.submit"
            onPress={() => void submit()}
            disabled={submitting || !email.trim()}>
            {submitting ? 'Sending...' : 'Send recovery link'}
          </AppButton>
        </View>
      )}

      <AppButton variant="text" onPress={() => router.push(loginRoute)}>
        Back to login
      </AppButton>
    </ScreenContainer>
  );
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
