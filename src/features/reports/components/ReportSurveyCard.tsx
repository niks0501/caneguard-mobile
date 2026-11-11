import { Feather } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { BOUNDARY_STATE_COPY, FIELD_SURVEY_COPY } from '@/constants/copy';
import { Radius, Spacing, Typography } from '@/constants/theme';
import type { FieldSurveyRow } from '@/database/schema';
import { useTheme } from '@/hooks/use-theme';
import { boundaryState } from '@/features/surveys/domain/boundaryState';
import {
  validateSurveyWaypoints,
  type SurveyWaypoint,
} from '@/features/surveys/domain/fieldSurvey';

export interface ReportSurveyCardProps {
  attachedSurvey: FieldSurveyRow | null;
  attachedUuid: string | null;
  disabled?: boolean;
  onAttach: (clientUuid: string | null) => void;
  onOpenMeasure: (clientUuid: string | null) => void;
  surveys: FieldSurveyRow[];
}

/** Measured plot area in square metres, or null when the saved boundary is unusable. */
function measuredAreaSqm(row: FieldSurveyRow): number | null {
  try {
    const measured = validateSurveyWaypoints(
      JSON.parse(row.waypointsJson) as SurveyWaypoint[],
    );
    return measured.valid ? measured.areaSqm : null;
  } catch {
    return null;
  }
}

function optionLabel(row: FieldSurveyRow, areaSqm: number | null): string {
  const hectares = areaSqm === null ? '—' : (areaSqm / 10_000).toFixed(2);
  const district = row.districtCode === 'UNSPECIFIED' ? 'No district' : row.districtCode;
  return FIELD_SURVEY_COPY.linkOption(district, hectares, BOUNDARY_STATE_COPY[boundaryState(row)].label);
}

/** Attach a saved boundary survey to a Draft report and jump to its Measure plot. */
export function ReportSurveyCard({ attachedSurvey, attachedUuid, disabled, onAttach, onOpenMeasure, surveys }: ReportSurveyCardProps) {
  const theme = useTheme();
  // Only measured boundaries are worth attaching.
  const choices = useMemo(
    () =>
      surveys
        .filter((row) => row.clientUuid !== attachedUuid)
        .flatMap((row) => {
          const areaSqm = measuredAreaSqm(row);
          return areaSqm === null ? [] : [{ areaSqm, row }];
        }),
    [attachedUuid, surveys],
  );
  const attachedAreaSqm = attachedSurvey ? measuredAreaSqm(attachedSurvey) : null;

  return (
    <View
      testID="field-report.survey-card"
      accessibilityValue={{
        text: `state=${attachedUuid ? (attachedSurvey ? 'attached' : 'missing') : 'none'};boundary=${attachedSurvey ? boundaryState(attachedSurvey) : 'none'};choices=${choices.length}`,
      }}
      style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.primaryDark }]}>{FIELD_SURVEY_COPY.linkTitle}</Text>
        <Text style={[styles.help, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.linkHelp}</Text>
      </View>

      {attachedUuid ? (
        <View style={styles.row}>
          <Feather name="check-circle" size={16} color={theme.success} />
          <Text testID="field-report.survey-attached" style={[styles.help, { color: theme.text, flex: 1 }]}>
            {attachedSurvey
              ? `${FIELD_SURVEY_COPY.linkAttached}: ${optionLabel(attachedSurvey, attachedAreaSqm)}`
              : FIELD_SURVEY_COPY.linkMissing}
          </Text>
        </View>
      ) : (
        <Text style={[styles.help, { color: theme.textSecondary }]}>
          {choices.length === 0 ? FIELD_SURVEY_COPY.linkEmpty : FIELD_SURVEY_COPY.linkNone}
        </Text>
      )}

      {attachedSurvey ? (
        <Text testID="field-report.survey-state" style={[styles.help, { color: theme.textSecondary }]}>
          {BOUNDARY_STATE_COPY[boundaryState(attachedSurvey)].hint}
        </Text>
      ) : null}

      {choices.map(({ areaSqm, row }) => (
        <AppButton
          key={row.clientUuid}
          testID={`field-report.survey-attach.${row.clientUuid}`}
          variant="secondary"
          disabled={disabled}
          accessibilityLabel={`${FIELD_SURVEY_COPY.linkAttach} ${optionLabel(row, areaSqm)}`}
          onPress={() => onAttach(row.clientUuid)}>
          {`${FIELD_SURVEY_COPY.linkAttach}: ${optionLabel(row, areaSqm)}`}
        </AppButton>
      ))}

      <AppButton
        testID="field-report.survey-open"
        variant="secondary"
        leadingIcon="map"
        onPress={() => onOpenMeasure(attachedUuid)}>
        {attachedSurvey ? FIELD_SURVEY_COPY.linkOpen : FIELD_SURVEY_COPY.linkMeasure}
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
