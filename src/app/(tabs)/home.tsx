import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pill, type PillVariant } from '@/components/ui/Pill';
import { SyncStatusRow } from '@/components/ui/SyncStatusRow';
import { HomeAttentionCard } from '@/features/activity/components/HomeAttentionCard';
import type { NeedsAttentionItem } from '@/features/activity/domain/needsAttention';
import { useHomeAttention } from '@/features/activity/hooks/useHomeAttention';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { MODEL_LABELS } from '@/features/detection/constants/modelContract';
import { referenceMedia } from '@/features/detection/constants/referenceMedia';
import {
  OfficeUpdatesPill,
  OFFICE_UPDATES_PILL_CLEARANCE,
} from '@/features/notifications/components/OfficeUpdatesPill';
import { useOfficeUpdates } from '@/features/notifications/providers/OfficeUpdatesProvider';
import { notificationDestinationRoute } from '@/features/notifications/services/resolveNotificationDestination';
import { getSyncBadgeLabel } from '@/features/sync/utils/syncStatusCopy';
import { useSync } from '@/features/sync/hooks/useSync';
import { DECISION_SUPPORT_DISCLAIMER } from '@/constants/copy';
import {
  ComponentTokens,
  Layout,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type QuickAction = {
  title: string;
  body: string;
  icon: keyof typeof Feather.glyphMap;
  primary?: boolean;
  onPress: () => void;
  testID?: string;
};

export default function HomeScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const logoSource = colorScheme === 'dark'
    ? require('../../../assets/cane_guard_logo_onDark.png')
    : require('../../../assets/cane_guard_logo.png');
  const { sessionVerification, user } = useAuth();
  const { apiReachability, isOnline } = useSync();
  const attention = useHomeAttention();
  const { open: openOfficeUpdates, unreadCount } = useOfficeUpdates();
  const [dismissedUpdateCount, setDismissedUpdateCount] = useState(0);
  const showOfficeUpdatesPill = unreadCount > dismissedUpdateCount;
  const activeVisitItems = attention.items.filter((item) => item.kind === 'assignment');
  const dueTodayCount = activeVisitItems.filter((item) => item.meta === 'Visit due today').length;
  const overdueCount = activeVisitItems.filter((item) => item.meta.startsWith('Visit was due')).length;
  const serverUnavailable =
    sessionVerification === 'unavailable' || apiReachability === 'unavailable';
  const badgeLabel = getSyncBadgeLabel({ apiReachability, isOnline, sessionVerification });
  const badgeColors = isOnline === false
    ? { backgroundColor: theme.warningBg, color: theme.warning }
    : serverUnavailable
      ? { backgroundColor: theme.dangerBg, color: theme.danger }
      : isOnline === true
        ? apiReachability === 'unknown'
          ? { backgroundColor: theme.infoBg, color: theme.info }
          : { backgroundColor: theme.successBg, color: theme.success }
        : { backgroundColor: theme.infoBg, color: theme.info };
  const connectionBadge = { ...badgeColors, label: badgeLabel };
  const actions: QuickAction[] = [
    {
      title: 'Start Scan',
      body: 'Check a sugarcane photo',
      icon: 'camera',
      primary: true,
      onPress: () => router.push('/scan'),
    },
    {
      title: "Today's visits",
      body: activeVisitItems.length
        ? `${dueTodayCount} due today · ${overdueCount} overdue`
        : 'No visits scheduled',
      icon: 'calendar',
      testID: 'home.today-visits',
      onPress: () => router.push('/today' as Href),
    },
    {
      title: 'My Activity',
      body: 'View scans and reports',
      icon: 'activity',
      onPress: () => router.push('/activity' as Href),
    },
  ];

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
            <View style={[styles.hero, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.heroContent}>
                <View style={styles.brandRow}>
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
                </View>
                <View style={styles.heroTop}>
                  <View style={styles.greetingBlock}>
                    <Text style={[styles.greeting, { color: theme.textSecondary }]}>Welcome back,</Text>
                    <Text style={[styles.name, { color: theme.primaryDark }]}>{user?.name ?? 'Field Inspector'}</Text>
                  </View>
                  <View style={styles.heroActions}>
                    <View style={[styles.online, { backgroundColor: connectionBadge.backgroundColor }]}>
                      <View style={[styles.onlineDot, { backgroundColor: connectionBadge.color }]} />
                      <Text
                        accessibilityRole="text"
                        accessibilityLabel={connectionBadge.label}
                        accessibilityLiveRegion="polite"
                        testID="home.connection-status"
                        style={[styles.onlineText, { color: connectionBadge.color }]}
                      >
                        {connectionBadge.label}
                      </Text>
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
                </View>
              </View>
            </View>

            <View style={styles.content}>
              <HomeAttentionCard
                items={attention.items}
                onOpenItem={openAttentionItem}
                onSeeAll={() => router.push('/activity' as Href)}
                total={attention.total}
              />

              <SectionTitle label="QUICK ACTIONS" />
              <View style={styles.grid}>
                {actions.map((action) => (
                  <QuickActionCard key={action.title} action={action} />
                ))}
              </View>

              <SyncStatusRow
                testID="home.sync-status"
                onPress={() => router.push('/activity' as Href)}
              />

              <Pressable
                testID="home.disease-reference"
                accessibilityRole="button"
                accessibilityLabel="Open disease reference guide"
                onPress={() => router.push('/disease-reference')}
                style={({ pressed }) => [pressed && styles.pressed]}>
                <View
                  style={[
                    styles.referenceEntryCard,
                    { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                  ]}>
                  <View style={styles.referenceEntryTop}>
                    <View style={styles.referenceHeading}>
                      <SectionTitle label="DISEASE REFERENCE" />
                      <Text style={[styles.referenceEntryTitle, { color: theme.primaryDark }]}>
                        Field symptom guide
                      </Text>
                    </View>
                    <Feather name="arrow-right" size={20} color={theme.primary} />
                  </View>
                  <Text style={[styles.referenceIntro, { color: theme.textSecondary }]}>
                    Observational references for the four sugarcane conditions CaneGuard can check. {DECISION_SUPPORT_DISCLAIMER}
                  </Text>
                  <View style={styles.referencePillsRow}>
                    {MODEL_LABELS.map((key) => (
                      <Pill
                        key={key}
                        label={referenceMedia[key].name}
                        variant={key as PillVariant}
                      />
                    ))}
                  </View>
                </View>
              </Pressable>
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

function SectionTitle({ label }: { label: string }) {
  const theme = useTheme();

  return <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{label}</Text>;
}

function QuickActionCard({ action }: { action: QuickAction }) {
  const theme = useTheme();
  const primary = action.primary === true;

  return (
    <Pressable
      testID={action.testID}
      accessibilityRole="button"
      accessibilityLabel={action.title}
      onPress={action.onPress}
      style={({ pressed }) => [
        styles.quickCard,
        {
          backgroundColor: primary ? theme.primary : theme.surfaceElevated,
          borderColor: primary ? theme.primary : theme.border,
        },
        pressed && styles.pressed,
      ]}>
      <View
        style={[
          styles.quickIcon,
          { backgroundColor: primary ? theme.primaryLight : theme.surfaceMuted },
        ]}>
        <Feather
          name={action.icon}
          size={20}
          color={primary ? theme.surfaceElevated : theme.primary}
        />
      </View>
      <View style={styles.quickCopy}>
        <Text style={[styles.quickTitle, { color: primary ? theme.surfaceElevated : theme.primaryDark }]}>
          {action.title}
        </Text>
        <Text style={[styles.quickBody, { color: primary ? theme.surfaceMuted : theme.textSecondary }]}>
          {action.body}
        </Text>
      </View>
      <Feather
        name="chevron-right"
        size={18}
        color={primary ? theme.surfaceElevated : theme.textSecondary}
      />
    </Pressable>
  );
}


const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingBottom: Spacing.xl },
  // Room for the floating office-updates pill so it never covers the last card.
  scrollContentWithPill: { paddingBottom: OFFICE_UPDATES_PILL_CLEARANCE },
  dashboard: { width: '100%', maxWidth: Layout.mobileMaxWidth },
  hero: {
    minHeight: 190,
    justifyContent: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  heroContent: {
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.lg,
  },
  brandRow: {
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
    fontWeight: '800',
    letterSpacing: -0.16,
  },
  heroTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  greetingBlock: { flexGrow: 1, flexShrink: 1, minWidth: 150, gap: Spacing.xs },
  greeting: { ...Typography.bodySmall },
  name: { ...Typography.title, fontWeight: '700' },
  heroActions: { flexDirection: 'row', flexShrink: 0, alignItems: 'center', gap: Spacing.sm },
  online: {
    minHeight: 30,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  onlineDot: { width: 6, height: 6, borderRadius: Radius.full },
  onlineText: { ...Typography.caption, fontWeight: '800' },
  profile: { width: 48, height: 48, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },
  sectionTitle: { ...Typography.label, letterSpacing: 1.1 },
  grid: { gap: Spacing.sm },
  quickCard: {
    minHeight: 78,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  quickIcon: { width: 45, height: 45, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  quickCopy: { flex: 1, gap: Spacing.xs },
  quickTitle: { ...Typography.bodySmall, fontWeight: '800' },
  quickBody: { ...Typography.caption },
  referenceHeading: { gap: Spacing.xs },
  referenceEntryCard: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  referenceEntryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  referenceEntryTitle: { ...Typography.subheading, fontWeight: '700' },
  referencePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  referenceNote: { ...Typography.caption },
  referenceIntro: { ...Typography.bodySmall },
  pressed: { opacity: 0.74 },
});
