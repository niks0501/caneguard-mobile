import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { useToast } from '@/components/ui/Toast';
import { FIELD_GUIDE_TITLE, OFFLINE_READINESS_COPY } from '@/constants/copy';
import { ComponentTokens, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';

// Design read: redesign-overhaul of a native mobile auth screen for field
// agronomists, with a trusted heritage-brand language, leaning toward deep
// cane-green surfaces plus cane-gold accent plus system type.
// Dials: DESIGN_VARIANCE 5 / MOTION_INTENSITY 3 / VISUAL_DENSITY 4.
// Static by intent (no entrance animation), so prefers-reduced-motion is
// honored by construction. Shape rule: xl radii on surfaces, input-token
// radii on fields, full-pill medallion only. Offline: bundled logo asset.
// All color comes from theme tokens (design-spine guard); the light-mode
// header uses primaryDark as its deep cane-green field with onPrimary type.

export default function LoginScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const logoSource = colorScheme === 'dark'
    ? require('../../assets/cane_guard_logo_onDark.png')
    : require('../../assets/cane_guard_logo.png');
  const headerBackground = colorScheme === 'dark' ? theme.backgroundElement : theme.primaryDark;
  const headerTitleColor = colorScheme === 'dark' ? theme.text : theme.onPrimary;
  const headerSubtitleColor = colorScheme === 'dark' ? theme.textSecondary : theme.accent;
  const { showToast } = useToast();
  const {
    biometricEnabled,
    biometricLoading,
    errorMessage,
    login,
    unlockWithBiometrics,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting || !email.trim() || !password) {
      return;
    }
    setSubmitting(true);
    const authenticated = await login(email, password);
    setSubmitting(false);
    if (authenticated) {
      showToast('Signed in', 'success');
      router.replace('/home');
    }
  };

  const handleBiometricUnlock = async () => {
    if (submitting || biometricLoading) {
      return;
    }
    const authenticated = await unlockWithBiometrics();
    if (authenticated) {
      showToast('Signed in', 'success');
      router.replace('/home');
    }
  };

  return (
    <SafeAreaView
      testID="auth.login-screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.root}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: headerBackground }]}>
          <View style={styles.brandRow}>
            <View style={[styles.medallion, { backgroundColor: theme.background }]}>
              <Image source={logoSource} style={styles.logo} resizeMode="contain" />
            </View>
            <View style={styles.brandCopy}>
              <Text style={[styles.brand, { color: headerTitleColor }]}>CaneGuard</Text>
              <Text style={[styles.tagline, { color: headerSubtitleColor }]}>Field disease detection for sugarcane</Text>
            </View>
          </View>
          <View style={[styles.goldRule, { backgroundColor: theme.accent }]} />
        </View>

        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <View style={styles.intro}>
              <Text style={[styles.title, { color: theme.primaryDark }]}>Welcome back</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Sign in to keep your field observations in sync.</Text>
            </View>

            <View style={styles.form}>
              <InputRow testID="auth.email-input" label="Email" icon="mail" value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" textContentType="username" />
              <InputRow testID="auth.password-input" label="Password" icon="lock" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry={!passwordVisible} textContentType="password" trailingIcon={passwordVisible ? 'eye-off' : 'eye'} onTrailingPress={() => setPasswordVisible((visible) => !visible)} />
              {errorMessage ? (
                <View style={styles.errorRow}>
                  <Feather name="alert-circle" size={16} color={theme.danger} />
                  <Text
                    accessibilityLiveRegion="assertive"
                    style={[styles.error, { color: theme.danger }]}>
                    {errorMessage}
                  </Text>
                </View>
              ) : null}
              <AppButton
                testID="auth.login-submit"
                onPress={() => void submit()}
                disabled={submitting || !email.trim() || !password}
                leadingIcon="log-in"
                trailingIcon="arrow-right"
                accessibilityLabel={submitting ? 'Signing in to CaneGuard' : 'Login to CaneGuard'}>
                {submitting ? 'Signing In...' : 'Login'}
              </AppButton>
              {biometricEnabled ? (
                <AppButton
                  testID="auth.biometric-unlock"
                  variant="secondary"
                  onPress={() => void handleBiometricUnlock()}
                  disabled={submitting || biometricLoading}
                  leadingIcon="shield"
                  accessibilityLabel="Unlock with biometrics">
                  {biometricLoading ? 'Unlocking...' : 'Unlock with biometrics'}
                </AppButton>
              ) : (
                <View
                  testID="auth.offline-restart-limit"
                  style={[styles.offlineNote, { backgroundColor: theme.warningBg, borderColor: theme.warning }]}>
                  <Feather name="info" size={16} color={theme.warning} />
                  <Text style={[styles.offlineNoteText, { color: theme.text }]}>
                    {OFFLINE_READINESS_COPY.passwordOnlyRestartLimit}
                  </Text>
                </View>
              )}
              <AppButton
                testID="auth.forgot-password"
                variant="text"
                onPress={() => router.push('/forgot-password')}
                accessibilityLabel="Forgot your password">
                Forgot password?
              </AppButton>
            </View>

            <View style={styles.signupRow}>
              <View style={[styles.rule, { backgroundColor: theme.accent }]} />
              <Pressable accessibilityRole="button" onPress={() => router.push('/register')} style={({ pressed }) => [styles.signupButton, pressed && styles.pressed]}>
                <Text style={[styles.signup, { color: theme.primaryDark }]}>Create an account</Text>
              </Pressable>
              <View style={[styles.rule, { backgroundColor: theme.accent }]} />
            </View>

            {/*
              The gallery needs no account, and a returning signed-out visitor
              lands here rather than on the welcome screen, so the open entry
              point has to exist on both.
            */}
            <AppButton
              testID="auth.field-guide"
              variant="text"
              leadingIcon="book-open"
              onPress={() => router.push('/field-guide')}
              accessibilityLabel="Open the field guide without signing in">
              {FIELD_GUIDE_TITLE}
            </AppButton>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>Offline-first disease detection support</Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type InputRowProps = {
  testID?: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'email-address';
  textContentType?: 'username' | 'password';
  secureTextEntry?: boolean;
  trailingIcon?: keyof typeof Feather.glyphMap;
  onTrailingPress?: () => void;
};

function InputRow({ testID, label, icon, value, onChangeText, placeholder, keyboardType, textContentType, secureTextEntry, trailingIcon, onTrailingPress }: InputRowProps) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.text }]}>{label}</Text>
      <View style={[styles.input, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
        <Feather name={icon} size={20} color={theme.primary} />
        <View style={styles.inputCopy}>
          <TextInput testID={testID} accessibilityLabel={placeholder} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.textSecondary} keyboardType={keyboardType} textContentType={textContentType} autoCapitalize="none" secureTextEntry={secureTextEntry} style={[styles.inputText, { color: theme.text }]} />
        </View>
         {trailingIcon && onTrailingPress ? <Pressable accessibilityRole="button" accessibilityLabel={secureTextEntry ? 'Show password' : 'Hide password'} hitSlop={4} onPress={onTrailingPress} style={styles.trailingButton}><Feather name={trailingIcon} size={20} color={theme.textSecondary} /></Pressable> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  medallion: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 40, height: 40 },
  brandCopy: { flex: 1, gap: Spacing.xs },
  brand: { ...Typography.heading },
  tagline: { ...Typography.bodySmall },
  goldRule: { height: 3, borderRadius: Radius.full, marginTop: Spacing.lg, width: 72 },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  card: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.xl,
    ...Shadows.md,
  },
  intro: { gap: Spacing.sm },
  title: { ...Typography.display, fontWeight: '700' },
  subtitle: { ...Typography.bodySmall },
  form: { gap: Spacing.md },
  field: { gap: Spacing.sm },
  fieldLabel: { ...Typography.label },
  input: { minHeight: ComponentTokens.input.minHeight, paddingHorizontal: Spacing.lg, borderWidth: ComponentTokens.input.borderWidth, borderRadius: ComponentTokens.input.borderRadius, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  inputCopy: { flex: 1 },
  inputText: { ...Typography.body, minHeight: 44, paddingVertical: Spacing.sm },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  error: { ...Typography.bodySmall, fontWeight: '700', flexShrink: 1 },
  trailingButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  signupRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  signupButton: { minHeight: 48, flexShrink: 1, alignItems: 'center', justifyContent: 'center' },
  rule: { height: 1, flex: 1 },
  signup: { ...Typography.bodySmall, fontWeight: '800' },
  footer: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, alignItems: 'center', gap: Spacing.sm },
  footerText: { ...Typography.caption },
  offlineNote: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  offlineNoteText: { ...Typography.caption, flex: 1 },
  pressed: { opacity: 0.7 },
});
