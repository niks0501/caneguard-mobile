import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { DiseasePill, type DiseasePillVariant } from '@/components/ui/DiseasePill';
import { ComponentTokens, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type MockRecord = { id: string; barangay: string; date: string; time: string; disease: DiseasePillVariant; status: 'queued' | 'sent' | 'healthy'; statusText: string };
type RecordCardProps = { record: MockRecord };

const DISEASE_ICONS: Record<DiseasePillVariant, keyof typeof Feather.glyphMap> = { smut: 'zap', rust: 'sun', mildew: 'cloud-rain', mosaic: 'grid', healthy: 'check-circle', unclear: 'help-circle' };

export function RecordCard({ record }: RecordCardProps) {
  const theme = useTheme();
  const statusColor = record.status === 'queued' ? theme.warning : theme.success;
  const statusIcon: keyof typeof Feather.glyphMap = record.status === 'queued' ? 'clock' : 'check-circle';

  return <View style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
    <View style={[styles.iconBlock, { backgroundColor: theme.surfaceMuted }]}><Feather name={DISEASE_ICONS[record.disease]} size={23} color={theme.primary} /></View>
    <View style={styles.main}><View style={styles.header}><View style={styles.copy}><Text style={[styles.barangay, { color: theme.primaryDark }]}>{record.barangay}</Text><Text style={[styles.date, { color: theme.textSecondary }]}>{record.date} · {record.time}</Text></View><DiseasePill variant={record.disease} /></View><View style={styles.status}><Feather name={statusIcon} size={14} color={statusColor} /><Text style={[styles.statusText, { color: statusColor }]}>{record.statusText}</Text></View></View>
  </View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: ComponentTokens.card.borderRadius, borderWidth: 1, padding: Spacing.md, flexDirection: 'row', gap: Spacing.md, ...Shadows.sm },
  iconBlock: { width: 48, height: 48, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' }, main: { flex: 1, gap: Spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm }, copy: { flex: 1, gap: Spacing.xs }, barangay: { ...Typography.bodySmall, fontWeight: '800' }, date: { ...Typography.caption },
  status: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }, statusText: { ...Typography.caption, fontWeight: '700' },
});
