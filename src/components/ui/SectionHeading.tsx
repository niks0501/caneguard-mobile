import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SectionHeadingProps = {
  title: string;
  eyebrow?: string;
  rightAccessory?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function SectionHeading({
  eyebrow,
  rightAccessory,
  style,
  testID,
  title,
}: SectionHeadingProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.textContainer}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>
            {eyebrow}
          </Text>
        ) : null}
        <Text style={[styles.title, { color: theme.primaryDark }]}>{title}</Text>
      </View>
      {rightAccessory ? <View style={styles.accessory}>{rightAccessory}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  textContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  eyebrow: {
    ...Typography.label,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    ...Typography.subheading,
    fontWeight: '700',
  },
  accessory: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
