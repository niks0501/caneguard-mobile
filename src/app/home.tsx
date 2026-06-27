import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ComponentTokens,
  DiseaseTokens,
  Layout,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type QuickAction = {
  title: string;
  icon: string;
  primary?: boolean;
  badge?: string;
  onPress: () => void;
};

type DiseaseExample = {
  name: string;
  symptoms: string;
  label: string;
  color: string;
  background: string;
};

const diseaseExamples: DiseaseExample[] = [
  {
    name: 'Downy Mildew',
    symptoms: 'White fuzz, yellow stripes',
    label: 'Leaf stripes',
    color: DiseaseTokens.downyMildew.color,
    background: DiseaseTokens.downyMildew.background,
  },
  {
    name: 'Sugarcane Smut',
    symptoms: 'Black whip-like growth',
    label: 'Whip growth',
    color: DiseaseTokens.smut.color,
    background: DiseaseTokens.smut.background,
  },
  {
    name: 'Mosaic Disease',
    symptoms: 'Yellow-green mosaic pattern',
    label: 'Mosaic pattern',
    color: DiseaseTokens.mosaic.color,
    background: DiseaseTokens.mosaic.background,
  },
  {
    name: 'Sugarcane Rust',
    symptoms: 'Rust-colored spots',
    label: 'Rust spots',
    color: DiseaseTokens.rust.color,
    background: DiseaseTokens.rust.background,
  },
];

export default function HomeScreen() {
  const theme = useTheme();

  const showComingSoon = (label: string) => {
    Alert.alert(label, 'This dashboard shortcut will be available in a future update.');
  };

  const quickActions: QuickAction[] = [
    {
      title: 'Start Scan',
      icon: '+',
      primary: true,
      onPress: () => router.push('/scan'),
    },
    {
      title: 'My Records',
      icon: 'R',
      onPress: () => showComingSoon('My Records'),
    },
    {
      title: 'Sync Queue',
      icon: 'Q',
      badge: '2',
      onPress: () => showComingSoon('Sync Queue'),
    },
    {
      title: 'Help & FAQ',
      icon: '?',
      onPress: () => showComingSoon('Help & FAQ'),
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.primary }]} edges={['top']}>
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}>
          <View style={styles.dashboard}>
            <View style={[styles.header, { backgroundColor: theme.primary }]}>
              <View style={styles.headerTopRow}>
                <View style={styles.greetingBlock}>
                  <Text style={[styles.greetingLabel, { color: theme.surfaceElevated }]}>Magandang umaga,</Text>
                  <Text style={[styles.greetingName, { color: theme.surfaceElevated }]}>Nikko Selwyn</Text>
                </View>

                <View style={styles.headerActions}>
                  <View style={[styles.onlinePill, { backgroundColor: theme.surfaceElevated }]}> 
                    <Text style={[styles.onlineText, { color: theme.success }]}>Online</Text>
                  </View>
                  <HeaderIconButton label="N" accessibilityLabel="Open profile" />
                  <HeaderIconButton label="?" accessibilityLabel="Open help" />
                </View>
              </View>

              <View style={[styles.locationPill, { backgroundColor: theme.primaryLight }]}> 
                <Text style={[styles.locationText, { color: theme.surfaceElevated }]}>
                  Location: Brgy. Cogunan, Nasugbu, Batangas
                </Text>
              </View>
            </View>

            <View style={styles.content}>
              <SectionTitle title="QUICK ACTIONS" />
              <View style={styles.quickGrid}>
                {quickActions.map((action) => (
                  <QuickActionCard key={action.title} action={action} />
                ))}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View sync queue"
                onPress={() => showComingSoon('Sync Queue')}
                style={({ pressed }) => [
                  styles.unsentCard,
                  {
                    backgroundColor: theme.warningBg,
                    borderColor: theme.warning,
                  },
                  pressed && styles.pressed,
                ]}>
                <View style={styles.unsentTextBlock}>
                  <Text style={[styles.unsentTitle, { color: theme.warning }]}>2 unsent reports</Text>
                  <Text style={[styles.unsentBody, { color: theme.warning }]}>Will sync automatically when online.</Text>
                </View>
                <Text style={[styles.queueLink, { color: theme.warning }]}>View queue</Text>
              </Pressable>

              <SectionTitle title="COMMON DISEASES - PHOTO EXAMPLES" />
              <View style={styles.diseaseGrid}>
                {diseaseExamples.map((disease) => (
                  <DiseasePhotoCard key={disease.name} disease={disease} />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.bottomNavWrap, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
          <View style={styles.bottomNav}>
            <BottomNavItem label="Home" icon="H" active />
            <BottomNavItem label="Scan" icon="S" onPress={() => router.push('/scan')} />
            <BottomNavItem label="Records" icon="R" onPress={() => showComingSoon('Records')} />
            <BottomNavItem label="Settings" icon="O" onPress={() => showComingSoon('Settings')} />
            <BottomNavItem label="Reports" icon="P" onPress={() => showComingSoon('Reports')} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  const theme = useTheme();

  return <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</Text>;
}

function HeaderIconButton({ label, accessibilityLabel }: { label: string; accessibilityLabel: string }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.headerIconButton,
        { backgroundColor: theme.primaryLight },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.headerIconText, { color: theme.surfaceElevated }]}>{label}</Text>
    </Pressable>
  );
}

function QuickActionCard({ action }: { action: QuickAction }) {
  const theme = useTheme();
  const isPrimary = action.primary === true;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.title}
      onPress={action.onPress}
      style={({ pressed }) => [
        styles.quickCard,
        isPrimary
          ? { backgroundColor: theme.primary, borderColor: theme.primary }
          : { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View
        style={[
          styles.quickIcon,
          {
            backgroundColor: isPrimary ? theme.primaryLight : theme.surfaceMuted,
            borderColor: isPrimary ? theme.primaryLight : theme.border,
          },
        ]}>
        <Text style={[styles.quickIconText, { color: isPrimary ? theme.surfaceElevated : theme.primaryDark }]}>{action.icon}</Text>
      </View>
      <Text style={[styles.quickTitle, { color: isPrimary ? theme.surfaceElevated : theme.primaryDark }]}>{action.title}</Text>
      {action.badge ? (
        <View style={[styles.countBadge, { backgroundColor: theme.infoBg }]}> 
          <Text style={[styles.countBadgeText, { color: theme.info }]}>{action.badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function DiseasePhotoCard({ disease }: { disease: DiseaseExample }) {
  const theme = useTheme();

  return (
    <View style={[styles.diseaseCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}> 
      <View style={[styles.photoPlaceholder, { backgroundColor: disease.background }]}> 
        <View style={[styles.caneBlade, styles.caneBladeOne, { backgroundColor: disease.color }]} />
        <View style={[styles.caneBlade, styles.caneBladeTwo, { backgroundColor: theme.primaryLight }]} />
        <View style={[styles.caneBlade, styles.caneBladeThree, { backgroundColor: disease.color }]} />
        <Text style={[styles.photoLabel, { color: theme.text }]}>{disease.label}</Text>
      </View>
      <View style={styles.diseaseTextBlock}>
        <Text style={[styles.diseaseName, { color: theme.text }]}>{disease.name}</Text>
        <Text style={[styles.diseaseSymptoms, { color: theme.textSecondary }]}>{disease.symptoms}</Text>
      </View>
    </View>
  );
}

function BottomNavItem({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}>
      <View style={[styles.navIcon, { borderColor: active ? theme.primary : theme.textSecondary }]}> 
        <Text style={[styles.navIconText, { color: active ? theme.primary : theme.textSecondary }]}>{icon}</Text>
      </View>
      <Text style={[styles.navLabel, { color: active ? theme.primary : theme.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
    paddingBottom: Layout.bottomNavHeight + Spacing['2xl'],
  },
  dashboard: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
  },
  header: {
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  greetingBlock: {
    flex: 1,
  },
  greetingLabel: {
    ...Typography.caption,
    fontWeight: '600',
  },
  greetingName: {
    ...Typography.heading,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  onlinePill: {
    minHeight: 24,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineText: {
    ...Typography.caption,
    fontWeight: '800',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    ...Typography.bodySmall,
    fontWeight: '800',
  },
  locationPill: {
    minHeight: 34,
    borderRadius: Radius.md,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  locationText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  content: {
    gap: Spacing.lg,
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.label,
    letterSpacing: 1,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickCard: {
    width: '48.8%',
    minHeight: 76,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    position: 'relative',
    ...Shadows.sm,
  },
  quickIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIconText: {
    ...Typography.caption,
    fontWeight: '900',
  },
  quickTitle: {
    ...Typography.bodySmall,
    flexShrink: 1,
    fontWeight: '900',
    textAlign: 'center',
  },
  countBadge: {
    position: 'absolute',
    right: Spacing.lg,
    top: Spacing.sm,
    minWidth: 24,
    height: 20,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  countBadgeText: {
    ...Typography.caption,
    fontWeight: '900',
  },
  unsentCard: {
    minHeight: 64,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  unsentTextBlock: {
    flex: 1,
  },
  unsentTitle: {
    ...Typography.bodySmall,
    fontWeight: '900',
  },
  unsentBody: {
    ...Typography.caption,
  },
  queueLink: {
    ...Typography.caption,
    textDecorationLine: 'underline',
    fontWeight: '800',
  },
  diseaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  diseaseCard: {
    width: '48.8%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  photoPlaceholder: {
    minHeight: 116,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: Spacing.sm,
  },
  caneBlade: {
    position: 'absolute',
    width: 18,
    height: 130,
    borderRadius: Radius.full,
    opacity: 0.78,
  },
  caneBladeOne: {
    left: 22,
    top: -12,
    transform: [{ rotate: '-18deg' }],
  },
  caneBladeTwo: {
    left: 64,
    top: -20,
    transform: [{ rotate: '10deg' }],
  },
  caneBladeThree: {
    right: 24,
    top: -8,
    transform: [{ rotate: '22deg' }],
  },
  photoLabel: {
    ...Typography.caption,
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.78)',
    overflow: 'hidden',
    fontWeight: '800',
  },
  diseaseTextBlock: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  diseaseName: {
    ...Typography.bodySmall,
    fontWeight: '900',
  },
  diseaseSymptoms: {
    ...Typography.caption,
  },
  bottomNavWrap: {
    alignItems: 'center',
    borderTopWidth: 1,
  },
  bottomNav: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    minHeight: Layout.bottomNavHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  navItem: {
    minWidth: 54,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  navIcon: {
    width: 22,
    height: 22,
    borderRadius: Radius.xs,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
  },
  navLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.78,
  },
});
