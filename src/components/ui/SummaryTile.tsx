import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SummaryTileProps = { value: number; label: string; tintColor: string; tintBackground: string; icon: keyof typeof Feather.glyphMap };

export function SummaryTile({ value, label, tintColor, tintBackground, icon }: SummaryTileProps) {
  const theme = useTheme();
  return <View accessibilityLabel={`${label}: ${value}`} style={[styles.tile, { backgroundColor: tintBackground }]}><View style={styles.top}><View style={[styles.icon, { backgroundColor: theme.surfaceElevated }]}><Feather name={icon} size={17} color={tintColor} /></View></View><Text style={[styles.value, { color: tintColor }]}>{value}</Text><Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text></View>;
}

const styles = StyleSheet.create({ tile: { flex: 1, minWidth: '46%', minHeight: 125, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.xs }, top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, icon: { width: 30, height: 30, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' }, value: { ...Typography.heading, fontSize: 27, lineHeight: 31, fontWeight: '800', marginTop: 'auto' }, label: { ...Typography.caption } });
