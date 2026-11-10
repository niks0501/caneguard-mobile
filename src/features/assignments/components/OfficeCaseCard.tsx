import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ClampedText } from '@/components/ui/ClampedText';
import { Pill } from '@/components/ui/Pill';
import { Row } from '@/components/ui/Row';
import { OFFICE_CASE_COPY } from '@/constants/copy';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { buildMobileReportPhotoUrl } from '@/features/assignments/api/mobileFieldValidationAssignmentsApi';
import {
  isOfficeCaseReadyOffline,
  listOfficeMediaItems,
  readOfficeMediaUri,
} from '@/features/assignments/services/officeMediaCache';
import { useSyncRecordsRevision } from '@/features/sync/hooks/useSyncRecordsRevision';
import { GuardedPhoto } from '@/features/assignments/components/GuardedPhoto';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/formatters';

/** Shows an office-born case as its own kind; renders nothing for a field-born one. */
export function OfficeCaseCard({
  accessToken,
  assignment,
  lastVisitPhotoUrl,
}: {
  accessToken?: string | null;
  assignment: FieldValidationAssignment;
  lastVisitPhotoUrl?: string | null;
}) {
  const theme = useTheme();
  useSyncRecordsRevision(); // re-read the disk when a photo prefetch finishes
  const officeCase = assignment.officeCase;
  if (!officeCase) return null;
  const media = listOfficeMediaItems(assignment);
  const localUri = (kind: 'report' | 'last-visit') => {
    const entry = media.find((candidate) => candidate.kind === kind);
    return entry ? readOfficeMediaUri(assignment.ownerIdentity, entry) : null;
  };

  const { suspectedCondition, observationText } = officeCase.reporterConcern;
  const hasConcern = Boolean(suspectedCondition?.trim() || observationText?.trim());
  const hasLastVisit = Boolean(assignment.previousVisit);

  return (
    <View
      testID="field-validation.office-case"
      style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <View style={styles.heading}>
        <Feather name="briefcase" size={20} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>{OFFICE_CASE_COPY.title}</Text>
        <Pill label={OFFICE_CASE_COPY.badge} variant="info" size="sm" />
        {isOfficeCaseReadyOffline(assignment.ownerIdentity, assignment) ? (
          <Pill label={OFFICE_CASE_COPY.readyOffline} variant="success" size="sm" />
        ) : null}
      </View>
      <Row label={OFFICE_CASE_COPY.statusLabel} value={humanize(officeCase.status.workflowStatus)} />
      <Row label="Last updated" value={formatDate(officeCase.status.updatedAt, officeCase.status.updatedAt)} />
      <Row label="Version" value={OFFICE_CASE_COPY.version(officeCase.version)} />
      <View style={styles.block} testID="field-validation.office-case.concern">
        <Text style={[styles.label, { color: theme.textSecondary }]}>{OFFICE_CASE_COPY.concernLabel}</Text>
        {hasConcern ? (
          <>
            {suspectedCondition?.trim() ? (
              <Pill label={`${suspectedCondition} · reported concern`} variant="warning" />
            ) : null}
            {observationText?.trim() ? (
              <ClampedText text={observationText} style={{ color: theme.text }} />
            ) : null}
          </>
        ) : (
          <Text style={[styles.label, { color: theme.textSecondary }]}>{OFFICE_CASE_COPY.concernNone}</Text>
        )}
      </View>
      <GuardedPhoto
        accessToken={accessToken}
        emptyText={OFFICE_CASE_COPY.noReportPhoto}
        label={OFFICE_CASE_COPY.reportPhotoLabel}
        localUri={localUri('report')}
        testID="field-validation.office-case.photo"
        url={officeCase.photo ? buildMobileReportPhotoUrl(assignment.id) : null}
      />
      {hasLastVisit ? (
        <GuardedPhoto
          accessToken={accessToken}
          emptyText={OFFICE_CASE_COPY.noLastVisitPhoto}
          label={OFFICE_CASE_COPY.lastVisitPhotoLabel}
          localUri={localUri('last-visit')}
          testID="field-validation.office-case.last-visit-photo"
          url={assignment.previousVisit?.photo ? (lastVisitPhotoUrl ?? null) : null}
        />
      ) : null}
    </View>
  );
}

function humanize(value: string): string {
  const text = value.replace(/_/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : value;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  title: { ...Typography.subheading, fontWeight: '800' },
  block: { gap: Spacing.xs },
  label: { ...Typography.caption },
});
