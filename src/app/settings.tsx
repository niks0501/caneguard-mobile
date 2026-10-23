import Constants from 'expo-constants';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { FIELD_GUIDE_ENTRY_DESCRIPTION } from '@/constants/copy';
import { ComponentTokens, Layout, Shadows, Spacing, Typography } from '@/constants/theme';
import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import {
  clearCachedOfficeDataForOwner,
  clearLocalDataForOwner,
  getLocalDataRemovalPreview,
  type LocalDataRemovalPreview,
} from '@/database/localDataLifecycle';
import { OfflineReadinessCard } from '@/features/auth/components/OfflineReadinessCard';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/providers/ThemePreferenceProvider';


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
  const { showToast } = useToast();
  const { isDarkMode, setDarkMode } = useThemePreference();
  const database = useCaneGuardDatabase();
  const { logout, user } = useAuth();
  const [clearingLocalData, setClearingLocalData] = useState(false);
  const [clearingCachedData, setClearingCachedData] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? 'Unknown';

  const clearCachedData = async () => {
    if (!user || clearingCachedData) {
      return;
    }
    setClearingCachedData(true);
    try {
      const result = await clearCachedOfficeDataForOwner(database, user.uuid);
      showToast('Downloaded office data cleared', 'success');
      Alert.alert(
        'Downloaded office data cleared',
        `${result.deletedRows} downloaded ${result.deletedRows === 1 ? 'item was' : 'items were'} removed. Saved scans, drafts, unsent reports, boundaries and completed visits were kept on this device.`,
      );
    } catch {
      showToast('Could not clear downloaded data', 'error');
    } finally {
      setClearingCachedData(false);
    }
  };

  const describeRemovalPreview = (preview: LocalDataRemovalPreview): string =>
    [
      `${preview.reports} report${preview.reports === 1 ? '' : 's'} (${preview.draftReports} draft, ${preview.finalizedUnsentReports} finalized but not sent)`,
      `${preview.visits} completed visit${preview.visits === 1 ? '' : 's'} (${preview.unsentVisits} not sent)`,
      `${preview.boundaries} boundar${preview.boundaries === 1 ? 'y' : 'ies'} (${preview.unsentBoundaries} not sent)`,
      `${preview.scans} saved scan${preview.scans === 1 ? '' : 's'}`,
      `${preview.draftCheckpoints} saved draft checkpoint${preview.draftCheckpoints === 1 ? '' : 's'}`,
      `${preview.assignments} downloaded visit assignment${preview.assignments === 1 ? '' : 's'}`,
      `${preview.notifications} cached office update${preview.notifications === 1 ? '' : 's'}`,
      preview.totalUnsent > 0
        ? `⚠︎ ${preview.totalUnsent} item${preview.totalUnsent === 1 ? '' : 's'} on this device ${preview.totalUnsent === 1 ? 'has' : 'have'} not reached the office and will be lost permanently.`
        : 'Everything listed has already reached the office.',
    ].join('\n');

  const confirmPermanentRemoval = (preview: LocalDataRemovalPreview) => {
    if (preview.uploadInFlight) {
      Alert.alert(
        'An upload is still running',
        'Wait for the current upload to finish, then review the local records again before removing anything.',
      );
      return;
    }
    Alert.alert(
      'Remove all local records?',
      `${describeRemovalPreview(preview)}\n\nThis cannot be undone. Server data and other accounts are not changed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text:
            preview.totalUnsent > 0
              ? 'Continue without unsent work'
              : 'Remove local records',
          style: 'destructive',
          onPress: () => {
            if (preview.totalUnsent > 0) {
              Alert.alert(
                'Lose unsent work permanently?',
                `${preview.totalUnsent} unsent item${preview.totalUnsent === 1 ? '' : 's'} will be deleted and cannot be sent afterwards.`,
                [
                  { text: 'Keep my work', style: 'cancel' },
                  {
                    text: 'Delete unsent work',
                    style: 'destructive',
                    onPress: () => void removeLocalData(preview),
                  },
                ],
              );
              return;
            }
            void removeLocalData(preview);
          },
        },
      ],
    );
  };

  const startPermanentRemoval = () => {
    if (!user || clearingLocalData) {
      return;
    }
    try {
      confirmPermanentRemoval(getLocalDataRemovalPreview(database, user.uuid));
    } catch {
      showToast('Could not read local record counts', 'error');
    }
  };

  const removeLocalData = async (expectedPreview: LocalDataRemovalPreview) => {
    if (!user || clearingLocalData) {
      return;
    }
    setClearingLocalData(true);
    try {
      const result = await clearLocalDataForOwner(database, user.uuid, {
        expectedPreview,
      });
      if (result.imageCleanupErrors.length > 0) {
        showToast('Local records removed with warnings', 'info');
      } else {
        showToast('Local records removed', 'success');
      }
      Alert.alert(
        result.imageCleanupErrors.length > 0
          ? 'Local records removed with cleanup warnings'
          : 'Local records removed',
        result.imageCleanupErrors.length > 0
          ? 'Your local records were removed, but one or more saved images could not be deleted yet.'
          : 'Saved scans, drafts, reports, boundaries, visits, and cached account data were removed from this device.',
      );
    } catch (error: unknown) {
      showToast('Could not remove local records', 'error');
      Alert.alert(
        'Could not remove local records',
        error instanceof Error
          ? error.message
          : 'CaneGuard could not remove all local records. Review the counts and try again.',
      );
    } finally {
      setClearingLocalData(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="Settings" variant="plain" />

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
              <ToggleRow
                label="Dark Mode"
                description="Use a darker appearance throughout CaneGuard"
                value={isDarkMode}
                onToggle={setDarkMode}
              />
            </View>

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>FIELD READINESS</Text>
            <OfflineReadinessCard />

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>FIELD GUIDE</Text>

            <View
              style={[
                styles.card,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}>
              <Pressable
                testID="settings.disease-reference"
                accessibilityRole="button"
                accessibilityLabel="Field guide"
                onPress={() => router.push('/field-guide')}
                style={({ pressed }) => [
                  styles.menuRow,
                  pressed && styles.pressed,
                ]}>
                <View style={styles.toggleCopy}>
                  <Text style={[styles.menuLabel, { color: theme.text }]}>Field guide</Text>
                  <Text style={[styles.toggleDescription, { color: theme.textSecondary }]}>
                    {FIELD_GUIDE_ENTRY_DESCRIPTION}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={theme.textSecondary} />
              </Pressable>
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
                    {user?.name ?? 'Field Inspector'}
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
                  testID="settings.logout"
                  variant="text"
                  onPress={() =>
                    Alert.alert(
                      'Log out?',
                      'Logging out revokes the server session and removes the protected credential. Pending scans remain owner-scoped on this device; use Remove all local records before handing the device to another user.',
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
                                showToast('Logout incomplete', 'error');
                                Alert.alert(
                                  'Logout incomplete',
                                  'CaneGuard could not clear secure session storage. Restart the app and try again.',
                                );
                              } else if (remoteRevocationFailed) {
                                showToast('Signed out locally', 'info');
                                Alert.alert(
                                  'Signed out locally',
                                  'The server could not be reached, so the remote token may remain active until it expires or is revoked later.',
                                );
                              } else {
                                showToast('Signed out', 'info');
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
                <AppButton
                  testID="settings.clear-cached-office-data"
                  variant="text"
                  disabled={clearingCachedData}
                  onPress={() =>
                    Alert.alert(
                      'Clear downloaded office data?',
                      'This removes only data that can be downloaded again: visit assignments and office updates. Every saved scan, draft, unsent report, boundary and completed visit stays on this device.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: clearingCachedData
                            ? 'Clearing…'
                            : 'Clear downloaded data',
                          onPress: () => void clearCachedData(),
                        },
                      ],
                    )
                  }
                  accessibilityLabel="Clear downloaded office data only">
                  <Text style={[styles.logoutText, { color: theme.primary }]}>
                    {clearingCachedData
                      ? 'Clearing downloaded data…'
                      : 'Clear downloaded office data'}
                  </Text>
                </AppButton>
                <AppButton
                  testID="settings.remove-local-records"
                  variant="text"
                  disabled={clearingLocalData}
                  onPress={startPermanentRemoval}
                  accessibilityLabel="Remove all local records for this account">
                  <Text style={[styles.logoutText, { color: theme.danger }]}>
                    {clearingLocalData
                      ? 'Removing local records…'
                      : 'Remove all local records'}
                  </Text>
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
