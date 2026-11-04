import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { FIELD_SURVEY_COPY } from '@/constants/copy';
import { Radius, Spacing, Typography } from '@/constants/theme';
import type { FieldSurveyRow } from '@/database/schema';
import { useTheme } from '@/hooks/use-theme';

export interface ReportSurveyCardProps {
  attachedUuid: string | null;
  disabled?: boolean;
  onAttach: (clientUuid: string | null) => void;
  onOpenMeasure: (clientUuid: string | null) => void;
  surveys: FieldSurveyRow[];
}

function statusLabel(status: FieldSurveyRow['status']): string {
  if (status === 'synced') return FIELD_SURVEY_COPY.linkStatusSent;
  if (status === 'draft') return FIELD_SURVEY_COPY.linkStatusDraft;
  return FIELD_SURVEY_COPY.linkStatusWaiting;
}

function optionLabel(row: FieldSurveyRow): string {
  const hectares = row.areaSqm === null ? '—' : (row.areaSqm / 10_000).toFixed(2);
  const district = row.districtCode === 'UNSPECIFIED' ? 'No district' : row.districtCode;
  return FIELD_SURVEY_COPY.linkOption(district, hectares, statusLabel(row.status));
}

/** Attach a saved boundary survey to a Draft report and jump to its Measure plot. */
export function ReportSurveyCard({ attachedUuid, disabled, onAttach, onOpenMeasure, surveys }: ReportSurveyCardProps) {
  const theme = useTheme();
  const attached = attachedUuid ? surveys.find((row) => row.clientUuid === attachedUuid) ?? null : null;
  // Only measured boundaries (with a polygon) are worth attaching.
  const choices = surveys.filter((row) => row.polygonJson !== null || row.clientUuid === attachedUuid);

  return (
    <View
      testID="field-report.survey-card"
      style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.primaryDark }]}>{FIELD_SURVEY_COPY.linkTitle}</Text>
        <Text style={[styles.help, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.linkHelp}</Text>
      </View>

      {attachedUuid ? (
        <View style={styles.row}>
          <Feather name="check-circle" size={16} color={theme.success} />
          <Text testID="field-report.survey-attached" style={[styles.help, { color: theme.text, flex: 1 }]}>
            {attached ? `${FIELD_SURVEY_COPY.linkAttached}: ${optionLabel(attached)}` : FIELD_SURVEY_COPY.linkMissing}
          </Text>
        </View>
      ) : (
        <Text style={[styles.help, { color: theme.textSecondary }]}>
          {choices.length === 0 ? FIELD_SURVEY_COPY.linkEmpty : FIELD_SURVEY_COPY.linkNone}
        </Text>
      )}

      {choices
        .filter((row) => row.clientUuid !== attachedUuid)
        .map((row) => (
          <AppButton
            key={row.clientUuid}
            testID={`field-report.survey-attach.${row.clientUuid}`}
            variant="secondary"
            disabled={disabled}
            accessibilityLabel={`${FIELD_SURVEY_COPY.linkAttach} ${optionLabel(row)}`}
            onPress={() => onAttach(row.clientUuid)}>
            {`${FIELD_SURVEY_COPY.linkAttach}: ${optionLabel(row)}`}
          </AppButton>
        ))}

      <AppButton
        testID="field-report.survey-open"
        variant="secondary"
        leadingIcon="map"
        onPress={() => onOpenMeasure(attached ? attached.clientUuid : null)}>
        {attached ? FIELD_SURVEY_COPY.linkOpen : FIELD_SURVEY_COPY.linkMeasure}
      </AppButton>
      {attachedUuid ? (
        <AppButton
          testID="field-report.survey-remove"
          variant="text"
          disabled={disabled}
          onPress={() => onAttach(null)}>
          {FIELD_SURVEY_COPY.linkRemove}
        </AppButton>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  header: { gap: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { ...Typography.subheading, fontWeight: '800' },
  help: { ...Typography.caption },
});
