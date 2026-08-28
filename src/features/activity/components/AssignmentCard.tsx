import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DiseasePill, type DiseasePillVariant } from '@/components/ui/DiseasePill';
import { ComponentTokens, Radius, Spacing, Typography } from '@/constants/theme';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import { useTheme } from '@/hooks/use-theme';

export function AssignmentCard({
  assignment,
  onPress,
  testID,
}: {
  assignment: FieldValidationAssignment;
  onPress?: () => void;
  testID?: string;
}) {
  const theme = useTheme();
  const variant = toPillVariant(assignment.case.predictedLabel);
  const target = assignment.targetVisitDate
    ? formatDate(assignment.targetVisitDate)
    : 'No target visit date';

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`Field validation assignment ${assignment.referenceCode}`}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
      testID={testID}>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
        ]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <View style={[styles.assignmentTag, { backgroundColor: theme.infoBg }]}>
            <Feather name="clipboard" size={14} color={theme.primary} />
            <Text style={[styles.assignmentTagText, { color: theme.primary }]}>Assignment</Text>
          </View>
          <Text style={[styles.reference, { color: theme.primaryDark }]}>
            {assignment.referenceCode}
          </Text>
          <Text style={[styles.location, { color: theme.textSecondary }]}>
            {assignment.case.barangay}
          </Text>
        </View>
        <DiseasePill variant={variant} />
      </View>
      <View style={styles.details}>
        <Detail label="Visit" value={target} theme={theme} />
        <Detail label="Submitted by" value={assignment.submitter.name} theme={theme} />
        <Detail label="Status" value={stateLabel(assignment.fieldValidationState)} theme={theme} />
      </View>
      {assignment.submitterIsAssignee ? (
        <View style={[styles.samePerson, { backgroundColor: theme.warningBg }]}>
          <Feather name="user-check" size={15} color={theme.warning} />
          <Text style={[styles.samePersonText, { color: theme.warning }]}>You submitted this case and are its validator.</Text>
        </View>
      ) : null}
      </View>
    </Pressable>
  );
}

function Detail({
  label,
  theme,
  value,
}: {
  label: string;
  theme: ReturnType<typeof useTheme>;
  value: string;
}) {
  return (
    <View style={styles.detail}>
      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.primaryDark }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function stateLabel(state: FieldValidationAssignment['fieldValidationState']): string {
  switch (state) {
    case 'assigned':
      return 'Assigned';
    case 'in_progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
    case 'unassigned':
      return 'Unassigned';
  }
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function toPillVariant(label: string): DiseasePillVariant {
  return label === 'healthy' || label === 'mosaic' || label === 'rust'
    ? label
    : 'unclear';
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  card: {
    borderRadius: ComponentTokens.card.borderRadius,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  titleBlock: { flex: 1, gap: Spacing.xs },
  assignmentTag: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  assignmentTagText: { ...Typography.caption, fontWeight: '800' },
  reference: { ...Typography.subheading, fontWeight: '800' },
  location: { ...Typography.bodySmall },
  details: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  detail: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  detailLabel: { ...Typography.caption, flexShrink: 0 },
  detailValue: { ...Typography.caption, fontWeight: '800', textAlign: 'right', flex: 1 },
  samePerson: {
    borderRadius: Radius.md,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  samePersonText: { ...Typography.caption, fontWeight: '800', flex: 1 },
});
