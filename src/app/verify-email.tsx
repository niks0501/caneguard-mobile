import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Radius, Spacing, Typography } from '@/constants/theme';
import {
  MobileAuthError,
  verifyEmail,
} from '@/features/auth/api/mobileAuthApi';
import { useTheme } from '@/hooks/use-theme';

type VerifyParams = {
  expires?: string | string[];
  hash?: string | string[];
  id?: string | string[];
  signature?: string | string[];
};

export default function VerifyEmailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<VerifyParams>();
  const hasParams = hasVerificationParams(params);
  const [state, setState] = useState<'error' | 'loading' | 'missing' | 'success'>(
    hasParams ? 'loading' : 'missing',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hasParams) {
      return;
    }

    let active = true;
    void verifyEmail({
      expires: readParam(params.expires),
      hash: readParam(params.hash),
      id: readParam(params.id),
      signature: readParam(params.signature),
    })
      .then(() => {
        if (active) {
          setState('success');
        }
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        setState('error');
        setErrorMessage(
          error instanceof MobileAuthError
            ? error.message
            : 'CaneGuard could not verify this email address.',
        );
      });

    return () => {
      active = false;
    };
  }, [hasParams, params.expires, params.hash, params.id, params.signature]);

  return (
    <ScreenContainer contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Email verification</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Confirm your email address before signing in to CaneGuard Mobile.</Text>
      </View>

      {state === 'loading' ? (
        <Text accessibilityLiveRegion="polite" style={[styles.message, { color: theme.textSecondary }]}>Verifying your email...</Text>
      ) : state === 'success' ? (
        <View testID="verify-email.success" accessibilityLiveRegion="polite" style={[styles.card, { backgroundColor: theme.surfaceMuted }]}>
          <Text style={[styles.cardTitle, { color: theme.primaryDark }]}>Email verified</Text>
          <Text style={[styles.message, { color: theme.text }]}>You may now sign in to CaneGuard Mobile.</Text>
          <AppButton onPress={() => router.replace('/login')}>Continue to login</AppButton>
        </View>
      ) : state === 'missing' ? (
        <View testID="verify-email.missing" style={[styles.card, { backgroundColor: theme.surfaceMuted }]}>
          <Text style={[styles.cardTitle, { color: theme.primaryDark }]}>Verification link required</Text>
          <Text style={[styles.message, { color: theme.text }]}>Open the secure verification link from your email to continue.</Text>
          <AppButton variant="secondary" onPress={() => router.replace('/login')}>Return to login</AppButton>
        </View>
      ) : (
        <View testID="verify-email.error" accessibilityLiveRegion="assertive" style={[styles.card, { backgroundColor: theme.dangerBg }]}>
          <Text style={[styles.cardTitle, { color: theme.danger }]}>Verification could not be completed</Text>
          <Text style={[styles.message, { color: theme.text }]}>{errorMessage}</Text>
          <AppButton variant="secondary" onPress={() => router.replace('/login')}>Return to login</AppButton>
        </View>
      )}

      <AppButton variant="text" onPress={() => router.push('/login')}>
        Back to login
      </AppButton>
    </ScreenContainer>
  );
}

function hasVerificationParams(params: VerifyParams): boolean {
  return Boolean(
    readParam(params.expires) &&
      readParam(params.hash) &&
      readParam(params.id) &&
      readParam(params.signature),
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
  card: {
    gap: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  cardTitle: {
    ...Typography.heading,
  },
  message: {
    ...Typography.bodySmall,
  },
});
