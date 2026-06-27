import { StyleSheet, Text, View } from 'react-native';

import { DiseasePill, type DiseasePillVariant } from '@/components/ui/DiseasePill';
import { StatusChip, type StatusVariant } from '@/components/ui/StatusChip';
import { ComponentTokens, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type MockRecord = {
  id: string;
  barangay: string;
  date: string;
  time: string;
  disease: DiseasePillVariant;
  status: StatusVariant;
  statusText: string;
};

type RecordCardProps = {
  record: MockRecord;
};

export function RecordCard({ record }: RecordCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <View style={styles.headerRow}>
        <View style={styles.textBlock}>
          <Text style={[styles.barangay, { color: theme.text }]}>{record.barangay}</Text>
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {record.date} · {record.time}
          </Text>
        </View>
        <DiseasePill variant={record.disease} />
      </View>

      <View style={styles.footerRow}>
        <StatusChip variant={record.status} />
        <Text style={[styles.statusText, { color: theme.textSecondary }]}>{record.statusText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: ComponentTokens.card.borderRadius,
    borderWidth: 1,
    padding: ComponentTokens.card.padding,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  textBlock: {
    flex: 1,
    gap: Spacing.xs,
  },
  barangay: {
    ...Typography.bodySmall,
    fontWeight: '800',
  },
  date: {
    ...Typography.caption,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusText: {
    ...Typography.caption,
  },
});
