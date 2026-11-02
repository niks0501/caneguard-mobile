import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HOME_NOTE_COPY } from '@/constants/copy';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type HomeGlanceStripProps = {
  overdue: number;
  onOpenActivity: () => void;
  onOpenVisits: () => void;
  today: number;
  waiting: number;
};

/** Visits today, overdue and waiting to send. Renders nothing when all three are zero. */
export function HomeGlanceStrip({
  overdue,
  onOpenActivity,
  onOpenVisits,
  today,
  waiting,
}: HomeGlanceStripProps) {
  const theme = useTheme();
  if (today + overdue + waiting === 0) return null;

  const cells = [
    { id: 'today', label: HOME_NOTE_COPY.glanceToday, value: today, onPress: onOpenVisits },
    { id: 'overdue', label: HOME_NOTE_COPY.glanceOverdue, value: overdue, onPress: onOpenVisits },
    { id: 'waiting', label: HOME_NOTE_COPY.glanceWaiting, value: waiting, onPress: onOpenActivity },
  ];

  return (
    <View style={styles.section} testID="home.glance">
      <Text style={[styles.heading, { color: theme.textSecondary }]}>
        {HOME_NOTE_COPY.glanceHeading}
      </Text>
      <View style={styles.row}>
        {cells.map((cell) => (
          <Pressable
            accessibilityLabel={`${cell.label}: ${cell.value}`}
            accessibilityRole="button"
            key={cell.id}
            onPress={cell.onPress}
            style={({ pressed }) => [
              styles.cell,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && styles.pressed,
            ]}
            testID={`home.glance.${cell.id}`}>
            <Text style={[styles.value, { color: theme.text }]}>{cell.value}</Text>
            <Text style={[styles.label, { color: theme.textSecondary }]}>{cell.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm },
  heading: { ...Typography.label },
  row: { flexDirection: 'row', gap: Spacing.sm },
  cell: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  value: { ...Typography.subheading },
  label: { ...Typography.bodySmall },
  pressed: { opacity: 0.74 },
});
