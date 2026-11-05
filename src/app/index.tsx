import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Spacing, Typography } from '@/constants/theme';
import { ACCOUNT_REQUEST_HINT, FIELD_GUIDE_TITLE } from '@/constants/copy';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';

export default function SplashScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const logoSource = colorScheme === 'dark'
    ? require('../../assets/cane_guard_logo_onDark.png')
    : require('../../assets/cane_guard_logo.png');
  const { hasCompletedLogin, status } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated' && hasCompletedLogin) {
      router.replace('/login');
    }
  }, [hasCompletedLogin, status]);

  return (
    <ScreenContainer contentStyle={styles.container} scrollable={false}>
      <View style={styles.brandWrap}>
        <Image
          accessible
          accessibilityLabel="CaneGuard Logo"
          source={logoSource}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.appName, { color: theme.text }]}>CaneGuard</Text>
        <Text style={[styles.subtitle, { color: theme.primaryDark }]}>AI-Based Disease Detection for Sugarcane</Text>
      </View>

      <View style={styles.actions}>
        <AppButton
          testID="welcome.sign-in"
          onPress={() => router.push('/login')}
          accessibilityLabel="Sign in to CaneGuard">
          Sign in
        </AppButton>
        <Text testID="welcome.account-hint" style={[styles.accountHint, { color: theme.textSecondary }]}>
          {ACCOUNT_REQUEST_HINT}
        </Text>
        {/*
          Readable with no account. Repeated on the login screen because a
          returning signed-out visitor is redirected there before they can use
          this action.
        */}
        <AppButton
          testID="welcome.field-guide"
          variant="text"
          leadingIcon="book-open"
          onPress={() => router.push('/field-guide')}
          accessibilityLabel="Open the field guide without signing in">
          {FIELD_GUIDE_TITLE}
        </AppButton>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  brandWrap: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  // Fixed square: on Android a percentage width combined with `aspectRatio`
  // resolves to a full-height box that pushes the Sign in action off-screen
  // on this non-scrolling screen.
  logo: {
    width: 180,
    height: 180,
  },
  appName: {
    ...Typography.title,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  accountHint: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.sm,
  },
});
