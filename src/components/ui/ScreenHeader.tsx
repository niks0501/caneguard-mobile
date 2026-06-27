import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenHeaderProps = {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
};

export function ScreenHeader({ title, showBack = true, onBackPress }: ScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View style={[styles.wrapper, { borderBottomColor: theme.divider }]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => (onBackPress ? onBackPress() : router.back())}
            style={({ pressed }) => [
              styles.backButton,
              { borderColor: theme.border, backgroundColor: theme.surfaceElevated },
              pressed && { opacity: 0.7 },
            ]}>
            <Feather name="chevron-left" size={20} color={theme.text} />
          </Pressable>
        ) : null}
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 44,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.heading,
    flex: 1,
  },
});
