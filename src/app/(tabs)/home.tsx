import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { HomeAttentionCard } from '@/features/activity/components/HomeAttentionCard';
import { buildMorningNote, type MorningNote } from '@/features/activity/domain/morningNote';
import {
  firstActionableAttentionItem,
  type NeedsAttentionItem,
} from '@/features/activity/domain/needsAttention';
import { useHomeAttention } from '@/features/activity/hooks/useHomeAttention';
import { HomeMyScansCard } from '@/features/home/components/HomeMyScansCard';
import { HomeHeaderBand } from '@/features/home/components/HomeHeaderBand';
import { HomeSignsStrip, HomeToolTiles } from '@/features/home/components/HomeFieldTools';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  OfficeUpdatesPill,
  OFFICE_UPDATES_PILL_CLEARANCE,
} from '@/features/notifications/components/OfficeUpdatesPill';
import { useOfficeUpdates } from '@/features/notifications/providers/OfficeUpdatesProvider';
import { notificationDestinationRoute } from '@/features/notifications/services/resolveNotificationDestination';
import { getHomeSyncNote, INSPECTOR_WORK_WAITING_COPY } from '@/features/sync/utils/syncStatusCopy';
import { useSync } from '@/features/sync/hooks/useSync';
import { FARMER_COPY, FIELD_SURVEY_COPY, HOME_NOTE_COPY } from '@/constants/copy';
import {
  ComponentTokens,
  Fonts,
  Layout,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { useLanguagePreference } from '@/providers/LanguagePreferenceProvider';

export default function HomeScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const logoSource = colorScheme === 'dark'
    ? require('../../../assets/cane_guard_logo_onDark.png')
    : require('../../../assets/cane_guard_logo.png');
  const { sessionVerification, user } = useAuth();
  const sync = useSync();
  const { language } = useLanguagePreference();
  const isFarmer = user?.role === 'farmer';
  const showInspectorWorkWaiting = isFarmer && sync.inspectorWorkWaiting;
  const attention = useHomeAttention();
  const { open: openOfficeUpdates, unreadCount } = useOfficeUpdates();
  const [dismissedUpdateCount, setDismissedUpdateCount] = useState(0);
  const showOfficeUpdatesPill = unreadCount > dismissedUpdateCount;
  const syncNote = getHomeSyncNote({
    apiReachability: sync.apiReachability,
    isOnline: sync.isOnline,
    isSyncing: sync.isSyncing,
    pendingCompletionsCount: sync.pendingCompletionsCount,
    pendingCount: sync.pendingCount,
    pendingReportsCount: sync.pendingReportsCount,
    pendingSurveysCount: sync.pendingSurveysCount,
    sessionVerification,
  });
  const farmerCopy = FARMER_COPY[language];
  // Farmers have no visits or office work and send nothing, so their headline is
  // a prompt in their language: never "All clear." and never a send state.
  const note: MorningNote = isFarmer
    ? {
        action: 'scan',
        actionLabel: farmerCopy.actions.startScan,
        headline: farmerCopy.home.headline,
        headlineOpensActivity: false,
        syncLine: null,
        visitsLine: null,
      }
    : buildMorningNote(attention.items, syncNote);
  const now = useNow();
  // Stable identity so the memoized attention rows can skip re-rendering when
  // only unrelated Home state changes.
  const markAttentionRead = attention.markRead;
  const openAttentionItem = useCallback(
    (item: NeedsAttentionItem) => {
      if (!item.destination) return;
      const route = notificationDestinationRoute(item.destination);
      if (!route) return;
      if (item.kind === 'notification') {
        // Acknowledgment is best effort: a failed read mutation never blocks the
        // inspector from opening the destination.
        void markAttentionRead(item.id.replace(/^notification-/, ''));
      }
      router.push(route as never);
    },
    [markAttentionRead],
  );
  const primaryItem = firstActionableAttentionItem(attention.items);
  const onPrimaryAction = () => {
    if (note.action === 'scan' || !primaryItem) {
      router.push('/scan');
      return;
    }
    openAttentionItem(primaryItem);
  };

  return (
    <SafeAreaView
      testID="home.screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top']}>
      <View style={styles.root}>
        <ScrollView
          testID="home.scroll"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            showOfficeUpdatesPill ? styles.scrollContentWithPill : null,
          ]}>
          <View style={styles.dashboard}>
            <View style={styles.topBar}>
              <View style={styles.brandLockup}>
                <Image
                  accessible
                  accessibilityLabel="CaneGuard Logo"
                  source={logoSource}
                  style={styles.brandMark}
                  resizeMode="contain"
                />
                <Text style={[styles.brandWordmark, { color: theme.primaryDark }]}>CaneGuard</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open settings"
                hitSlop={8}
                onPress={() => router.push('/settings')}
                style={({ pressed }) => [
                  styles.profile,
                  { backgroundColor: theme.primary },
                  pressed && styles.pressed,
                ]}>
                <Feather name="user" size={18} color={theme.surfaceElevated} />
              </Pressable>
            </View>

            <View style={styles.band}>
              <HomeHeaderBand
                copy={isFarmer ? { greeting: farmerCopy.greeting, offline: farmerCopy.home.offline } : undefined}
                isOffline={sync.isOnline === false}
                name={user?.name}
                now={now}
              />
            </View>

            <View style={styles.content}>
              <View style={styles.note}>
                <Text
                  accessibilityLiveRegion="polite"
                  accessibilityLabel={
                    note.headlineOpensActivity ? `Open Activity, ${note.headline}` : undefined
                  }
                  accessibilityRole={note.headlineOpensActivity ? 'button' : 'header'}
                  onPress={
                    note.headlineOpensActivity
                      ? () => router.push('/activity' as Href)
                      : undefined
                  }
                  testID="home.note"
                  style={[styles.noteText, { color: theme.text }]}>
                  {note.headline}
                </Text>
                {note.visitsLine ? (
                  <Text
                    accessibilityLiveRegion="polite"
                    testID="home.visit-counts"
                    style={[styles.syncLine, { color: theme.textSecondary }]}>
                    {note.visitsLine}
                  </Text>
                ) : null}
                {note.syncLine ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Open Activity, ${note.syncLine}`}
                    hitSlop={8}
                    onPress={() => router.push('/activity' as Href)}
                    testID="home.sync-status">
                    <Text style={[styles.syncLine, { color: theme.textSecondary }]}>{note.syncLine}</Text>
                  </Pressable>
                ) : null}
              </View>

              {showInspectorWorkWaiting ? (
                <Text
                  accessibilityLiveRegion="polite"
                  testID="home.inspector-work-waiting"
                  style={[styles.syncLine, { color: theme.textSecondary }]}>
                  {INSPECTOR_WORK_WAITING_COPY[language]}
                </Text>
              ) : null}

              <AppButton testID="home.primary-action" onPress={onPrimaryAction}>
                {note.actionLabel}
              </AppButton>

              {isFarmer ? (
                <HomeMyScansCard onOpen={() => router.push('/activity' as Href)} />
              ) : (
                <>
                  <HomeAttentionCard
                    items={attention.items}
                    onOpenItem={openAttentionItem}
                    onSeeAll={() => router.push('/activity' as Href)}
                    total={attention.total}
                  />

                </>
              )}

              <HomeToolTiles
                tiles={[
                  ...(note.action === 'scan'
                    ? []
                    : [
                        {
                          icon: 'camera' as const,
                          label: isFarmer ? farmerCopy.actions.startScan : HOME_NOTE_COPY.startScan,
                          onPress: () => router.push('/scan'),
                          testID: 'home.start-scan',
                        },
                      ]),
                  ...(isFarmer
                    ? []
                    : [
                        {
                          icon: 'map' as const,
                          label: HOME_NOTE_COPY.measurePlotLink,
                          onPress: () => router.push('/field-survey' as Href),
                          testID: 'home.field-survey',
                        },
                        {
                          icon: 'layers' as const,
                          label: FIELD_SURVEY_COPY.myBoundariesLink,
                          onPress: () => router.push('/my-boundaries' as Href),
                          testID: 'home.my-boundaries',
                        },
                      ]),
                  {
                    accessibilityLabel: isFarmer
                      ? farmerCopy.home.fieldGuideLabel
                      : HOME_NOTE_COPY.fieldGuideLabel,
                    icon: 'book-open',
                    label: isFarmer ? farmerCopy.actions.fieldGuide : HOME_NOTE_COPY.fieldGuideLink,
                    onPress: () => router.push('/field-guide'),
                    testID: 'home.disease-reference',
                  },
                ]}
              />

              <HomeSignsStrip
                copy={
                  isFarmer
                    ? {
                        referencePhoto: farmerCopy.home.referencePhoto,
                        signPhrases: farmerCopy.home.signPhrases,
                        signsHeading: farmerCopy.home.knowSigns,
                      }
                    : undefined
                }
                onOpenEntry={(id) => router.push(`/field-guide/${id}` as Href)} />
            </View>
          </View>
        </ScrollView>

        {showOfficeUpdatesPill ? (
          <OfficeUpdatesPill
            count={unreadCount}
            onDismiss={() => setDismissedUpdateCount(unreadCount)}
            onOpen={openOfficeUpdates}
            testID="home.office-updates-pill"
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingBottom: Spacing.xl },
  // Room for the floating office-updates pill so it never covers the last row.
  scrollContentWithPill: { paddingBottom: OFFICE_UPDATES_PILL_CLEARANCE },
  dashboard: { width: '100%', maxWidth: Layout.mobileMaxWidth },
  topBar: {
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brandMark: {
    width: 22,
    height: 22,
  },
  brandWordmark: {
    ...Typography.body,
    fontWeight: '500',
    letterSpacing: -0.16,
  },
  profile: { width: 48, height: 48, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  band: {
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingTop: Spacing.md,
  },
  content: {
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingTop: Spacing['2xl'],
    gap: Spacing['2xl'],
  },
  note: { gap: Spacing.sm },
  // The phone's own serif, large enough to read at arm's length outdoors.
  noteText: { ...Typography.display, fontFamily: Fonts?.serif, fontWeight: '400' },
  syncLine: { ...Typography.body },
  pressed: { opacity: 0.74 },
});
