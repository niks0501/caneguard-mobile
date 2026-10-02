import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Spacing, Typography } from '@/constants/theme';
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
        <AppButton onPress={() => router.push('/register')} accessibilityLabel="Get started with CaneGuard">
          Get Started
        </AppButton>
        <AppButton
          variant="text"
          onPress={() => router.push('/login')}
          accessibilityLabel="I already have an account">
          I already have an account
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
  logo: {
    width: '100%',
    maxWidth: 180,
    aspectRatio: 1,
  },
  appName: {
    ...Typography.title,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.sm,
  },
});
