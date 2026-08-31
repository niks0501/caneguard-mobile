import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TextField } from '@/components/ui/TextField';
import { Radius, Spacing, Typography } from '@/constants/theme';
import {
  MobileAuthError,
  registerMobile,
  resendVerification,
} from '@/features/auth/api/mobileAuthApi';
import { useTheme } from '@/hooks/use-theme';

const PASSWORD_MIN_LENGTH = 15;
const PASSWORD_MAX_LENGTH = 128;

export default function RegisterScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const submit = async () => {
    if (
      submitting ||
      !email.trim() ||
      !fullName.trim() ||
      password.length < PASSWORD_MIN_LENGTH
    ) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setResendMessage(null);
    try {
      const result = await registerMobile({
        email,
        name: fullName,
        password,
      });
      setRegisteredEmail(result.user.email);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof MobileAuthError
          ? error.message
          : 'CaneGuard could not create your account.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (!registeredEmail || resending) {
      return;
    }
    setResending(true);
    setErrorMessage(null);
    setResendMessage(null);
    try {
      await resendVerification(registeredEmail);
      setResendMessage(
        'If the address is eligible, a verification link will be sent.',
      );
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof MobileAuthError
          ? error.message
          : 'CaneGuard could not resend the verification email.',
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Create account</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Register with your name, email, and password to use CaneGuard Mobile.</Text>
      </View>

      {registeredEmail ? (
        <View
          testID="register.verification-state"
          style={[
            styles.messageCard,
            { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
          ]}>
          <Text style={[styles.messageTitle, { color: theme.primaryDark }]}>Check your email</Text>
          <Text style={[styles.statusMessage, { color: theme.text }]}>We created your field-reporter account. Verify {registeredEmail} before signing in.</Text>
          <Text style={[styles.statusMessage, { color: theme.textSecondary }]}>The verification link opens the secure CaneGuard account-verification page.</Text>
          {resendMessage ? (
            <Text accessibilityLiveRegion="polite" style={[styles.statusMessage, { color: theme.primaryDark }]}>{resendMessage}</Text>
          ) : null}
          {errorMessage ? (
            <Text accessibilityLiveRegion="assertive" style={[styles.statusMessage, { color: theme.danger }]}>{errorMessage}</Text>
          ) : null}
          <AppButton
            testID="register.resend-verification"
            variant="secondary"
            onPress={() => void resend()}
            disabled={resending}
            leadingIcon="send">
            {resending ? 'Sending...' : 'Resend verification email'}
          </AppButton>
          <AppButton variant="text" onPress={() => router.replace('/login')}>
            Return to login
          </AppButton>
        </View>
      ) : (
        <View style={styles.formFields}>
          <TextField
            testID="register.full-name-input"
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Juan Dela Cruz"
            maxLength={255}
            textContentType="name"
          />
          <TextField
            testID="register.email-input"
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
            testID="register.password-input"
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            maxLength={PASSWORD_MAX_LENGTH}
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
          />
          <Text style={[styles.hint, { color: theme.textSecondary }]}>Use {PASSWORD_MIN_LENGTH} to {PASSWORD_MAX_LENGTH} characters. A phrase is fine; no symbol or number pattern is required.</Text>
          {errorMessage ? (
            <Text
              accessibilityLiveRegion="assertive"
              testID="register.error"
              style={[styles.statusMessage, { color: theme.danger }]}
              >
              {errorMessage}
            </Text>
          ) : null}
          <AppButton
            testID="register.submit"
            onPress={() => void submit()}
            disabled={
              submitting ||
              !email.trim() ||
              !fullName.trim() ||
              password.length < PASSWORD_MIN_LENGTH
            }>
            {submitting ? 'Creating Account...' : 'Create Account'}
          </AppButton>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>Already have an account?</Text>
        <AppButton variant="text" onPress={() => router.push('/login')}>
          Login
        </AppButton>
      </View>
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
  formFields: {
    gap: Spacing.lg,
  },
  hint: {
    ...Typography.caption,
  },
  messageCard: {
    gap: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  messageTitle: {
    ...Typography.heading,
  },
  statusMessage: {
    ...Typography.bodySmall,
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  footerText: {
    ...Typography.bodySmall,
  },
});
