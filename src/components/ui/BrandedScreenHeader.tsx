import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type BrandedScreenHeaderProps = {
  action?: ReactNode;
  subtitle?: string;
  title: string;
  showBack?: boolean;
  variant?: 'hero' | 'plain';
  onBackPress?: () => void;
};

export function BrandedScreenHeader({
  action,
  showBack = true,
  subtitle,
  title,
  variant = 'hero',
  onBackPress,
}: BrandedScreenHeaderProps) {
  const theme = useTheme();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  if (variant === 'plain') {
    return (
      <View style={[styles.plainWrapper, { backgroundColor: theme.background, borderBottomColor: theme.divider }]}>
        <View style={styles.plainContent}>
          <View style={styles.plainRow}>
            {showBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={8}
                onPress={handleBack}
                style={({ pressed }) => [
                  styles.plainBackButton,
                  { borderColor: theme.border, backgroundColor: theme.surfaceElevated },
                  pressed && styles.pressed,
                ]}>
                <Feather name="chevron-left" size={20} color={theme.text} />
              </Pressable>
            ) : null}
            <Text accessibilityRole="header" style={[styles.plainTitle, { color: theme.text }]}>
              {title}
            </Text>
            {action}
          </View>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.divider }]}>
      <View style={styles.content}>
        <View style={[styles.titleRow, !showBack && styles.titleRowWithoutBack]}>
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
              onPress={handleBack}
              style={({ pressed }) => [
                styles.back,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                pressed && styles.pressed,
              ]}>
              <Feather name="chevron-left" size={24} color={theme.primaryDark} />
            </Pressable>
          ) : null}
          <Text accessibilityRole="header" style={[styles.title, { color: theme.primaryDark }]}>{title}</Text>
          {action}
        </View>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        ) : null}
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
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
  plainWrapper: {
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  plainContent: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
  },
  plainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 48,
  },
  plainBackButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plainTitle: {
    ...Typography.heading,
    flex: 1,
  },
  back: {
    width: 48,
    height: 48,
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
  subtitle: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
});
