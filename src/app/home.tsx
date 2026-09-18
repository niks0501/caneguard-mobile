import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/ui/BottomNav';
import { Pill } from '@/components/ui/Pill';
import { SyncStatusRow } from '@/components/ui/SyncStatusRow';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSync } from '@/features/sync/hooks/useSync';
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
};

type ReferenceTone = 'healthy' | 'mosaic' | 'rust' | 'smut';

type ReferenceClass = {
  name: 'Healthy' | 'Mosaic' | 'Rust' | 'Smut';
  tone: ReferenceTone;
  description: string;
  image?: number;
};

export const REFERENCE_CLASSES: readonly ReferenceClass[] = [
  {
    name: 'Healthy',
    tone: 'healthy',
    description: 'No visible symptoms',
    image: require('../../assets/images/sugarcane-diseases/reference_healthy.jpg'),
  },
  {
    name: 'Mosaic',
    tone: 'mosaic',
    description: 'Mottling or irregular discoloration',
    image: require('../../assets/images/sugarcane-diseases/reference_mosaic.jpg'),
  },
  {
    name: 'Rust',
    tone: 'rust',
    description: 'Orange-brown spots or pustules',
    image: require('../../assets/images/sugarcane-diseases/reference_rust.jpg'),
  },
  {
    name: 'Smut',
    tone: 'smut',
    description: 'Dark, whip-like growth emerging from the central shoot or stalk',
    image: require('../../assets/model-fixtures/v1-smut.jpg'),
  },
];

export default function HomeScreen() {
  const theme = useTheme();
  const { sessionVerification, user } = useAuth();
  const { apiReachability, isOnline } = useSync();
  const serverUnavailable =
    sessionVerification === 'unavailable' || apiReachability === 'unavailable';
  const connectionBadge = isOnline === false
    ? { backgroundColor: theme.warningBg, color: theme.warning, label: 'Offline' }
    : serverUnavailable
      ? { backgroundColor: theme.dangerBg, color: theme.danger, label: 'Server unavailable' }
      : isOnline === true
        ? apiReachability === 'unknown'
          ? { backgroundColor: theme.infoBg, color: theme.info, label: 'Network available' }
          : { backgroundColor: theme.successBg, color: theme.success, label: 'Online' }
        : { backgroundColor: theme.infoBg, color: theme.info, label: 'Checking connection' };
  const actions: QuickAction[] = [
    {
      title: 'Start Scan',
      body: 'Check a sugarcane photo',
      icon: 'camera',
      primary: true,
      onPress: () => router.push('/scan'),
    },
    {
      title: 'My Activity',
      body: 'View scans and reports',
      icon: 'activity',
      onPress: () => router.push('/activity' as Href),
    },
  ];

  return (
    <SafeAreaView
      testID="home.screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top']}>
      <View style={styles.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.dashboard}>
            <View style={[styles.hero, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.heroContent}>
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
                    These are observational references for the four Model V1 classes. They support decision-making only and do not confirm a disease.
                  </Text>
                  <View style={styles.referencePillsRow}>
                    <Pill label="Healthy" variant="healthy" />
                    <Pill label="Mosaic" variant="mosaic" />
                    <Pill label="Rust" variant="rust" />
                    <Pill label="Smut" variant="smut" />
                  </View>
                </View>
              </Pressable>
            </View>
          </View>
        </ScrollView>
        <BottomNav activeTab="home" />
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
