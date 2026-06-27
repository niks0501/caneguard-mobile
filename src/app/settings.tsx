import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BottomNav } from '@/components/ui/BottomNav';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ComponentTokens, Layout, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SelectRowProps = {
  label: string;
  value: string;
};

function SelectRow({ label, value }: SelectRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={() => Alert.alert(label, `${label} selection will be available in a future update.`)}
      style={({ pressed }) => [
        styles.menuRow,
        { borderBottomColor: theme.divider },
        pressed && { opacity: 0.7 },
      ]}>
      <Text style={[styles.menuLabel, { color: theme.text }]}>{label}</Text>
      <View style={styles.menuValueRow}>
        <Text style={[styles.menuValue, { color: theme.textSecondary }]}>{value}</Text>
        <Text style={[styles.chevron, { color: theme.textSecondary }]}>{'>'}</Text>
      </View>
    </Pressable>
  );
}

type ToggleRowProps = {
  label: string;
  value: boolean;
  onToggle: (next: boolean) => void;
};

function ToggleRow({ label, value, onToggle }: ToggleRowProps) {
  const theme = useTheme();

  return (
    <View style={[styles.menuRow, { borderBottomColor: theme.divider }]}>
      <Text style={[styles.menuLabel, { color: theme.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#D8E0D9', true: theme.primary }}
        thumbColor="#FFFFFF"
        accessibilityLabel={label}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const theme = useTheme();

  const [highContrast, setHighContrast] = useState(false);
  const [syncAlerts, setSyncAlerts] = useState(true);
  const [maoAdvisories, setMaoAdvisories] = useState(true);

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
              <SelectRow label="Language / Wika" value="English" />
              <SelectRow label="Text Size" value="Normal" />
              <ToggleRow label="High Contrast Mode" value={highContrast} onToggle={setHighContrast} />
            </View>

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>NOTIFICATIONS</Text>

            <View
              style={[
                styles.card,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}>
              <ToggleRow label="Sync Alerts" value={syncAlerts} onToggle={setSyncAlerts} />
              <ToggleRow label="MAO Advisories" value={maoAdvisories} onToggle={setMaoAdvisories} />
            </View>

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>ACCOUNT & SECURITY</Text>

            <View
              style={[
                styles.card,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}>
              <View style={[styles.menuRow, { borderBottomColor: theme.divider }]}>
                <Text style={[styles.menuLabel, { color: theme.text }]}>Profile Settings</Text>
                <AppButton
                  variant="secondary"
                  onPress={() => Alert.alert('Profile', 'Profile management will be available in a future update.')}
                  accessibilityLabel="Manage profile settings"
                  style={styles.manageButton}>
                  Manage
                </AppButton>
              </View>
              <View style={styles.logoutRow}>
                <AppButton
                  variant="text"
                  onPress={() => Alert.alert('Logout', 'Logout will be available in a future update.')}
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
                <Text style={[styles.menuValue, { color: theme.textSecondary }]}>v1.0.0-prototype</Text>
              </View>
            </View>

            <View style={{ height: Layout.bottomNavHeight + Spacing.xl }} />
          </View>
        </ScrollView>

        <BottomNav activeTab="settings" />
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
  menuValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  menuValue: {
    ...Typography.bodySmall,
  },
  chevron: {
    ...Typography.body,
    fontWeight: '800',
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
});
