import { Feather } from '@expo/vector-icons';
import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { DisclosureSection } from '@/components/ui/DisclosureSection';
import { BOUNDARY_STATE_COPY, FIELD_SURVEY_COPY } from '@/constants/copy';
import { Radius, Spacing, Typography } from '@/constants/theme';
import type { FieldSurveyRow } from '@/database/schema';
import { useTheme } from '@/hooks/use-theme';
import { hasOpenAffectedArea, measuredBoundaryArea, percentAffected } from '@/features/surveys/domain/attachedBoundary';
import { boundaryState } from '@/features/surveys/domain/boundaryState';
import { isAtPlot, type PlotPoint } from '@/features/surveys/domain/plotLocation';

export interface ReportSurveyCardProps {
  attachedSurvey: FieldSurveyRow | null;
  attachedUuid: string | null;
  disabled?: boolean;
  /** Typed-number fallback, folded below the map actions. */
  manualEntry?: ReactNode;
  manualExpanded?: boolean;
  manualSummary?: string;
  onManualExpandedChange?: (expanded: boolean) => void;
  /** Where the report was pinned; a pin outside the attached map earns a one-line check. */
  reportLocation?: PlotPoint | null;
  onAttach: (clientUuid: string | null) => void;
  onOpenMeasure: (clientUuid: string | null) => void;
  surveys: FieldSurveyRow[];
}

/** The saved plot corners, or none when they cannot be read. */
function plotPoints(row: FieldSurveyRow): PlotPoint[] {
  try {
    const parsed: unknown = JSON.parse(row.waypointsJson);
    return Array.isArray(parsed) ? (parsed as PlotPoint[]) : [];
  } catch {
    return [];
  }
}

/** Measured plot area in square metres, or null while the saved boundary is unfinished or unusable. */
function measuredAreaSqm(row: FieldSurveyRow): number | null {
  return measuredBoundaryArea(row)?.areaSqm ?? null;
}

function optionLabel(row: FieldSurveyRow, areaSqm: number | null): string {
  const hectares = areaSqm === null ? '—' : (areaSqm / 10_000).toFixed(2);
  const district = row.districtCode === 'UNSPECIFIED' ? 'No district' : row.districtCode;
  return FIELD_SURVEY_COPY.linkOption(district, hectares, BOUNDARY_STATE_COPY[boundaryState(row)].label);
}

/** Optional affected-area measurement inside a Draft report: measure on the map first, reuse a saved map, or type the numbers. */
export function ReportSurveyCard({
  attachedSurvey,
  attachedUuid,
  disabled,
  manualEntry,
  manualExpanded,
  manualSummary,
  onAttach,
  onManualExpandedChange,
  onOpenMeasure,
  reportLocation,
  surveys,
}: ReportSurveyCardProps) {
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
  const attachedMeasured = attachedSurvey ? measuredBoundaryArea(attachedSurvey) : null;
  const attachedAreaSqm = attachedMeasured?.areaSqm ?? null;
  const attachedPercent = attachedMeasured ? percentAffected(attachedMeasured) : null;
  const pinOutsidePlot = Boolean(
    attachedSurvey && reportLocation && attachedAreaSqm !== null && !isAtPlot(plotPoints(attachedSurvey), reportLocation),
  );

  return (
    <View
      testID="field-report.survey-card"
      accessibilityValue={{
        text: `state=${attachedUuid ? (attachedSurvey ? 'attached' : 'missing') : 'none'};boundary=${attachedSurvey ? boundaryState(attachedSurvey) : 'none'};choices=${choices.length}`,
      }}
      style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={styles.row}>
          <Feather name="crop" size={20} color={theme.primary} />
          <Text style={[styles.title, { color: theme.text }]}>{FIELD_SURVEY_COPY.linkTitle}</Text>
        </View>
        {attachedUuid ? null : (
          <Text style={[styles.help, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.linkHelp}</Text>
        )}
      </View>

      {attachedUuid ? (
        <View style={styles.row}>
          <Feather name={attachedAreaSqm === null ? 'alert-circle' : 'check-circle'} size={16} color={attachedAreaSqm === null ? theme.warning : theme.success} />
          <Text testID="field-report.survey-attached" style={[styles.help, { color: theme.text, flex: 1 }]}>
            {!attachedSurvey
              ? FIELD_SURVEY_COPY.linkMissing
              : attachedAreaSqm === null
                ? hasOpenAffectedArea(attachedSurvey) ? FIELD_SURVEY_COPY.linkAreaOpen : FIELD_SURVEY_COPY.linkUnfinished
                : FIELD_SURVEY_COPY.linkAttached((attachedAreaSqm / 10_000).toFixed(2), attachedPercent === null ? null : String(attachedPercent))}
          </Text>
        </View>
      ) : null}

      {pinOutsidePlot ? (
        <View style={styles.row}>
          <Feather name="alert-triangle" size={16} color={theme.warning} />
          <Text testID="field-report.survey-outside" style={[styles.help, { color: theme.text, flex: 1 }]}>
            {FIELD_SURVEY_COPY.linkOutsidePlot}
          </Text>
        </View>
      ) : null}

      <AppButton
        testID="field-report.survey-open"
        variant={attachedUuid ? 'secondary' : 'primary'}
        leadingIcon="map"
        disabled={disabled}
        onPress={() => onOpenMeasure(attachedSurvey ? attachedUuid : null)}>
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

      {!attachedUuid && choices.length > 0 ? (
        <DisclosureSection
          testID="field-report.survey-saved"
          title={FIELD_SURVEY_COPY.linkSavedTitle}
          summary={FIELD_SURVEY_COPY.linkSavedSummary(choices.length)}>
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
        </DisclosureSection>
      ) : null}

      {manualEntry ? (
        <DisclosureSection
          testID="field-report.area-manual"
          title={FIELD_SURVEY_COPY.manualTitle}
          summary={manualSummary ?? FIELD_SURVEY_COPY.manualEmpty}
          expandedSummary={FIELD_SURVEY_COPY.manualEmpty}
          expanded={manualExpanded}
          onExpandedChange={onManualExpandedChange}>
          {manualEntry}
        </DisclosureSection>
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
