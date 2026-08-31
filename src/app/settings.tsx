import Constants from 'expo-constants';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ComponentTokens, Layout, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/providers/ThemePreferenceProvider';

type DisabledRowProps = {
  label: string;
  description?: string;
};

function DisabledRow({ label, description }: DisabledRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: Coming later`}
      accessibilityState={{ disabled: true }}
      disabled
      onPress={() => undefined}
      style={[styles.menuRow, styles.disabledRow, { borderBottomColor: theme.divider }]}>
      <View style={styles.toggleCopy}>
        <Text style={[styles.menuLabel, { color: theme.textSecondary }]}>{label}</Text>
        {description ? (
          <Text style={[styles.toggleDescription, { color: theme.textSecondary }]}>
            {description}
          </Text>
        ) : null}
      </View>
      <View style={styles.menuValueRow}>
        <Text style={[styles.menuValue, { color: theme.textSecondary }]}>Coming later</Text>
        <Feather name="chevron-right" size={18} color={theme.textSecondary} />
      </View>
    </Pressable>
  );
}

type ToggleRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onToggle: (next: boolean) => void;
};

function ToggleRow({ label, description, value, onToggle }: ToggleRowProps) {
  const theme = useTheme();

  return (
    <View style={[styles.menuRow, { borderBottomColor: theme.divider }]}>
      <View style={styles.toggleCopy}>
        <Text style={[styles.menuLabel, { color: theme.text }]}>{label}</Text>
        {description ? (
          <Text style={[styles.toggleDescription, { color: theme.textSecondary }]}>
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.textSecondary, true: theme.primary }}
        thumbColor={theme.surfaceElevated}
        ios_backgroundColor={theme.textSecondary}
        accessibilityLabel={label}
        accessibilityHint={description ?? `Turn ${label.toLowerCase()} on or off`}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const { isDarkMode, setDarkMode } = useThemePreference();
  const { logout, user } = useAuth();

  const appVersion = Constants.expoConfig?.version ?? 'Unknown';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.root}>
        <ScreenHeader title="Settings" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}>
          <View style={styles.content}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>DISPLAY & ACCESSIBILITY</Text>

            <View
              style={[
                styles.card,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}>
              <DisabledRow label="Language / Wika" />
              <DisabledRow label="Text Size" />
              <ToggleRow
                label="Dark Mode"
                description="Use a darker appearance throughout CaneGuard"
                value={isDarkMode}
                onToggle={setDarkMode}
              />
              <DisabledRow
                label="High Contrast Mode"
                description="Accessibility display controls are not available yet"
              />
            </View>

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>NOTIFICATIONS</Text>

            <View
              style={[
                styles.card,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}>
              <DisabledRow label="Sync Alerts" />
              <DisabledRow label="MAO Advisories" />
            </View>

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>ACCOUNT & SECURITY</Text>

            <View
              style={[
                styles.card,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}>
              <View style={[styles.menuRow, { borderBottomColor: theme.divider }]}>
                <View style={styles.toggleCopy}>
                  <Text style={[styles.menuLabel, { color: theme.text }]}>
                    {user?.name ?? 'Field reporter'}
                  </Text>
                  <Text style={[styles.toggleDescription, { color: theme.textSecondary }]}>
                    {user?.email ?? 'Authenticated mobile account'}
                  </Text>
                </View>
              </View>
              <Pressable
                testID="settings.account-security"
                accessibilityRole="button"
                accessibilityLabel="Account and security"
                onPress={() => router.push('/account-security')}
                style={({ pressed }) => [
                  styles.menuRow,
                  { borderBottomColor: theme.divider },
                  pressed && styles.pressed,
                ]}>
                <View style={styles.toggleCopy}>
                  <Text style={[styles.menuLabel, { color: theme.text }]}>Account security</Text>
                  <Text style={[styles.toggleDescription, { color: theme.textSecondary }]}>Password, email, device, and biometric controls</Text>
                </View>
                <Feather name="chevron-right" size={18} color={theme.textSecondary} />
              </Pressable>
              <View style={styles.logoutRow}>
                <AppButton
                  variant="text"
                  onPress={() =>
                    Alert.alert(
                      'Log out?',
                      'Pending scans remain safely stored on this device.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Log out',
                          style: 'destructive',
                          onPress: () => {
                            void logout().then(
                              ({
                                localClearFailed,
                                remoteRevocationFailed,
                              }) => {
                              if (localClearFailed) {
                                Alert.alert(
                                  'Logout incomplete',
                                  'CaneGuard could not clear secure session storage. Restart the app and try again.',
                                );
                              } else if (remoteRevocationFailed) {
                                Alert.alert(
                                  'Signed out locally',
                                  'The server could not be reached, so the remote token may remain active until it expires or is revoked later.',
                                );
                              }
                            });
                          },
                        },
                      ],
                    )
                  }
                  accessibilityLabel="Log out of your account"
                  style={styles.logoutButton}>
                  <Text style={[styles.logoutText, { color: theme.danger }]}>Logout</Text>
                </AppButton>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>ABOUT</Text>

            <View
              style={[
                styles.card,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}>
              <View style={[styles.menuRow, { borderBottomColor: theme.divider }]}>
                <Text style={[styles.menuLabel, { color: theme.text }]}>App Name</Text>
                <Text style={[styles.menuValue, { color: theme.textSecondary }]}>CaneGuard</Text>
              </View>
              <View style={styles.menuRow}>
                <Text style={[styles.menuLabel, { color: theme.text }]}>Version</Text>
                <Text style={[styles.menuValue, { color: theme.textSecondary }]}>
                  v{appVersion}
                </Text>
              </View>
            </View>

            <View style={{ height: Spacing.xl }} />
          </View>
        </ScrollView>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.label,
    letterSpacing: 1,
  },
  card: {
    borderRadius: ComponentTokens.card.borderRadius,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    ...Shadows.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  menuLabel: {
    ...Typography.bodySmall,
    fontWeight: '700',
    flex: 1,
  },
  disabledRow: { opacity: 0.72 },
  toggleCopy: {
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  toggleDescription: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  menuValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  menuValue: {
    ...Typography.bodySmall,
  },
  manageButton: {
    minHeight: 36,
    paddingHorizontal: Spacing.lg,
  },
  logoutRow: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  logoutButton: {
    minHeight: 44,
  },
  logoutText: {
    ...Typography.body,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
});
