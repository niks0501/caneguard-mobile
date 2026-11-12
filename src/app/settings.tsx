import Constants from 'expo-constants';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FARMER_COPY, FIELD_GUIDE_ENTRY_DESCRIPTION, LOGOUT_DIALOG_COPY } from '@/constants/copy';
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
import { useSync } from '@/features/sync/hooks/useSync';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/hooks/use-theme';
import { useLanguagePreference, type FarmerLanguage } from '@/providers/LanguagePreferenceProvider';
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

function LanguageRow() {
  const theme = useTheme();
  const { language, setLanguage } = useLanguagePreference();
  const copy = FARMER_COPY[language].settings;
  const options: { value: FarmerLanguage; label: string }[] = [
    { value: 'tl', label: copy.tagalog },
    { value: 'en', label: copy.english },
  ];

  return (
    <View style={[styles.menuRow, { borderBottomColor: theme.divider }]}>
      <View style={styles.toggleCopy}>
        <Text style={[styles.menuLabel, { color: theme.text }]}>{copy.languageLabel}</Text>
        <Text style={[styles.toggleDescription, { color: theme.textSecondary }]}>
          {copy.languageDescription}
        </Text>
        <View style={styles.languageOptions}>
          {options.map((option) => {
            const selected = option.value === language;
            return (
              <Pressable
                key={option.value}
                testID={`settings.language.${option.value}`}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ selected }}
                onPress={() => setLanguage(option.value)}
                style={[
                  styles.languageChip,
                  {
                    borderColor: selected ? theme.primary : theme.border,
                    backgroundColor: selected ? theme.primary : 'transparent',
                  },
                ]}>
                <Text
                  style={[
                    styles.languageChipText,
                    { color: selected ? theme.surfaceElevated : theme.text },
                  ]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const { language } = useLanguagePreference();
  const { showToast } = useToast();
  const { isDarkMode, setDarkMode } = useThemePreference();
  const database = useCaneGuardDatabase();
  const { logout, user } = useAuth();
  const { pendingCount } = useSync();
  const isFarmer = user?.role === 'farmer';
  const copy = FARMER_COPY[language].settingsScreen;
  const [clearingLocalData, setClearingLocalData] = useState(false);
  const [clearingCachedData, setClearingCachedData] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? 'Unknown';

  const confirmLogout = async () => {
    if (loggingOut) {
      return;
    }
    setLoggingOut(true);
    try {
      const { localClearFailed, remoteRevocationFailed } = await logout();
      if (localClearFailed) {
        showToast(isFarmer ? copy.logoutIncomplete : 'Logout incomplete', 'error');
        Alert.alert(
          isFarmer ? copy.logoutIncomplete : 'Logout incomplete',
          isFarmer
            ? copy.logoutIncompleteMessage
            : 'CaneGuard could not clear secure session storage. Restart the app and try again.',
        );
      } else if (remoteRevocationFailed) {
        showToast(isFarmer ? copy.signedOutLocally : 'Signed out locally', 'info');
        Alert.alert(
          isFarmer ? copy.signedOutLocally : 'Signed out locally',
          isFarmer
            ? copy.remoteLogoutMessage
            : 'The server could not be reached, so the remote token may remain active until it expires or is revoked later.',
        );
      } else {
        showToast(isFarmer ? copy.signedOut : 'Signed out', 'info');
      }
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const clearCachedData = async () => {
    if (!user || clearingCachedData) {
      return;
    }
    setClearingCachedData(true);
    try {
      const result = await clearCachedOfficeDataForOwner(database, user.uuid);
      showToast(isFarmer ? copy.cachedCleared : 'Downloaded office data cleared', 'success');
      Alert.alert(
        isFarmer ? copy.cachedCleared : 'Downloaded office data cleared',
        isFarmer
          ? copy.cachedClearedMessage(result.deletedRows)
          : `${result.deletedRows} downloaded ${result.deletedRows === 1 ? 'item was' : 'items were'} removed. Saved scans, drafts, unsent reports, boundaries and completed visits were kept on this device.`,
      );
    } catch {
      showToast(isFarmer ? copy.cachedClearFailed : 'Could not clear downloaded data', 'error');
    } finally {
      setClearingCachedData(false);
    }
  };

  const describeRemovalPreview = (preview: LocalDataRemovalPreview): string => isFarmer
    ? `${copy.removalCounts({ reports: preview.reports, visits: preview.visits, boundaries: preview.boundaries, scans: preview.scans, drafts: preview.draftCheckpoints, assignments: preview.assignments, notifications: preview.notifications })}\n${preview.totalUnsent > 0 ? copy.unsentWarning(preview.totalUnsent) : copy.removeLocalMessage}`
    : [
      `${preview.reports} report${preview.reports === 1 ? '' : 's'} (${preview.draftReports} draft, ${preview.finalizedUnsentReports} finalized but not sent)`,
      `${preview.visits} completed visit${preview.visits === 1 ? '' : 's'} (${preview.unsentVisits} not sent)`,
      `${preview.boundaries} boundar${preview.boundaries === 1 ? 'y' : 'ies'} (${preview.unsentBoundaries} not sent)`,
      `${preview.scans} saved scan${preview.scans === 1 ? '' : 's'}${preview.unsentScans > 0 ? ` (${preview.unsentScans} not sent to the office)` : ''}`,
      `${preview.draftCheckpoints} saved draft checkpoint${preview.draftCheckpoints === 1 ? '' : 's'}`,
      `${preview.assignments} downloaded visit${preview.assignments === 1 ? '' : 's'}`,
      `${preview.notifications} cached office update${preview.notifications === 1 ? '' : 's'}`,
      preview.totalUnsent > 0
        ? `⚠︎ ${preview.totalUnsent} item${preview.totalUnsent === 1 ? '' : 's'} on this device ${preview.totalUnsent === 1 ? 'has' : 'have'} not reached the office and will be lost permanently.`
        : 'Every listed report, visit and boundary has already reached the office.',
    ].join('\n');

  const confirmPermanentRemoval = (preview: LocalDataRemovalPreview) => {
    if (preview.uploadInFlight) {
      Alert.alert(
        isFarmer ? copy.removeLocalBusy : 'An upload is still running',
        isFarmer
          ? copy.removeLocalBusy
          : 'Wait for the current upload to finish, then review the local records again before removing anything.',
      );
      return;
    }
    Alert.alert(
      isFarmer ? copy.removeLocalTitle : 'Remove all local records?',
      `${describeRemovalPreview(preview)}\n\n${isFarmer ? copy.removeLocalMessage : 'This cannot be undone. Server data and other accounts are not changed.'}`,
      [
        { text: isFarmer ? copy.cancel : 'Cancel', style: 'cancel' },
        {
          text:
            preview.totalUnsent > 0
              ? isFarmer ? copy.continueUnsent : 'Continue without unsent work'
              : isFarmer ? copy.removeLocalConfirm : 'Remove local records',
          style: 'destructive',
          onPress: () => {
            if (preview.totalUnsent > 0) {
              Alert.alert(
                isFarmer ? copy.loseUnsentTitle : 'Lose unsent work permanently?',
                isFarmer
                  ? copy.unsentDeletionMessage(preview.totalUnsent)
                  : `${preview.totalUnsent} unsent item${preview.totalUnsent === 1 ? '' : 's'} will be deleted and cannot be sent afterwards.`,
                [
                  { text: isFarmer ? copy.keepWork : 'Keep my work', style: 'cancel' },
                  {
                    text: isFarmer ? copy.deleteUnsent : 'Delete unsent work',
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
      showToast(isFarmer ? copy.removeLocalFailed : 'Could not read local record counts', 'error');
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
        showToast(isFarmer ? copy.removeLocalWarning : 'Local records removed with warnings', 'info');
      } else {
        showToast(isFarmer ? copy.removeLocalConfirm : 'Local records removed', 'success');
      }
      Alert.alert(
        result.imageCleanupErrors.length > 0
          ? isFarmer ? copy.removeLocalWarning : 'Local records removed with cleanup warnings'
          : isFarmer ? copy.removeLocalConfirm : 'Local records removed',
        result.imageCleanupErrors.length > 0
          ? isFarmer ? copy.removedWithWarnings : 'Your local records were removed, but one or more saved images could not be deleted yet.'
          : isFarmer ? copy.removed : 'Saved scans, drafts, reports, boundaries, visits, and cached account data were removed from this device.',
      );
    } catch (error: unknown) {
      showToast(isFarmer ? copy.removeLocalFailed : 'Could not remove local records', 'error');
      Alert.alert(
        isFarmer ? copy.removeLocalFailed : 'Could not remove local records',
        isFarmer
          ? copy.removeLocalFailed
          : error instanceof Error
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
        <BrandedScreenHeader
          title={isFarmer ? copy.title : 'Settings'}
          variant="plain"
          backAccessibilityLabel={isFarmer ? FARMER_COPY[language].record.backLabel : undefined}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}>
          <View style={styles.content}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{isFarmer ? copy.displaySection : 'DISPLAY & ACCESSIBILITY'}</Text>

            <View
              style={[
                styles.card,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}>
              <ToggleRow
                label={isFarmer ? copy.darkMode : 'Dark Mode'}
                description={isFarmer ? copy.darkModeDescription : 'Use a darker appearance throughout CaneGuard'}
                value={isDarkMode}
                onToggle={setDarkMode}
              />
              {isFarmer ? <LanguageRow /> : null}
            </View>

            {isFarmer ? null : (
              <>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>FIELD READINESS</Text>
                <OfflineReadinessCard />
              </>
            )}

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{isFarmer ? copy.fieldGuideSection : 'FIELD GUIDE'}</Text>

            <View
              style={[
                styles.card,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}>
              <Pressable
                testID="settings.disease-reference"
                accessibilityRole="button"
                accessibilityLabel={isFarmer ? copy.fieldGuideTitle : 'Field guide'}
                onPress={() => router.push('/field-guide')}
                style={({ pressed }) => [
                  styles.menuRow,
                  pressed && styles.pressed,
                ]}>
                <View style={styles.toggleCopy}>
                  <Text style={[styles.menuLabel, { color: theme.text }]}>{isFarmer ? copy.fieldGuideTitle : 'Field guide'}</Text>
                  <Text style={[styles.toggleDescription, { color: theme.textSecondary }]}>
                    {FIELD_GUIDE_ENTRY_DESCRIPTION}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{isFarmer ? copy.accountSection : 'ACCOUNT & SECURITY'}</Text>

            <View
              style={[
                styles.card,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}>
              <View style={[styles.menuRow, { borderBottomColor: theme.divider }]}>
                <View style={styles.toggleCopy}>
                  <Text style={[styles.menuLabel, { color: theme.text }]}>
                    {user?.name ?? (isFarmer ? copy.fallbackName : 'Field Inspector')}
                  </Text>
                  <Text style={[styles.toggleDescription, { color: theme.textSecondary }]}>
                    {user?.email ?? (isFarmer ? copy.fallbackAccount : 'Authenticated mobile account')}
                  </Text>
                </View>
              </View>
              <Pressable
                testID="settings.account-security"
                accessibilityRole="button"
                accessibilityLabel={isFarmer ? copy.accountSecurity : 'Account and security'}
                onPress={() => router.push('/account-security')}
                style={({ pressed }) => [
                  styles.menuRow,
                  { borderBottomColor: theme.divider },
                  pressed && styles.pressed,
                ]}>
                <View style={styles.toggleCopy}>
                  <Text style={[styles.menuLabel, { color: theme.text }]}>{isFarmer ? copy.accountSecurity : 'Account security'}</Text>
                  <Text style={[styles.toggleDescription, { color: theme.textSecondary }]}>{isFarmer ? copy.accountSecurityDescription : 'Password, email, device, and biometric controls'}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={theme.textSecondary} />
              </Pressable>
              <View style={styles.logoutRow}>
                <AppButton
                  testID="settings.logout"
                  variant="text"
                  onPress={() => setShowLogoutConfirm(true)}
                  accessibilityLabel={isFarmer ? copy.logoutAccessibility : 'Log out of your account'}
                  style={styles.logoutButton}>
                  <Text style={[styles.logoutText, { color: theme.danger }]}>{isFarmer ? copy.logout : 'Logout'}</Text>
                </AppButton>
                <AppButton
                  testID="settings.clear-cached-office-data"
                  variant="text"
                  busy={clearingCachedData}
                  disabled={clearingCachedData}
                  onPress={() =>
                    Alert.alert(
                      isFarmer ? copy.clearCachedTitle : 'Clear downloaded office data?',
                      isFarmer ? copy.clearCachedMessage : 'This removes only data that can be downloaded again: visits and office updates. Every saved scan, draft, unsent report, boundary and completed visit stays on this device.',
                      [
                        { text: isFarmer ? copy.cancel : 'Cancel', style: 'cancel' },
                        {
                          text: clearingCachedData
                            ? isFarmer ? copy.clearingCached : 'Clearing…'
                            : isFarmer ? copy.clearCachedConfirm : 'Clear downloaded data',
                          onPress: () => void clearCachedData(),
                        },
                      ],
                    )
                  }
                  accessibilityLabel={isFarmer ? copy.clearCachedAccessibility : 'Clear downloaded office data only'}>
                  {clearingCachedData
                    ? isFarmer ? copy.clearingCached : 'Clearing downloaded data…'
                    : isFarmer ? copy.clearCached : 'Clear downloaded office data'}
                </AppButton>
                <AppButton
                  testID="settings.remove-local-records"
                  variant="danger"
                  busy={clearingLocalData}
                  disabled={clearingLocalData}
                  onPress={startPermanentRemoval}
                  accessibilityLabel={isFarmer ? copy.removeLocalAccessibility : 'Remove all local records for this account'}>
                  {clearingLocalData
                    ? isFarmer ? copy.removingLocal : 'Removing local records…'
                    : isFarmer ? copy.removeLocal : 'Remove all local records'}
                </AppButton>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{isFarmer ? copy.aboutSection : 'ABOUT'}</Text>

            <View
              style={[
                styles.card,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}>
              <View style={[styles.menuRow, { borderBottomColor: theme.divider }]}>
                <Text style={[styles.menuLabel, { color: theme.text }]}>{isFarmer ? copy.appName : 'App Name'}</Text>
                <Text style={[styles.menuValue, { color: theme.textSecondary }]}>CaneGuard</Text>
              </View>
              <View style={styles.menuRow}>
                <Text style={[styles.menuLabel, { color: theme.text }]}>{isFarmer ? copy.version : 'Version'}</Text>
                <Text style={[styles.menuValue, { color: theme.textSecondary }]}>
                  v{appVersion}
                </Text>
              </View>
            </View>

            <View style={{ height: Spacing.xl }} />
          </View>
        </ScrollView>

        <ConfirmDialog
          visible={showLogoutConfirm}
          title={isFarmer ? copy.logoutDialogTitle : LOGOUT_DIALOG_COPY.title}
          message={
            loggingOut
              ? isFarmer ? copy.signingOutMessage : LOGOUT_DIALOG_COPY.busyMessage
              : isFarmer
                ? `${copy.logoutDialogMessage}${pendingCount > 0 ? ` ${copy.pendingNote(pendingCount)}` : ''}`
                : pendingCount > 0
                  ? `${LOGOUT_DIALOG_COPY.message} ${LOGOUT_DIALOG_COPY.pendingNote(pendingCount)}`
                  : LOGOUT_DIALOG_COPY.message
          }
          confirmLabel={isFarmer ? copy.logoutDialogConfirm : LOGOUT_DIALOG_COPY.confirmLabel}
          busy={loggingOut}
          busyLabel={isFarmer ? copy.loggingOut : LOGOUT_DIALOG_COPY.busyLabel}
          destructive
          overlay
          testID="settings.logout-dialog"
          onConfirm={() => void confirmLogout()}
          onCancel={() => setShowLogoutConfirm(false)}
          onRequestClose={() => setShowLogoutConfirm(false)}
        />
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
  languageOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  languageChip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderRadius: ComponentTokens.card.borderRadius,
  },
  languageChipText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
});
