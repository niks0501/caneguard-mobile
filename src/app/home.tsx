import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/ui/BottomNav';
import { SyncStatusRow } from '@/components/ui/SyncStatusRow';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSync } from '@/features/sync/hooks/useSync';
import {
  ComponentTokens,
  Fonts,
  Layout,
  Radius,
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

type ReferenceTone = 'healthy' | 'mosaic' | 'rust';

type ReferenceClass = {
  name: 'Healthy' | 'Mosaic' | 'Rust';
  tone: ReferenceTone;
  description: string;
  image: number;
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
                    <Text style={[styles.greeting, { color: theme.textSecondary }]}>Magandang umaga,</Text>
                    <Text style={[styles.name, { color: theme.primaryDark }]}>{user?.name ?? 'Field reporter'}</Text>
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

              <View style={styles.referenceHeading}>
                <SectionTitle label="DISEASE REFERENCE" />
                <Text style={[styles.referenceNote, { color: theme.textSecondary }]}>Education only · supplied photos</Text>
              </View>
              <Text style={[styles.referenceIntro, { color: theme.textSecondary }]}>
                Healthy, Mosaic, and Rust are the current supported reference classes. Reference photos are supplied locally; source and license evidence still needs to be recorded before final gallery acceptance.
              </Text>
              <View style={styles.referenceList}>
                {REFERENCE_CLASSES.map((reference) => (
                  <ReferenceCard key={reference.name} reference={reference} />
                ))}
              </View>
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

function ReferenceCard({ reference }: { reference: ReferenceClass }) {
  const theme = useTheme();
  const toneColor = theme[reference.tone];

  return (
    <View
      accessibilityLabel={`${reference.name} reference card`}
      style={[
        styles.referenceCard,
        { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
      ]}>
      <Image
        accessibilityLabel={`${reference.name} reference photo`}
        source={reference.image}
        resizeMode="cover"
        style={styles.referenceImage}
      />
      <View style={styles.referenceCopy}>
        <View style={styles.referenceTitleRow}>
          <View style={[styles.referenceDot, { backgroundColor: toneColor }]} />
          <Text style={[styles.referenceName, { color: theme.primaryDark }]}>{reference.name}</Text>
        </View>
        <Text style={[styles.referenceDescription, { color: theme.textSecondary }]}>
          {reference.description}
        </Text>
        <Text style={[styles.referenceStatus, { color: theme.textSecondary }]}>Photo supplied · license evidence pending</Text>
      </View>
    </View>
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
  name: { ...Typography.title, fontFamily: Fonts?.serif, fontWeight: '700' },
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
  profile: { width: 42, height: 42, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
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
  referenceNote: { ...Typography.caption },
  referenceIntro: { ...Typography.bodySmall },
  referenceList: { gap: Spacing.sm },
  referenceCard: {
    minHeight: 122,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  referenceImage: {
    width: 96,
    height: 96,
    borderRadius: Radius.lg,
  },
  referenceCopy: { flex: 1, minHeight: 96, justifyContent: 'center', gap: Spacing.xs },
  referenceTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  referenceDot: { width: 7, height: 7, borderRadius: Radius.full },
  referenceName: { ...Typography.bodySmall, fontWeight: '800' },
  referenceDescription: { ...Typography.caption },
  referenceStatus: { ...Typography.caption, fontStyle: 'italic' },
  pressed: { opacity: 0.74 },
});
