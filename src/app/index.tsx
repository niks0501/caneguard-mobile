import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function SplashScreen() {
  const theme = useTheme();

  return (
    <ScreenContainer contentStyle={styles.container}>
      <View style={styles.brandWrap}>
        <View
          accessibilityLabel="Minimal sugarcane leaf mark"
          accessible
          style={[styles.leafMark, { backgroundColor: theme.primary }]}>
          <View style={[styles.leafBlade, styles.leafBladeLeft, { backgroundColor: theme.accent }]} />
          <View style={[styles.leafBlade, styles.leafBladeRight, { backgroundColor: theme.accent }]} />
          <View style={[styles.leafStem, { backgroundColor: theme.surfaceElevated }]} />
        </View>
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
    gap: Spacing['3xl'],
  },
  brandWrap: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  leafMark: {
    width: 92,
    height: 92,
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  leafBlade: {
    position: 'absolute',
    width: 18,
    height: 62,
    borderRadius: Radius.full,
  },
  leafBladeLeft: {
    transform: [{ rotate: '-32deg' }],
    left: 28,
    top: 13,
  },
  leafBladeRight: {
    transform: [{ rotate: '32deg' }],
    right: 28,
    top: 13,
  },
  leafStem: {
    width: 8,
    height: 56,
    borderRadius: Radius.full,
    transform: [{ rotate: '2deg' }],
  },
  appName: {
    ...Typography.display,
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
