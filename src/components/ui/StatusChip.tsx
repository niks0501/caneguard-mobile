import { StyleSheet, Text, View } from 'react-native';

import { ComponentTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type StatusVariant = 'queued' | 'sent' | 'healthy';

type StatusChipProps = {
  variant: StatusVariant;
};

const CHIP_CONFIG: Record<StatusVariant, { label: string; bgKey: 'warningBg' | 'successBg' | 'healthyBg'; fgKey: 'warning' | 'success' | 'healthy' }> = {
  queued: { label: 'Queued', bgKey: 'warningBg', fgKey: 'warning' },
  sent: { label: 'Sent', bgKey: 'successBg', fgKey: 'success' },
  healthy: { label: 'Healthy', bgKey: 'healthyBg', fgKey: 'healthy' },
};

export function StatusChip({ variant }: StatusChipProps) {
  const theme = useTheme();
  const config = CHIP_CONFIG[variant];

  return (
    <View style={[styles.chip, { backgroundColor: theme[config.bgKey] }]}>
      <Text style={[styles.label, { color: theme[config.fgKey] }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: ComponentTokens.chip.borderRadius,
    paddingHorizontal: ComponentTokens.chip.paddingHorizontal,
    paddingVertical: ComponentTokens.chip.paddingVertical,
  },
  label: {
    ...Typography.caption,
    fontWeight: '800',
  },
});
