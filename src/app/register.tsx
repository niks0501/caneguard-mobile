import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TextField } from '@/components/ui/TextField';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function RegisterScreen() {
  const theme = useTheme();
  const [fullName, setFullName] = useState('');
  const [barangay, setBarangay] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  return (
    <ScreenContainer contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Create account</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Register to start recording sugarcane disease observations.</Text>
      </View>

      <View style={styles.formFields}>
        <View>
          <TextField
            testID="register.full-name-input"
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Juan Dela Cruz"
            textContentType="name"
          />
        </View>
        <View>
          <TextField
            testID="register.barangay-input"
            label="Barangay"
            value={barangay}
            onChangeText={setBarangay}
            placeholder="Barangay name"
            textContentType="addressCity"
          />
        </View>
        <View>
          <TextField
            testID="register.phone-input"
            label="Phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="09XX XXX XXXX"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
          />
        </View>
        <View>
          <TextField
            testID="register.password-input"
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
          />
        </View>
        <AppButton
          onPress={() =>
            setMessage('Account creation is not connected yet. Registration will be added next.')
          }>
          Create Account
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
  statusMessage: {
    ...Typography.bodySmall,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  footerText: {
    ...Typography.bodySmall,
  },
});
