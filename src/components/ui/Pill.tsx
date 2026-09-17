import type { ReactNode } from 'react';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { ComponentTokens, Spacing, Typography, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type PillVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'healthy'
  | 'smut'
  | 'mosaic'
  | 'rust'
  | 'unclear';

export type PillProps = {
  label: string;
  variant?: PillVariant;
  icon?: keyof typeof Feather.glyphMap;
  rightAccessory?: ReactNode;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
};

const VARIANT_CONFIG: Record<
  PillVariant,
  { colorKey: ThemeColor; backgroundKey: ThemeColor }
> = {
  default: { colorKey: 'primary', backgroundKey: 'surfaceMuted' },
  success: { colorKey: 'success', backgroundKey: 'successBg' },
  warning: { colorKey: 'warning', backgroundKey: 'warningBg' },
  danger: { colorKey: 'danger', backgroundKey: 'dangerBg' },
  info: { colorKey: 'info', backgroundKey: 'infoBg' },
  healthy: { colorKey: 'healthy', backgroundKey: 'healthyBg' },
  smut: { colorKey: 'smut', backgroundKey: 'smutBg' },
  mosaic: { colorKey: 'mosaic', backgroundKey: 'mosaicBg' },
  rust: { colorKey: 'rust', backgroundKey: 'rustBg' },
  unclear: { colorKey: 'unclear', backgroundKey: 'unclearBg' },
};

export function Pill({
  accessibilityLabel,
  icon,
  label,
  rightAccessory,
  size = 'sm',
  style,
  testID,
  variant = 'default',
}: PillProps) {
  const theme = useTheme();
  const config = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.default;
  const color = theme[config.colorKey];
  const bg = theme[config.backgroundKey];

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        styles.pill,
        size === 'md' && styles.pillMd,
        { backgroundColor: bg, borderColor: color },
        style,
      ]}
      testID={testID}>
      {icon ? (
        <Feather name={icon} size={size === 'md' ? 16 : 14} color={color} />
      ) : null}
      <Text style={[styles.label, { color }]}>{label}</Text>
      {rightAccessory}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: ComponentTokens.chip.borderRadius,
    borderWidth: 1,
    paddingHorizontal: ComponentTokens.chip.paddingHorizontal,
    paddingVertical: ComponentTokens.chip.paddingVertical,
    alignSelf: 'flex-start',
    minHeight: 28,
  },
  pillMd: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    minHeight: 36,
  },
  label: {
    ...Typography.caption,
    fontWeight: '700',
  },
});
