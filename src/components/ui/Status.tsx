import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Spacing, Typography, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type StatusKind =
  | 'synced'
  | 'pending'
  | 'syncing'
  | 'failed'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

export type StatusProps = {
  label: string;
  status?: StatusKind;
  icon?: keyof typeof Feather.glyphMap;
  showDot?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
};

const STATUS_MAP: Record<
  StatusKind,
  { colorKey: ThemeColor; backgroundKey: ThemeColor; defaultIcon: keyof typeof Feather.glyphMap }
> = {
  synced: { colorKey: 'success', backgroundKey: 'successBg', defaultIcon: 'check-circle' },
  success: { colorKey: 'success', backgroundKey: 'successBg', defaultIcon: 'check-circle' },
  pending: { colorKey: 'warning', backgroundKey: 'warningBg', defaultIcon: 'clock' },
  warning: { colorKey: 'warning', backgroundKey: 'warningBg', defaultIcon: 'alert-circle' },
  syncing: { colorKey: 'info', backgroundKey: 'infoBg', defaultIcon: 'refresh-cw' },
  info: { colorKey: 'info', backgroundKey: 'infoBg', defaultIcon: 'info' },
  failed: { colorKey: 'danger', backgroundKey: 'dangerBg', defaultIcon: 'alert-triangle' },
  danger: { colorKey: 'danger', backgroundKey: 'dangerBg', defaultIcon: 'alert-triangle' },
  neutral: { colorKey: 'textSecondary', backgroundKey: 'surfaceMuted', defaultIcon: 'minus' },
};

export function Status({
  accessibilityLabel,
  icon,
  label,
  showDot = false,
  status = 'neutral',
  style,
  testID,
}: StatusProps) {
  const theme = useTheme();
  const config = STATUS_MAP[status] ?? STATUS_MAP.neutral;
  const color = theme[config.colorKey];
  const bg = theme[config.backgroundKey];
  const iconName = icon ?? config.defaultIcon;

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="text"
      style={[styles.status, { backgroundColor: bg, borderColor: color }, style]}
      testID={testID}>
      {showDot ? (
        <View style={[styles.dot, { backgroundColor: color }]} />
      ) : (
        <Feather name={iconName} size={14} color={color} />
      )}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
    minHeight: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  label: {
    ...Typography.caption,
    fontWeight: '700',
  },
});
