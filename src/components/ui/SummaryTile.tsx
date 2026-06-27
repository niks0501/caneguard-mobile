import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SummaryTileProps = {
  value: number;
  label: string;
  tintColor: string;
  tintBackground: string;
};

export function SummaryTile({ value, label, tintColor, tintBackground }: SummaryTileProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.tile, { backgroundColor: tintBackground, borderColor: tintColor }]}>
      <Text style={[styles.value, { color: tintColor }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: '46%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
    alignItems: 'center',
  },
  value: {
    ...Typography.heading,
    fontWeight: '800',
  },
  label: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
