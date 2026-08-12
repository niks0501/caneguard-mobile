import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { Fonts, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const theme = useTheme();
  const { errorMessage, login } = useAuth();
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
      router.replace('/home');
    }
  };

  return (
    <SafeAreaView
      testID="auth.login-screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.divider }]}>
          <View style={styles.brandRow}>
            <Image source={require('../../assets/cane_guard_logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={[styles.brand, { color: theme.primaryDark }]}>CaneGuard</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.intro}>
            <Text style={[styles.title, { color: theme.primaryDark }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Sign in to keep your field observations in sync.</Text>
          </View>

          <View style={styles.form}>
            <InputRow icon="mail" value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" textContentType="username" />
            <InputRow icon="lock" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry={!passwordVisible} textContentType="password" trailingIcon={passwordVisible ? 'eye-off' : 'eye'} onTrailingPress={() => setPasswordVisible((visible) => !visible)} />
            {errorMessage ? (
              <Text
                accessibilityLiveRegion="assertive"
                style={[styles.error, { color: theme.danger }]}>
                {errorMessage}
              </Text>
            ) : null}
            <AppButton
              onPress={() => void submit()}
              disabled={submitting || !email.trim() || !password}
              leadingIcon="log-in"
              trailingIcon="arrow-right"
              accessibilityLabel={submitting ? 'Signing in to CaneGuard' : 'Login to CaneGuard'}>
              {submitting ? 'Signing In...' : 'Login'}
            </AppButton>
          </View>

          <View style={styles.signupRow}>
            <View style={[styles.rule, { backgroundColor: theme.accent }]} />
            <Pressable accessibilityRole="button" onPress={() => router.push('/register')} style={({ pressed }) => [styles.signupButton, pressed && styles.pressed]}>
              <Text style={[styles.signup, { color: theme.primaryDark }]}>Create an account</Text>
            </Pressable>
            <View style={[styles.rule, { backgroundColor: theme.accent }]} />
          </View>
        </View>

        <View style={styles.footer}>
          <View style={[styles.footerLine, { backgroundColor: theme.accent }]} />
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>Offline-first disease detection support</Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type InputRowProps = {
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

function InputRow({ icon, value, onChangeText, placeholder, keyboardType, textContentType, secureTextEntry, trailingIcon, onTrailingPress }: InputRowProps) {
  const theme = useTheme();

  return (
    <View style={[styles.input, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <Feather name={icon} size={20} color={theme.primary} />
      <View style={styles.inputCopy}>
        <TextInput accessibilityLabel={placeholder} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.textSecondary} keyboardType={keyboardType} textContentType={textContentType} autoCapitalize="none" secureTextEntry={secureTextEntry} style={[styles.inputText, { color: theme.text }]} />
      </View>
       {trailingIcon && onTrailingPress ? <Pressable accessibilityRole="button" accessibilityLabel={secureTextEntry ? 'Show password' : 'Hide password'} hitSlop={4} onPress={onTrailingPress} style={styles.trailingButton}><Feather name={trailingIcon} size={20} color={theme.textSecondary} /></Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  hero: { height: 190, justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, borderBottomWidth: 1 },
  brandRow: { maxWidth: '62%', flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, zIndex: 1 },
  logo: { width: 54, height: 54 },
  brand: { ...Typography.subheading, flexShrink: 1, fontFamily: Fonts?.serif, fontSize: 25 },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing['2xl'], gap: Spacing['3xl'] },
  intro: { gap: Spacing.sm },
  title: { ...Typography.display, fontFamily: Fonts?.serif, fontWeight: '700' },
  subtitle: { ...Typography.bodySmall },
  form: { gap: Spacing.md },
  input: { minHeight: 62, paddingHorizontal: Spacing.lg, borderWidth: 1, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, ...Shadows.sm },
  inputCopy: { flex: 1 },
  inputText: { ...Typography.body, minHeight: 44, paddingVertical: Spacing.sm },
  error: { ...Typography.bodySmall, fontWeight: '700' },
  trailingButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  signupRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  signupButton: { minHeight: 44, flexShrink: 1, alignItems: 'center', justifyContent: 'center' },
  rule: { height: 1, flex: 1 },
  signup: { ...Typography.bodySmall, fontWeight: '800' },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg, alignItems: 'center', gap: Spacing.sm },
  footerLine: { width: 70, height: 3, borderRadius: Radius.full },
  footerText: { ...Typography.caption },
  pressed: { opacity: 0.7 },
});
