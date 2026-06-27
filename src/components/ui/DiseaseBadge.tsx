import { StyleSheet, Text, View } from 'react-native';

import { ComponentTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type DiseaseBadgeProps = {
  label: string;
  color: string;
  background: string;
};

export function DiseaseBadge({ label, color, background }: DiseaseBadgeProps) {
  const theme = useTheme();

  return (
    <View style={[styles.badge, { backgroundColor: background, borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: ComponentTokens.chip.paddingHorizontal,
    paddingVertical: ComponentTokens.chip.paddingVertical,
    borderRadius: ComponentTokens.chip.borderRadius,
    borderWidth: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
});
