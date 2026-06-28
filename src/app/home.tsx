import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ComponentTokens,
  Colors,
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
  icon: keyof typeof Feather.glyphMap;
  primary?: boolean;
  badge?: string;
  onPress: () => void;
};

type DiseaseExample = {
  name: string;
  symptoms: string;
  label: string;
  image: number;
  color: string;
  background: string;
};

const diseaseExamples: DiseaseExample[] = [
  {
    name: 'Downy Mildew',
    symptoms: 'White fuzz, yellow stripes',
    label: 'Leaf stripes',
    image: require('../../assets/images/sugarcane-diseases/sugarcane_downey_mildew.jpg'),
    color: DiseaseTokens.downyMildew.color,
    background: DiseaseTokens.downyMildew.background,
  },
  {
    name: 'Sugarcane Smut',
    symptoms: 'Black whip-like growth',
    label: 'Whip growth',
    image: require('../../assets/images/sugarcane-diseases/sugarcane_smut.jpg'),
    color: DiseaseTokens.smut.color,
    background: DiseaseTokens.smut.background,
  },
  {
    name: 'Mosaic Disease',
    symptoms: 'Yellow-green mosaic pattern',
    label: 'Mosaic pattern',
    image: require('../../assets/images/sugarcane-diseases/sugarcane_mosaic.jpg'),
    color: DiseaseTokens.mosaic.color,
    background: DiseaseTokens.mosaic.background,
  },
  {
    name: 'Sugarcane Rust',
    symptoms: 'Rust-colored spots',
    label: 'Rust spots',
    image: require('../../assets/images/sugarcane-diseases/sugarcane_rust.jpg'),
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
      icon: 'camera',
      primary: true,
      onPress: () => router.push('/scan'),
    },
    {
      title: 'My Records',
      icon: 'folder',
      onPress: () => router.push('/records'),
    },
    {
      title: 'Sync Queue',
      icon: 'refresh-cw',
      badge: '2',
      onPress: () => showComingSoon('Sync Queue'),
    },
    {
      title: 'Help & FAQ',
      icon: 'help-circle',
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
                  <View
                    style={[
                      styles.onlinePill,
                      { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.28)' },
                    ]}>
                    <Text style={[styles.onlineText, { color: theme.surfaceElevated }]}>Online</Text>
                  </View>
                  <HeaderIconButton icon="user" accessibilityLabel="Open profile" />
                  <HeaderIconButton icon="help-circle" accessibilityLabel="Open help" />
                </View>
              </View>

              <View
                style={[
                  styles.locationPill,
                  { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.24)' },
                ]}>
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
                  <Text style={[styles.unsentTitle, { color: theme.text }]}>2 unsent reports</Text>
                  <Text style={[styles.unsentBody, { color: theme.text }]}>Will sync automatically when online.</Text>
                </View>
                <Text style={[styles.queueLink, { color: theme.text }]}>View queue</Text>
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
            <BottomNavItem label="Home" icon="home" active />
            <BottomNavItem label="Scan" icon="camera" onPress={() => router.push('/scan')} />
            <BottomNavItem label="Records" icon="folder" onPress={() => router.push('/records')} />
            <BottomNavItem label="Settings" icon="settings" onPress={() => router.push('/settings')} />
            <BottomNavItem label="Reports" icon="bar-chart-2" onPress={() => router.push('/reports')} />
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

function HeaderIconButton({ icon, accessibilityLabel }: { icon: keyof typeof Feather.glyphMap; accessibilityLabel: string }) {
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
      <Feather name={icon} size={20} color={theme.surfaceElevated} />
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
        <Feather name={action.icon} size={18} color={isPrimary ? theme.surfaceElevated : theme.primaryDark} />
      </View>
      <Text style={[styles.quickTitle, { color: isPrimary ? theme.surfaceElevated : theme.primaryDark }]}>{action.title}</Text>
      {action.badge ? (
        <View style={[styles.countBadge, { backgroundColor: theme.accent, borderColor: theme.accentDark }]}>
          <Text style={[styles.countBadgeText, { color: Colors.light.primaryDark }]}>{action.badge}</Text>
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
        <Image
          source={disease.image}
          style={styles.diseaseImage}
          resizeMode="cover"
        />
        <Text style={[styles.photoLabel, { color: Colors.light.primaryDark }]}>{disease.label}</Text>
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
  icon: keyof typeof Feather.glyphMap;
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
      <Feather
        name={icon}
        size={ComponentTokens.bottomNav.iconSize}
        color={active ? theme.primary : theme.textSecondary}
      />
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
    borderWidth: 1,
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
  locationPill: {
    minHeight: 34,
    borderRadius: Radius.md,
    borderWidth: 1,
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
    borderWidth: 1,
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
    minHeight: 200,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: Spacing.sm,
  },
  diseaseImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
  navLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.78,
  },
});
