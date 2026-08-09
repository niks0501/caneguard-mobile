import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/ui/BottomNav';
import {
  ComponentTokens,
  DiseaseTokens,
  Fonts,
  Layout,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/providers/ThemePreferenceProvider';

type QuickAction = {
  title: string;
  body: string;
  icon: keyof typeof Feather.glyphMap;
  primary?: boolean;
  badge?: string;
  onPress: () => void;
};

type DiseaseExample = {
  name: string;
  symptoms: string;
  image: number;
  color: string;
};

const DISEASES: DiseaseExample[] = [
  {
    name: 'Downy Mildew',
    symptoms: 'White fuzz and yellow stripes',
    image: require('../../assets/images/sugarcane-diseases/sugarcane_downey_mildew.jpg'),
    color: DiseaseTokens.downyMildew.color,
  },
  {
    name: 'Sugarcane Smut',
    symptoms: 'Black whip-like growth',
    image: require('../../assets/images/sugarcane-diseases/sugarcane_smut.jpg'),
    color: DiseaseTokens.smut.color,
  },
  {
    name: 'Mosaic Disease',
    symptoms: 'Yellow-green mosaic pattern',
    image: require('../../assets/images/sugarcane-diseases/sugarcane_mosaic.jpg'),
    color: DiseaseTokens.mosaic.color,
  },
  {
    name: 'Sugarcane Rust',
    symptoms: 'Rust-colored leaf spots',
    image: require('../../assets/images/sugarcane-diseases/sugarcane_rust.jpg'),
    color: DiseaseTokens.rust.color,
  },
];

export default function HomeScreen() {
  const theme = useTheme();
  const { isDarkMode } = useThemePreference();

  const showComingSoon = (label: string) => {
    Alert.alert(label, 'This dashboard shortcut will be available in a future update.');
  };

  const actions: QuickAction[] = [
    {
      title: 'Start Scan',
      body: 'Check a sugarcane photo',
      icon: 'camera',
      primary: true,
      onPress: () => router.push('/scan'),
    },
    {
      title: 'My Records',
      body: 'View field observations',
      icon: 'folder',
      onPress: () => router.push('/records'),
    },
    {
      title: 'Sync Queue',
      body: 'Reports saved offline',
      icon: 'refresh-cw',
      badge: '2',
      onPress: () => showComingSoon('Sync Queue'),
    },
    {
      title: 'Help & FAQ',
      body: 'Learn how CaneGuard works',
      icon: 'help-circle',
      onPress: () => showComingSoon('Help & FAQ'),
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
              <ExpoImage
                accessible={false}
                contentFit="contain"
                contentPosition="right bottom"
                pointerEvents="none"
                source={require('../../assets/svg/sugarcane-hero.svg')}
                style={[styles.heroArtwork, isDarkMode && styles.heroArtworkDark]}
              />
              <View style={[styles.wave, { backgroundColor: theme.surfaceMuted }]} />
              <View style={styles.heroContent}>
                <View style={styles.heroTop}>
                  <View style={styles.greetingBlock}>
                    <Text style={[styles.greeting, { color: theme.textSecondary }]}>Magandang umaga,</Text>
                    <Text style={[styles.name, { color: theme.primaryDark }]}>Nikko Selwyn</Text>
                  </View>
                  <View style={styles.heroActions}>
                    <View style={[styles.online, { backgroundColor: theme.successBg }]}>
                      <View style={[styles.onlineDot, { backgroundColor: theme.success }]} />
                      <Text style={[styles.onlineText, { color: theme.success }]}>Online</Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Open settings"
                      hitSlop={8}
                      onPress={() => router.push('/settings')}
                      style={[styles.profile, { backgroundColor: theme.primary }]}>
                      <Feather name="user" size={18} color={theme.surfaceElevated} />
                    </Pressable>
                  </View>
                </View>

                <View
                  style={[
                    styles.location,
                    { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                  ]}>
                  <Feather name="map-pin" size={16} color={theme.accentDark} />
                  <Text style={[styles.locationText, { color: theme.primaryDark }]}>
                    Brgy. Cogunan, Nasugbu, Batangas
                  </Text>
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

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View sync queue, 2 unsent reports"
                onPress={() => showComingSoon('Sync Queue')}
                style={({ pressed }) => [
                  styles.unsent,
                  { backgroundColor: theme.warningBg, borderColor: theme.accent },
                  pressed && styles.pressed,
                ]}>
                <ExpoImage
                  accessible={false}
                  contentFit="contain"
                  pointerEvents="none"
                  source={require('../../assets/svg/offline-sync.svg')}
                  style={styles.unsentArtwork}
                />
                <View style={styles.unsentCopy}>
                  <Text style={[styles.unsentTitle, { color: theme.primaryDark }]}>2 unsent reports</Text>
                  <Text style={[styles.unsentBody, { color: theme.textSecondary }]}>
                    Saved locally. Sync when you are online.
                  </Text>
                </View>
                <Text style={[styles.viewQueue, { color: theme.primaryDark }]}>View queue</Text>
              </Pressable>

              <SectionTitle label="COMMON DISEASES" />
              <View style={styles.diseaseGrid}>
                {DISEASES.map((disease) => (
                  <DiseaseCard key={disease.name} disease={disease} />
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
      accessibilityLabel={
        action.badge ? `${action.title}, ${action.badge} pending reports` : action.title
      }
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
      {action.badge ? (
        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
          <Text style={[styles.badgeText, { color: theme.primaryDark }]}>{action.badge}</Text>
        </View>
      ) : (
        <Feather
          name="chevron-right"
          size={18}
          color={primary ? theme.surfaceElevated : theme.textSecondary}
        />
      )}
    </Pressable>
  );
}

function DiseaseCard({ disease }: { disease: DiseaseExample }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.diseaseCard,
        { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
      ]}>
      <Image
        source={disease.image}
        accessibilityLabel={`${disease.name} example`}
        resizeMode="cover"
        style={styles.diseaseImage}
      />
      <View style={styles.diseaseCopy}>
        <View style={[styles.diseaseDot, { backgroundColor: disease.color }]} />
        <Text style={[styles.diseaseName, { color: theme.primaryDark }]}>{disease.name}</Text>
        <Text style={[styles.diseaseSymptoms, { color: theme.textSecondary }]}>
          {disease.symptoms}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: Spacing.xl,
  },
  dashboard: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
  },
  hero: {
    minHeight: 240,
    overflow: 'hidden',
  },
  heroArtwork: {
    position: 'absolute',
    width: 280,
    height: 238,
    right: -58,
    bottom: -8,
    opacity: 0.88,
  },
  heroArtworkDark: {
    opacity: 0.4,
  },
  wave: {
    position: 'absolute',
    width: '130%',
    height: 135,
    bottom: -95,
    left: -80,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
  },
  heroContent: {
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingTop: Spacing.lg,
  },
  heroTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  greetingBlock: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 150,
  },
  greeting: {
    ...Typography.bodySmall,
  },
  name: {
    ...Typography.title,
    fontFamily: Fonts?.serif,
    fontWeight: '700',
  },
  heroActions: {
    flexDirection: 'row',
    flexShrink: 0,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  online: {
    minHeight: 30,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  onlineText: {
    ...Typography.caption,
    fontWeight: '800',
  },
  profile: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  location: {
    alignSelf: 'flex-start',
    maxWidth: '70%',
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radius.full,
    minHeight: 38,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  locationText: {
    ...Typography.caption,
    flexShrink: 1,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.label,
    letterSpacing: 1.1,
  },
  grid: {
    gap: Spacing.sm,
  },
  quickCard: {
    minHeight: 83,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.sm,
  },
  quickIcon: {
    width: 45,
    height: 45,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  quickTitle: {
    ...Typography.bodySmall,
    fontWeight: '800',
  },
  quickBody: {
    ...Typography.caption,
  },
  badge: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '900',
  },
  unsent: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  unsentArtwork: {
    width: 44,
    height: 44,
    flexShrink: 0,
  },
  unsentCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  unsentTitle: {
    ...Typography.bodySmall,
    fontWeight: '800',
  },
  unsentBody: {
    ...Typography.caption,
  },
  viewQueue: {
    ...Typography.caption,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  diseaseGrid: {
    width: '100%',
    gap: Spacing.sm,
  },
  diseaseCard: {
    width: '100%',
    minHeight: 112,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.sm,
  },
  diseaseImage: {
    width: 96,
    height: 96,
    flexShrink: 0,
    borderRadius: Radius.lg,
  },
  diseaseCopy: {
    flex: 1,
    minHeight: 96,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    position: 'relative',
    justifyContent: 'center',
  },
  diseaseDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
  },
  diseaseName: {
    ...Typography.bodySmall,
    fontWeight: '800',
  },
  diseaseSymptoms: {
    ...Typography.caption,
  },
  pressed: {
    opacity: 0.74,
  },
});
