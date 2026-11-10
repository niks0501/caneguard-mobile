import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pill, type PillVariant } from '@/components/ui/Pill';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { BOUNDARY_STATE_COPY, FIELD_SURVEY_COPY } from '@/constants/copy';
import { Spacing, Typography } from '@/constants/theme';
import { EMPTY_DATABASE, useDatabaseState } from '@/database/DatabaseProvider';
import type { FieldSurveyRow } from '@/database/schema';
import { canAuthorInspectorWork } from '@/features/auth/capabilities';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { deleteOwnedFieldSurvey, listOwnedFieldSurveys } from '@/features/surveys/data/fieldSurveyRepository';
import { boundaryCanDelete, boundaryCanEdit, boundaryState, type BoundaryState } from '@/features/surveys/domain/boundaryState';
import { validateSurveyWaypoints, type SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';
import { subscribeSyncRecords } from '@/features/sync/services/syncEvents';
import { useTheme } from '@/hooks/use-theme';

const STATE_PILL: Record<BoundaryState, PillVariant> = {
  draft: 'default',
  waiting_to_send: 'info',
  sending: 'info',
  sent: 'success',
  will_retry: 'warning',
  needs_fix: 'danger',
  identity_rejected: 'danger',
  damaged: 'danger',
  refused: 'danger',
};

/** Stored point count and measured hectares; the count is null when the saved points cannot be read at all. */
function plotOf(row: FieldSurveyRow): { pointCount: number | null; hectares: string | null } {
  try {
    const waypoints = JSON.parse(row.waypointsJson) as SurveyWaypoint[];
    if (!Array.isArray(waypoints)) return { pointCount: null, hectares: null };
    const measured = validateSurveyWaypoints(waypoints);
    return {
      pointCount: waypoints.length,
      hectares: measured.valid ? (measured.areaSqm / 10_000).toFixed(2) : null,
    };
  } catch {
    return { pointCount: null, hectares: null };
  }
}

/** "No points yet" only when the boundary truly has none; a drawn but unmeasurable ring only shows its district. */
function summaryOf(row: FieldSurveyRow, { pointCount, hectares }: { pointCount: number | null; hectares: string | null }): string {
  const district = row.districtCode === 'UNSPECIFIED' ? 'No district' : row.districtCode;
  if (hectares !== null) return `${district} · ${hectares} ha`;
  return pointCount === 0 ? `${district} · ${FIELD_SURVEY_COPY.myBoundariesNoPoints}` : district;
}

/** Every boundary saved on this phone, with its state, so older drafts can be reopened or deleted. */
export default function MyBoundariesScreen() {
  const theme = useTheme();
  const { database, ready } = useDatabaseState();
  const { session } = useAuth();
  const ownerIdentity = session?.user.uuid ?? null;
  const canAuthor = canAuthorInspectorWork(session?.user);
  const [rows, setRows] = useState<FieldSurveyRow[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FieldSurveyRow | null>(null);

  const load = useCallback(() => {
    if (!ready || !database || database === EMPTY_DATABASE || !ownerIdentity) return;
    try {
      setRows(listOwnedFieldSurveys(database, ownerIdentity));
      setLoadFailed(false);
    } catch {
      setRows(null);
      setLoadFailed(true);
    }
  }, [database, ownerIdentity, ready]);

  useFocusEffect(load);
  useEffect(() => subscribeSyncRecords(load), [load]);

  function confirmDelete() {
    const target = pendingDelete;
    setPendingDelete(null);
    if (!target || !database || !ownerIdentity) return;
    try {
      setMessage(deleteOwnedFieldSurvey(database, target.clientUuid, ownerIdentity) ? null : FIELD_SURVEY_COPY.myBoundariesDeleteFailed);
    } catch {
      setMessage(FIELD_SURVEY_COPY.myBoundariesDeleteFailed);
    }
    load();
  }

  const state = !canAuthor ? 'unavailable' : loadFailed ? 'error' : rows === null ? 'loading' : rows.length === 0 ? 'empty' : 'list';
  const errorMessage = loadFailed ? FIELD_SURVEY_COPY.myBoundariesLoadFailed : message;

  return (
    <ScreenContainer
      testID="my-boundaries.screen"
      accessibilityValue={{ text: `state=${state};count=${rows?.length ?? 0}` }}
      header={<BrandedScreenHeader title={FIELD_SURVEY_COPY.myBoundariesTitle} subtitle={FIELD_SURVEY_COPY.myBoundariesSubtitle} />}>
      {!canAuthor ? (
        <Text style={[styles.help, { color: theme.textSecondary }]}>{FIELD_SURVEY_COPY.unavailable}</Text>
      ) : (
        <>
          {errorMessage ? <Text accessibilityLiveRegion="assertive" testID="my-boundaries.message" style={[styles.help, { color: theme.danger }]}>{errorMessage}</Text> : null}
          {rows?.length === 0 ? (
            <EmptyState
              icon="map"
              title={FIELD_SURVEY_COPY.myBoundariesEmptyTitle}
              message={FIELD_SURVEY_COPY.myBoundariesEmptyBody}
              testID="my-boundaries.empty"
              action={{ label: FIELD_SURVEY_COPY.quickActionTitle, onPress: () => router.push('/field-survey' as Href), testID: 'my-boundaries.measure' }}
            />
          ) : null}
          {rows?.map((row) => {
            const rowState = boundaryState(row);
            const copy = BOUNDARY_STATE_COPY[rowState];
            const summary = summaryOf(row, plotOf(row));
            return (
              <Card key={row.clientUuid} testID={`my-boundaries.row.${row.clientUuid}`} style={styles.card}>
                <View accessibilityValue={{ text: `state=${rowState}` }} style={styles.marker} />
                <View style={styles.rowHeader}>
                  <Text style={[styles.title, { color: theme.text }]}>{summary}</Text>
                  <Pill label={copy.label} variant={STATE_PILL[rowState]} />
                </View>
                <Text style={[styles.help, { color: theme.textSecondary }]}>{copy.hint}</Text>
                <View style={styles.actions}>
                  <AppButton
                    testID={`my-boundaries.open.${row.clientUuid}`}
                    variant="secondary"
                    accessibilityLabel={FIELD_SURVEY_COPY.myBoundariesRowOpenLabel(summary)}
                    onPress={() => router.push({ pathname: '/field-survey', params: { surveyId: row.clientUuid } } as unknown as Href)}>
                    {boundaryCanEdit(rowState) ? FIELD_SURVEY_COPY.myBoundariesOpen : FIELD_SURVEY_COPY.myBoundariesView}
                  </AppButton>
                  {boundaryCanDelete(rowState) ? (
                    <AppButton
                      testID={`my-boundaries.delete.${row.clientUuid}`}
                      variant="text"
                      accessibilityLabel={FIELD_SURVEY_COPY.myBoundariesRowDeleteLabel(summary)}
                      onPress={() => setPendingDelete(row)}>
                      {FIELD_SURVEY_COPY.myBoundariesDelete}
                    </AppButton>
                  ) : null}
                </View>
              </Card>
            );
          })}
        </>
      )}
      <ConfirmDialog
        visible={pendingDelete !== null}
        overlay
        destructive
        title={FIELD_SURVEY_COPY.myBoundariesDeleteTitle}
        message={FIELD_SURVEY_COPY.myBoundariesDeleteBody}
        confirmLabel={FIELD_SURVEY_COPY.myBoundariesDelete}
        confirmTestID="my-boundaries.delete-confirm"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  marker: { height: 0 },
  card: { gap: Spacing.sm },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  title: { ...Typography.subheading, flex: 1 },
  help: { ...Typography.bodySmall },
  actions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
});
