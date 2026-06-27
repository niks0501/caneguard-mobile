import { StyleSheet, Text, View } from 'react-native';

import { ComponentTokens, DiseaseTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type DiseasePillVariant = 'smut' | 'rust' | 'mildew' | 'mosaic' | 'healthy' | 'unclear';

type DiseasePillProps = {
  variant: DiseasePillVariant;
};

const VARIANT_MAP: Record<DiseasePillVariant, { label: string; color: string; background: string }> = {
  smut: { label: 'Possible Smut', color: DiseaseTokens.smut.color, background: DiseaseTokens.smut.background },
  rust: { label: 'Possible Rust', color: DiseaseTokens.rust.color, background: DiseaseTokens.rust.background },
  mildew: { label: 'Possible Mildew', color: DiseaseTokens.downyMildew.color, background: DiseaseTokens.downyMildew.background },
  mosaic: { label: 'Possible Mosaic', color: DiseaseTokens.mosaic.color, background: DiseaseTokens.mosaic.background },
  healthy: { label: 'Healthy', color: DiseaseTokens.healthy.color, background: DiseaseTokens.healthy.background },
  unclear: { label: 'Unclear', color: DiseaseTokens.unclear.color, background: DiseaseTokens.unclear.background },
};

export function DiseasePill({ variant }: DiseasePillProps) {
  const theme = useTheme();
  const config = VARIANT_MAP[variant];

  return (
    <View style={[styles.pill, { backgroundColor: config.background, borderColor: config.color }]}>
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
