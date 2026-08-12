import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BrandedScreenHeaderProps = {
  title: string;
  showBack?: boolean;
};

export function BrandedScreenHeader({ title, showBack = true }: BrandedScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.divider }]}>
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
    minHeight: 112,
    borderBottomWidth: 1,
    justifyContent: 'flex-end',
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
    paddingRight: 0,
  },
  title: {
    ...Typography.heading,
    flex: 1,
    flexShrink: 1,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
