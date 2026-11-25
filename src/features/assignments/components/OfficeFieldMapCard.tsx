import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { FIELD_SURVEY_COPY } from '@/constants/copy';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { fetchAssignmentFieldMap, type AssignmentFieldMap } from '@/features/surveys/api/fieldSurveysApi';
import { useTheme } from '@/hooks/use-theme';

/**
 * The field map the office holds for this case, so the visit starts from a known plot instead of
 * walking it again. Best effort: nothing shows while loading, offline, or when the case has no map.
 * Only the plot outline can be reused; damage is always drawn fresh.
 */
export function OfficeFieldMapCard({ assignmentId, accessToken }: { assignmentId: string; accessToken: string | null }) {
  const theme = useTheme();
  const [map, setMap] = useState<AssignmentFieldMap | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    fetchAssignmentFieldMap(assignmentId, accessToken)
      .then((next) => { if (!cancelled) setMap(next); })
      .catch(() => { if (!cancelled) setMap(null); });
    return () => { cancelled = true; };
  }, [accessToken, assignmentId]);

  if (!map) return null;

  return (
    <View
      testID="field-validation.office-field-map"
      style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <View style={styles.heading}>
        <Feather name="crop" size={20} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>{FIELD_SURVEY_COPY.officeMapTitle}</Text>
      </View>
      <Text style={[styles.help, { color: theme.text }]}>
        {FIELD_SURVEY_COPY.officeMapSummary(map.label ?? `Map ${map.fieldSurveyId}`, (map.areaSqm / 10_000).toFixed(2), map.inspectorName)}
      </Text>
      <Text style={[styles.help, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.officeMapHelp}</Text>
      <AppButton
        testID="field-validation.office-field-map.use"
        variant="secondary"
        leadingIcon="map"
        onPress={() => router.push({ pathname: '/field-survey', params: { outlineFrom: assignmentId } } as unknown as Href)}>
        {FIELD_SURVEY_COPY.officeMapUse}
      </AppButton>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.sm },
  heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { ...Typography.subheading, fontWeight: '800' },
  help: { ...Typography.bodySmall },
});
