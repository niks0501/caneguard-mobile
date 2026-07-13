import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/providers/ThemePreferenceProvider';

type BrandedScreenHeaderProps = {
  title: string;
  showBack?: boolean;
};

export function BrandedScreenHeader({ title, showBack = true }: BrandedScreenHeaderProps) {
  const theme = useTheme();
  const { isDarkMode } = useThemePreference();

  return (
    <View style={[styles.hero, { backgroundColor: theme.backgroundElement }]}>
      <ExpoImage
        accessible={false}
        contentFit="cover"
        contentPosition="right center"
        pointerEvents="none"
        source={require('../../../assets/svg/header-botanical-wave.svg')}
        style={[styles.artwork, isDarkMode && styles.artworkDark]}
      />
      <View style={styles.content}>
        <View style={[styles.titleRow, !showBack && styles.titleRowWithoutBack]}>
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
              onPress={() => router.back()}
              style={({ pressed }) => [styles.back, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }, pressed && styles.pressed]}>
              <Feather name="chevron-left" size={24} color={theme.primaryDark} />
            </Pressable>
          ) : null}
          <Text accessibilityRole="header" style={[styles.title, { color: theme.primaryDark }]}>{title}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    minHeight: 176,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  artwork: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    inset: 0,
  },
  artworkDark: {
    opacity: 0.24,
  },
  content: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
  back: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingRight: Spacing['2xl'],
  },
  titleRowWithoutBack: {
    paddingRight: 96,
  },
  title: {
    ...Typography.display,
    flex: 1,
    flexShrink: 1,
    fontFamily: Fonts?.serif,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
