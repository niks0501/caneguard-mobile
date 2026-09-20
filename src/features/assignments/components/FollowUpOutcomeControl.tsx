import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ComponentTokens, Radius, Spacing, Typography } from '@/constants/theme';
import {
  FIELD_VALIDATION_FOLLOW_UP_OUTCOMES,
  type FieldValidationFollowUpOutcome,
} from '@/database/schema';
import { useTheme } from '@/hooks/use-theme';

const OUTCOME_LABELS: Record<FieldValidationFollowUpOutcome, string> = {
  improved: 'Improved',
  unchanged: 'Unchanged',
  worsened: 'Worsened',
  unable_to_determine: 'Unable to determine',
};

const OUTCOME_COLORS = {
  improved: 'success',
  unchanged: 'warning',
  worsened: 'danger',
  unable_to_determine: 'textSecondary',
} as const;

export function FollowUpOutcomeControl({
  previousVisitAt,
  value,
  onChange,
}: {
  previousVisitAt?: string | null;
  value: FieldValidationFollowUpOutcome | null;
  onChange: (value: FieldValidationFollowUpOutcome) => void;
}) {
  const theme = useTheme();
  return (
    <View testID="field-validation.outcome-group" style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Follow-up outcome</Text>
      <Text style={[styles.dateLine, { color: theme.textSecondary }]}>{previousVisitAt ? `Compared with ${formatDate(previousVisitAt)}` : 'No previous visit on record'}</Text>
      <View style={styles.grid}>
        {FIELD_VALIDATION_FOLLOW_UP_OUTCOMES.map((outcome) => {
          const selected = value === outcome;
          const color = theme[OUTCOME_COLORS[outcome]];
          return (
            <Pressable
              key={outcome}
              testID={`field-validation.outcome.${outcome}`}
              accessibilityRole="radio"
              accessibilityLabel={OUTCOME_LABELS[outcome]}
              accessibilityState={{ selected }}
              onPress={() => onChange(outcome)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: selected ? `${color}18` : theme.surfaceMuted,
                  borderColor: selected ? color : theme.border,
                },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.optionLabel, { color: selected ? color : theme.text }]}>{OUTCOME_LABELS[outcome]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  title: { ...Typography.subheading, fontWeight: '800' },
  dateLine: { ...Typography.caption },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  option: {
    minHeight: 62,
    flexBasis: '48%',
    flexGrow: 1,
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    paddingHorizontal: ComponentTokens.card.padding,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: { ...Typography.bodySmall, fontWeight: '800', textAlign: 'center' },
  pressed: { opacity: 0.72 },
});
