import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TextField } from '@/components/ui/TextField';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const theme = useTheme();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  return (
    <ScreenContainer contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Sign in to continue using CaneGuard.</Text>
      </View>

      <View style={styles.formFields}>
        <View>
          <TextField
            label="Email or phone"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            placeholder="farmer@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="username"
          />
        </View>
        <View>
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
          />
        </View>
        <AppButton
          onPress={() => setMessage('Login is not connected yet. Authentication will be added next.')}>
          Login
        </AppButton>
        {message ? (
          <Text
            style={[
              styles.statusMessage,
              { color: theme.primaryDark, backgroundColor: theme.surfaceMuted },
            ]}>
            {message}
          </Text>
        ) : null}
      </View>

      <View style={styles.footer}>
        <AppButton variant="text" onPress={() => router.push('/register')}>
          Create an account
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
  statusMessage: {
    ...Typography.bodySmall,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  footer: {
    gap: Spacing.md,
    alignItems: 'center',
  },
});
