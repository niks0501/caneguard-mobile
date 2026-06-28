import { StyleSheet, Text, View } from 'react-native';

import { ComponentTokens, Typography, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type DiseasePillVariant = 'smut' | 'rust' | 'mildew' | 'mosaic' | 'healthy' | 'unclear';

type DiseasePillProps = {
  variant: DiseasePillVariant;
};

const VARIANT_MAP: Record<DiseasePillVariant, { label: string; colorKey: ThemeColor; backgroundKey: ThemeColor }> = {
  smut: { label: 'Possible Smut', colorKey: 'smut', backgroundKey: 'smutBg' },
  rust: { label: 'Possible Rust', colorKey: 'rust', backgroundKey: 'rustBg' },
  mildew: { label: 'Possible Mildew', colorKey: 'downyMildew', backgroundKey: 'downyMildewBg' },
  mosaic: { label: 'Possible Mosaic', colorKey: 'mosaic', backgroundKey: 'mosaicBg' },
  healthy: { label: 'Healthy', colorKey: 'healthy', backgroundKey: 'healthyBg' },
  unclear: { label: 'Unclear', colorKey: 'unclear', backgroundKey: 'unclearBg' },
};

export function DiseasePill({ variant }: DiseasePillProps) {
  const theme = useTheme();
  const config = VARIANT_MAP[variant];

  return (
    <View style={[styles.pill, { backgroundColor: theme[config.backgroundKey], borderColor: theme[config.colorKey] }]}>
      <Text style={[styles.label, { color: theme.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: ComponentTokens.chip.borderRadius,
    borderWidth: 1,
    paddingHorizontal: ComponentTokens.chip.paddingHorizontal,
    paddingVertical: ComponentTokens.chip.paddingVertical,
  },
  label: {
    ...Typography.caption,
    fontWeight: '700',
  },
});
