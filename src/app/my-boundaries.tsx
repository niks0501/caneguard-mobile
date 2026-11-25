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
import { BOUNDARY_STATE_COPY, FIELD_SURVEY_COPY, OFFICE_VERDICT_COPY } from '@/constants/copy';
import { Spacing, Typography } from '@/constants/theme';
import { EMPTY_DATABASE, useDatabaseState } from '@/database/DatabaseProvider';
import type { FieldSurveyRow } from '@/database/schema';
import { canAuthorInspectorWork } from '@/features/auth/capabilities';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { fetchFieldSurveyOfficeStatus, type FieldSurveyOfficeVerdict } from '@/features/surveys/api/fieldSurveysApi';
import { deleteOwnedFieldSurvey, listOwnedFieldSurveys } from '@/features/surveys/data/fieldSurveyRepository';
import { boundaryCanDelete, boundaryCanEdit, boundaryState, type BoundaryState } from '@/features/surveys/domain/boundaryState';
import { validateSurveyWaypoints, type SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';
import { subscribeSyncRecords } from '@/features/sync/services/syncEvents';
import { useTheme } from '@/hooks/use-theme';

const VERDICT_PILL: Record<FieldSurveyOfficeVerdict, PillVariant> = {
  confirmed: 'success',
  wrong_field: 'warning',
  pending: 'info',
};

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

/** "No points yet" only when the boundary truly has none; a drawn draft that cannot be measured says it needs a fix. */
function summaryOf(
  row: FieldSurveyRow,
  state: BoundaryState,
  { pointCount, hectares }: { pointCount: number | null; hectares: string | null },
): string {
  const district = row.districtCode === 'UNSPECIFIED' ? 'No district' : row.districtCode;
  if (hectares !== null) return `${district} · ${hectares} ha`;
  if (pointCount === 0) return `${district} · ${FIELD_SURVEY_COPY.myBoundariesNoPoints}`;
  if (state === 'draft' && pointCount !== null) return `${district} · ${BOUNDARY_STATE_COPY.needs_fix.label}`;
  return district;
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
  // What the office decided about each sent map. Best effort: offline or a failed read simply shows nothing.
  const [verdicts, setVerdicts] = useState<Map<string, FieldSurveyOfficeVerdict>>(() => new Map());
  const token = session?.token ?? null;

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
  useFocusEffect(useCallback(() => {
    if (!token || !canAuthor) return;
    let cancelled = false;
    fetchFieldSurveyOfficeStatus(token)
      .then((next) => { if (!cancelled) setVerdicts(next); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [canAuthor, token]));
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
            />
          ) : null}
          {rows?.map((row) => {
            const rowState = boundaryState(row);
            const copy = BOUNDARY_STATE_COPY[rowState];
            const summary = row.label?.trim() ? `${row.label.trim()} · ${summaryOf(row, rowState, plotOf(row))}` : summaryOf(row, rowState, plotOf(row));
            const verdict = verdicts.get(row.clientUuid.toLowerCase()) ?? null;
            return (
              <Card key={row.clientUuid} testID={`my-boundaries.row.${row.clientUuid}`} style={styles.card}>
                <View accessibilityValue={{ text: `state=${rowState}` }} style={styles.marker} />
                <View style={styles.rowHeader}>
                  <Text style={[styles.title, { color: theme.text }]}>{summary}</Text>
                  <Pill label={copy.label} variant={STATE_PILL[rowState]} />
                </View>
                <Text style={[styles.help, { color: theme.textSecondary }]}>{copy.hint}</Text>
                {rowState === 'sent' && verdict ? (
                  <View testID={`my-boundaries.verdict.${row.clientUuid}`} accessibilityValue={{ text: `verdict=${verdict}` }} style={styles.verdict}>
                    <Pill label={OFFICE_VERDICT_COPY[verdict].label} variant={VERDICT_PILL[verdict]} />
                    <Text style={[styles.help, { color: theme.textSecondary }]}>{OFFICE_VERDICT_COPY[verdict].hint}</Text>
                  </View>
                ) : null}
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
  verdict: { gap: Spacing.xs, alignItems: 'flex-start' },
});
